import type { Metadata } from "next";
import { getCurrentUser } from "@/lib/session";

export const metadata: Metadata = {
  title: "Admin Dashboard",
};

export default async function AdminDashboardPage() {
  const user = await getCurrentUser();

  return (
    <div>
      <h1 className="text-2xl font-bold text-navy">Welcome back, {user?.name.split(" ")[0]}</h1>
      <p className="mt-1 text-body">Shipment and operations overview.</p>
    </div>
  );
}
