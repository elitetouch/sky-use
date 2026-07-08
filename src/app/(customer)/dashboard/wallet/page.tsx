import type { Metadata } from "next";
import { apiFetch } from "@/lib/api";
import { getSessionToken } from "@/lib/session";
import type { PaginatedResult, Wallet, WalletTransaction } from "@/lib/types";
import { formatNaira } from "@/lib/types";
import { FundWalletForm } from "@/components/dashboard/FundWalletForm";

export const metadata: Metadata = {
  title: "Wallet",
};

export default async function WalletPage() {
  const token = await getSessionToken();
  const [wallet, transactions] = await Promise.all([
    apiFetch<Wallet>("/wallet", { token: token! }),
    apiFetch<PaginatedResult<WalletTransaction>>("/wallet/transactions", { token: token! }),
  ]);

  return (
    <div>
      <h1 className="text-2xl font-bold text-navy">Wallet</h1>
      <p className="mt-1 text-body">Fund your wallet to pay for shipments.</p>

      <div className="mt-6 grid gap-6 lg:grid-cols-3">
        <div className="rounded-2xl bg-navy p-6 text-white">
          <p className="text-sm text-white/70">Balance</p>
          <p className="mt-1 text-4xl font-extrabold">{formatNaira(wallet.balance_kobo)}</p>
        </div>

        <div className="lg:col-span-2">
          <FundWalletForm />
        </div>
      </div>

      <div className="mt-8">
        <p className="text-sm font-semibold text-navy">Transaction History</p>
        <div className="mt-3 overflow-hidden rounded-2xl border border-black/5">
          {transactions.items.length === 0 ? (
            <p className="p-6 text-sm text-body">No transactions yet.</p>
          ) : (
            <table className="w-full text-left text-sm">
              <thead className="bg-[#f5f5f5] text-xs uppercase tracking-wide text-body">
                <tr>
                  <th className="px-5 py-3">Type</th>
                  <th className="px-5 py-3">Description</th>
                  <th className="px-5 py-3">Amount</th>
                  <th className="px-5 py-3">Status</th>
                  <th className="px-5 py-3">Date</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-black/5">
                {transactions.items.map((transaction) => (
                  <tr key={transaction.id}>
                    <td className="px-5 py-4 capitalize text-navy font-semibold">{transaction.type}</td>
                    <td className="px-5 py-4 text-body">{transaction.description ?? "—"}</td>
                    <td
                      className={`px-5 py-4 font-semibold ${
                        transaction.type === "debit" ? "text-red" : "text-navy"
                      }`}
                    >
                      {transaction.type === "debit" ? "-" : "+"}
                      {formatNaira(transaction.amount_kobo)}
                    </td>
                    <td className="px-5 py-4 capitalize text-body">{transaction.status}</td>
                    <td className="px-5 py-4 text-body">
                      {new Date(transaction.created_at).toLocaleDateString()}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          )}
        </div>
      </div>
    </div>
  );
}
