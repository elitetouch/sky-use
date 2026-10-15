import { cookies, headers } from "next/headers";
import { redirect } from "next/navigation";
import { SESSION_COOKIE } from "@/lib/session";
import { safeRedirectPath } from "@/lib/safe-redirect";

/**
 * Send a visitor without a valid session to the login page, remembering where
 * they were going. If they still carry a session cookie (expired or revoked
 * token), route through /api/auth/session-expired first so the stale cookie is
 * cleared — otherwise they'd bounce between /login and the dashboard.
 */
export async function redirectToLogin(fallback: string): Promise<never> {
  const next = safeRedirectPath((await headers()).get("x-pathname"), fallback);
  const hasCookie = (await cookies()).has(SESSION_COOKIE);

  if (hasCookie) {
    redirect(`/api/auth/session-expired?next=${encodeURIComponent(next)}`);
  }

  redirect(`/login?redirect=${encodeURIComponent(next)}`);
}
