"use client";

export function PrintButton() {
  return (
    <button
      className="mt-6 rounded-lg bg-navy px-4 py-2 text-white"
      onClick={() => window.print()}
    >
      Print Receipt
    </button>
  );
}
