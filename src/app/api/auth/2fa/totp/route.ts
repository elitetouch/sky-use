import { proxyAuthed } from "@/lib/authed-fetch";

// Begin authenticator-app setup (returns secret + otpauth URI).
export async function POST() {
  return proxyAuthed("/two-factor/totp", { method: "POST" });
}
