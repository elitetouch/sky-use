"use client";

import { useRouter } from "next/navigation";
import { useState } from "react";
import { Button } from "@/components/ui/Button";
import type { Address } from "@/lib/types";
import { formatNaira } from "@/lib/types";

type Item = { description: string; quantity: string; value: string };
type Parcel = { type: string; length: string; width: string; height: string };
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
type ServiceRate = {
  service_level: string;
  label: string;
  carrier: string | null;
  delivery: string;
  price_kobo: number | null;
  available: boolean;
  unavailable_reason: string | null;
};

const STEPS = ["Sender", "Receiver", "Items", "Service", "Review"] as const;
const PURPOSES = ["Personal", "Commercial", "Gift", "Sample", "Return"] as const;
const CURRENCIES = ["NGN", "USD", "GBP", "EUR"] as const;
const PARCEL_TYPES = ["Box", "Envelope", "Soft Packaging"] as const;
const VOLUMETRIC_DIVISOR = 5000;

const EMPTY_ITEM: Item = { description: "", quantity: "1", value: "" };
const emptyParcel = (): Parcel => ({ type: "Box", length: "", width: "", height: "" });
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

// --- Draft hydration guards ---------------------------------------------
// Draft `data` is arbitrary JSON persisted from an earlier session. Never
// trust its shape: a non-string where a string is expected (e.g. an item
// with no `description`) or a non-array `parcels`/`items` would crash the
// form during render. These coercers guarantee well-typed state so a
// malformed or older-schema draft resumes cleanly instead of erroring.
function asRecord(v: unknown): Record<string, unknown> {
  return v && typeof v === "object" && !Array.isArray(v) ? (v as Record<string, unknown>) : {};
}
function asStr(v: unknown, fallback = ""): string {
  if (typeof v === "string") return v;
  if (typeof v === "number" && Number.isFinite(v)) return String(v);
  return fallback;
}
function asMode(v: unknown, fallback: Mode): Mode {
  return v === "saved" || v === "new" ? v : fallback;
}
function asItems(v: unknown): Item[] {
  if (!Array.isArray(v)) return [{ ...EMPTY_ITEM }];
  const items = v.map((x) => {
    const r = asRecord(x);
    return { description: asStr(r.description), quantity: asStr(r.quantity, "1"), value: asStr(r.value) };
  });
  return items.length > 0 ? items : [{ ...EMPTY_ITEM }];
}
function asParcels(v: unknown): Parcel[] {
  if (!Array.isArray(v)) return [emptyParcel()];
  const parcels = v.map((x) => {
    const r = asRecord(x);
    return { type: asStr(r.type, "Box") || "Box", length: asStr(r.length), width: asStr(r.width), height: asStr(r.height) };
  });
  return parcels.length > 0 ? parcels : [emptyParcel()];
}
function asAddress(v: unknown, country: string): AddressForm {
  const r = asRecord(v);
  if (Object.keys(r).length === 0) return emptyAddress(country);
  return {
    label: asStr(r.label),
    contact_name: asStr(r.contact_name),
    phone: asStr(r.phone),
    email: asStr(r.email),
    line1: asStr(r.line1),
    line2: asStr(r.line2),
    city: asStr(r.city),
    state: asStr(r.state),
    postal_code: asStr(r.postal_code),
    country: asStr(r.country, country),
  };
}

const inputClass =
  "mt-1.5 w-full rounded-lg border border-black/10 px-4 py-2.5 text-sm text-navy outline-none focus:border-navy";
const smallInput =
  "w-full rounded-lg border border-black/10 px-3 py-2 text-sm text-navy outline-none focus:border-navy";

function num(v: string): number {
  const n = Number(v);
  return Number.isFinite(n) && n > 0 ? n : 0;
}
function parcelVolumetric(p: Parcel): number {
  const v = (num(p.length) * num(p.width) * num(p.height)) / VOLUMETRIC_DIVISOR;
  return Math.round(v * 100) / 100;
}
function fullAddress(a: Address): string {
  return [a.line1, a.line2, [a.city, a.state].filter(Boolean).join(", "), a.country].filter(Boolean).join(", ");
}
function newAddressSummary(a: AddressForm): string {
  return [a.line1, a.line2, [a.city, a.state].filter(Boolean).join(", "), a.country].filter(Boolean).join(", ");
}

