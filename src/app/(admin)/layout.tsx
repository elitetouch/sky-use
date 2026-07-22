import { redirect } from "next/navigation";
import { ReactNode } from "react";
import { DashboardShell, type NavItem } from "@/components/layout/DashboardShell";
import { getCurrentUser, isStaff } from "@/lib/session";

const NAV_ITEMS: NavItem[] = [
  { href: "/admin", label: "Overview" },
  { href: "/admin/shipments", label: "Shipments" },
  { href: "/admin/shipments/new", label: "Book Shipment" },
  { href: "/admin/pricing", label: "Pricing Rules" },
  { href: "/admin/offices", label: "Offices" },
  { href: "/admin/staff", label: "Staff" },
  { href: "/admin/customers", label: "Customers" },
];

export default async function AdminLayout({ children }: { children: ReactNode }) {
  const user = await getCurrentUser();

  if (!user) {
    redirect("/login");
  }

  if (!isStaff(user)) {
    redirect("/dashboard");
  }

  return (
    <DashboardShell user={user} navItems={NAV_ITEMS}>
      {children}
    </DashboardShell>
  );
}
