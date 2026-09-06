import { NextRequest } from "next/server";
import { proxyAuthed } from "@/lib/authed-fetch";

// Summary of carriers (zones + rate counts).
export async function GET() {
  return proxyAuthed("/admin/carrier-pricing", { method: "GET" });
}

// Upload a rate-card CSV (multipart) — forwarded to the API with the bearer token.
export async function POST(request: NextRequest) {
  const { getSessionToken } = await import("@/lib/session");
  const token = await getSessionToken();
  if (!token) {
    return Response.json({ message: "Unauthenticated." }, { status: 401 });
  }

  const form = await request.formData();
  const base = process.env.API_BASE_URL ?? "http://localhost:8000/api/v1";

  const response = await fetch(`${base}/admin/carrier-pricing/rates`, {
    method: "POST",
    headers: { Accept: "application/json", Authorization: `Bearer ${token}` },
    body: form,
    cache: "no-store",
  });

  const json = await response.json().catch(() => null);
  return Response.json(json ?? { message: "Something went wrong." }, { status: response.status });
}
