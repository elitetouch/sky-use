// Formats a stored phone number into the house style: +(234) 80-3614-1026.
// Nigerian numbers (with or without country code / leading zero) group as
// 2-4-4. Anything that doesn't fit that shape is returned trimmed, untouched.
export function formatPhone(raw: string): string {
  const trimmed = raw.trim();
  const digits = trimmed.replace(/\D/g, "");

  const countryCode = "234";
  let national = digits;

  if (digits.startsWith("234")) {
    national = digits.slice(3);
  } else if (digits.startsWith("0")) {
    national = digits.slice(1);
  }

  if (national.length === 10) {
    const a = national.slice(0, 2);
    const b = national.slice(2, 6);
    const c = national.slice(6, 10);
    return `+(${countryCode}) ${a}-${b}-${c}`;
  }

  return trimmed;
}
