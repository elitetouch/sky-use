"use client";

export type AddressForm = {
  label: string;
  contact_name: string;
  phone: string;
  line1: string;
  line2: string;
  city: string;
  state: string;
};

export const EMPTY_ADDRESS: AddressForm = {
  label: "",
  contact_name: "",
  phone: "",
  line1: "",
  line2: "",
  city: "",
  state: "",
};

export function AddressFieldset({
  title,
  value,
  onChange,
}: {
  title: string;
  value: AddressForm;
  onChange: (next: AddressForm) => void;
}) {
  function update(field: keyof AddressForm) {
    return (e: React.ChangeEvent<HTMLInputElement>) => onChange({ ...value, [field]: e.target.value });
  }

  const inputClass =
    "mt-1.5 w-full rounded-lg border border-black/10 px-4 py-2.5 text-sm text-navy outline-none focus:border-navy";

  return (
    <div className="rounded-2xl border border-black/5 p-6">
      <p className="text-sm font-semibold text-navy">{title}</p>
      <div className="mt-4 grid gap-4 sm:grid-cols-2">
        <div>
          <label className="block text-sm font-semibold text-navy">Contact name</label>
          <input required value={value.contact_name} onChange={update("contact_name")} className={inputClass} />
        </div>
        <div>
          <label className="block text-sm font-semibold text-navy">Phone</label>
          <input required value={value.phone} onChange={update("phone")} className={inputClass} />
        </div>
      </div>
      <div className="mt-4">
        <label className="block text-sm font-semibold text-navy">Address line 1</label>
        <input required value={value.line1} onChange={update("line1")} className={inputClass} />
      </div>
      <div className="mt-4">
        <label className="block text-sm font-semibold text-navy">Address line 2 (optional)</label>
        <input value={value.line2} onChange={update("line2")} className={inputClass} />
      </div>
      <div className="mt-4 grid gap-4 sm:grid-cols-2">
        <div>
          <label className="block text-sm font-semibold text-navy">City</label>
          <input required value={value.city} onChange={update("city")} className={inputClass} />
        </div>
        <div>
          <label className="block text-sm font-semibold text-navy">State</label>
          <input required value={value.state} onChange={update("state")} className={inputClass} />
        </div>
      </div>
    </div>
  );
}
