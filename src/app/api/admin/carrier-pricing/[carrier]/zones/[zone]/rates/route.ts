import { NextRequest } from "next/server";
import { getSessionToken } from "@/lib/session";

type Params = { params: Promise<{ carrier: string; zone: string }> };

// Upload a CSV of prices for ONE zone (multipart) — other zones are untouched.
export async function POST(request: NextRequest, { params }: Params) {
  const token = await getSessionToken();
  if (!token) {
    return Response.json({ message: "Unauthenticated." }, { status: 401 });
  }

  const { carrier, zone } = await params;
  const form = await request.formData();
  const base = process.env.API_BASE_URL ?? "http://localhost:8000/api/v1";

  const response = await fetch(
    `${base}/admin/carrier-pricing/${encodeURIComponent(carrier)}/zones/${encodeURIComponent(zone)}/rates`,
    {
      method: "POST",
      headers: { Accept: "application/json", Authorization: `Bearer ${token}` },
      body: form,
      cache: "no-store",
    },
  );

  const json = await response.json().catch(() => null);
  return Response.json(json ?? { message: "Something went wrong." }, { status: response.status });
}
