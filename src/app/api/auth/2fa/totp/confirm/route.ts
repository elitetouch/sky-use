import { NextRequest } from "next/server";
import { proxyAuthed } from "@/lib/authed-fetch";

// Confirm authenticator setup with a code; returns recovery codes.
export async function POST(request: NextRequest) {
  const body = await request.text();
  return proxyAuthed("/two-factor/totp/confirm", { method: "POST", body });
}
