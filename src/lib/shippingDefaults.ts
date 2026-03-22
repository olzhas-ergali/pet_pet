const KEY = 'optbirja-shipping-v1';

export type ShippingDefaults = {
  recipient_phone?: string;
  address_line?: string;
  city?: string;
};

export function loadShippingDefaults(): ShippingDefaults {
  try {
    const raw = localStorage.getItem(KEY);
    if (!raw) return {};
    const o = JSON.parse(raw) as Record<string, unknown>;
    return {
      recipient_phone: typeof o.recipient_phone === 'string' ? o.recipient_phone : undefined,
      address_line: typeof o.address_line === 'string' ? o.address_line : undefined,
      city: typeof o.city === 'string' ? o.city : undefined,
    };
  } catch {
    return {};
  }
}

export function saveShippingDefaults(v: ShippingDefaults): void {
  localStorage.setItem(
    KEY,
    JSON.stringify({
      recipient_phone: v.recipient_phone ?? '',
      address_line: v.address_line ?? '',
      city: v.city ?? '',
    })
  );
}
