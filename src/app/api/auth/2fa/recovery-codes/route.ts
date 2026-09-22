import { NextRequest } from "next/server";
import { proxyAuthed } from "@/lib/authed-fetch";

// Regenerate recovery codes (authenticator method; requires password).
export async function POST(request: NextRequest) {
  const body = await request.text();
  return proxyAuthed("/two-factor/recovery-codes", { method: "POST", body });
}
