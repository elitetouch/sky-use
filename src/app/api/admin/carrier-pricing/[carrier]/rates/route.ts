import { NextRequest } from "next/server";
import { proxyAuthed } from "@/lib/authed-fetch";

type Params = { params: Promise<{ carrier: string }> };

// Save edited grid cells in one batch (null price removes a cell).
export async function PUT(request: NextRequest, { params }: Params) {
  const { carrier } = await params;
  const body = await request.json();
  return proxyAuthed(`/admin/carrier-pricing/${encodeURIComponent(carrier)}/rates`, {
    method: "PUT",
    body: JSON.stringify(body),
  });
}

// Clear every price for the carrier (zones are kept).
export async function DELETE(_request: NextRequest, { params }: Params) {
  const { carrier } = await params;
  return proxyAuthed(`/admin/carrier-pricing/${encodeURIComponent(carrier)}/rates`, { method: "DELETE" });
}
