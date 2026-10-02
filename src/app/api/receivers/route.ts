import { proxyAuthed } from "@/lib/authed-fetch";

export async function GET() {
  return proxyAuthed("/receivers", { method: "GET" });
}
