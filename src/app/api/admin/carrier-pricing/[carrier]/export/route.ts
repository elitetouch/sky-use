import { getSessionToken } from "@/lib/session";

type Params = { params: Promise<{ carrier: string }> };

// Streams the carrier's current rate card CSV back to the browser as a download.
export async function GET(_request: Request, { params }: Params) {
  const token = await getSessionToken();
  if (!token) {
    return Response.json({ message: "Unauthenticated." }, { status: 401 });
  }

  const { carrier } = await params;
  const base = process.env.API_BASE_URL ?? "http://localhost:8000/api/v1";

  const response = await fetch(`${base}/admin/carrier-pricing/${encodeURIComponent(carrier)}/export`, {
    headers: { Accept: "text/csv", Authorization: `Bearer ${token}` },
    cache: "no-store",
  });

  if (!response.ok) {
    return Response.json({ message: "Download failed." }, { status: response.status });
  }

  const filename = `${carrier}-rates-${new Date().toISOString().slice(0, 10)}.csv`;

  return new Response(response.body, {
    status: 200,
    headers: {
      "Content-Type": "text/csv",
      "Content-Disposition": `attachment; filename="${filename}"`,
    },
  });
}
