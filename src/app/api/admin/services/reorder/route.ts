import { NextRequest } from "next/server";
import { proxyAuthed } from "@/lib/authed-fetch";

// Set the customer display order from an ordered list of service ids.
export async function PUT(request: NextRequest) {
  const body = await request.json().catch(() => ({}));
  return proxyAuthed("/admin/services/reorder", { method: "PUT", body: JSON.stringify(body) });
}
