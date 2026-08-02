"use client";

import { createClient } from "@/lib/supabase/client";
import { CheckCircle2 } from "lucide-react";
import { useEffect, useState } from "react";

export default function Location() {
  const supabase = createClient();
  const [name, setName] = useState("");
  const [location, setLocation] = useState("");
  const [loading, setLoading] = useState(false);
  const [userId, setUserId] = useState<string | null>(null);

  const fetchProfile = async () => {
    const {
      data: { user },
    } = await supabase.auth.getUser();
    if (!user) return;

    setUserId(user.id);
    const { data, error } = await supabase
      .from("profiles")
      .select("location, full_name")
      .eq("id", user.id)
      .single();

    if (data) {
      setLocation(data.location ?? "");
      setName(data.full_name ?? "");
    }
    if (error) {
      console.error("Fetch error:", error.message);
    }
  };

  useEffect(() => {
    fetchProfile();
  }, []);

  const handleNameChange = async (value: string) => {
    if (!userId) return;
    setLoading(true);
    setName(value);

    const { error } = await supabase
      .from("profiles")
      .upsert({ id: userId, full_name: value });
    setLoading(false);
    if (error) console.error("Save error:", error.message);
  };

  const handleLocationChange = async (value: string) => {
    if (!userId) return;
    setLoading(true);
    setLocation(value);

    const { error } = await supabase
      .from("profiles")
      .upsert({ id: userId, location: value });
    setLoading(false);
    if (error) console.error("Save error:", error.message);
  };

  return (
    <div className="relative flex flex-col gap-4 rounded-2xl bg-white p-6 shadow-sm">
      <label className="text-lg font-medium">Name</label>
      <input
        value={name}
        onChange={(e) => handleNameChange(e.target.value)}
        className="min-h-12 rounded-lg border border-slate-300 px-3 py-2 text-base"
        placeholder="Name"
      />
      <label className="text-lg font-medium">
        Give Delivery Address
      </label>
      <textarea
        value={location}
        onChange={(e) => handleLocationChange(e.target.value)}
        className="min-h-28 rounded-lg border border-slate-300 px-3 py-2 text-base"
        placeholder="Enter Delivery Location"
      />
      <div className="mt-2 inline-flex items-center gap-2 text-sm text-slate-600">
        <CheckCircle2 size={16} className={loading ? "text-slate-400" : "text-emerald-600"} />
        {loading ? "Saving changes..." : "Saved"}
      </div>
    </div>
  );
}
