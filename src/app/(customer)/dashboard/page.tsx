import type { Metadata } from "next";
import { getCurrentUser } from "@/lib/session";

export const metadata: Metadata = {
  title: "Dashboard",
};

export default async function DashboardPage() {
  const user = await getCurrentUser();

  return (
    <div>
      <h1 className="text-2xl font-bold text-navy">Welcome back, {user?.name.split(" ")[0]}</h1>
      <p className="mt-1 text-body">Here&apos;s what&apos;s happening with your shipments.</p>
    </div>
  );
}
