import { NextResponse } from "next/server";
import { apiFetch, ApiError } from "@/lib/api";
import { getSessionToken } from "@/lib/session";

/**
 * For use inside Route Handlers that proxy an authenticated mutation to the
 * Laravel API. Reads the session cookie, forwards the request, and maps
 * ApiError into a matching JSON response.
 */
export async function proxyAuthed<T>(
  path: string,
  options: RequestInit = {},
): Promise<NextResponse> {
  const token = await getSessionToken();

  if (!token) {
    return NextResponse.json({ message: "Unauthenticated." }, { status: 401 });
  }

  try {
    const data = await apiFetch<T>(path, { ...options, token });
    return NextResponse.json({ data });
  } catch (error) {
    if (error instanceof ApiError) {
      return NextResponse.json({ message: error.message, errors: error.errors }, { status: error.status });
    }

    return NextResponse.json({ message: "Something went wrong." }, { status: 500 });
  }
}
