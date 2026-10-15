import { NextRequest } from "next/server";
import { proxyAuthed } from "@/lib/authed-fetch";

type Params = { params: Promise<{ carrier: string; zone: string }> };

// Set exactly which countries belong to a zone (creates the zone if new).
export async function PUT(request: NextRequest, { params }: Params) {
  const { carrier, zone } = await params;
  const body = await request.json();
  return proxyAuthed(
    `/admin/carrier-pricing/${encodeURIComponent(carrier)}/zones/${encodeURIComponent(zone)}/countries`,
    { method: "PUT", body: JSON.stringify(body) },
  );
}
