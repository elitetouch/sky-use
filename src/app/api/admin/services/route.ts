import { NextRequest } from "next/server";
import { proxyAuthed } from "@/lib/authed-fetch";

// List every service (admin), with rate-card size.
export async function GET() {
  return proxyAuthed("/admin/services", { method: "GET" });
}

// Create a service.
export async function POST(request: NextRequest) {
  const body = await request.json().catch(() => ({}));
  return proxyAuthed("/admin/services", { method: "POST", body: JSON.stringify(body) });
}
