// Mirrors the real `designers` table columns. Unlike `brands.contact_info`
// (a `text` column, see src/types/brand.ts), `designers.contact_info` is a
// genuine `jsonb` column — confirmed via `supabase db query --linked` — so it
// comes back from Supabase already parsed, no manual JSON.parse needed here.
export interface DesignerContactInfo {
  first_name: string;
  last_name: string;
  phone: string;
  email: string;
  artist_handle: string;
  portfolio: string;
  socials: string;
}

export interface Designer {
  designer_uuid: string;
  artist_handle: string;
  portfolio: string;
  socials: string;
  bio: string;
  style: string;
  contact_info: DesignerContactInfo;
  created_at: string;
}
