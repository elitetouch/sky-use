import { NextResponse } from "next/server";
import { apiFetch } from "@/lib/api";
import { clearSessionToken, getSessionToken } from "@/lib/session";

export async function POST() {
  const token = await getSessionToken();

  if (token) {
    await apiFetch("/logout", { method: "POST", token }).catch(() => null);
  }

  await clearSessionToken();

  return NextResponse.json({ message: "Logged out" });
}
