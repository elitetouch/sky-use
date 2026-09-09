import { NextRequest } from "next/server";
import { proxyAuthed } from "@/lib/authed-fetch";

export async function GET(request: NextRequest) {
  const qs = request.nextUrl.searchParams.toString();

  return proxyAuthed(`/admin/customers${qs ? `?${qs}` : ""}`, { method: "GET" });
}
