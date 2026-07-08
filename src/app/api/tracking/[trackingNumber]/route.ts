import { NextResponse } from "next/server";
import { apiFetch, ApiError } from "@/lib/api";

export async function GET(_request: Request, { params }: { params: Promise<{ trackingNumber: string }> }) {
  const { trackingNumber } = await params;

  try {
    const data = await apiFetch(`/tracking/${encodeURIComponent(trackingNumber)}`);
    return NextResponse.json({ data });
  } catch (error) {
    if (error instanceof ApiError) {
      return NextResponse.json({ message: error.message }, { status: error.status });
    }

    return NextResponse.json({ message: "Something went wrong." }, { status: 500 });
  }
}
