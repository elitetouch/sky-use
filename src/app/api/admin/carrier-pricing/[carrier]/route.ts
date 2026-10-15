import { proxyAuthed } from "@/lib/authed-fetch";

type Params = { params: Promise<{ carrier: string }> };

// Full rate card for one carrier: zones (+countries), weights and prices.
export async function GET(_request: Request, { params }: Params) {
  const { carrier } = await params;
  return proxyAuthed(`/admin/carrier-pricing/${encodeURIComponent(carrier)}`, { method: "GET" });
}
