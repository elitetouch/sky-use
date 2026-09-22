import { NextRequest } from "next/server";
import { proxyAuthed } from "@/lib/authed-fetch";

// Confirm email setup with the emailed code.
export async function POST(request: NextRequest) {
  const body = await request.text();
  return proxyAuthed("/two-factor/email/confirm", { method: "POST", body });
}
