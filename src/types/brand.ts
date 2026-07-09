
export interface BrandContactInfo {
  first_name: string;
  last_name: string;
  phone: string;
  email: string;
  location: string;
  website: string;
  company_name: string;
}

export interface Brand {
  account_id: string;
  company_name: string;
  first_name: string;
  last_name: string;
  // every brand doesn't have a logo uploaded yet, and the DB stores that as SQL NULL, not an empty string.
  logo: string | null;
  style: string;
  website: string;
  about: string;
  contact_info: BrandContactInfo;
  slug: string;
  shipping_range: string | null;
  created_at: string;
}