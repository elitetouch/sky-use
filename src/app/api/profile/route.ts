import { NextRequest } from "next/server";
import { proxyAuthed } from "@/lib/authed-fetch";

export async function PATCH(request: NextRequest) {
  const body = await request.text();
  return proxyAuthed("/profile", { method: "PATCH", body });
}
