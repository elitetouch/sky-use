import { NextRequest } from "next/server";
import { getSessionToken } from "@/lib/session";

// Forwards a proof image (multipart) to the API with the bearer token.
export async function POST(request: NextRequest) {
  const token = await getSessionToken();
  if (!token) {
    return Response.json({ message: "Unauthenticated." }, { status: 401 });
  }

  const form = await request.formData();
  const base = process.env.API_BASE_URL ?? "http://localhost:8000/api/v1";

  const response = await fetch(`${base}/shipments/proof-uploads`, {
    method: "POST",
    headers: { Accept: "application/json", Authorization: `Bearer ${token}` },
    body: form,
    cache: "no-store",
  });

  const json = await response.json().catch(() => null);
  return Response.json(json ?? { message: "Something went wrong." }, { status: response.status });
}
