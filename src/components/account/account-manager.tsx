"use client";

import { useEffect, useMemo, useState } from "react";
import { createClient } from "@/lib/supabase/client";
import { Card } from "@/components/ui/card";

type Role = "Brand" | "Designer" | "Customer" | "Unknown";

type ProfileRow = {
  [key: string]: unknown;
  contact_info?: unknown;
};

type AccountUser = {
  id: string;
  email?: string | null;
  user_metadata?: Record<string, unknown>;
};

function parseContactInfo(contactInfo: unknown): Record<string, unknown> | null {
  if (!contactInfo) return null;
  if (typeof contactInfo === "object" && !Array.isArray(contactInfo)) {
    return contactInfo as Record<string, unknown>;
  }
  if (typeof contactInfo === "string") {
    try {
      const parsed = JSON.parse(contactInfo);
      if (parsed && typeof parsed === "object" && !Array.isArray(parsed)) {
        return parsed as Record<string, unknown>;
      }
    } catch {
      return null;
    }
  }
  return null;
}

function resolveRole(user: AccountUser): Role {
  const roleValue = user.user_metadata?.role;
  if (roleValue === "Brand" || roleValue === "Designer" || roleValue === "Customer") {
    return roleValue;
  }
  return "Unknown";
}

function resolveProfileTarget(role: Role) {
  if (role === "Brand") {
    return { table: "brands", column: "account_id" };
  }
  if (role === "Designer") {
    return { table: "designers", column: "designer_uuid" };
  }
  if (role === "Customer") {
    return { table: "customers", column: "customer_uuid" };
  }
  return null;
}

