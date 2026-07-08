import { NextRequest } from "next/server";
import { proxyAuthed } from "@/lib/authed-fetch";

export async function POST(request: NextRequest) {
  const body = await request.json();

  return proxyAuthed("/shipments", { method: "POST", body: JSON.stringify(body) });
}
