import { NextRequest } from "next/server";
import { proxyAuthed } from "@/lib/authed-fetch";

export async function GET(request: NextRequest) {
  const search = request.nextUrl.searchParams.get("search") ?? "";
  const query = search ? `?search=${encodeURIComponent(search)}` : "";

  return proxyAuthed(`/admin/customers${query}`, { method: "GET" });
}
