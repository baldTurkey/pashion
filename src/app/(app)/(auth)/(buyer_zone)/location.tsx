"use client";

import { createClient } from "@/lib/supabase/client";
import { AddressAutocomplete } from "@/components/shared/address-autocomplete";
import {
  getCustomerDeliveryName,
  parseCustomerContactInfo,
  type CustomerContactInfo,
} from "@/lib/customers/contact-info";
import { CheckCircle2 } from "lucide-react";
import { useEffect, useMemo, useRef, useState } from "react";

export default function Location() {
  const supabase = useMemo(() => createClient(), []);
  const [name, setName] = useState("");
  const [location, setLocation] = useState("");
  const [loading, setLoading] = useState(false);
  const [userId, setUserId] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);
  const contactInfoRef = useRef<CustomerContactInfo>({});

  const fetchProfile = async () => {
    const {
      data: { user },
    } = await supabase.auth.getUser();
    if (!user) return;

    setUserId(user.id);
    const { data, error } = await supabase
      .from("customers")
      .select("contact_info")
      .eq("customer_uuid", user.id)
      .maybeSingle();

    if (data) {
      const contactInfo = parseCustomerContactInfo(data.contact_info);
      contactInfoRef.current = contactInfo;
      setLocation(contactInfo.location ?? "");
      setName(getCustomerDeliveryName(contactInfo));
    }
    if (error) {
      setError(error.message);
    }
  };

  useEffect(() => {
    fetchProfile();
  }, [supabase]);

  const saveContactInfo = async (changes: Partial<CustomerContactInfo>) => {
    if (!userId) return;
    setLoading(true);
    setError(null);
    const nextContactInfo = { ...contactInfoRef.current, ...changes };

    const { error } = await supabase
      .from("customers")
      .update({ contact_info: nextContactInfo })
      .eq("customer_uuid", userId);
    setLoading(false);
    if (error) {
      setError(error.message);
      return;
    }
    contactInfoRef.current = nextContactInfo;
  };

  return (
    <div className="relative flex flex-col gap-4 rounded-2xl bg-white p-6 shadow-sm">
      <label className="text-lg font-medium">Name</label>
      <input
        value={name}
        onChange={(event) => setName(event.target.value)}
        onBlur={() => void saveContactInfo({ delivery_name: name.trim() })}
        className="min-h-12 rounded-lg border border-slate-300 px-3 py-2 text-base"
        placeholder="Name"
      />
      <label className="text-lg font-medium">
        Give Delivery Address
      </label>
      <AddressAutocomplete
        className="min-h-12 w-full rounded-lg border border-slate-300 px-3 py-2 text-base"
        value={location}
        onChange={setLocation}
        onBlur={() => void saveContactInfo({ location: location.trim() })}
        onSelect={(suggestion) => {
          setLocation(suggestion.placeName);
          void saveContactInfo({ location: suggestion.placeName });
        }}
        placeholder="Enter Delivery Location"
      />
      {error && <p className="text-sm text-red-600">{error}</p>}
      <div className="mt-2 inline-flex items-center gap-2 text-sm text-slate-600">
        <CheckCircle2 size={16} className={loading ? "text-slate-400" : "text-emerald-600"} />
        {loading ? "Saving changes..." : "Saved"}
      </div>
    </div>
  );
}
