import type { Metadata } from "next";
import { apiFetch } from "@/lib/api";
import { getSessionToken } from "@/lib/session";
import type { PricingRule } from "@/lib/types";
import { PricingRuleManager } from "@/components/admin/PricingRuleManager";

export const metadata: Metadata = {
  title: "Pricing Rules",
};

export default async function AdminPricingPage() {
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