export function BookShipmentForm({
  addresses,
  initialDraft,
}: {
  addresses: Address[];
  initialDraft?: { id: string; data: Record<string, unknown> } | null;
}) {
  const router = useRouter();
  const hasSaved = addresses.length > 0;
  const d = asRecord(initialDraft?.data);

  const [draftId, setDraftId] = useState<string | null>(initialDraft?.id ?? null);
  const [step, setStep] = useState(0);

  const [senderMode, setSenderMode] = useState<Mode>(asMode(d.senderMode, hasSaved ? "saved" : "new"));
  const [senderId, setSenderId] = useState(asStr(d.senderId) || addresses[0]?.id || "");
  const [senderNew, setSenderNew] = useState<AddressForm>(asAddress(d.senderNew, "Nigeria"));

  const [receiverMode, setReceiverMode] = useState<Mode>(asMode(d.receiverMode, hasSaved ? "saved" : "new"));
  const [receiverId, setReceiverId] = useState(asStr(d.receiverId) || addresses[1]?.id || "");
  const [receiverNew, setReceiverNew] = useState<AddressForm>(asAddress(d.receiverNew, ""));

  const [purpose, setPurpose] = useState<string>(asStr(d.purpose, "Personal"));
  const [currency, setCurrency] = useState<string>(asStr(d.currency, "NGN"));
  const [parcels, setParcels] = useState<Parcel[]>(asParcels(d.parcels));
  const [declaredWeight, setDeclaredWeight] = useState(asStr(d.declaredWeight, "1"));
  const [items, setItems] = useState<Item[]>(asItems(d.items));

  const [rates, setRates] = useState<ServiceRate[]>([]);
  const [selected, setSelected] = useState<ServiceRate | null>(null);
  const [ratesLoading, setRatesLoading] = useState(false);

  const [error, setError] = useState<string | null>(null);
  const [isBooking, setIsBooking] = useState(false);
  const [savingDraft, setSavingDraft] = useState(false);
  const [draftMsg, setDraftMsg] = useState<string | null>(null);

  const filledItems = items.filter((i) => i.description.trim() !== "");
  const totalVolumetric = Math.round(parcels.reduce((s, p) => s + parcelVolumetric(p), 0) * 100) / 100;
  const declared = num(declaredWeight);
  const billable = Math.max(declared, totalVolumetric);
  const volumetricDrives = totalVolumetric > declared && totalVolumetric > 0;

  function receiverCountry(): string {
    return receiverMode === "saved" ? addresses.find((a) => a.id === receiverId)?.country ?? "" : receiverNew.country;
  }
  function receiverMode2(): string {
    return receiverCountry().trim().toLowerCase() === "nigeria" ? "local" : "international";
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

  async function next() {
    setError(null);
    if (step === 0 && !addressValid(senderMode, senderId, senderNew)) {
      setError("Complete the sender address (name, phone, address, city, state).");
      return;
    }
    if (step === 1) {
      if (!addressValid(receiverMode, receiverId, receiverNew)) {
        setError("Complete the receiver address (name, phone, address, city, state).");
        return;
      }
      if (senderMode === "saved" && receiverMode === "saved" && senderId === receiverId) {
        setError("Sender and receiver addresses must be different.");
        return;
      }
    }
    if (step === 2) {
      if (billable <= 0) {
        setError("Enter a declared weight, or parcel dimensions for volumetric weight.");
        return;
      }
      await loadRates();
    }
    if (step === 3 && !selected) {
      setError("Choose a service to continue.");
      return;
    }
    setStep((s) => Math.min(s + 1, STEPS.length - 1));
  }

  function back() {
    setError(null);
    setStep((s) => Math.max(s - 1, 0));
  }

  async function loadRates() {
    setRatesLoading(true);
    setRates([]);
    setSelected(null);
    try {
      const response = await fetch("/api/quotes/compare", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          weight_kg: billable,
          destination_country: receiverCountry(),
          mode: receiverMode2(),
        }),
      });
      const json = await response.json();
      if (!response.ok) {
        setError(json.message ?? "Couldn't load service prices.");
        return;
      }
      setRates(json.data ?? []);
    } finally {
      setRatesLoading(false);
    }
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

  function draftData() {
    return {
      senderMode,
      senderId,
      senderNew,
      receiverMode,
      receiverId,
      receiverNew,
      purpose,
      currency,
      parcels,
      declaredWeight,
      items,
    };
  }

  async function saveDraft() {
    setDraftMsg(null);
    setError(null);
    setSavingDraft(true);
    try {
      const summary = `To ${receiverSummary.name || "recipient"}${receiverCountry() ? ` — ${receiverCountry()}` : ""}`;
      const response = await fetch("/api/shipment-drafts", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ id: draftId ?? undefined, summary, data: draftData() }),
      });
      const json = await response.json();
      if (!response.ok) {
        setError(json.message ?? "Couldn't save draft.");
        return;
      }
      if (json.data?.id) setDraftId(json.data.id);
      setDraftMsg("Draft saved. You can resume it from My Shipments.");
    } finally {
      setSavingDraft(false);
    }
  }

  async function confirmBooking() {
    if (!selected) return;
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
          weight_kg: billable,
          service_level: selected.service_level,
          mode: receiverMode2(),
          purpose,
          currency,
          parcels: parcels.map((p) => ({
            type: p.type,
            length_cm: num(p.length) || undefined,
            width_cm: num(p.width) || undefined,
            height_cm: num(p.height) || undefined,
            volumetric_kg: parcelVolumetric(p),
          })),
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
      // The draft has become a real shipment — discard it.
      if (draftId) {
        await fetch(`/api/shipment-drafts/${draftId}`, { method: "DELETE" }).catch(() => {});
      }
      router.push(`/dashboard/shipments/${json.data.id}`);
      router.refresh();
    } finally {
      setIsBooking(false);
    }
  }

  const senderSummary =
    senderMode === "saved"
      ? { name: addresses.find((a) => a.id === senderId)?.contact_name ?? "—", addr: fullAddress(addresses.find((a) => a.id === senderId) ?? ({} as Address)) }
      : { name: senderNew.contact_name, addr: newAddressSummary(senderNew) };
  const receiverSummary =
    receiverMode === "saved"
      ? { name: addresses.find((a) => a.id === receiverId)?.contact_name ?? "—", addr: fullAddress(addresses.find((a) => a.id === receiverId) ?? ({} as Address)) }
      : { name: receiverNew.contact_name, addr: newAddressSummary(receiverNew) };

  return (
    <div className="space-y-6">
      {/* Stepper */}
      <ol className="flex items-center gap-1 overflow-x-auto">
        {STEPS.map((label, i) => (
          <li key={label} className="flex flex-1 items-center gap-2">
            <span
              className={`flex h-7 w-7 shrink-0 items-center justify-center rounded-full text-xs font-bold ${
                i <= step ? "bg-navy text-white" : "bg-black/10 text-body"
              }`}
            >
              {i + 1}
            </span>
            <span className={`whitespace-nowrap text-sm font-semibold ${i <= step ? "text-navy" : "text-body"}`}>{label}</span>
            {i < STEPS.length - 1 ? <span className={`h-0.5 flex-1 ${i < step ? "bg-navy" : "bg-black/10"}`} /> : null}
          </li>
        ))}
      </ol>

      <div className="rounded-2xl border border-black/5 p-6">
        {step === 0 ? (
          <AddressSection title="Ship from" addresses={addresses} mode={senderMode} setMode={setSenderMode} selectedId={senderId} setSelectedId={setSenderId} form={senderNew} setForm={setSenderNew} />
        ) : null}

        {step === 1 ? (
          <AddressSection title="Ship to" addresses={addresses} mode={receiverMode} setMode={setReceiverMode} selectedId={receiverId} setSelectedId={setReceiverId} form={receiverNew} setForm={setReceiverNew} />
        ) : null}

        {step === 2 ? (
          <div className="space-y-5">
            <div className="grid gap-4 sm:grid-cols-2">
              <div>
                <label className="block text-sm font-semibold text-navy">Purpose of shipping</label>
                <select value={purpose} onChange={(e) => setPurpose(e.target.value)} className={inputClass}>
                  {PURPOSES.map((p) => (
                    <option key={p} value={p}>
                      {p}
                    </option>
                  ))}
                </select>
              </div>
              <div>
                <label className="block text-sm font-semibold text-navy">Currency</label>
                <select value={currency} onChange={(e) => setCurrency(e.target.value)} className={inputClass}>
                  {CURRENCIES.map((c) => (
                    <option key={c} value={c}>
                      {c}
                    </option>
                  ))}
                </select>
              </div>
            </div>

            {/* Parcels */}
            <div className="space-y-3">
              {parcels.map((p, i) => (
                <div key={i} className="rounded-xl border border-black/10 p-4">
                  <div className="flex items-center justify-between">
                    <p className="text-sm font-semibold text-navy">Parcel {i + 1}</p>
                    <div className="flex items-center gap-3">
                      <span className="rounded-md bg-green-100 px-2 py-1 text-xs font-semibold text-green-700">
                        Volumetric = {parcelVolumetric(p)}kg
                      </span>
                      {parcels.length > 1 ? (
                        <button type="button" onClick={() => setParcels((prev) => prev.filter((_, idx) => idx !== i))} className="text-red hover:text-red/70" aria-label="Remove parcel">
                          ✕
                        </button>
                      ) : null}
                    </div>
                  </div>
                  <div className="mt-3 grid grid-cols-2 gap-2 sm:grid-cols-4">
                    <select value={p.type} onChange={(e) => setParcels((prev) => prev.map((x, idx) => (idx === i ? { ...x, type: e.target.value } : x)))} className={smallInput}>
                      {PARCEL_TYPES.map((t) => (
                        <option key={t} value={t}>
                          {t}
                        </option>
                      ))}
                    </select>
                    <input type="number" min="0" value={p.length} onChange={(e) => setParcels((prev) => prev.map((x, idx) => (idx === i ? { ...x, length: e.target.value } : x)))} placeholder="Length (cm)" className={smallInput} />
                    <input type="number" min="0" value={p.width} onChange={(e) => setParcels((prev) => prev.map((x, idx) => (idx === i ? { ...x, width: e.target.value } : x)))} placeholder="Width (cm)" className={smallInput} />
                    <input type="number" min="0" value={p.height} onChange={(e) => setParcels((prev) => prev.map((x, idx) => (idx === i ? { ...x, height: e.target.value } : x)))} placeholder="Height (cm)" className={smallInput} />
                  </div>
                </div>
              ))}
              <button type="button" onClick={() => setParcels((prev) => [...prev, emptyParcel()])} className="text-sm font-semibold text-navy hover:text-red">
                + Add parcel
              </button>
            </div>

            <div className="grid gap-4 sm:grid-cols-2">
              <div>
                <label className="block text-sm font-semibold text-navy">Declared weight (kg)</label>
                <input type="number" min="0.1" step="0.1" value={declaredWeight} onChange={(e) => setDeclaredWeight(e.target.value)} className={inputClass} />
                <p className="mt-1 text-xs text-body">
                  Billable weight: <strong>{billable}kg</strong>
                  {volumetricDrives ? " (volumetric applies)" : ""}
                </p>
              </div>
            </div>

            {/* Items */}
            <div>
              <div className="flex items-center justify-between">
                <label className="block text-sm font-semibold text-navy">What&apos;s inside? (optional)</label>
                <button type="button" onClick={() => setItems((p) => [...p, { ...EMPTY_ITEM }])} className="text-xs font-semibold text-navy hover:text-red">
                  + Add item
                </button>
              </div>
              <div className="mt-2 space-y-2">
                {items.map((item, i) => (
                  <div key={i} className="grid grid-cols-12 gap-2">
                    <input value={item.description} onChange={(e) => setItems((p) => p.map((x, idx) => (idx === i ? { ...x, description: e.target.value } : x)))} placeholder="Item (e.g. Shoes)" className={`col-span-6 ${smallInput}`} />
                    <input type="number" min="1" value={item.quantity} onChange={(e) => setItems((p) => p.map((x, idx) => (idx === i ? { ...x, quantity: e.target.value } : x)))} placeholder="Qty" className={`col-span-2 ${smallInput}`} />
                    <input type="number" min="0" value={item.value} onChange={(e) => setItems((p) => p.map((x, idx) => (idx === i ? { ...x, value: e.target.value } : x)))} placeholder={`Value ${currency}`} className={`col-span-3 ${smallInput}`} />
                    <button type="button" onClick={() => setItems((p) => (p.length === 1 ? p : p.filter((_, idx) => idx !== i)))} className="col-span-1 text-red hover:text-red/70" aria-label="Remove item">
                      ✕
                    </button>
                  </div>
                ))}
              </div>
            </div>
          </div>
        ) : null}

        {step === 3 ? (
          <div className="space-y-3">
            {volumetricDrives ? (
              <div className="rounded-xl bg-green-50 p-3 text-sm text-green-800">
                Rates are based on your volumetric weight ({totalVolumetric}kg), as it exceeds your declared weight ({declared}kg).
              </div>
            ) : null}
            {ratesLoading ? (
              <p className="text-sm text-body">Fetching prices…</p>
            ) : (
              rates.map((r) => (
                <button
                  key={r.service_level}
                  type="button"
                  disabled={!r.available}
                  onClick={() => setSelected(r)}
                  className={`flex w-full items-center justify-between rounded-xl border p-4 text-left transition-colors ${
                    !r.available
                      ? "cursor-not-allowed border-black/5 bg-black/[0.02] opacity-70"
                      : selected?.service_level === r.service_level
                        ? "border-navy bg-navy/[0.04]"
                        : "border-black/10 hover:border-navy/40"
                  }`}
                >
                  <div>
                    <p className="text-sm font-semibold text-navy">{r.label}</p>
                    <p className="text-xs text-body">Delivery: {r.delivery}</p>
                  </div>
                  <div className="text-right">
                    {r.available && r.price_kobo !== null ? (
                      <span className="text-base font-extrabold text-navy">{formatNaira(r.price_kobo)}</span>
                    ) : (
                      <span className="text-xs font-semibold text-body">Price not available</span>
                    )}
                  </div>
                </button>
              ))
            )}
            {!ratesLoading && rates.length > 0 && rates.every((r) => !r.available) ? (
              <p className="text-sm text-body">Prices aren&apos;t available for this route yet — please contact us for a quote.</p>
            ) : null}
          </div>
        ) : null}

        {step === 4 ? (
          <div className="space-y-4">
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
              <p className="text-body">
                Purpose: <span className="text-navy">{purpose}</span> · Billable weight:{" "}
                <span className="text-navy">{billable}kg</span> · Currency: <span className="text-navy">{currency}</span>
              </p>
              <p className="mt-1 text-body">
                {parcels.length} parcel{parcels.length > 1 ? "s" : ""}
                {filledItems.length > 0 ? ` · ${filledItems.length} item${filledItems.length > 1 ? "s" : ""}` : ""}
              </p>
            </div>

            {selected ? (
              <div className="rounded-2xl bg-navy p-6 text-white">
                <div className="flex items-center justify-between">
                  <div>
                    <p className="text-sm text-white/70">Service</p>
                    <p className="text-lg font-bold">{selected.label}</p>
                    <p className="text-xs text-white/70">Delivery: {selected.delivery}</p>
                  </div>
                  <div className="text-right">
                    <p className="text-sm text-white/70">Total price</p>
                    <p className="text-3xl font-extrabold">{selected.price_kobo !== null ? formatNaira(selected.price_kobo) : "—"}</p>
                  </div>
                </div>
              </div>
            ) : null}
          </div>
        ) : null}

        {error ? <p className="mt-4 text-sm text-red">{error}</p> : null}
        {draftMsg ? <p className="mt-4 text-sm text-green-700">{draftMsg}</p> : null}

        <div className="mt-6 flex items-center justify-between gap-3">
          {step > 0 ? (
            <Button type="button" variant="ghost" onClick={back} disabled={isBooking}>
              Back
            </Button>
          ) : (
            <span />
          )}
          <div className="flex items-center gap-3">
            <button
              type="button"
              onClick={saveDraft}
              disabled={savingDraft || isBooking}
              className="text-sm font-semibold text-navy hover:text-red disabled:opacity-50"
            >
              {savingDraft ? "Saving…" : "Save as draft"}
            </button>
            {step < STEPS.length - 1 ? (
              <Button type="button" variant="primary" onClick={next} disabled={ratesLoading}>
                Continue
              </Button>
            ) : (
              <Button type="button" variant="accent" onClick={confirmBooking} disabled={isBooking || !selected}>
                {isBooking ? "Booking…" : "Confirm & Book"}
              </Button>
            )}
          </div>
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
            <button type="button" onClick={() => setMode("saved")} className={`rounded-md px-3 py-1 ${mode === "saved" ? "bg-white text-navy shadow-sm" : "text-body"}`}>
              Saved
            </button>
            <button type="button" onClick={() => setMode("new")} className={`rounded-md px-3 py-1 ${mode === "new" ? "bg-white text-navy shadow-sm" : "text-body"}`}>
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
              <button key={a.id} type="button" onClick={() => setSelectedId(a.id)} className={`rounded-xl border p-3 text-left transition-colors ${selected ? "border-navy bg-navy/[0.04]" : "border-black/10 hover:border-navy/40"}`}>
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
