import type { Metadata } from "next";
import { formatDate } from "@/lib/datetime";
import { apiFetch } from "@/lib/api";
import { getSessionToken, getCurrentUser, can } from "@/lib/session";
import type { PaginatedResult, User } from "@/lib/types";
import { NoAccess } from "@/components/admin/NoAccess";

export const metadata: Metadata = {
  title: "Customers",
};

export default async function AdminCustomersPage() {
  if (!can(await getCurrentUser(), "customers.view")) {
    return <NoAccess area="customers" />;
  }
  const token = await getSessionToken();
  const { items: customers } = await apiFetch<PaginatedResult<User>>("/admin/customers", { token: token! });

  return (
    <div>
      <h1 className="text-2xl font-bold text-navy">Customers</h1>
      <p className="mt-1 text-body">Everyone who has signed up to book shipments.</p>

      <div className="mt-6 overflow-hidden rounded-2xl border border-black/5">
        {customers.length === 0 ? (
          <p className="p-6 text-sm text-body">No customers yet.</p>
        ) : (
          <table className="w-full text-left text-sm">
            <thead className="bg-[#f5f5f5] text-xs uppercase tracking-wide text-body">
              <tr>
                <th className="px-5 py-3">Name</th>
                <th className="px-5 py-3">Email</th>
                <th className="px-5 py-3">Phone</th>
                <th className="px-5 py-3">Joined</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-black/5">
              {customers.map((customer) => (
                <tr key={customer.id}>
                  <td className="px-5 py-4 font-semibold text-navy">{customer.name}</td>
                  <td className="px-5 py-4 text-body">{customer.email}</td>
                  <td className="px-5 py-4 text-body">{customer.phone ?? "—"}</td>
                  <td className="px-5 py-4 text-body">{formatDate(customer.created_at)}</td>
                </tr>
              ))}
            </tbody>
          </table>
        )}
      </div>
    </div>
  );
}
