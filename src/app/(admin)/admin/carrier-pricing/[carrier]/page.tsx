import type { Metadata } from "next";
import Link from "next/link";
import { notFound } from "next/navigation";
import { apiFetch, ApiError } from "@/lib/api";
import { getSessionToken, getCurrentUser, can } from "@/lib/session";
import { NoAccess } from "@/components/admin/NoAccess";
import { CarrierRateCardEditor, type RateCardDetail } from "@/components/admin/CarrierRateCardEditor";

export const metadata: Metadata = {
  title: "Rate Card",
};

export default async function CarrierRateCardPage({ params }: { params: Promise<{ carrier: string }> }) {
  const user = await getCurrentUser();
  if (!can(user, "pricing.view")) {
    return <NoAccess area="Carrier Pricing" />;
  }

  const { carrier } = await params;
  const token = await getSessionToken();

  let detail: RateCardDetail;
  try {
    detail = await apiFetch<RateCardDetail>(`/admin/carrier-pricing/${encodeURIComponent(carrier)}`, { token: token! });
  } catch (error) {
    if (error instanceof ApiError && error.status === 404) notFound();
    throw error;
  }

  const priced = new Set(detail.cells.map((c) => c.zone)).size;

  return (
    <div>
      <Link href="/admin/carrier-pricing" className="text-sm font-semibold text-body hover:text-navy">
        ← All carriers
      </Link>
      <h1 className="mt-2 text-2xl font-bold text-navy">{detail.label}</h1>
      <p className="mt-1 text-body">
        {detail.zones.length} zone{detail.zones.length === 1 ? "" : "s"} · {priced} priced ·{" "}
        {detail.weights.length} weight tier{detail.weights.length === 1 ? "" : "s"} · Prices in NGN
      </p>

      <CarrierRateCardEditor carrier={detail.carrier} initial={detail} canManage={can(user, "pricing.manage")} />
    </div>
  );
}
