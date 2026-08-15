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
