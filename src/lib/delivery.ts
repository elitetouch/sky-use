// Estimated delivery window options (DHL-style).
export const DELIVERY_WINDOWS = ["By Start of Day", "By End of Day"] as const;

/** Format an ISO date (YYYY-MM-DD) as e.g. "10 August 2026". */
export function formatDeliveryDate(iso: string | null | undefined): string | null {
  if (!iso) return null;
  const date = new Date(`${iso}T00:00:00`);
  if (Number.isNaN(date.getTime())) return null;
  return date.toLocaleDateString("en-GB", { day: "numeric", month: "long", year: "numeric" });
}

/** Combine date + window, e.g. "10 August 2026 - By End of Day". */
export function formatEstimatedDelivery(
  date: string | null | undefined,
  window: string | null | undefined,
): string | null {
  const formatted = formatDeliveryDate(date);
  if (!formatted) return null;
  return window ? `${formatted} - ${window}` : formatted;
}
