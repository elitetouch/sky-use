import { InputHTMLAttributes } from "react";

type FieldProps = InputHTMLAttributes<HTMLInputElement> & {
  label: string;
  error?: string;
};

export function Field({ label, error, id, ...rest }: FieldProps) {
  const inputId = id ?? rest.name;

  return (
    <div>
      <label htmlFor={inputId} className="block text-sm font-semibold text-navy">
        {label}
      </label>
      <input
        id={inputId}
        {...rest}
        className={`mt-1.5 w-full rounded-lg border px-4 py-2.5 text-sm text-navy outline-none transition-colors focus:border-navy ${
          error ? "border-red" : "border-black/10"
        }`}
      />
      {error ? <p className="mt-1 text-xs text-red">{error}</p> : null}
    </div>
  );
}
