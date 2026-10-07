import { cookies } from "next/headers";
import { apiFetch, ApiError } from "@/lib/api";

export const SESSION_COOKIE = "skyfot_token";

const COOKIE_OPTIONS = {
  httpOnly: true,
  secure: process.env.NODE_ENV === "production",
  sameSite: "lax" as const,
  path: "/",
  maxAge: 60 * 60 * 24 * 7, // 7 days
};

/** Route Handlers / Server Actions only (cookies() is mutable there). */
export async function setSessionToken(token: string): Promise<void> {
  const cookieStore = await cookies();
  cookieStore.set(SESSION_COOKIE, token, COOKIE_OPTIONS);
}

/** Route Handlers / Server Actions only. */
export async function clearSessionToken(): Promise<void> {
  const cookieStore = await cookies();
  cookieStore.delete(SESSION_COOKIE);
}

/** Safe to call from Server Components (read-only). */
export async function getSessionToken(): Promise<string | null> {
  const cookieStore = await cookies();
  return cookieStore.get(SESSION_COOKIE)?.value ?? null;
}

export type Role = "customer" | "admin" | "support" | "dispatcher" | "finance" | string;

export type SessionUser = {
  id: string;
  name: string;
  email: string;
  phone: string | null;
  status: string;
  roles: Role[];
  permissions?: string[];
  two_factor_enabled?: boolean;
  two_factor_method?: "totp" | "email" | null;
  nin_verified?: boolean;
  nin_masked?: string | null;
};

/** Whether the user holds a given permission (admins hold all). */
export function can(user: SessionUser | null | undefined, permission: string): boolean {
  if (!user) return false;
  if (user.roles.includes("admin")) return true;
  return (user.permissions ?? []).includes(permission);
}

/** Resolves the current user from the session cookie, or null if unauthenticated. */
export async function getCurrentUser(): Promise<SessionUser | null> {
  const token = await getSessionToken();

  if (!token) {
    return null;
  }

  // One retry so a transient /profile hiccup (timeout, cold start, a brief 5xx
  // under load — common right after a deploy) doesn't crash the whole page into
  // its error boundary. A real 401 still means "not signed in"; a persistent
  // 4xx is a genuine client error and is surfaced.
  for (let attempt = 0; attempt < 2; attempt++) {
    try {
      return await apiFetch<SessionUser>("/profile", { token });
    } catch (error) {
      if (error instanceof ApiError && error.status === 401) {
        return null;
      }

      const transient = !(error instanceof ApiError) || error.status >= 500;
      if (!transient || attempt === 1) {
        throw error;
      }

      await new Promise((resolve) => setTimeout(resolve, 300));
    }
  }

  // Unreachable — the loop either returns or throws.
  return null;
}

export function isStaff(user: SessionUser): boolean {
  return user.roles.some((role) => role !== "customer");
}
