"use client";

import { useRouter } from "next/navigation";
import { FormEvent, useState } from "react";
import { Button } from "@/components/ui/Button";
import { AddressFieldset, EMPTY_ADDRESS, type AddressForm } from "@/components/admin/AddressFieldset";
import type { Office, User } from "@/lib/types";
import { formatNaira } from "@/lib/types";
import { SERVICE_OPTIONS, DEFAULT_SERVICE } from "@/lib/services";
import { DELIVERY_WINDOWS, formatEstimatedDelivery } from "@/lib/delivery";

type CustomerMode = "existing" | "new";

type LineItem = { description: string; amount: string };

const EMPTY_ITEM: LineItem = { description: "", amount: "" };

const inputClass =
  "mt-1.5 w-full rounded-lg border border-black/10 px-4 py-2.5 text-sm text-navy outline-none focus:border-navy";

function toNumber(value: string): number {
  const n = Number(value);
  return Number.isFinite(n) && n > 0 ? n : 0;
}

export function AdminBookingForm({
  offices,
  canRecordPayment,
}: {
  offices: Office[];
  canRecordPayment: boolean;
}) {
  const router = useRouter();

  const [customerMode, setCustomerMode] = useState<CustomerMode>("existing");

  const [searchTerm, setSearchTerm] = useState("");
  const [searchResults, setSearchResults] = useState<User[]>([]);
  const [isSearching, setIsSearching] = useState(false);
  const [selectedCustomer, setSelectedCustomer] = useState<User | null>(null);

  const [newCustomer, setNewCustomer] = useState({ name: "", email: "", phone: "" });

  const [sender, setSender] = useState<AddressForm>(EMPTY_ADDRESS);
  // Receivers are often international — don't presume a destination country.
  const [receiver, setReceiver] = useState<AddressForm>({ ...EMPTY_ADDRESS, country: "" });

  const [serviceLevel, setServiceLevel] = useState<string>(DEFAULT_SERVICE);
  const [carrier, setCarrier] = useState("");
  const [terminalShipmentId, setTerminalShipmentId] = useState("");
  const [estimatedDate, setEstimatedDate] = useState("");
  const [estimatedWindow, setEstimatedWindow] = useState("By End of Day");
  const [totalWeight, setTotalWeight] = useState("");
  const [note, setNote] = useState("");
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
  const [showPreview, setShowPreview] = useState(false);

  // Item amounts are recorded per line but are NOT part of the total.
  const totalAmount = toNumber(handling) + toNumber(freight) + toNumber(insurance);

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

  const validItems = items.filter((item) => item.description.trim() !== "");

  function validate(): string | null {
    if (customerMode === "existing" && !selectedCustomer) {
      return "Search for and select a customer first.";
    }
    if (customerMode === "new" && newCustomer.name.trim() === "") {
      return "Enter the new customer's name.";
    }
    if (sender.contact_name.trim() === "" || receiver.contact_name.trim() === "") {
      return "Sender and receiver contact names are required.";
    }
    if (!totalWeight || Number(totalWeight) <= 0) {
      return "Enter the total weight.";
    }
    if (validItems.length === 0) {
      return "Add at least one item with a description.";
    }
    return null;
  }

  function buildPayload(): Record<string, unknown> {
    const payload: Record<string, unknown> = {
      customer_mode: customerMode,
      sender_address: {
        label: sender.label || undefined,
        contact_name: sender.contact_name,
        phone: sender.phone,
        email: sender.email || undefined,
        line1: sender.line1,
        line2: sender.line2 || undefined,
        city: sender.city,
        state: sender.state,
        postal_code: sender.postal_code || undefined,
        country: sender.country || undefined,
      },
      receiver_address: {
        label: receiver.label || undefined,
        contact_name: receiver.contact_name,
        phone: receiver.phone,
        email: receiver.email || undefined,
        line1: receiver.line1,
        line2: receiver.line2 || undefined,
        city: receiver.city,
        state: receiver.state,
        postal_code: receiver.postal_code || undefined,
        country: receiver.country || undefined,
      },
      service_level: serviceLevel,
      weight_kg: Number(totalWeight),
      carrier: carrier || undefined,
      terminal_shipment_id: terminalShipmentId.trim() || undefined,
      estimated_delivery_date: estimatedDate || undefined,
      estimated_delivery_window: estimatedDate ? estimatedWindow || undefined : undefined,
      declared_value: declaredValue ? Number(declaredValue) : undefined,
      description: note || undefined,
      items: validItems.map((item) => ({
        description: item.description.trim(),
        cost: toNumber(item.amount),
      })),
      handling: handling ? Number(handling) : undefined,
      freight: freight ? Number(freight) : undefined,
      insurance: insurance ? Number(insurance) : undefined,
      office_id: officeId || undefined,
      mark_as_paid: canRecordPayment && markAsPaid,
      payment_method: canRecordPayment && markAsPaid ? paymentMethod : undefined,
    };

    if (customerMode === "existing") {
      payload.user_id = selectedCustomer!.id;
    } else {
      payload.new_customer = newCustomer;
    }

    return payload;
  }

  // Clicking "Book" opens the review sheet first — nothing is saved yet.
  function handleReview(event: FormEvent) {
    event.preventDefault();
    setError(null);

    const validationError = validate();
    if (validationError) {
      setError(validationError);
      return;
    }

    setShowPreview(true);
  }

  async function confirmBooking() {
    setError(null);
    setIsSubmitting(true);

    try {
      const response = await fetch("/api/admin/shipments", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(buildPayload()),
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

  const serviceLabel = SERVICE_OPTIONS.find((s) => s.value === serviceLevel)?.label ?? serviceLevel;
  const officeName = offices.find((o) => o.id === officeId)?.name ?? "—";
  const estimatedDelivery = formatEstimatedDelivery(estimatedDate, estimatedWindow);
  const customerName = customerMode === "existing" ? selectedCustomer?.name ?? "—" : newCustomer.name || "—";
  const customerEmail = customerMode === "existing" ? selectedCustomer?.email ?? "" : newCustomer.email;
  const placeLabel = (a: AddressForm) =>
    [a.city, a.country].filter((p) => p && p.trim() !== "").join(", ") || "—";
  const addressLines = (a: AddressForm) =>
    [a.line1, a.line2, [a.city, a.state].filter(Boolean).join(", "), a.postal_code, a.country]
      .filter((p) => p && p.trim() !== "")
      .join(", ");

  return (
    <form onSubmit={handleReview} className="space-y-6">
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
              {SERVICE_OPTIONS.map((option) => (
                <option key={option.value} value={option.value}>
                  {option.label}
                </option>
              ))}
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
          <div>
            <label className="block text-sm font-semibold text-navy">Total Weight (kg)</label>
            <input
              type="number"
              min="0.1"
              step="0.01"
              required
              value={totalWeight}
              onChange={(e) => setTotalWeight(e.target.value)}
              placeholder="0"
              className={inputClass}
            />
          </div>
        </div>

        <div className="mt-4">
          <label className="block text-sm font-semibold text-navy">Note (optional)</label>
          <textarea
            value={note}
            onChange={(e) => setNote(e.target.value)}
            rows={3}
            placeholder="Describe the shipment contents…"
            className={`${inputClass} resize-y`}
          />
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

        <div className="mt-4 grid gap-4 sm:grid-cols-2">
          <div>
            <label className="block text-sm font-semibold text-navy">Estimated delivery date (optional)</label>
            <input
              type="date"
              value={estimatedDate}
              onChange={(e) => setEstimatedDate(e.target.value)}
              className={inputClass}
            />
          </div>
          <div>
            <label className="block text-sm font-semibold text-navy">Delivery window</label>
            <select
              value={estimatedWindow}
              onChange={(e) => setEstimatedWindow(e.target.value)}
              disabled={!estimatedDate}
              className={`${inputClass} disabled:opacity-50`}
            >
              {DELIVERY_WINDOWS.map((option) => (
                <option key={option} value={option}>
                  {option}
                </option>
              ))}
            </select>
          </div>
        </div>

        <div className="mt-4">
          <label className="block text-sm font-semibold text-navy">Terminal tracking number (optional)</label>
          <input
            value={terminalShipmentId}
            onChange={(e) => setTerminalShipmentId(e.target.value)}
            placeholder="e.g. SH-16380611554"
            className={inputClass}
          />
          <p className="mt-1 text-xs text-body">
            Terminal Africa shipment ID for DHL/UPS/FedEx. When set, live tracking is pulled from Terminal and
            stays masked behind the SkyFots tracking number.
          </p>
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
                <div className="sm:col-span-8">
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
                <div className="sm:col-span-3">
                  {index === 0 ? (
                    <label className="block text-xs font-semibold text-body">Amount (₦, optional)</label>
                  ) : null}
                  <input
                    type="number"
                    min="0"
                    step="0.01"
                    value={item.amount}
                    onChange={(e) => updateItem(index, { amount: e.target.value })}
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
            <label className="block text-sm font-semibold text-navy">Freight Charge (₦)</label>
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
            <label className="block text-sm font-semibold text-navy">Handling Charge (₦)</label>
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
            <label className="block text-sm font-semibold text-navy">Insurance Charge (₦)</label>
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
          <div className="flex justify-between text-base">
            <span className="font-semibold text-navy">Total amount</span>
            <span className="font-extrabold text-navy">{formatNaira(Math.round(totalAmount * 100))}</span>
          </div>
        </div>

        {canRecordPayment ? (
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
        ) : null}
      </div>

      {error && !showPreview ? <p className="text-sm text-red">{error}</p> : null}

      <Button type="submit" variant="accent" size="lg" disabled={isSubmitting}>
        Review &amp; Book Shipment
      </Button>

      {showPreview ? (
        <div
          className="fixed inset-0 z-50 flex items-end justify-center bg-black/50 p-0 sm:items-center sm:p-4"
          role="dialog"
          aria-modal="true"
          aria-label="Review shipment"
          onClick={() => !isSubmitting && setShowPreview(false)}
        >
          <div
            className="flex max-h-[92vh] w-full max-w-2xl flex-col overflow-hidden rounded-t-2xl bg-white shadow-2xl sm:rounded-2xl"
            onClick={(e) => e.stopPropagation()}
          >
            {/* Header */}
            <div className="flex items-start justify-between gap-4 border-b border-black/5 px-6 py-5">
              <div>
                <h2 className="text-lg font-bold text-navy">Review shipment</h2>
                <p className="mt-0.5 text-sm text-body">Confirm the details below. Nothing is saved yet.</p>
              </div>
              <button
                type="button"
                onClick={() => setShowPreview(false)}
                disabled={isSubmitting}
                className="rounded-lg p-1.5 text-body hover:bg-black/5 disabled:opacity-50"
                aria-label="Close preview"
              >
                <svg viewBox="0 0 24 24" className="h-5 w-5" fill="none" stroke="currentColor" strokeWidth="2">
                  <path d="M6 6l12 12M18 6L6 18" strokeLinecap="round" />
                </svg>
              </button>
            </div>

            {/* Body */}
            <div className="flex-1 space-y-5 overflow-y-auto px-6 py-5">
              {/* Route */}
              <div className="flex items-center gap-3 rounded-xl bg-[#f5f5f7] p-4">
                <div className="min-w-0 flex-1">
                  <p className="text-xs font-semibold uppercase tracking-wide text-body">Origin</p>
                  <p className="mt-0.5 truncate text-sm font-bold text-navy">{placeLabel(sender)}</p>
                </div>
                <div className="flex flex-1 items-center px-1" aria-hidden="true">
                  <span className="h-2 w-2 shrink-0 rounded-full bg-navy" />
                  <span className="h-0.5 flex-1 bg-gradient-to-r from-navy to-red" />
                  <svg viewBox="0 0 24 24" className="h-4 w-4 shrink-0 -scale-x-100 text-red" fill="currentColor">
                    <path d="M2.5 12l17-8-4 8 4 8-17-8z" />
                  </svg>
                  <span className="h-0.5 flex-1 bg-black/10" />
                  <span className="h-2 w-2 shrink-0 rounded-full border-2 border-red bg-white" />
                </div>
                <div className="min-w-0 flex-1 text-right">
                  <p className="text-xs font-semibold uppercase tracking-wide text-body">Destination</p>
                  <p className="mt-0.5 truncate text-sm font-bold text-navy">{placeLabel(receiver)}</p>
                </div>
              </div>

              {/* Customer */}
              <section>
                <p className="text-xs font-semibold uppercase tracking-wide text-body">Customer</p>
                <p className="mt-1 text-sm font-semibold text-navy">{customerName}</p>
                {customerEmail ? <p className="text-sm text-body">{customerEmail}</p> : null}
              </section>

              {/* Sender & receiver */}
              <div className="grid gap-4 sm:grid-cols-2">
                <section className="rounded-xl border border-black/5 p-4">
                  <p className="text-xs font-semibold uppercase tracking-wide text-body">Sender</p>
                  <p className="mt-1 text-sm font-semibold text-navy">{sender.contact_name || "—"}</p>
                  {sender.phone ? <p className="text-sm text-body">{sender.phone}</p> : null}
                  <p className="mt-1 text-sm text-body">{addressLines(sender) || "—"}</p>
                </section>
                <section className="rounded-xl border border-black/5 p-4">
                  <p className="text-xs font-semibold uppercase tracking-wide text-body">Receiver</p>
                  <p className="mt-1 text-sm font-semibold text-navy">{receiver.contact_name || "—"}</p>
                  {receiver.phone ? <p className="text-sm text-body">{receiver.phone}</p> : null}
                  <p className="mt-1 text-sm text-body">{addressLines(receiver) || "—"}</p>
                </section>
              </div>

              {/* Package */}
              <section className="rounded-xl border border-black/5 p-4">
                <p className="text-xs font-semibold uppercase tracking-wide text-body">Package</p>
                <dl className="mt-2 grid grid-cols-2 gap-x-4 gap-y-2 text-sm">
                  <div>
                    <dt className="text-body">Service</dt>
                    <dd className="font-semibold text-navy">{serviceLabel}</dd>
                  </div>
                  <div>
                    <dt className="text-body">Total weight</dt>
                    <dd className="font-semibold text-navy">{totalWeight || "0"} kg</dd>
                  </div>
                  <div>
                    <dt className="text-body">Booking office</dt>
                    <dd className="font-semibold text-navy">{officeName}</dd>
                  </div>
                  {carrier ? (
                    <div>
                      <dt className="text-body">Carrier</dt>
                      <dd className="font-semibold text-navy">{carrier}</dd>
                    </div>
                  ) : null}
                  {terminalShipmentId.trim() ? (
                    <div>
                      <dt className="text-body">Terminal tracking #</dt>
                      <dd className="font-semibold text-navy">{terminalShipmentId.trim()}</dd>
                    </div>
                  ) : null}
                  {estimatedDelivery ? (
                    <div className="col-span-2">
                      <dt className="text-body">Estimated delivery</dt>
                      <dd className="font-semibold text-navy">{estimatedDelivery}</dd>
                    </div>
                  ) : null}
                  {note ? (
                    <div className="col-span-2">
                      <dt className="text-body">Note</dt>
                      <dd className="text-navy">{note}</dd>
                    </div>
                  ) : null}
                </dl>
              </section>

              {/* Items */}
              <section className="rounded-xl border border-black/5 p-4">
                <p className="text-xs font-semibold uppercase tracking-wide text-body">Items</p>
                <ul className="mt-2 divide-y divide-black/5 text-sm">
                  {validItems.map((item, i) => (
                    <li key={i} className="flex justify-between gap-4 py-1.5">
                      <span className="text-navy">{item.description}</span>
                      <span className="shrink-0 text-body">
                        {toNumber(item.amount) > 0 ? formatNaira(Math.round(toNumber(item.amount) * 100)) : "—"}
                      </span>
                    </li>
                  ))}
                </ul>
              </section>

              {/* Charges */}
              <section className="rounded-xl bg-[#f5f5f7] p-4 text-sm">
                <div className="space-y-1.5">
                  <div className="flex justify-between">
                    <span className="text-body">Freight</span>
                    <span className="text-navy">{formatNaira(Math.round(toNumber(freight) * 100))}</span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-body">Handling</span>
                    <span className="text-navy">{formatNaira(Math.round(toNumber(handling) * 100))}</span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-body">Insurance</span>
                    <span className="text-navy">{formatNaira(Math.round(toNumber(insurance) * 100))}</span>
                  </div>
                  {declaredValue ? (
                    <div className="flex justify-between">
                      <span className="text-body">Declared value</span>
                      <span className="text-navy">{formatNaira(Math.round(Number(declaredValue) * 100))}</span>
                    </div>
                  ) : null}
                </div>
                <div className="mt-3 flex justify-between border-t border-black/10 pt-3 text-base">
                  <span className="font-semibold text-navy">Total amount</span>
                  <span className="font-extrabold text-navy">{formatNaira(Math.round(totalAmount * 100))}</span>
                </div>
                <div className="mt-2 flex justify-between">
                  <span className="text-body">Payment</span>
                  <span className="font-semibold text-navy">
                    {canRecordPayment && markAsPaid
                      ? `Paid at counter · ${paymentMethod.charAt(0).toUpperCase() + paymentMethod.slice(1)}`
                      : "Pending"}
                  </span>
                </div>
              </section>

              {error ? <p className="text-sm text-red">{error}</p> : null}
            </div>

            {/* Footer */}
            <div className="flex flex-col-reverse gap-3 border-t border-black/5 px-6 py-4 sm:flex-row sm:justify-end">
              <Button
                type="button"
                variant="ghost"
                onClick={() => setShowPreview(false)}
                disabled={isSubmitting}
              >
                Edit details
              </Button>
              <Button type="button" variant="accent" onClick={confirmBooking} disabled={isSubmitting}>
                {isSubmitting ? "Booking…" : "Confirm & Book"}
              </Button>
            </div>
          </div>
        </div>
      ) : null}
    </form>
  );
}
