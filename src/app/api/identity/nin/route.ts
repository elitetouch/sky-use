import { NextRequest } from "next/server";
import { proxyAuthed } from "@/lib/authed-fetch";

// Verify a NIN via Prembly (cache-first on the API).
export async function POST(request: NextRequest) {
  const body = await request.text();
  return proxyAuthed("/identity/nin", { method: "POST", body });
}
