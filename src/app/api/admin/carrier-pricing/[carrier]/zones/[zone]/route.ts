import { proxyAuthed } from "@/lib/authed-fetch";

type Params = { params: Promise<{ carrier: string; zone: string }> };

// Delete a zone: its prices and its countries.
export async function DELETE(_request: Request, { params }: Params) {
  const { carrier, zone } = await params;
  return proxyAuthed(`/admin/carrier-pricing/${encodeURIComponent(carrier)}/zones/${encodeURIComponent(zone)}`, {
    method: "DELETE",
  });
}
