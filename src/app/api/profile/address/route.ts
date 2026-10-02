import { NextRequest } from "next/server";
import { proxyAuthed } from "@/lib/authed-fetch";

export async function GET() {
  return proxyAuthed("/profile/address", { method: "GET" });
}

export async function PUT(request: NextRequest) {
  const body = await request.text();
  return proxyAuthed("/profile/address", { method: "PUT", body });
}
