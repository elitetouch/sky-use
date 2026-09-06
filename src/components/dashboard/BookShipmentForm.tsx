"use client";

import { useRouter } from "next/navigation";
import { useState } from "react";
import { Button } from "@/components/ui/Button";
import type { Address } from "@/lib/types";
import { formatNaira } from "@/lib/types";
import { SERVICE_OPTIONS, DEFAULT_SERVICE } from "@/lib/services";

type Quote = { price_kobo: number };
type Item = { description: string; quantity: string; value: string };
type AddressForm = {
  label: string;
  contact_name: string;
  phone: string;
  email: string;
  line1: string;
  line2: string;
  city: string;
  state: string;
  postal_code: string;
  country: string;
};
type Mode = "saved" | "new";

const STEPS = ["Route", "Package", "Review"] as const;
const EMPTY_ITEM: Item = { description: "", quantity: "1", value: "" };
const emptyAddress = (country = ""): AddressForm => ({
  label: "",
  contact_name: "",
  phone: "",
  email: "",
  line1: "",
  line2: "",
  city: "",
  state: "",
  postal_code: "",
  country,
});

const inputClass =
  "mt-1.5 w-full rounded-lg border border-black/10 px-4 py-2.5 text-sm text-navy outline-none focus:border-navy";
const smallInput =
  "w-full rounded-lg border border-black/10 px-3 py-2 text-sm text-navy outline-none focus:border-navy";

function fullAddress(a: Address): string {
  return [a.line1, a.line2, [a.city, a.state].filter(Boolean).join(", "), a.country].filter(Boolean).join(", ");
}
function newAddressSummary(a: AddressForm): string {
  return [a.line1, a.line2, [a.city, a.state].filter(Boolean).join(", "), a.country].filter(Boolean).join(", ");
}

