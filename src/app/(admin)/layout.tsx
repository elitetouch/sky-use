import { redirect } from "next/navigation";
import { ReactNode } from "react";
import { DashboardShell, type NavItem } from "@/components/layout/DashboardShell";
import { getCurrentUser, isStaff, can } from "@/lib/session";

const NAV_ITEMS: (NavItem & { permission?: string })[] = [
  { href: "/admin", label: "Overview", permission: "dashboard.view" },
  { href: "/admin/shipments", label: "Shipments", permission: "shipments.view" },
  { href: "/admin/shipments/new", label: "Book Shipment", permission: "shipments.create" },
  { href: "/admin/pricing", label: "Pricing Rules", permission: "pricing.view" },
  { href: "/admin/status-templates", label: "Status Milestones", permission: "milestones.manage" },
  { href: "/admin/offices", label: "Offices", permission: "offices.manage" },
  { href: "/admin/staff", label: "Staff", permission: "staff.view" },
  { href: "/admin/customers", label: "Customers", permission: "customers.view" },
];

export default async function AdminLayout({ children }: { children: ReactNode }) {
  const user = await getCurrentUser();

  if (!user) {
    redirect("/login");
  }

  if (!isStaff(user)) {
    redirect("/dashboard");
  }

  const navItems: NavItem[] = NAV_ITEMS.filter(
    (item) => !item.permission || can(user, item.permission),
  ).map(({ href, label }) => ({ href, label }));

  return (
    <DashboardShell user={user} navItems={navItems}>
      {children}
    </DashboardShell>
  );
}
