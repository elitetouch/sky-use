"use client";

import { useRouter } from "next/navigation";
import { FormEvent, useState } from "react";
import { Button } from "@/components/ui/Button";
import { AddressFieldset, EMPTY_ADDRESS, type AddressForm } from "@/components/admin/AddressFieldset";
import type { Office, User } from "@/lib/types";

type CustomerMode = "existing" | "new";

const inputClass =
  "mt-1.5 w-full rounded-lg border border-black/10 px-4 py-2.5 text-sm text-navy outline-none focus:border-navy";

export function AdminBookingForm({ offices }: { offices: Office[] }) {
  const router = useRouter();

  const [customerMode, setCustomerMode] = useState<CustomerMode>("existing");

  const [searchTerm, setSearchTerm] = useState("");
  const [searchResults, setSearchResults] = useState<User[]>([]);
  const [isSearching, setIsSearching] = useState(false);
  const [selectedCustomer, setSelectedCustomer] = useState<User | null>(null);

  const [newCustomer, setNewCustomer] = useState({ name: "", email: "", phone: "" });

  const [sender, setSender] = useState<AddressForm>(EMPTY_ADDRESS);
  const [receiver, setReceiver] = useState<AddressForm>(EMPTY_ADDRESS);

  const [weightKg, setWeightKg] = useState("1");
  const [serviceLevel, setServiceLevel] = useState("standard");
  const [mode, setMode] = useState("local");
  const [description, setDescription] = useState("");

  const defaultOffice = offices.find((o) => o.is_default) ?? offices[0];
  const [officeId, setOfficeId] = useState(defaultOffice?.id ?? "");

  const [markAsPaid, setMarkAsPaid] = useState(false);
  const [paymentMethod, setPaymentMethod] = useState("cash");

  const [error, setError] = useState<string | null>(null);
  const [isSubmitting, setIsSubmitting] = useState(false);

  async function handleSearch() {
    if (searchTerm.trim() === "") return;
    setIsSearching(true);
    try {
      const response = await fetch(`/api/admin/customers?search=${encodeURIComponent(searchTerm.trim())}`);
      const json = await response.json();
      setSearchResults(json.data?.items ?? []);
    } finally {
      setIsSearching(false);
    }
  }

  async function handleSubmit(event: FormEvent) {
    event.preventDefault();
    setError(null);

    if (customerMode === "existing" && !selectedCustomer) {
      setError("Search for and select a customer first.");
      return;
    }

    setIsSubmitting(true);

    const payload: Record<string, unknown> = {
      customer_mode: customerMode,
      sender_address: {
        label: sender.label || undefined,
        contact_name: sender.contact_name,
        phone: sender.phone,
        line1: sender.line1,
        line2: sender.line2 || undefined,
        city: sender.city,
        state: sender.state,
      },
      receiver_address: {
        label: receiver.label || undefined,
        contact_name: receiver.contact_name,
        phone: receiver.phone,
        line1: receiver.line1,
        line2: receiver.line2 || undefined,
        city: receiver.city,
        state: receiver.state,
      },
      weight_kg: Number(weightKg),
      service_level: serviceLevel,
      mode,
      description: description || undefined,
      office_id: officeId || undefined,
      mark_as_paid: markAsPaid,
      payment_method: markAsPaid ? paymentMethod : undefined,
    };

    if (customerMode === "existing") {
      payload.user_id = selectedCustomer!.id;
    } else {
      payload.new_customer = newCustomer;
    }

    try {
      const response = await fetch("/api/admin/shipments", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(payload),
      });

      const json = await response.json();

      if (!response.ok) {
        setError(json.message ?? "Unable to book this shipment.");
        return;
      }

      router.push(`/admin/shipments/${json.data.id}/receipt`);
      router.refresh();
    } finally {
      setIsSubmitting(false);
    }
  }

  return (
    <form onSubmit={handleSubmit} className="space-y-6">
      <div className="rounded-2xl border border-black/5 p-6">
        <p className="text-sm font-semibold text-navy">Customer</p>

        <div className="mt-3 flex gap-2">
          <button
            type="button"
            onClick={() => setCustomerMode("existing")}
            className={`rounded-full px-4 py-1.5 text-sm font-semibold ${
              customerMode === "existing" ? "bg-navy text-white" : "border border-navy/20 text-navy"
            }`}
          >
            Existing customer
          </button>
          <button
            type="button"
            onClick={() => setCustomerMode("new")}
            className={`rounded-full px-4 py-1.5 text-sm font-semibold ${
              customerMode === "new" ? "bg-navy text-white" : "border border-navy/20 text-navy"
            }`}
          >
            New customer
          </button>
        </div>

        {customerMode === "existing" ? (
          <div className="mt-4">
            {selectedCustomer ? (
              <div className="flex items-center justify-between rounded-lg bg-[#f5f5f5] px-4 py-3">
                <div>
                  <p className="text-sm font-semibold text-navy">{selectedCustomer.name}</p>
                  <p className="text-xs text-body">
                    {selectedCustomer.email}
                    {selectedCustomer.phone ? ` • ${selectedCustomer.phone}` : ""}
                  </p>
                </div>
                <button
                  type="button"
                  onClick={() => setSelectedCustomer(null)}
                  className="text-sm font-semibold text-red hover:text-red-light"
                >
                  Change
                </button>
              </div>
            ) : (
              <>
                <div className="flex gap-2">
                  <input
                    value={searchTerm}
                    onChange={(e) => setSearchTerm(e.target.value)}
                    onKeyDown={(e) => {
                      if (e.key === "Enter") {
                        e.preventDefault();
                        handleSearch();
                      }
                    }}
                    placeholder="Search by name, email, or phone"
                    className="w-full rounded-lg border border-black/10 px-4 py-2.5 text-sm text-navy outline-none focus:border-navy"
                  />
                  <Button type="button" variant="primary" onClick={handleSearch} disabled={isSearching}>
                    {isSearching ? "Searching…" : "Search"}
                  </Button>
                </div>

                {searchResults.length > 0 ? (
                  <ul className="mt-3 divide-y divide-black/5 rounded-lg border border-black/5">
                    {searchResults.map((customer) => (
                      <li key={customer.id}>
                        <button
                          type="button"
                          onClick={() => {
                            setSelectedCustomer(customer);
                            setSearchResults([]);
                          }}
                          className="flex w-full items-center justify-between px-4 py-3 text-left hover:bg-[#f5f5f5]"
                        >
                          <span>
                            <span className="block text-sm font-semibold text-navy">{customer.name}</span>
                            <span className="block text-xs text-body">
                              {customer.email}
                              {customer.phone ? ` • ${customer.phone}` : ""}
                            </span>
                          </span>
                          <span className="text-sm font-semibold text-navy">Select</span>
                        </button>
                      </li>
                    ))}
                  </ul>
                ) : null}
              </>
            )}
          </div>
        ) : (
          <div className="mt-4 grid gap-4 sm:grid-cols-3">
            <div>
              <label className="block text-sm font-semibold text-navy">Full name</label>
              <input
                required
                value={newCustomer.name}
                onChange={(e) => setNewCustomer((p) => ({ ...p, name: e.target.value }))}
                className={inputClass}
              />
            </div>
            <div>
              <label className="block text-sm font-semibold text-navy">Email</label>
              <input
                type="email"
                required
                value={newCustomer.email}
                onChange={(e) => setNewCustomer((p) => ({ ...p, email: e.target.value }))}
                className={inputClass}
              />
            </div>
            <div>
              <label className="block text-sm font-semibold text-navy">Phone</label>
              <input
                value={newCustomer.phone}
                onChange={(e) => setNewCustomer((p) => ({ ...p, phone: e.target.value }))}
                className={inputClass}
              />
            </div>
          </div>
        )}
      </div>

      <AddressFieldset title="Sender" value={sender} onChange={setSender} />
      <AddressFieldset title="Receiver" value={receiver} onChange={setReceiver} />

      <div className="rounded-2xl border border-black/5 p-6">
        <p className="text-sm font-semibold text-navy">Package &amp; Booking</p>
        <div className="mt-4 grid gap-4 sm:grid-cols-3">
          <div>
            <label className="block text-sm font-semibold text-navy">Weight (kg)</label>
            <input
              type="number"
              min="0.1"
              step="0.1"
              required
              value={weightKg}
              onChange={(e) => setWeightKg(e.target.value)}
              className={inputClass}
            />
          </div>
          <div>
            <label className="block text-sm font-semibold text-navy">Service</label>
            <select value={serviceLevel} onChange={(e) => setServiceLevel(e.target.value)} className={inputClass}>
              <option value="standard">Standard</option>
              <option value="express">Express</option>
            </select>
          </div>
          <div>
            <label className="block text-sm font-semibold text-navy">Mode</label>
            <select value={mode} onChange={(e) => setMode(e.target.value)} className={inputClass}>
              <option value="local">Local</option>
              <option value="international">International</option>
            </select>
          </div>
        </div>

        <div className="mt-4 grid gap-4 sm:grid-cols-2">
          <div>
            <label className="block text-sm font-semibold text-navy">Booking office</label>
            <select value={officeId} onChange={(e) => setOfficeId(e.target.value)} className={inputClass}>
              {offices.map((office) => (
                <option key={office.id} value={office.id}>
                  {office.name}
                </option>
              ))}
            </select>
          </div>
          <div>
            <label className="block text-sm font-semibold text-navy">Description (optional)</label>
            <input value={description} onChange={(e) => setDescription(e.target.value)} className={inputClass} />
          </div>
        </div>

        <div className="mt-5 border-t border-black/5 pt-5">
          <label className="flex items-center gap-2 text-sm font-semibold text-navy">
            <input type="checkbox" checked={markAsPaid} onChange={(e) => setMarkAsPaid(e.target.checked)} />
            Customer paid at the counter
          </label>

          {markAsPaid ? (
            <div className="mt-3 max-w-xs">
              <label className="block text-sm font-semibold text-navy">Payment method</label>
              <select value={paymentMethod} onChange={(e) => setPaymentMethod(e.target.value)} className={inputClass}>
                <option value="cash">Cash</option>
                <option value="card">Card</option>
                <option value="transfer">Bank Transfer</option>
              </select>
            </div>
          ) : null}
        </div>
      </div>

      {error ? <p className="text-sm text-red">{error}</p> : null}

      <Button type="submit" variant="accent" size="lg" disabled={isSubmitting}>
        {isSubmitting ? "Booking…" : "Book Shipment & Print Receipt"}
      </Button>
    </form>
  );
}
