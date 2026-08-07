import { redirect } from "next/navigation";
import { ReactNode } from "react";
import { DashboardShell, type NavItem } from "@/components/layout/DashboardShell";
import { getCurrentUser, isStaff } from "@/lib/session";

const NAV_ITEMS: NavItem[] = [
  { href: "/dashboard", label: "Overview" },
  { href: "/dashboard/shipments", label: "My Shipments" },
  { href: "/dashboard/shipments/new", label: "Book a Shipment" },
  { href: "/dashboard/wallet", label: "Wallet" },
  { href: "/dashboard/addresses", label: "Addresses" },
];

export default async function CustomerLayout({ children }: { children: ReactNode }) {
  const user = await getCurrentUser();

  if (!user) {
    redirect("/login");
  }

  // Only send actual staff to the admin area. A user who is neither a customer
  // nor staff (e.g. an orphaned session with no roles) stays here instead of
  // bouncing between /dashboard and /admin forever.
  if (isStaff(user)) {
    redirect("/admin");
  }

  return (
    <DashboardShell user={user} navItems={NAV_ITEMS}>
      {children}
    </DashboardShell>
  );
}