export function AccountManager({ user }: { user: AccountUser }) {
  const supabase = useMemo(() => createClient(), []);
  const [role, setRole] = useState<Role>(resolveRole(user));
  const [profileRow, setProfileRow] = useState<ProfileRow | null>(null);
  const [loading, setLoading] = useState(true);
  const [firstName, setFirstName] = useState(String(user.user_metadata?.first_name ?? ""));
  const [lastName, setLastName] = useState(String(user.user_metadata?.last_name ?? ""));
  const [phone, setPhone] = useState(String(user.user_metadata?.phone ?? ""));
  const [email, setEmail] = useState(user.email ?? "");
  const [password, setPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");
  const [saving, setSaving] = useState(false);
  const [status, setStatus] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    const nextRole = resolveRole(user);
    setRole(nextRole);

    const target = resolveProfileTarget(nextRole);
    if (!target) {
      setProfileRow(null);
      setLoading(false);
      return;
    }

    const loadProfile = async () => {
      setLoading(true);
      const { data, error: fetchError } = await supabase
        .from(target.table)
        .select("*")
        .eq(target.column, user.id)
        .maybeSingle();

      if (fetchError) {
        console.error("Profile load error:", fetchError.message);
        setProfileRow(null);
      } else {
        setProfileRow((data ?? null) as ProfileRow | null);
      }

      setLoading(false);
    };

    void loadProfile();
  }, [supabase, user]);

  useEffect(() => {
    const contactInfo = parseContactInfo(profileRow?.contact_info) ?? {};
    const profileFirstName = String(profileRow?.first_name ?? contactInfo.first_name ?? user.user_metadata?.first_name ?? "");
    const profileLastName = String(profileRow?.last_name ?? contactInfo.last_name ?? user.user_metadata?.last_name ?? "");
    const profilePhone = String(profileRow?.phone ?? contactInfo.phone ?? user.user_metadata?.phone ?? "");

    setFirstName(profileFirstName);
    setLastName(profileLastName);
    setPhone(profilePhone);
    setEmail(user.email ?? "");
  }, [profileRow, user]);

  const handleProfileSave = async () => {
    setError(null);
    setStatus(null);
    setSaving(true);

    try {
      const nextFirstName = firstName.trim();
      const nextLastName = lastName.trim();
      const nextPhone = phone.trim();
      const nextEmail = email.trim();

      if (!nextFirstName || !nextLastName) {
        throw new Error("First and last name are required.");
      }

      if (nextEmail && !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(nextEmail)) {
        throw new Error("Enter a valid email address.");
      }

      const { error: authError } = await supabase.auth.updateUser({
        email: nextEmail !== (user.email ?? "") ? nextEmail : undefined,
        data: {
          role,
          first_name: nextFirstName,
          last_name: nextLastName,
          phone: nextPhone,
        },
      });

      if (authError) throw authError;

      const contactInfo = parseContactInfo(profileRow?.contact_info) ?? {};
      const nextContactInfo = {
        ...contactInfo,
        first_name: nextFirstName,
        last_name: nextLastName,
        phone: nextPhone,
        email: nextEmail,
      };

      const commonProfileUpdate = {
        first_name: nextFirstName,
        last_name: nextLastName,
        contact_info: nextContactInfo,
      };

      if (role === "Brand") {
        const { error } = await supabase
          .from("brands")
          .update({
            ...commonProfileUpdate,
            company_name: (profileRow?.company_name as string | undefined) ?? "",
            email: nextEmail,
          })
          .eq("account_id", user.id);

        if (error) throw error;
      } else if (role === "Designer") {
        const { error } = await supabase
          .from("designers")
          .update({
            ...commonProfileUpdate,
            artist_handle: (profileRow?.artist_handle as string | undefined) ?? "",
            email: nextEmail,
          })
          .eq("designer_uuid", user.id);

        if (error) throw error;
      } else if (role === "Customer") {
        const { error } = await supabase
          .from("customers")
          .update({
            ...commonProfileUpdate,
            email: nextEmail,
          })
          .eq("customer_uuid", user.id);

        if (error) throw error;
      }

      setStatus("Account details updated.");
    } catch (err) {
      setError(err instanceof Error ? err.message : "We could not update your account.");
    } finally {
      setSaving(false);
    }
  };

  const handlePasswordSave = async () => {
    setError(null);
    setStatus(null);

    if (password.length < 8) {
      setError("Password must be at least 8 characters long.");
      return;
    }

    if (password !== confirmPassword) {
      setError("Passwords do not match.");
      return;
    }

    try {
      const { error: passwordError } = await supabase.auth.updateUser({ password });
      if (passwordError) throw passwordError;
      setPassword("");
      setConfirmPassword("");
      setStatus("Password updated successfully.");
    } catch (err) {
      setError(err instanceof Error ? err.message : "We could not update your password.");
    }
  };

  return (
    <div className="mx-auto max-w-5xl space-y-6 px-4 py-10">
      <section className="rounded-3xl border border-brand-ink/10 bg-white p-6 shadow-sm">
        <p className="text-xs uppercase tracking-[0.2em] text-brand-ink/50">Account</p>
        <h1 className="mt-2 font-serif text-3xl text-brand-ink">Manage Account</h1>
        <p className="mt-2 text-sm text-brand-ink/70">
          Update your profile details and password. Changes are saved to your authenticated account.
        </p>
      </section>

      <div className="grid gap-6 lg:grid-cols-[1.2fr_0.8fr]">
        <Card className="p-6">
          <h2 className="text-xl font-semibold text-brand-ink">Profile details</h2>
          {loading ? (
            <p className="mt-4 text-sm text-brand-ink/70">Loading your account…</p>
          ) : (
            <div className="mt-5 space-y-4">
              <div className="grid gap-4 sm:grid-cols-2">
                <label className="block text-sm font-medium text-brand-ink">
                  First name
                  <input
                    value={firstName}
                    onChange={(event) => setFirstName(event.target.value)}
                    className="mt-1 w-full rounded-xl border border-brand-ink/15 bg-white px-3 py-2.5 text-brand-ink outline-none transition focus:border-brand-accent"
                  />
                </label>

                <label className="block text-sm font-medium text-brand-ink">
                  Last name
                  <input
                    value={lastName}
                    onChange={(event) => setLastName(event.target.value)}
                    className="mt-1 w-full rounded-xl border border-brand-ink/15 bg-white px-3 py-2.5 text-brand-ink outline-none transition focus:border-brand-accent"
                  />
                </label>
              </div>

              <label className="block text-sm font-medium text-brand-ink">
                Email
                <input
                  type="email"
                  value={email}
                  onChange={(event) => setEmail(event.target.value)}
                  className="mt-1 w-full rounded-xl border border-brand-ink/15 bg-white px-3 py-2.5 text-brand-ink outline-none transition focus:border-brand-accent"
                />
              </label>

              <label className="block text-sm font-medium text-brand-ink">
                Phone
                <input
                  type="tel"
                  value={phone}
                  onChange={(event) => setPhone(event.target.value)}
                  className="mt-1 w-full rounded-xl border border-brand-ink/15 bg-white px-3 py-2.5 text-brand-ink outline-none transition focus:border-brand-accent"
                />
              </label>

              <div className="flex items-center justify-between gap-3 pt-2">
                <div className="text-xs uppercase tracking-[0.2em] text-brand-ink/50">Role: {role}</div>
                <button
                  type="button"
                  onClick={handleProfileSave}
                  className="rounded-full bg-brand-accent px-5 py-2.5 text-sm font-semibold text-white transition hover:bg-brand-olive-dark disabled:cursor-not-allowed disabled:opacity-60"
                  disabled={saving}
                >
                  {saving ? "Saving…" : "Save profile"}
                </button>
              </div>
            </div>
          )}
        </Card>

        <Card className="p-6">
          <h2 className="text-xl font-semibold text-brand-ink">Security</h2>
          <div className="mt-5 space-y-4">
            <label className="block text-sm font-medium text-brand-ink">
              New password
              <input
                type="password"
                value={password}
                onChange={(event) => setPassword(event.target.value)}
                className="mt-1 w-full rounded-xl border border-brand-ink/15 bg-white px-3 py-2.5 text-brand-ink outline-none transition focus:border-brand-accent"
                placeholder="At least 8 characters"
              />
            </label>

            <label className="block text-sm font-medium text-brand-ink">
              Confirm password
              <input
                type="password"
                value={confirmPassword}
                onChange={(event) => setConfirmPassword(event.target.value)}
                className="mt-1 w-full rounded-xl border border-brand-ink/15 bg-white px-3 py-2.5 text-brand-ink outline-none transition focus:border-brand-accent"
                placeholder="Repeat your new password"
              />
            </label>

            <button
              type="button"
              onClick={handlePasswordSave}
              className="w-full rounded-full border border-brand-ink/15 bg-brand-cream px-4 py-2.5 text-sm font-semibold text-brand-ink transition hover:bg-brand-blush"
            >
              Update password
            </button>
          </div>
        </Card>
      </div>

      {(status || error) && (
        <div className="rounded-2xl border px-4 py-3 text-sm">
          {error ? (
            <p className="text-red-600">{error}</p>
          ) : (
            <p className="text-emerald-700">{status}</p>
          )}
        </div>
      )}
    </div>
  );
}
