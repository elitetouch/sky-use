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

export type User = {
  id: string;
  name: string;
  email: string;
  phone: string | null;
  status: string;
  roles: string[];
  created_at: string;
};

export type Office = {
  id: string;
  name: string;
  address: string;
  terms_and_conditions: string | null;
  is_default: boolean;
  created_at: string;
  updated_at: string;
};

export type AdminShipment = Shipment & {
  courier: string | null;
  courier_label: string | null;
  courier_tracking_number: string | null;
  payment_method: string | null;
  payment_method_label: string | null;
  user?: User;
  booked_by?: string | null;
  office?: Office | null;
};

export type PricingRule = {
  id: string;
  service_level: string;
  mode: string;
  base_fee_kobo: number;
  per_kg_kobo: number;
  is_active: boolean;
  created_at: string;
  updated_at: string;
};

export type Staff = {
  id: string;
  name: string;
  email: string;
  phone: string | null;
  status: string;
  roles: string[];
  created_at: string;
};

export type StaffInvitation = {
  id: string;
  name: string;
  email: string;
  role: string;
  invited_by: string | null;
  expires_at: string;
  accepted_at: string | null;
  is_expired: boolean;
  created_at: string;
};

export type Role = {
  id: number;
  name: string;
  permissions: string[];
  is_protected: boolean;
};

export type DashboardMetrics = {
  shipments_total: number;
  shipments_by_status: Record<string, number>;
  shipments_delivered_this_month: number;
  revenue_this_month_kobo: number;
  customers_total: number;
  staff_total: number;
  pending_invitations: number;
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
