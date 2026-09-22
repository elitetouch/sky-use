"use client";

import { useRouter } from "next/navigation";
import { useState } from "react";
import { Button } from "@/components/ui/Button";
import type { Address } from "@/lib/types";
import { formatNaira } from "@/lib/types";

type Item = { description: string; quantity: string; value: string };
type UploadedFile = { path: string; url: string; name: string };
type ProofSlot = "parcelItems" | "proofOfPurchase" | "proofOfWeight";
type Parcel = {
  type: string;
  length: string;
  width: string;
  height: string;
  parcelItems?: UploadedFile;
  proofOfPurchase?: UploadedFile;
  proofOfWeight?: UploadedFile;
};
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

const PROOF_SLOTS: { key: ProofSlot; label: string }[] = [
  { key: "parcelItems", label: "Parcel Items" },
  { key: "proofOfPurchase", label: "Proof of Purchase" },
  { key: "proofOfWeight", label: "Proof of Weight" },
];

// How-to content shown in the "View Sample" popup for each upload slot.
const PROOF_SAMPLES: Record<ProofSlot, { title: string; steps: string[] }> = {
  parcelItems: {
    title: "Parcel Items: How to upload",
    steps: [
      "Arrange all the contents of this parcel and take a picture.",
      "Ensure you capture every single item.",
      "Upload an image (JPG or PNG) under 1MB.",
    ],
  },
  proofOfPurchase: {
    title: "Proof of Purchase: How to upload",
    steps: [
      "Take a picture of the receipts associated with these items.",
      "Upload an image (JPG or PNG) under 1MB.",
    ],
  },
  proofOfWeight: {
    title: "Proof of Weight: How to upload",
    steps: [
      "Pack all items into a single carton or flyer, then seal it.",
      "Weigh the sealed parcel on a scale or measure it with a tape.",
      "Take a picture showing the weight or dimensions.",
      "Upload an image (JPG or PNG) under 1MB.",
    ],
  },
};

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
function asUpload(v: unknown): UploadedFile | undefined {
  const r = asRecord(v);
  const path = asStr(r.path);
  const url = asStr(r.url);
  if (path === "" && url === "") return undefined;
  return { path, url, name: asStr(r.name) || "Uploaded file" };
}
function asParcels(v: unknown): Parcel[] {
  if (!Array.isArray(v)) return [emptyParcel()];
  const parcels = v.map((x) => {
    const r = asRecord(x);
    return {
      type: asStr(r.type, "Box") || "Box",
      length: asStr(r.length),
      width: asStr(r.width),
      height: asStr(r.height),
      parcelItems: asUpload(r.parcelItems),
      proofOfPurchase: asUpload(r.proofOfPurchase),
      proofOfWeight: asUpload(r.proofOfWeight),
    };
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
const fieldLabel = "mb-1 block text-sm font-medium text-navy";
const optionalHint = <span className="font-normal text-body"> (optional)</span>;
const requiredMark = <span className="text-red"> *</span>;
// `!` (important) is needed so it wins over the base `border-black/10`.
const errorBorder = "!border-red";
const EMAIL_RE = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;

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
  const [invalid, setInvalid] = useState<Set<string>>(new Set());
  const [isBooking, setIsBooking] = useState(false);
  const [savingDraft, setSavingDraft] = useState(false);
  const [draftMsg, setDraftMsg] = useState<string | null>(null);
  const [sample, setSample] = useState<ProofSlot | null>(null);
  const [uploading, setUploading] = useState<string | null>(null);

  async function uploadProof(index: number, slot: ProofSlot, file: File) {
    setError(null);
    if (!["image/jpeg", "image/png"].includes(file.type)) {
      setError("Upload a JPG or PNG image.");
      return;
    }
    if (file.size > 1024 * 1024) {
      setError("Image must be under 1MB.");
      return;
    }
    const key = `${index}:${slot}`;
    setUploading(key);
    try {
      const fd = new FormData();
      fd.append("file", file);
      const res = await fetch("/api/shipments/proof-uploads", { method: "POST", body: fd });
      const json = await res.json();
      if (!res.ok) {
        setError(json.message ?? "Couldn't upload that file.");
        return;
      }
      const uploaded: UploadedFile = { path: json.data.path, url: json.data.url, name: file.name };
      setParcels((prev) => prev.map((p, i) => (i === index ? { ...p, [slot]: uploaded } : p)));
    } finally {
      setUploading(null);
    }
  }

  function removeProof(index: number, slot: ProofSlot) {
    setParcels((prev) => prev.map((p, i) => (i === index ? { ...p, [slot]: undefined } : p)));
  }

  // Clears a field's error highlight as soon as the user edits it.
  function clearInvalid(key: string) {
    setInvalid((prev) => {
      if (!prev.has(key)) return prev;
      const nextSet = new Set(prev);
      nextSet.delete(key);
      return nextSet;
    });
  }

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

  // Validates one address. Returns the invalid field keys (prefixed so they can
  // highlight the right inputs) plus a message naming what's missing, or null.
  function validateAddress(
    prefix: "sender" | "receiver",
    m: Mode,
    id: string,
    form: AddressForm,
  ): { keys: string[]; message: string } | null {
    const who = prefix === "sender" ? "sender" : "receiver";
    if (m === "saved") {
      return id !== "" ? null : { keys: [`${prefix}.saved`], message: `Select a saved ${who} address.` };
    }
    const required: [keyof AddressForm, string][] = [
      ["contact_name", "full name"],
      ["phone", "phone"],
      ["line1", "address line 1"],
      ["city", "city"],
      ["state", "state"],
      ["country", "country"],
    ];
    const missing = required.filter(([f]) => form[f].trim() === "");
    const keys = missing.map(([f]) => `${prefix}.${f}`);
    const emailBad = form.email.trim() !== "" && !EMAIL_RE.test(form.email.trim());
    if (emailBad) keys.push(`${prefix}.email`);
    if (keys.length === 0) return null;

    const parts: string[] = [];
    if (missing.length > 0) parts.push(`Complete the ${who} address — missing: ${missing.map(([, l]) => l).join(", ")}.`);
    if (emailBad) parts.push("Enter a valid email address or leave it blank.");
    return { keys, message: parts.join(" ") };
  }

  async function next() {
    setError(null);

    if (step === 0) {
      const result = validateAddress("sender", senderMode, senderId, senderNew);
      if (result) {
        setInvalid(new Set(result.keys));
        setError(result.message);
        return;
      }
    }

    if (step === 1) {
      const result = validateAddress("receiver", receiverMode, receiverId, receiverNew);
      if (result) {
        setInvalid(new Set(result.keys));
        setError(result.message);
        return;
      }
      if (senderMode === "saved" && receiverMode === "saved" && senderId === receiverId) {
        setError("Sender and receiver addresses must be different.");
        return;
      }
    }

    if (step === 2) {
      const keys: string[] = [];
      if (declared <= 0) keys.push("weight");
      parcels.forEach((p, i) => {
        if (num(p.length) <= 0) keys.push(`parcel.${i}.length`);
        if (num(p.width) <= 0) keys.push(`parcel.${i}.width`);
        if (num(p.height) <= 0) keys.push(`parcel.${i}.height`);
      });
      // Any item that has a quantity/value but no description is incomplete.
      items.forEach((it, i) => {
        const hasDetail = it.value.trim() !== "" || (it.quantity.trim() !== "" && it.quantity.trim() !== "1");
        if (hasDetail && it.description.trim() === "") keys.push(`item.${i}.description`);
      });
      if (keys.length > 0) {
        setInvalid(new Set(keys));
        const onlyWeight = keys.length === 1 && keys[0] === "weight";
        const itemIssue = keys.some((k) => k.startsWith("item."));
        setError(
          onlyWeight
            ? "Enter the declared weight (kg)."
            : itemIssue && keys.every((k) => k.startsWith("item."))
              ? "Add a name for each item you've listed, or remove it."
              : "Enter the declared weight and every parcel's length, width and height.",
        );
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
    setInvalid(new Set());
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
            parcel_items_file: p.parcelItems?.path,
            proof_of_purchase_file: p.proofOfPurchase?.path,
            proof_of_weight_file: p.proofOfWeight?.path,
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
          <AddressSection title="Ship from" prefix="sender" addresses={addresses} mode={senderMode} setMode={setSenderMode} selectedId={senderId} setSelectedId={setSenderId} form={senderNew} setForm={setSenderNew} invalid={invalid} clearInvalid={clearInvalid} />
        ) : null}

        {step === 1 ? (
          <AddressSection title="Ship to" prefix="receiver" addresses={addresses} mode={receiverMode} setMode={setReceiverMode} selectedId={receiverId} setSelectedId={setReceiverId} form={receiverNew} setForm={setReceiverNew} invalid={invalid} clearInvalid={clearInvalid} />
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
                  <div className="mt-3 grid grid-cols-2 gap-3 sm:grid-cols-4">
                    <label className="block">
                      <span className={fieldLabel}>Packaging</span>
                      <select value={p.type} onChange={(e) => setParcels((prev) => prev.map((x, idx) => (idx === i ? { ...x, type: e.target.value } : x)))} className={smallInput}>
                        {PARCEL_TYPES.map((t) => (
                          <option key={t} value={t}>
                            {t}
                          </option>
                        ))}
                      </select>
                    </label>
                    <label className="block">
                      <span className={fieldLabel}>Length (cm){requiredMark}</span>
                      <input type="number" min="0" value={p.length} onChange={(e) => { const v = e.target.value; setParcels((prev) => prev.map((x, idx) => (idx === i ? { ...x, length: v } : x))); clearInvalid(`parcel.${i}.length`); }} placeholder="0" className={`${smallInput} ${invalid.has(`parcel.${i}.length`) ? errorBorder : ""}`} />
                    </label>
                    <label className="block">
                      <span className={fieldLabel}>Width (cm){requiredMark}</span>
                      <input type="number" min="0" value={p.width} onChange={(e) => { const v = e.target.value; setParcels((prev) => prev.map((x, idx) => (idx === i ? { ...x, width: v } : x))); clearInvalid(`parcel.${i}.width`); }} placeholder="0" className={`${smallInput} ${invalid.has(`parcel.${i}.width`) ? errorBorder : ""}`} />
                    </label>
                    <label className="block">
                      <span className={fieldLabel}>Height (cm){requiredMark}</span>
                      <input type="number" min="0" value={p.height} onChange={(e) => { const v = e.target.value; setParcels((prev) => prev.map((x, idx) => (idx === i ? { ...x, height: v } : x))); clearInvalid(`parcel.${i}.height`); }} placeholder="0" className={`${smallInput} ${invalid.has(`parcel.${i}.height`) ? errorBorder : ""}`} />
                    </label>
                  </div>

                  <div className="mt-4 grid gap-4 sm:grid-cols-3">
                    {PROOF_SLOTS.map((slot) => (
                      <ProofUpload
                        key={slot.key}
                        label={slot.label}
                        file={p[slot.key]}
                        busy={uploading === `${i}:${slot.key}`}
                        onSample={() => setSample(slot.key)}
                        onUpload={(f) => uploadProof(i, slot.key, f)}
                        onRemove={() => removeProof(i, slot.key)}
                      />
                    ))}
                  </div>
                </div>
              ))}
              <button type="button" onClick={() => setParcels((prev) => [...prev, emptyParcel()])} className="text-sm font-semibold text-navy hover:text-red">
                + Add parcel
              </button>
            </div>

            <div className="grid gap-4 sm:grid-cols-2">
              <div>
                <label className="block text-sm font-semibold text-navy">Declared weight (kg){requiredMark}</label>
                <input type="number" min="0.1" step="0.1" value={declaredWeight} onChange={(e) => { setDeclaredWeight(e.target.value); clearInvalid("weight"); }} className={`${inputClass} ${invalid.has("weight") ? errorBorder : ""}`} />
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
              <div className="mt-2 grid grid-cols-12 gap-2 px-1">
                <span className={`col-span-6 ${fieldLabel} mb-0`}>Item</span>
                <span className={`col-span-2 ${fieldLabel} mb-0`}>Qty</span>
                <span className={`col-span-3 ${fieldLabel} mb-0`}>Value ({currency})</span>
                <span className="col-span-1" />
              </div>
              <div className="mt-1 space-y-2">
                {items.map((item, i) => (
                  <div key={i} className="grid grid-cols-12 items-center gap-2">
                    <input value={item.description} onChange={(e) => { const v = e.target.value; setItems((p) => p.map((x, idx) => (idx === i ? { ...x, description: v } : x))); clearInvalid(`item.${i}.description`); }} placeholder="e.g. Shoes" className={`col-span-6 ${smallInput} ${invalid.has(`item.${i}.description`) ? errorBorder : ""}`} />
                    <input type="number" min="1" value={item.quantity} onChange={(e) => setItems((p) => p.map((x, idx) => (idx === i ? { ...x, quantity: e.target.value } : x)))} placeholder="1" className={`col-span-2 ${smallInput}`} />
                    <input type="number" min="0" value={item.value} onChange={(e) => setItems((p) => p.map((x, idx) => (idx === i ? { ...x, value: e.target.value } : x)))} placeholder="0" className={`col-span-3 ${smallInput}`} />
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

      {sample ? <SampleModal slot={sample} onClose={() => setSample(null)} /> : null}
    </div>
  );
}

function AddressSection({
  title,
  prefix,
  addresses,
  mode,
  setMode,
  selectedId,
  setSelectedId,
  form,
  setForm,
  invalid,
  clearInvalid,
}: {
  title: string;
  prefix: "sender" | "receiver";
  addresses: Address[];
  mode: Mode;
  setMode: (m: Mode) => void;
  selectedId: string;
  setSelectedId: (id: string) => void;
  form: AddressForm;
  setForm: (updater: (prev: AddressForm) => AddressForm) => void;
  invalid: Set<string>;
  clearInvalid: (key: string) => void;
}) {
  const hasSaved = addresses.length > 0;
  const set = (field: keyof AddressForm) => (e: React.ChangeEvent<HTMLInputElement>) => {
    const value = e.target.value;
    setForm((prev) => ({ ...prev, [field]: value }));
    clearInvalid(`${prefix}.${field}`);
  };
  const err = (field: keyof AddressForm) => (invalid.has(`${prefix}.${field}`) ? errorBorder : "");

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
        <div className="mt-2 grid grid-cols-2 gap-3">
          <label className="block">
            <span className={fieldLabel}>Full name{requiredMark}</span>
            <input value={form.contact_name} onChange={set("contact_name")} placeholder="e.g. Jane Doe" className={`${smallInput} ${err("contact_name")}`} />
          </label>
          <label className="block">
            <span className={fieldLabel}>Phone{requiredMark}</span>
            <input value={form.phone} onChange={set("phone")} placeholder="e.g. 0803 000 0000" className={`${smallInput} ${err("phone")}`} />
          </label>
          <label className="col-span-2 block">
            <span className={fieldLabel}>Email{optionalHint}</span>
            <input type="email" value={form.email} onChange={set("email")} placeholder="name@email.com" className={`${smallInput} ${err("email")}`} />
          </label>
          <label className="col-span-2 block">
            <span className={fieldLabel}>Address line 1{requiredMark}</span>
            <input value={form.line1} onChange={set("line1")} placeholder="Street address" className={`${smallInput} ${err("line1")}`} />
          </label>
          <label className="col-span-2 block">
            <span className={fieldLabel}>Address line 2{optionalHint}</span>
            <input value={form.line2} onChange={set("line2")} placeholder="Apartment, suite, unit, etc." className={smallInput} />
          </label>
          <label className="block">
            <span className={fieldLabel}>City{requiredMark}</span>
            <input value={form.city} onChange={set("city")} placeholder="City" className={`${smallInput} ${err("city")}`} />
          </label>
          <label className="block">
            <span className={fieldLabel}>State / Province{requiredMark}</span>
            <input value={form.state} onChange={set("state")} placeholder="State or province" className={`${smallInput} ${err("state")}`} />
          </label>
          <label className="block">
            <span className={fieldLabel}>Postal code{optionalHint}</span>
            <input value={form.postal_code} onChange={set("postal_code")} placeholder="Postal / ZIP code" className={smallInput} />
          </label>
          <label className="block">
            <span className={fieldLabel}>Country{requiredMark}</span>
            <input value={form.country} onChange={set("country")} placeholder="Country" className={`${smallInput} ${err("country")}`} />
          </label>
        </div>
      )}
    </div>
  );
}

function ProofUpload({
  label,
  file,
  busy,
  onSample,
  onUpload,
  onRemove,
}: {
  label: string;
  file?: UploadedFile;
  busy: boolean;
  onSample: () => void;
  onUpload: (file: File) => void;
  onRemove: () => void;
}) {
  return (
    <div>
      <div className="flex flex-wrap items-baseline gap-x-2 gap-y-0.5">
        <span className="whitespace-nowrap text-sm font-semibold text-navy">{label}</span>
        <button type="button" onClick={onSample} className="shrink-0 text-xs font-semibold text-red hover:underline">
          View Sample
        </button>
      </div>

      {file ? (
        <div className="mt-1.5 flex items-center gap-2 rounded-lg border border-black/10 p-2">
          {/* eslint-disable-next-line @next/next/no-img-element */}
          <img src={file.url} alt={label} className="h-10 w-10 rounded object-cover" />
          <span className="min-w-0 flex-1 truncate text-xs text-body">{file.name}</span>
          <button type="button" onClick={onRemove} className="shrink-0 text-xs font-semibold text-red hover:underline">
            Remove
          </button>
        </div>
      ) : (
        <>
          <label
            className={`mt-1.5 flex cursor-pointer items-center justify-center gap-2 rounded-lg border border-black/10 px-3 py-2 text-sm font-semibold text-navy transition-colors hover:border-navy ${busy ? "pointer-events-none opacity-60" : ""}`}
          >
            <span aria-hidden>↑</span> {busy ? "Uploading…" : "Upload"}
            <input
              type="file"
              accept="image/png,image/jpeg"
              hidden
              disabled={busy}
              onChange={(e) => {
                const f = e.target.files?.[0];
                if (f) onUpload(f);
                e.target.value = "";
              }}
            />
          </label>
          <p className="mt-1 text-xs text-body">No file uploaded</p>
        </>
      )}
    </div>
  );
}

function SampleModal({ slot, onClose }: { slot: ProofSlot; onClose: () => void }) {
  const sample = PROOF_SAMPLES[slot];
  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40 p-4" onClick={onClose}>
      <div className="w-full max-w-md rounded-2xl bg-white p-6 shadow-xl" onClick={(e) => e.stopPropagation()}>
        <div className="flex items-start justify-between gap-4">
          <h3 className="text-lg font-bold text-navy">{sample.title}</h3>
          <button type="button" onClick={onClose} aria-label="Close" className="shrink-0 text-body hover:text-navy">
            ✕
          </button>
        </div>
        <ul className="mt-4 list-disc space-y-2 pl-5 text-sm text-body">
          {sample.steps.map((s, i) => (
            <li key={i}>{s}</li>
          ))}
        </ul>
        <div className="mt-4 flex justify-center rounded-xl border border-black/10 p-4">
          <ProofSampleArt slot={slot} />
        </div>
        <button
          type="button"
          onClick={onClose}
          className="mt-5 w-full rounded-full bg-red px-6 py-3 text-sm font-semibold text-white transition-colors hover:bg-red-light"
        >
          Close
        </button>
      </div>
    </div>
  );
}

