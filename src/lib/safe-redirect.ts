/**
 * Return `value` only if it's a same-site path (e.g. "/admin/shipments?x=1"),
 * otherwise `fallback`. Prevents open redirects via ?redirect=… / ?next=…:
 * rejects absolute URLs ("https://evil.com"), protocol-relative ("//evil.com"),
 * backslash tricks ("/\evil.com"), "javascript:" and control characters.
 */
export function safeRedirectPath(value: string | null | undefined, fallback: string): string {
  if (typeof value !== "string" || value === "") return fallback;
  if (!value.startsWith("/") || value.startsWith("//") || value.startsWith("/\\")) return fallback;
  if (/[\u0000-\u001f\u007f\\]/.test(value)) return fallback;

  try {
    const base = "http://same-site.invalid";
    const url = new URL(value, base);
    if (url.origin !== base) return fallback;
    return `${url.pathname}${url.search}${url.hash}`;
  } catch {
    return fallback;
  }
}
