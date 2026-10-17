import type { Metadata } from "next";
import { getCurrentUser, can } from "@/lib/session";
import { NoAccess } from "@/components/admin/NoAccess";
import { ServicesManager } from "@/components/admin/ServicesManager";

export const metadata: Metadata = {
  title: "Services",
};

export default async function ServicesPage() {
  const user = await getCurrentUser();
  if (!can(user, "pricing.view")) {
    return <NoAccess area="Services" />;
  }

  return (
    <div>
      <h1 className="text-2xl font-bold text-navy">Services</h1>
      <p className="mt-1 text-body">
        The shipping options customers can book — their names, delivery estimates, display order and visibility.
      </p>

      <ServicesManager canManage={can(user, "pricing.manage")} />
    </div>
  );
}