export function BookShipmentForm({ addresses }: { addresses: Address[] }) {
  const router = useRouter();
  const hasSaved = addresses.length > 0;

  const [step, setStep] = useState(0);

  const [senderMode, setSenderMode] = useState<Mode>(hasSaved ? "saved" : "new");
  const [senderId, setSenderId] = useState(addresses[0]?.id ?? "");
  const [senderNew, setSenderNew] = useState<AddressForm>(emptyAddress("Nigeria"));

  const [receiverMode, setReceiverMode] = useState<Mode>(hasSaved ? "saved" : "new");
  const [receiverId, setReceiverId] = useState(addresses[1]?.id ?? "");
  const [receiverNew, setReceiverNew] = useState<AddressForm>(emptyAddress(""));

  const [description, setDescription] = useState("");
  const [weightKg, setWeightKg] = useState("1");
  const [serviceLevel, setServiceLevel] = useState<string>(DEFAULT_SERVICE);
  const [mode, setMode] = useState("local");
  const [items, setItems] = useState<Item[]>([{ ...EMPTY_ITEM }]);

  const [quote, setQuote] = useState<Quote | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [isQuoting, setIsQuoting] = useState(false);
  const [isBooking, setIsBooking] = useState(false);

  const filledItems = items.filter((i) => i.description.trim() !== "");
  const serviceLabel = SERVICE_OPTIONS.find((s) => s.value === serviceLevel)?.label ?? serviceLevel;

  function updateItem(index: number, patch: Partial<Item>) {
    setItems((prev) => prev.map((it, i) => (i === index ? { ...it, ...patch } : it)));
  }

  function addressValid(m: Mode, id: string, form: AddressForm): boolean {
    if (m === "saved") return id !== "";
    return (
      form.contact_name.trim() !== "" &&
      form.phone.trim() !== "" &&
      form.line1.trim() !== "" &&
      form.city.trim() !== "" &&
      form.state.trim() !== ""
    );
  }

  function next() {
    setError(null);
    if (step === 0) {
      if (!addressValid(senderMode, senderId, senderNew)) {
        setError("Complete the sender address (name, phone, address, city, state).");
        return;
      }
      if (!addressValid(receiverMode, receiverId, receiverNew)) {
        setError("Complete the receiver address (name, phone, address, city, state).");
        return;
      }
      if (senderMode === "saved" && receiverMode === "saved" && senderId === receiverId) {
        setError("Sender and receiver addresses must be different.");
        return;
      }
    }
    if (step === 1) {
      if (!weightKg || Number(weightKg) <= 0) {
        setError("Enter the package weight.");
        return;
      }
      void fetchQuote();
    }
    setStep((s) => Math.min(s + 1, STEPS.length - 1));
  }

  function back() {
    setError(null);
    setStep((s) => Math.max(s - 1, 0));
  }

  function addressPayload(m: Mode, id: string, form: AddressForm) {
    if (m === "saved") return { address_id: id, address: undefined };
    return {
      address_id: undefined,
      address: {
        label: form.label || undefined,
        contact_name: form.contact_name,
        phone: form.phone,
        email: form.email || undefined,
        line1: form.line1,
        line2: form.line2 || undefined,
        city: form.city,
        state: form.state,
        postal_code: form.postal_code || undefined,
        country: form.country || undefined,
      },
    };
  }

  async function fetchQuote() {
    setIsQuoting(true);
    setQuote(null);
    try {
      const response = await fetch("/api/quotes", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ weight_kg: Number(weightKg), service_level: serviceLevel, mode }),
      });
      const json = await response.json();
      if (!response.ok) {
        setError("Pricing isn't available for this service and route yet. Please choose another service.");
        return;
      }
      setQuote(json.data);
    } finally {
      setIsQuoting(false);
    }
  }

  async function confirmBooking() {
    setError(null);
    setIsBooking(true);
    try {
      const sender = addressPayload(senderMode, senderId, senderNew);
      const receiver = addressPayload(receiverMode, receiverId, receiverNew);
      const response = await fetch("/api/shipments", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          sender_address_id: sender.address_id,
          sender_address: sender.address,
          receiver_address_id: receiver.address_id,
          receiver_address: receiver.address,
          weight_kg: Number(weightKg),
          service_level: serviceLevel,
          mode,
          description: description || undefined,
          items: filledItems.map((it) => {
            const qty = Number(it.quantity);
            const label = qty > 1 ? `${it.description.trim()} ×${qty}` : it.description.trim();
            const value = Number(it.value);
            return { description: label, cost: Number.isFinite(value) && value > 0 ? value : undefined };
          }),
        }),
      });
      const json = await response.json();
      if (!response.ok) {
        setError(json.message ?? "Unable to book this shipment.");
        return;
      }
      router.push(`/dashboard/shipments/${json.data.id}`);
      router.refresh();
    } finally {
      setIsBooking(false);
    }
  }

  const routeSummary = (m: Mode, id: string, form: AddressForm) => {
    if (m === "saved") {
      const a = addresses.find((x) => x.id === id);
      return a ? { name: a.contact_name, addr: fullAddress(a) } : { name: "—", addr: "" };
    }
    return { name: form.contact_name, addr: newAddressSummary(form) };
  };
  const senderSummary = routeSummary(senderMode, senderId, senderNew);
  const receiverSummary = routeSummary(receiverMode, receiverId, receiverNew);

  return (
    <div className="space-y-6">
      {/* Stepper */}
      <ol className="flex items-center gap-2">
        {STEPS.map((label, i) => (
          <li key={label} className="flex flex-1 items-center gap-2">
            <span
              className={`flex h-7 w-7 shrink-0 items-center justify-center rounded-full text-xs font-bold ${
                i <= step ? "bg-navy text-white" : "bg-black/10 text-body"
              }`}
            >
              {i + 1}
            </span>
            <span className={`text-sm font-semibold ${i <= step ? "text-navy" : "text-body"}`}>{label}</span>
            {i < STEPS.length - 1 ? (
              <span className={`h-0.5 flex-1 ${i < step ? "bg-navy" : "bg-black/10"}`} />
            ) : null}
          </li>
        ))}
      </ol>

      <div className="rounded-2xl border border-black/5 p-6">
        {step === 0 ? (
          <div className="space-y-6">
            <AddressSection
              title="Ship from"
              addresses={addresses}
              mode={senderMode}
              setMode={setSenderMode}
              selectedId={senderId}
              setSelectedId={setSenderId}
              form={senderNew}
              setForm={setSenderNew}
            />
            <AddressSection
              title="Ship to"
              addresses={addresses}
              mode={receiverMode}
              setMode={setReceiverMode}
              selectedId={receiverId}
              setSelectedId={setReceiverId}
              form={receiverNew}
              setForm={setReceiverNew}
            />
          </div>
        ) : null}

        {step === 1 ? (
          <div className="space-y-5">
            <div>
              <label className="block text-sm font-semibold text-navy">Package description (optional)</label>
              <input
                value={description}
                onChange={(e) => setDescription(e.target.value)}
                placeholder="e.g. Documents, electronics…"
                className={inputClass}
              />
            </div>

            <div className="grid grid-cols-3 gap-4">
              <div>
                <label className="block text-sm font-semibold text-navy">Weight (kg)</label>
                <input
                  type="number"
                  min="0.1"
                  step="0.1"
                  value={weightKg}
                  onChange={(e) => setWeightKg(e.target.value)}
                  className={inputClass}
                />
              </div>
              <div>
                <label className="block text-sm font-semibold text-navy">Service</label>
                <select value={serviceLevel} onChange={(e) => setServiceLevel(e.target.value)} className={inputClass}>
                  {SERVICE_OPTIONS.map((s) => (
                    <option key={s.value} value={s.value}>
                      {s.label}
                    </option>
                  ))}
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

            <div>
              <div className="flex items-center justify-between">
                <label className="block text-sm font-semibold text-navy">What&apos;s inside? (optional)</label>
                <button
                  type="button"
                  onClick={() => setItems((p) => [...p, { ...EMPTY_ITEM }])}
                  className="text-xs font-semibold text-navy hover:text-red"
                >
                  + Add item
                </button>
              </div>
              <div className="mt-2 space-y-2">
                {items.map((item, i) => (
                  <div key={i} className="grid grid-cols-12 gap-2">
                    <input
                      value={item.description}
                      onChange={(e) => updateItem(i, { description: e.target.value })}
                      placeholder="Item (e.g. Shoes)"
                      className={`col-span-6 ${smallInput}`}
                    />
                    <input
                      type="number"
                      min="1"
                      value={item.quantity}
                      onChange={(e) => updateItem(i, { quantity: e.target.value })}
                      placeholder="Qty"
                      className={`col-span-2 ${smallInput}`}
                    />
                    <input
                      type="number"
                      min="0"
                      value={item.value}
                      onChange={(e) => updateItem(i, { value: e.target.value })}
                      placeholder="Value ₦"
                      className={`col-span-3 ${smallInput}`}
                    />
                    <button
                      type="button"
                      onClick={() => setItems((p) => (p.length === 1 ? p : p.filter((_, idx) => idx !== i)))}
                      className="col-span-1 text-red hover:text-red/70"
                      aria-label="Remove item"
                    >
                      ✕
                    </button>
                  </div>
                ))}
              </div>
            </div>
          </div>
        ) : null}

        {step === 2 ? (
          <div className="space-y-5">
            <div className="grid gap-4 sm:grid-cols-2">
              <div className="rounded-xl border border-black/5 p-4">
                <p className="text-xs font-semibold uppercase tracking-wide text-body">Ship from</p>
                <p className="mt-1 text-sm font-semibold text-navy">{senderSummary.name}</p>
                <p className="text-xs text-body">{senderSummary.addr}</p>
              </div>
              <div className="rounded-xl border border-black/5 p-4">
                <p className="text-xs font-semibold uppercase tracking-wide text-body">Ship to</p>
                <p className="mt-1 text-sm font-semibold text-navy">{receiverSummary.name}</p>
                <p className="text-xs text-body">{receiverSummary.addr}</p>
              </div>
            </div>

            <div className="rounded-xl border border-black/5 p-4 text-sm">
              <div className="grid grid-cols-3 gap-3">
                <div>
                  <p className="text-body">Weight</p>
                  <p className="font-semibold text-navy">{weightKg} kg</p>
                </div>
                <div>
                  <p className="text-body">Service</p>
                  <p className="font-semibold text-navy">{serviceLabel}</p>
                </div>
                <div>
                  <p className="text-body">Mode</p>
                  <p className="font-semibold capitalize text-navy">{mode}</p>
                </div>
              </div>
              {filledItems.length > 0 ? (
                <ul className="mt-3 divide-y divide-black/5">
                  {filledItems.map((it, i) => (
                    <li key={i} className="flex justify-between py-1.5">
                      <span className="text-navy">
                        {it.description}
                        {Number(it.quantity) > 1 ? ` ×${Number(it.quantity)}` : ""}
                      </span>
                      <span className="text-body">
                        {Number(it.value) > 0 ? formatNaira(Math.round(Number(it.value) * 100)) : "—"}
                      </span>
                    </li>
                  ))}
                </ul>
              ) : null}
            </div>

            <div className="rounded-2xl bg-navy p-6 text-white">
              <p className="text-sm text-white/70">Total price</p>
              <p className="mt-1 text-4xl font-extrabold">
                {isQuoting ? "…" : quote ? formatNaira(quote.price_kobo) : "—"}
              </p>
            </div>
          </div>
        ) : null}

        {error ? <p className="mt-4 text-sm text-red">{error}</p> : null}

        <div className="mt-6 flex items-center justify-between gap-3">
          {step > 0 ? (
            <Button type="button" variant="ghost" onClick={back} disabled={isBooking}>
              Back
            </Button>
          ) : (
            <span />
          )}
          {step < STEPS.length - 1 ? (
            <Button type="button" variant="primary" onClick={next}>
              Continue
            </Button>
          ) : (
            <Button type="button" variant="accent" onClick={confirmBooking} disabled={isBooking || isQuoting || !quote}>
              {isBooking ? "Booking…" : "Confirm & Book"}
            </Button>
          )}
        </div>
      </div>
    </div>
  );
}

