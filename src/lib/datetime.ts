// All timestamps in the app are shown in Nigeria (West Africa) time,
// regardless of the viewer's device timezone.
const LAGOS_TZ = "Africa/Lagos";

type DateInput = string | number | Date | null | undefined;

/** Date only, e.g. "14 Aug 2026" (Africa/Lagos). */
export function formatDate(value: DateInput): string {
  if (!value) return "";
  const date = new Date(value);
  if (Number.isNaN(date.getTime())) return "";
  return date.toLocaleDateString("en-GB", {
    timeZone: LAGOS_TZ,
    day: "2-digit",
    month: "short",
    year: "numeric",
  });
}

/**
 * Value for a `<input type="datetime-local">`, i.e. "YYYY-MM-DDTHH:MM",
 * expressed in Africa/Lagos wall-clock so editing matches what's displayed.
 */
export function toLagosInputValue(value: DateInput): string {
  if (!value) return "";
  const date = new Date(value);
  if (Number.isNaN(date.getTime())) return "";
  const parts = new Intl.DateTimeFormat("en-CA", {
    timeZone: LAGOS_TZ,
    year: "numeric",
    month: "2-digit",
    day: "2-digit",
    hour: "2-digit",
    minute: "2-digit",
    hour12: false,
  }).formatToParts(date);
  const get = (t: string) => parts.find((p) => p.type === t)?.value ?? "";
  // en-CA gives YYYY-MM-DD for the date parts; hour may come back as "24" at midnight.
  const hour = get("hour") === "24" ? "00" : get("hour");
  return `${get("year")}-${get("month")}-${get("day")}T${hour}:${get("minute")}`;
}

/** Date and time, e.g. "14 Aug 2026, 15:42" (Africa/Lagos). */
export function formatDateTime(value: DateInput): string {
  if (!value) return "";
  const date = new Date(value);
  if (Number.isNaN(date.getTime())) return "";
  return date.toLocaleString("en-GB", {
    timeZone: LAGOS_TZ,
    day: "2-digit",
    month: "short",
    year: "numeric",
    hour: "2-digit",
    minute: "2-digit",
  });
}
