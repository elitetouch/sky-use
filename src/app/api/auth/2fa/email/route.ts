import { proxyAuthed } from "@/lib/authed-fetch";

// Begin email setup (sends a code to the account email).
export async function POST() {
  return proxyAuthed("/two-factor/email", { method: "POST" });
}
