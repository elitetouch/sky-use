import type { Metadata } from "next";
import { apiFetch } from "@/lib/api";
import { getSessionToken, getCurrentUser, can } from "@/lib/session";
import type { BusinessSetting, Office } from "@/lib/types";
import { OfficeManager } from "@/components/admin/OfficeManager";
import { BusinessSettingsManager } from "@/components/admin/BusinessSettingsManager";
import { NoAccess } from "@/components/admin/NoAccess";

export const metadata: Metadata = {
  title: "Offices",
};

const EMPTY_BUSINESS: BusinessSetting = { rc_number: null, email: null, website: null, phones: [] };

export default async function AdminOfficesPage() {
  if (!can(await getCurrentUser(), "offices.manage")) {
    return <NoAccess area="offices" />;
  }
  const token = await getSessionToken();

  const [offices, business] = await Promise.all([
    apiFetch<Office[]>("/admin/offices", { token: token! }),
    apiFetch<BusinessSetting>("/admin/business-settings", { token: token! }).catch(() => EMPTY_BUSINESS),
  ]);

  return (
    <div>
      <h1 className="text-2xl font-bold text-navy">Offices &amp; Business Details</h1>
      <p className="mt-1 text-body">
        Business-wide contact details and each office address printed on customer receipts.
      </p>

      <section className="mt-6">
        <h2 className="text-sm font-semibold uppercase tracking-wide text-body">Business Details</h2>
        <p className="mt-1 text-sm text-body/70">
          RC number, email, and phone numbers — shared across all offices and shown on every receipt.
        </p>
        <div className="mt-3">
          <BusinessSettingsManager initial={business} />
        </div>
      </section>

      <section className="mt-10">
        <h2 className="text-sm font-semibold uppercase tracking-wide text-body">Office Addresses</h2>
        <div className="mt-3">
          <OfficeManager initialOffices={offices} />
        </div>
      </section>
    </div>
  );
}
