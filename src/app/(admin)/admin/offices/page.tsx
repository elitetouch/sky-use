import type { Metadata } from "next";
import { apiFetch } from "@/lib/api";
import { getSessionToken } from "@/lib/session";
import type { Office } from "@/lib/types";
import { OfficeManager } from "@/components/admin/OfficeManager";

export const metadata: Metadata = {
  title: "Offices",
};

export default async function AdminOfficesPage() {
  const token = await getSessionToken();
  const offices = await apiFetch<Office[]>("/admin/offices", { token: token! });

  return (
    <div>
      <h1 className="text-2xl font-bold text-navy">Offices</h1>
      <p className="mt-1 text-body">
        Manage office addresses and the terms &amp; conditions printed on customer receipts.
      </p>

      <div className="mt-6">
        <OfficeManager initialOffices={offices} />
      </div>
    </div>
  );
}
