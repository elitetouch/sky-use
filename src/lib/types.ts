export type Address = {
  id: string;
  label: string | null;
  contact_name: string;
  phone: string;
  line1: string;
  line2: string | null;
  city: string;
  state: string;
  country: string;
  is_default: boolean;
  created_at: string;
  updated_at: string;
};

export type StatusEvent = {
  id: string;
  status: string;
  label: string;
  location: string | null;
  note: string | null;
  created_at: string;
};

export type Shipment = {
  id: string;
  tracking_number: string;
  status: string;
  status_label: string;
  service_level: string;
  mode: string;
  weight_kg: string;
  dimensions: Record<string, unknown> | null;
  price_kobo: number | null;
  paid_at: string | null;
  description: string | null;
  sender_address?: Address;
  receiver_address?: Address;
  status_events?: StatusEvent[];
  created_at: string;
  updated_at: string;
};

export type PaginatedResult<T> = {
  items: T[];
  meta: {
    current_page: number;
    last_page: number;
    total: number;
  };
};

export type Wallet = {
  id: string;
  balance_kobo: number;
};

export type WalletTransaction = {
  id: string;
  type: "fund" | "debit" | "refund";
  status: "pending" | "success" | "failed";
  amount_kobo: number;
  reference: string;
  description: string | null;
  shipment_id: string | null;
  created_at: string;
};

export function formatNaira(kobo: number): string {
  return new Intl.NumberFormat("en-NG", { style: "currency", currency: "NGN" }).format(kobo / 100);
}
