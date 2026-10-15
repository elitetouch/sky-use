import { NextRequest, NextResponse } from "next/server";
import { SESSION_COOKIE } from "@/lib/session";

const AUTH_PAGES = ["/login", "/register"];
const PROTECTED_PREFIXES = ["/dashboard", "/admin"];

export function proxy(request: NextRequest) {
  const { pathname } = request.nextUrl;
  const hasSession = request.cookies.has(SESSION_COOKIE);

  const isProtected = PROTECTED_PREFIXES.some((prefix) => pathname.startsWith(prefix));
  const isAuthPage = AUTH_PAGES.some((page) => pathname.startsWith(page));

  if (isProtected && !hasSession) {
    const loginUrl = new URL("/login", request.url);
    loginUrl.searchParams.set("redirect", pathname + request.nextUrl.search);
    return NextResponse.redirect(loginUrl);
  }

  // Note: we deliberately do NOT bounce /login or /register just because a
  // session cookie exists — the cookie may hold an expired/revoked token, which
  // caused a /login <-> /dashboard redirect loop. Those pages verify the
  // session themselves and redirect only when it's genuinely valid.
  if (isAuthPage) {
    return NextResponse.next();
  }

  // Tell server layouts which page was requested, so an expired session can be
  // sent back here after logging in. (Always overwritten — never trusted from
  // the client.)
  const forwarded = new Headers(request.headers);
  forwarded.set("x-pathname", pathname + request.nextUrl.search);
  return NextResponse.next({ request: { headers: forwarded } });
}

export const config = {
  matcher: ["/dashboard/:path*", "/admin/:path*", "/login", "/register"],
};
