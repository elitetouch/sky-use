import { NextRequest, NextResponse } from "next/server";
import { apiFetch, ApiError } from "@/lib/api";
import { setSessionToken, type SessionUser } from "@/lib/session";

type LoginResponse = {
  user?: SessionUser;
  token?: string;
  two_factor_required?: boolean;
  method?: "totp" | "email";
  challenge_token?: string;
};

export async function POST(request: NextRequest) {
  const body = await request.json();

  try {
    const data = await apiFetch<LoginResponse>("/login", {
      method: "POST",
      body: JSON.stringify(body),
    });

    // 2FA is on — don't establish a session yet; the client collects the code.
    if (data.two_factor_required) {
      return NextResponse.json({
        two_factor_required: true,
        method: data.method,
        challenge_token: data.challenge_token,
      });
    }

    if (data.token) {
      await setSessionToken(data.token);
    }

    return NextResponse.json({ user: data.user });
  } catch (error) {
    if (error instanceof ApiError) {
      return NextResponse.json({ message: error.message, errors: error.errors }, { status: error.status });
    }

    return NextResponse.json({ message: "Something went wrong." }, { status: 500 });
  }
}
