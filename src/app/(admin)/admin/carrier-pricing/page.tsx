import type { Metadata } from "next";
import { getCurrentUser, can } from "@/lib/session";
import { NoAccess } from "@/components/admin/NoAccess";
import { CarrierPricingManager } from "@/components/admin/CarrierPricingManager";

export const metadata: Metadata = {
  title: "Carrier Pricing",
};

export default async function CarrierPricingPage() {
  const user = await getCurrentUser();
  if (!can(user, "pricing.view")) {
    return <NoAccess area="Carrier Pricing" />;
  }

  return (
    <div>
      <h1 className="text-2xl font-bold text-navy">Carrier Pricing</h1>
      <p className="mt-1 text-body">
        Each service&apos;s zone-based rate card. Prices are by destination zone &amp; weight and drive customer quotes.
        Manage the services themselves (names, order, visibility) under <strong>Services</strong>.
      </p>

      <CarrierPricingManager canManage={can(user, "pricing.manage")} />
    </div>
  );
}
