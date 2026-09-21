import { NextRequest } from "next/server";
import { proxyAuthed } from "@/lib/authed-fetch";

export async function GET() {
  return proxyAuthed("/shipment-drafts", { method: "GET" });
}

export async function POST(request: NextRequest) {
  const body = await request.json();
  return proxyAuthed("/shipment-drafts", { method: "POST", body: JSON.stringify(body) });
}
