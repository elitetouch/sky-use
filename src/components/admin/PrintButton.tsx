"use client";

export function PrintButton({ fileName }: { fileName?: string }) {
  function handlePrint() {
    if (!fileName) {
      window.print();
      return;
    }

    // Browsers derive the "Save as PDF" filename from document.title, so set it
    // to the desired pattern just for the print, then restore it afterwards.
    const original = document.title;
    document.title = fileName;

    const restore = () => {
      document.title = original;
      window.removeEventListener("afterprint", restore);
    };
    window.addEventListener("afterprint", restore);

    window.print();
  }

  return (
    <button
      className="mt-6 rounded-lg bg-navy px-4 py-2 text-white"
      onClick={handlePrint}
    >
      Print Receipt
    </button>
  );
}
