import { NextRequest, NextResponse } from "next/server";
import { apiFetch, ApiError } from "@/lib/api";
import { setSessionToken, type SessionUser } from "@/lib/session";

type LoginResponse = {
  user: SessionUser;
  token: string;
};

export async function POST(request: NextRequest) {
  const body = await request.json();

  try {
    const { user, token } = await apiFetch<LoginResponse>("/login", {
      method: "POST",
      body: JSON.stringify(body),
    });

    await setSessionToken(token);

    return NextResponse.json({ user });
  } catch (error) {
    if (error instanceof ApiError) {
      return NextResponse.json({ message: error.message, errors: error.errors }, { status: error.status });
    }

    return NextResponse.json({ message: "Something went wrong." }, { status: 500 });
  }
}
