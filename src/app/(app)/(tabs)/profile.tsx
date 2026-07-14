"use client";

import { createClient } from "@/lib/supabase/client";
import Link from "next/link";
import { useEffect, useMemo, useState } from "react";

type Role = "Brand" | "Designer" | "Customer" | "Unknown";

type ProfileRow = {
  [key: string]: unknown;
  contact_info?: unknown;
};

type SessionView = {
  email: string;
  id: string;
  role: Role;
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

export default function Profile() {
  const supabase = createClient();
  const [session, setSession] = useState<SessionView | null>(null);
  const [profileRow, setProfileRow] = useState<ProfileRow | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const loadProfile = async () => {
      const {
        data: { user },
      } = await supabase.auth.getUser();

      if (!user) {
        setSession(null);
        setProfileRow(null);
        setLoading(false);
        return;
      }

      const roleValue = user.user_metadata?.role;
      const role: Role =
        roleValue === "Brand" || roleValue === "Designer" || roleValue === "Customer"
          ? roleValue
          : "Unknown";

      setSession({
        email: user.email ?? "Unknown email",
        id: user.id,
        role,
      });

      let table = "";
      let column = "";

      if (role === "Brand") {
        table = "brands";
        column = "account_id";
      } else if (role === "Designer") {
        table = "designers";
        column = "designer_uuid";
      } else if (role === "Customer") {
        table = "customers";
        column = "customer_uuid";
      }

      if (!table || !column) {
        setProfileRow(null);
        setLoading(false);
        return;
      }

      const { data, error } = await supabase.from(table).select("*").eq(column, user.id).single();

      if (error) {
        console.error("Profile table fetch error:", error.message);
        setProfileRow(null);
      } else {
        setProfileRow((data ?? null) as ProfileRow | null);
      }

      setLoading(false);
    };

    loadProfile();
  }, [supabase]);

  const contactInfo = useMemo(
    () => parseContactInfo(profileRow?.contact_info),
    [profileRow]
  );

  return (
    <main className="space-y-8">
      <section className="rounded-3xl border border-slate-200 bg-white p-8 shadow-sm">
        <h1 className="text-4xl font-semibold tracking-tight text-slate-900">Profile</h1>
        <p className="mt-3 max-w-3xl text-slate-600">
          Your account data is loaded from the signup flow table that matches your role.
        </p>
      </section>

      <section className="rounded-3xl border border-slate-200 bg-white p-8 shadow-sm">
        {loading ? (
          <p className="text-slate-600">Loading profile...</p>
        ) : !session ? (
          <div className="space-y-4">
            <p className="text-slate-700">You are not signed in.</p>
            <div className="flex gap-3">
              <Link href="/sign-up" className="rounded-lg bg-slate-900 px-4 py-2 text-sm font-medium text-white hover:bg-slate-800">
                Create account
              </Link>
              <Link href="/sign-up" className="rounded-lg border border-slate-300 px-4 py-2 text-sm font-medium text-slate-700 hover:bg-slate-100">
                Sign in
              </Link>
            </div>
          </div>
        ) : (
          <div className="space-y-6">
            <div className="grid grid-cols-1 gap-4 md:grid-cols-3">
              <article className="rounded-xl border border-slate-200 p-4">
                <p className="text-xs uppercase tracking-wide text-slate-500">Email</p>
                <p className="mt-1 font-medium text-slate-900">{session.email}</p>
              </article>
              <article className="rounded-xl border border-slate-200 p-4">
                <p className="text-xs uppercase tracking-wide text-slate-500">Role</p>
                <p className="mt-1 font-medium text-slate-900">{session.role}</p>
              </article>
              <article className="rounded-xl border border-slate-200 p-4">
                <p className="text-xs uppercase tracking-wide text-slate-500">User ID</p>
                <p className="mt-1 break-all font-medium text-slate-900">{session.id}</p>
              </article>
            </div>

            <div className="rounded-xl border border-slate-200 p-5">
              <h2 className="text-lg font-semibold text-slate-900">Database Record</h2>
              {!profileRow ? (
                <p className="mt-2 text-slate-600">No matching row found for this account yet.</p>
              ) : (
                <dl className="mt-4 grid grid-cols-1 gap-3 md:grid-cols-2">
                  {Object.entries(profileRow)
                    .filter(([key]) => key !== "contact_info")
                    .map(([key, value]) => (
                      <div key={key} className="rounded-lg bg-slate-50 p-3">
                        <dt className="text-xs uppercase tracking-wide text-slate-500">{key}</dt>
                        <dd className="mt-1 break-words text-slate-900">{String(value ?? "-")}</dd>
                      </div>
                    ))}
                </dl>
              )}
            </div>

            {contactInfo && (
              <div className="rounded-xl border border-slate-200 p-5">
                <h2 className="text-lg font-semibold text-slate-900">Contact Info</h2>
                <dl className="mt-4 grid grid-cols-1 gap-3 md:grid-cols-2">
                  {Object.entries(contactInfo).map(([key, value]) => (
                    <div key={key} className="rounded-lg bg-slate-50 p-3">
                      <dt className="text-xs uppercase tracking-wide text-slate-500">{key}</dt>
                      <dd className="mt-1 break-words text-slate-900">{String(value ?? "-")}</dd>
                    </div>
                  ))}
                </dl>
              </div>
            )}

            <div className="flex flex-wrap gap-3">
              {session.role === "Customer" && (
                <Link href="/my_order" className="rounded-lg border border-slate-300 px-4 py-2 text-sm font-medium text-slate-700 hover:bg-slate-100">
                  View my orders
                </Link>
              )}
              {session.role === "Brand" && (
                <Link href="/brand/dashboard" className="rounded-lg border border-slate-300 px-4 py-2 text-sm font-medium text-slate-700 hover:bg-slate-100">
                  Open brand dashboard
                </Link>
              )}
              {session.role === "Designer" && (
                <Link href="/designer/dashboard" className="rounded-lg border border-slate-300 px-4 py-2 text-sm font-medium text-slate-700 hover:bg-slate-100">
                  Open designer dashboard
                </Link>
              )}
            </div>
          </div>
        )}
      </section>
    </main>
  );
}
