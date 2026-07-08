import { redirect } from "next/navigation";
import { ReactNode } from "react";
import { DashboardShell, type NavItem } from "@/components/layout/DashboardShell";
import { getCurrentUser } from "@/lib/session";

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

  if (!user.roles.includes("customer")) {
    redirect("/admin");
  }

  return (
    <DashboardShell user={user} navItems={NAV_ITEMS}>
      {children}
    </DashboardShell>
  );
}
