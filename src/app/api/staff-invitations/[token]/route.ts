import { NextRequest, NextResponse } from "next/server";
import { apiFetch, ApiError } from "@/lib/api";

export async function GET(_request: NextRequest, { params }: { params: Promise<{ token: string }> }) {
  const { token } = await params;

  try {
    const data = await apiFetch(`/staff-invitations/${encodeURIComponent(token)}`);
    return NextResponse.json({ data });
  } catch (error) {
    if (error instanceof ApiError) {
      return NextResponse.json({ message: error.message, errors: error.errors }, { status: error.status });
    }

    return NextResponse.json({ message: "Something went wrong." }, { status: 500 });
  }
}