function AddressSection({
  title,
  addresses,
  mode,
  setMode,
  selectedId,
  setSelectedId,
  form,
  setForm,
}: {
  title: string;
  addresses: Address[];
  mode: Mode;
  setMode: (m: Mode) => void;
  selectedId: string;
  setSelectedId: (id: string) => void;
  form: AddressForm;
  setForm: (updater: (prev: AddressForm) => AddressForm) => void;
}) {
  const hasSaved = addresses.length > 0;
  const set = (field: keyof AddressForm) => (e: React.ChangeEvent<HTMLInputElement>) =>
    setForm((prev) => ({ ...prev, [field]: e.target.value }));

  return (
    <div>
      <div className="flex items-center justify-between">
        <p className="text-sm font-semibold text-navy">{title}</p>
        {hasSaved ? (
          <div className="flex gap-1 rounded-lg bg-black/5 p-0.5 text-xs font-semibold">
            <button
              type="button"
              onClick={() => setMode("saved")}
              className={`rounded-md px-3 py-1 ${mode === "saved" ? "bg-white text-navy shadow-sm" : "text-body"}`}
            >
              Saved
            </button>
            <button
              type="button"
              onClick={() => setMode("new")}
              className={`rounded-md px-3 py-1 ${mode === "new" ? "bg-white text-navy shadow-sm" : "text-body"}`}
            >
              New address
            </button>
          </div>
        ) : null}
      </div>

      {mode === "saved" && hasSaved ? (
        <div className="mt-2 grid gap-2 sm:grid-cols-2">
          {addresses.map((a) => {
            const selected = a.id === selectedId;
            return (
              <button
                key={a.id}
                type="button"
                onClick={() => setSelectedId(a.id)}
                className={`rounded-xl border p-3 text-left transition-colors ${
                  selected ? "border-navy bg-navy/[0.04]" : "border-black/10 hover:border-navy/40"
                }`}
              >
                <p className="text-sm font-semibold text-navy">
                  {a.label ? `${a.label} — ` : ""}
                  {a.contact_name}
                </p>
                <p className="text-xs text-body">{[a.city, a.state, a.country].filter(Boolean).join(", ")}</p>
              </button>
            );
          })}
        </div>
      ) : (
        <div className="mt-2 grid grid-cols-2 gap-2">
          <input value={form.contact_name} onChange={set("contact_name")} placeholder="Full name" className={smallInput} />
          <input value={form.phone} onChange={set("phone")} placeholder="Phone" className={smallInput} />
          <input value={form.email} onChange={set("email")} placeholder="Email (optional)" className={`col-span-2 ${smallInput}`} />
          <input value={form.line1} onChange={set("line1")} placeholder="Address line 1" className={`col-span-2 ${smallInput}`} />
          <input value={form.line2} onChange={set("line2")} placeholder="Address line 2 (optional)" className={`col-span-2 ${smallInput}`} />
          <input value={form.city} onChange={set("city")} placeholder="City" className={smallInput} />
          <input value={form.state} onChange={set("state")} placeholder="State" className={smallInput} />
          <input value={form.postal_code} onChange={set("postal_code")} placeholder="Postal code (optional)" className={smallInput} />
          <input value={form.country} onChange={set("country")} placeholder="Country" className={smallInput} />
        </div>
      )}
    </div>
  );
}
