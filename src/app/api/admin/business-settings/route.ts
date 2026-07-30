import { NextRequest } from "next/server";
import { proxyAuthed } from "@/lib/authed-fetch";

export async function PUT(request: NextRequest) {
  const body = await request.json();

  return proxyAuthed("/admin/business-settings", { method: "PUT", body: JSON.stringify(body) });
}
