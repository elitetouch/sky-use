import { NextRequest } from "next/server";
import { proxyAuthed } from "@/lib/authed-fetch";

// Current 2FA status.
export async function GET() {
  return proxyAuthed("/two-factor", { method: "GET" });
}

// Disable 2FA (requires password).
export async function DELETE(request: NextRequest) {
  const body = await request.text();
  return proxyAuthed("/two-factor", { method: "DELETE", body });
}
