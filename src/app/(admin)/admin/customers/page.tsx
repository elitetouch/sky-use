import type { Metadata } from "next";
import { formatDate } from "@/lib/datetime";
import { apiFetch } from "@/lib/api";
import { getSessionToken, getCurrentUser, can } from "@/lib/session";
import type { PaginatedResult, User } from "@/lib/types";
import { NoAccess } from "@/components/admin/NoAccess";
import { CustomerSearch } from "@/components/admin/CustomerSearch";
import { EditCustomerButton } from "@/components/admin/EditCustomerButton";
import { VerifiedBadge } from "@/components/identity/VerifiedBadge";
import { NinReveal } from "@/components/identity/NinReveal";
import { Pagination } from "@/components/admin/Pagination";
import { LinkButton } from "@/components/ui/Button";

export const metadata: Metadata = {
  title: "Customers",
};

export default async function AdminCustomersPage({
  searchParams,
}: {
  searchParams: Promise<{ search?: string; page?: string; per_page?: string }>;
}) {
  const { search, page, per_page: perPage } = await searchParams;
  const user = await getCurrentUser();
  // Viewable with either the view or the add (edit) permission; super admins
  // hold both via can().
  if (!can(user, "customers.view") && !can(user, "customers.create")) {
    return <NoAccess area="customers" />;
  }
  const canEdit = can(user, "customers.create");
  // The NIN column is gated by a permission assignable to any role.
  const canViewNin = can(user, "customers.nin");
  const token = await getSessionToken();

  const params = new URLSearchParams();
  if (search) params.set("search", search);
  if (page && Number(page) > 1) params.set("page", page);
  if (perPage) params.set("per_page", perPage);
  const query = params.toString() ? `?${params.toString()}` : "";

  const { items: customers, meta } = await apiFetch<PaginatedResult<User>>(`/admin/customers${query}`, {
    token: token!,
  });

  const exportHref = `/api/admin/customers/export${search ? `?search=${encodeURIComponent(search)}` : ""}`;

  return (
    <div>
      <div className="flex flex-wrap items-start justify-between gap-3">
        <div>
          <h1 className="text-2xl font-bold text-navy">Customers</h1>
          <p className="mt-1 text-body">Everyone who has signed up to book shipments.</p>
        </div>
        <LinkButton href={exportHref} variant="ghost" size="sm">
          Export CSV
        </LinkButton>
      </div>

      <div className="mt-4 w-full lg:max-w-md">
        <CustomerSearch initialValue={search ?? ""} />
      </div>

      <div className="mt-6 overflow-hidden rounded-2xl border border-black/5">
        {customers.length === 0 ? (
          <p className="p-6 text-sm text-body">No customers found.</p>
        ) : (
          <table className="w-full text-left text-sm">
            <thead className="bg-[#f5f5f5] text-xs uppercase tracking-wide text-body">
              <tr>
                <th className="px-5 py-3">Name</th>
                <th className="px-5 py-3">Email</th>
                <th className="px-5 py-3">Phone</th>
                {canViewNin ? <th className="px-5 py-3">NIN</th> : null}
                <th className="px-5 py-3">Identity</th>
                <th className="px-5 py-3">Status</th>
                <th className="px-5 py-3">Joined</th>
                {canEdit ? <th className="px-5 py-3 text-right">Actions</th> : null}
              </tr>
            </thead>
            <tbody className="divide-y divide-black/5">
              {customers.map((customer) => (
                <tr key={customer.id} className="hover:bg-[#f5f5f5]">
                  <td className="px-5 py-4 font-semibold text-navy">{customer.name}</td>
                  <td className="px-5 py-4 text-body">{customer.email}</td>
                  <td className="px-5 py-4 text-body">{customer.phone ?? "—"}</td>
                  {canViewNin ? (
                    <td className="px-5 py-4">
                      <NinReveal nin={customer.nin} />
                    </td>
                  ) : null}
                  <td className="px-5 py-4">
                    {customer.nin_verified ? (
                      <VerifiedBadge />
                    ) : (
                      <span className="rounded-full bg-black/5 px-3 py-1 text-xs font-semibold text-body">
                        Not verified
                      </span>
                    )}
                  </td>
                  <td className="px-5 py-4">
                    {customer.status === "active" ? (
                      <span className="rounded-full bg-green-100 px-3 py-1 text-xs font-semibold text-green-700">
                        Active
                      </span>
                    ) : (
                      <span className="rounded-full bg-red/10 px-3 py-1 text-xs font-semibold text-red">
                        {customer.status}
                      </span>
                    )}
                  </td>
                  <td className="px-5 py-4 text-body">{formatDate(customer.created_at)}</td>
                  {canEdit ? (
                    <td className="px-5 py-4 text-right">
                      <EditCustomerButton customer={customer} />
                    </td>
                  ) : null}
                </tr>
              ))}
            </tbody>
          </table>
        )}
      </div>

      {customers.length > 0 ? (
        <Pagination
          currentPage={meta.current_page}
          lastPage={meta.last_page}
          perPage={meta.per_page ?? customers.length}
          total={meta.total}
        />
      ) : null}
    </div>
  );
}