// Real sample photos, dropped into /public/samples. If a file is missing the
// component falls back to the built-in SVG illustration, so the popup always
// shows something.
const SAMPLE_IMAGES: Record<ProofSlot, string> = {
  parcelItems: "/samples/parcel-items.jpg",
  proofOfPurchase: "/samples/proof-of-purchase.jpg",
  proofOfWeight: "/samples/proof-of-weight.jpg",
};

function ProofSampleArt({ slot }: { slot: ProofSlot }) {
  const [broken, setBroken] = useState(false);
  if (!broken) {
    return (
      // eslint-disable-next-line @next/next/no-img-element
      <img
        src={SAMPLE_IMAGES[slot]}
        alt="Sample"
        onError={() => setBroken(true)}
        className="max-h-64 w-auto rounded-lg object-contain"
      />
    );
  }
  return <ProofSampleFallback slot={slot} />;
}

/** Built-in illustration used until a real sample photo is added. */
function ProofSampleFallback({ slot }: { slot: ProofSlot }) {
  if (slot === "proofOfWeight") {
    return (
      <svg viewBox="0 0 200 140" className="h-32 w-auto" role="img" aria-label="Sealed box on a weighing scale">
        <rect x="55" y="18" width="90" height="60" rx="4" fill="#d9a566" stroke="#a9772f" strokeWidth="2" />
        <path d="M55 40 h90" stroke="#a9772f" strokeWidth="2" />
        <path d="M100 18 v22" stroke="#a9772f" strokeWidth="2" />
        <rect x="40" y="86" width="120" height="30" rx="4" fill="#3b3b46" />
        <rect x="52" y="94" width="34" height="14" rx="2" fill="#29abe2" />
        <rect x="150" y="116" width="8" height="10" fill="#3b3b46" />
        <rect x="42" y="116" width="8" height="10" fill="#3b3b46" />
      </svg>
    );
  }
  if (slot === "proofOfPurchase") {
    return (
      <svg viewBox="0 0 200 140" className="h-32 w-auto" role="img" aria-label="Shopping receipts">
        {[18, 74, 130].map((x) => (
          <g key={x}>
            <rect x={x} y="20" width="52" height="100" fill="#f4f4f5" stroke="#c9c9d1" strokeWidth="1.5" />
            <rect x={x + 8} y="30" width="36" height="5" fill="#c9c9d1" />
            <rect x={x + 8} y="44" width="36" height="3" fill="#dcdce1" />
            <rect x={x + 8} y="52" width="36" height="3" fill="#dcdce1" />
            <rect x={x + 8} y="60" width="24" height="3" fill="#dcdce1" />
            <rect x={x + 8} y="100" width="36" height="8" fill="#3b3b46" />
          </g>
        ))}
      </svg>
    );
  }
  return (
    <svg viewBox="0 0 200 140" className="h-32 w-auto" role="img" aria-label="Parcel contents arranged for a photo">
      <rect x="20" y="16" width="160" height="108" rx="6" fill="#efe7dc" stroke="#c9b79a" strokeWidth="2" />
      {[0, 1, 2].map((r) =>
        [0, 1, 2, 3].map((c) => (
          <rect
            key={`${r}-${c}`}
            x={32 + c * 38}
            y={28 + r * 32}
            width="30"
            height="24"
            rx="3"
            fill={["#c8361d", "#29abe2", "#ffb930", "#0e104b"][(r + c) % 4]}
            opacity="0.85"
          />
        )),
      )}
    </svg>
  );
}
