export interface CustomerContactInfo {
  first_name?: string;
  last_name?: string;
  delivery_name?: string;
  location?: string;
  shipping_city?: string;
  shipping_region?: string;
  shipping_postal_code?: string;
  shipping_country?: string;
  phone?: string;
  email?: string;
  [key: string]: unknown;
}

export function parseCustomerContactInfo(value: unknown): CustomerContactInfo {
  if (value && typeof value === "object" && !Array.isArray(value)) {
    return value as CustomerContactInfo;
  }

  if (typeof value === "string") {
    try {
      const parsed = JSON.parse(value);
      if (parsed && typeof parsed === "object" && !Array.isArray(parsed)) {
        return parsed as CustomerContactInfo;
      }
    } catch {
      return {};
    }
  }

  return {};
}

export function getCustomerDeliveryName(contactInfo: CustomerContactInfo): string {
  return (
    contactInfo.delivery_name?.trim() ||
    [contactInfo.first_name, contactInfo.last_name].filter(Boolean).join(" ").trim()
  );
}