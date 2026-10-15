import { NextRequest, NextResponse } from "next/server";
import { clearSessionToken, getCurrentUser, getSessionToken } from "@/lib/session";
import { safeRedirectPath } from "@/lib/safe-redirect";

/**
 * Clears a dead session cookie (expired/revoked token) and sends the visitor to
 * log in, keeping their intended destination. A still-valid session is NOT
 * cleared — it just continues to `next` — so this link can't be used to log
 * someone out.
 */
export async function GET(request: NextRequest) {
  const next = safeRedirectPath(request.nextUrl.searchParams.get("next"), "/dashboard");

  if (await getSessionToken()) {
    let valid: boolean | null;
    try {
      valid = (await getCurrentUser()) !== null;
    } catch {
      valid = null; // API unreachable — don't guess; leave the cookie alone.
    }

    if (valid === true) {
      return NextResponse.redirect(new URL(next, request.url));
    }
    if (valid === false) {
      await clearSessionToken();
    }
  }

  const login = new URL("/login", request.url);
  login.searchParams.set("redirect", next);
  return NextResponse.redirect(login);
}
