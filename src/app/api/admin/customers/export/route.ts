import { NextRequest } from "next/server";
import { getSessionToken } from "@/lib/session";

// Streams the customers CSV from the API back to the browser as a download.
export async function GET(request: NextRequest) {
  const token = await getSessionToken();
  if (!token) {
    return Response.json({ message: "Unauthenticated." }, { status: 401 });
  }

  const search = request.nextUrl.searchParams.get("search") ?? "";
  const query = search ? `?search=${encodeURIComponent(search)}` : "";
  const base = process.env.API_BASE_URL ?? "http://localhost:8000/api/v1";

  const response = await fetch(`${base}/admin/customers/export${query}`, {
    headers: { Accept: "text/csv", Authorization: `Bearer ${token}` },
    cache: "no-store",
  });

  if (!response.ok) {
    return Response.json({ message: "Export failed." }, { status: response.status });
  }

  const filename = `customers-${new Date().toISOString().slice(0, 10)}.csv`;

  return new Response(response.body, {
    status: 200,
    headers: {
      "Content-Type": "text/csv",
      "Content-Disposition": `attachment; filename="${filename}"`,
    },
  });
}
