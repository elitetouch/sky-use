"use client";

import { useRouter } from "next/navigation";
import { FormEvent, useState } from "react";
import { Button } from "@/components/ui/Button";
import { AddressFieldset, EMPTY_ADDRESS, type AddressForm } from "@/components/admin/AddressFieldset";
import type { Office, User } from "@/lib/types";
import { formatNaira } from "@/lib/types";

type CustomerMode = "existing" | "new";

type LineItem = { description: string; weight: string; cost: string };

const EMPTY_ITEM: LineItem = { description: "", weight: "", cost: "" };

const inputClass =
  "mt-1.5 w-full rounded-lg border border-black/10 px-4 py-2.5 text-sm text-navy outline-none focus:border-navy";

function toNumber(value: string): number {
  const n = Number(value);
  return Number.isFinite(n) && n > 0 ? n : 0;
}

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

  const [serviceLevel, setServiceLevel] = useState("standard");
  const [mode, setMode] = useState("local");
  const [carrier, setCarrier] = useState("");
  const [description, setDescription] = useState("");
  const [declaredValue, setDeclaredValue] = useState("");

  const [items, setItems] = useState<LineItem[]>([{ ...EMPTY_ITEM }]);
  const [handling, setHandling] = useState("");
  const [freight, setFreight] = useState("");
  const [insurance, setInsurance] = useState("");

  const defaultOffice = offices.find((o) => o.is_default) ?? offices[0];
  const [officeId, setOfficeId] = useState(defaultOffice?.id ?? "");

  const [markAsPaid, setMarkAsPaid] = useState(false);
  const [paymentMethod, setPaymentMethod] = useState("cash");

  const [error, setError] = useState<string | null>(null);
  const [isSubmitting, setIsSubmitting] = useState(false);

  const totalWeight = items.reduce((sum, item) => sum + toNumber(item.weight), 0);
  const itemsTotal = items.reduce((sum, item) => sum + toNumber(item.cost), 0);
  const chargesTotal = toNumber(handling) + toNumber(freight) + toNumber(insurance);
  const totalAmount = itemsTotal + chargesTotal;

  function updateItem(index: number, patch: Partial<LineItem>) {
    setItems((prev) => prev.map((item, i) => (i === index ? { ...item, ...patch } : item)));
  }

  function addItem() {
    setItems((prev) => [...prev, { ...EMPTY_ITEM }]);
  }

  function removeItem(index: number) {
    setItems((prev) => (prev.length === 1 ? prev : prev.filter((_, i) => i !== index)));
  }

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

    const validItems = items.filter((item) => item.description.trim() !== "");

    if (validItems.length === 0) {
      setError("Add at least one item with a description.");
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
        country: sender.country || undefined,
      },
      receiver_address: {
        label: receiver.label || undefined,
        contact_name: receiver.contact_name,
        phone: receiver.phone,
        line1: receiver.line1,
        line2: receiver.line2 || undefined,
        city: receiver.city,
        state: receiver.state,
        country: receiver.country || undefined,
      },
      service_level: serviceLevel,
      mode,
      carrier: carrier || undefined,
      declared_value: declaredValue ? Number(declaredValue) : undefined,
      description: description || undefined,
      items: validItems.map((item) => ({
        description: item.description.trim(),
        weight_kg: toNumber(item.weight),
        cost: toNumber(item.cost),
      })),
      handling: handling ? Number(handling) : undefined,
      freight: freight ? Number(freight) : undefined,
      insurance: insurance ? Number(insurance) : undefined,
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
          <div>
            <label className="block text-sm font-semibold text-navy">Carrier (optional)</label>
            <input
              value={carrier}
              onChange={(e) => setCarrier(e.target.value)}
              placeholder="e.g. DHL, UPS"
              className={inputClass}
            />
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
            <label className="block text-sm font-semibold text-navy">Declared value (₦, optional)</label>
            <input
              type="number"
              min="0"
              step="0.01"
              value={declaredValue}
              onChange={(e) => setDeclaredValue(e.target.value)}
              placeholder="0"
              className={inputClass}
            />
          </div>
        </div>

        <div className="mt-4">
          <label className="block text-sm font-semibold text-navy">Description (optional)</label>
          <textarea
            value={description}
            onChange={(e) => setDescription(e.target.value)}
            rows={3}
            placeholder="Describe the shipment contents…"
            className={`${inputClass} resize-y`}
          />
        </div>

        {/* Line items */}
        <div className="mt-6 border-t border-black/5 pt-5">
          <div className="flex items-center justify-between">
            <p className="text-sm font-semibold text-navy">Items</p>
            <button
              type="button"
              onClick={addItem}
              className="rounded-full border border-navy/20 px-3 py-1 text-xs font-semibold text-navy hover:bg-navy/5"
            >
              + Add item
            </button>
          </div>

          <div className="mt-3 space-y-3">
            {items.map((item, index) => (
              <div key={index} className="grid grid-cols-1 gap-2 sm:grid-cols-12 sm:items-end">
                <div className="sm:col-span-6">
                  {index === 0 ? (
                    <label className="block text-xs font-semibold text-body">Description</label>
                  ) : null}
                  <input
                    value={item.description}
                    onChange={(e) => updateItem(index, { description: e.target.value })}
                    placeholder="Item description"
                    className="mt-1 w-full rounded-lg border border-black/10 px-3 py-2 text-sm text-navy outline-none focus:border-navy"
                  />
                </div>
                <div className="sm:col-span-2">
                  {index === 0 ? (
                    <label className="block text-xs font-semibold text-body">Weight (kg)</label>
                  ) : null}
                  <input
                    type="number"
                    min="0"
                    step="0.01"
                    value={item.weight}
                    onChange={(e) => updateItem(index, { weight: e.target.value })}
                    placeholder="0"
                    className="mt-1 w-full rounded-lg border border-black/10 px-3 py-2 text-sm text-navy outline-none focus:border-navy"
                  />
                </div>
                <div className="sm:col-span-3">
                  {index === 0 ? (
                    <label className="block text-xs font-semibold text-body">Cost (₦)</label>
                  ) : null}
                  <input
                    type="number"
                    min="0"
                    step="0.01"
                    value={item.cost}
                    onChange={(e) => updateItem(index, { cost: e.target.value })}
                    placeholder="0"
                    className="mt-1 w-full rounded-lg border border-black/10 px-3 py-2 text-sm text-navy outline-none focus:border-navy"
                  />
                </div>
                <div className="sm:col-span-1">
                  <button
                    type="button"
                    onClick={() => removeItem(index)}
                    disabled={items.length === 1}
                    aria-label="Remove item"
                    className="w-full rounded-lg px-2 py-2 text-sm font-semibold text-red hover:bg-red/5 disabled:opacity-30"
                  >
                    ✕
                  </button>
                </div>
              </div>
            ))}
          </div>
        </div>

        {/* Charges */}
        <div className="mt-5 grid gap-4 sm:grid-cols-3">
          <div>
            <label className="block text-sm font-semibold text-navy">Handling (₦)</label>
            <input
              type="number"
              min="0"
              step="0.01"
              value={handling}
              onChange={(e) => setHandling(e.target.value)}
              placeholder="0"
              className={inputClass}
            />
          </div>
          <div>
            <label className="block text-sm font-semibold text-navy">Freight charge (₦)</label>
            <input
              type="number"
              min="0"
              step="0.01"
              value={freight}
              onChange={(e) => setFreight(e.target.value)}
              placeholder="0"
              className={inputClass}
            />
          </div>
          <div>
            <label className="block text-sm font-semibold text-navy">Insurance charge (₦)</label>
            <input
              type="number"
              min="0"
              step="0.01"
              value={insurance}
              onChange={(e) => setInsurance(e.target.value)}
              placeholder="0"
              className={inputClass}
            />
          </div>
        </div>

        {/* Totals */}
        <div className="mt-5 rounded-xl bg-[#f5f5f7] p-4 text-sm">
          <div className="flex justify-between text-body">
            <span>Total weight</span>
            <span className="font-semibold text-navy">{totalWeight.toFixed(2)} kg</span>
          </div>
          <div className="mt-1 flex justify-between text-body">
            <span>Number of items</span>
            <span className="font-semibold text-navy">
              {items.filter((i) => i.description.trim() !== "").length}
            </span>
          </div>
          <div className="mt-2 flex justify-between border-t border-black/10 pt-2 text-base">
            <span className="font-semibold text-navy">Total amount</span>
            <span className="font-extrabold text-navy">{formatNaira(Math.round(totalAmount * 100))}</span>
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
