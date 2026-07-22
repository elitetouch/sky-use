import { NextRequest } from "next/server";
import { proxyAuthed } from "@/lib/authed-fetch";

export async function POST(request: NextRequest) {
  const body = await request.json();

  return proxyAuthed("/admin/offices", { method: "POST", body: JSON.stringify(body) });
}
