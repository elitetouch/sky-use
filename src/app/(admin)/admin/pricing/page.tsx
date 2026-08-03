import type { Metadata } from "next";
import { apiFetch } from "@/lib/api";
import { getSessionToken, getCurrentUser, can } from "@/lib/session";
import type { PricingRule } from "@/lib/types";
import { PricingRuleManager } from "@/components/admin/PricingRuleManager";
import { NoAccess } from "@/components/admin/NoAccess";

export const metadata: Metadata = {
  title: "Pricing Rules",
};

export default async function AdminPricingPage() {
  if (!can(await getCurrentUser(), "pricing.view")) {
    return <NoAccess area="pricing rules" />;
  }
  const token = await getSessionToken();
  const rules = await apiFetch<PricingRule[]>("/admin/pricing-rules", { token: token! });

  return (
    <div>
      <h1 className="text-2xl font-bold text-navy">Pricing Rules</h1>
      <p className="mt-1 text-body">These rates power the public quote calculator and shipment booking.</p>

      <div className="mt-6">
        <PricingRuleManager initialRules={rules} />
      </div>
    </div>
  );
}
