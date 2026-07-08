import { NextRequest, NextResponse } from "next/server";
import { apiFetch, ApiError } from "@/lib/api";

export async function POST(request: NextRequest) {
  const body = await request.json();

  try {
    const data = await apiFetch("/quotes", {
      method: "POST",
      body: JSON.stringify(body),
    });

    return NextResponse.json({ data });
  } catch (error) {
    if (error instanceof ApiError) {
      return NextResponse.json({ message: error.message, errors: error.errors }, { status: error.status });
    }

    return NextResponse.json({ message: "Something went wrong." }, { status: 500 });
  }
}
