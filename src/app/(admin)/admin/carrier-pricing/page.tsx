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
        Zone-based rate cards for DHL, UPS &amp; FedEx (and Air/Sea cargo) that price customer bookings.
      </p>

      <CarrierPricingManager canManage={can(user, "pricing.manage")} />
    </div>
  );
}
