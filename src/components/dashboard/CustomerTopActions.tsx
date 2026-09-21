import Link from "next/link";

const actions = [
  { href: "/dashboard/shipments/new", label: "Book Shipment", primary: true },
  { href: "/track", label: "Track Shipment", primary: false },
  { href: "/dashboard/rates", label: "Rates Calculator", primary: false },
];

/** Terminal-style quick actions shown at the top of every customer page. */
export function CustomerTopActions() {
  return (
    <div className="mb-6 flex flex-wrap gap-2">
      {actions.map((a) => (
        <Link
          key={a.href}
          href={a.href}
          className={`rounded-full px-4 py-2 text-sm font-semibold transition-colors ${
            a.primary
              ? "bg-red text-white hover:bg-red/90"
              : "border border-red/30 text-red hover:bg-red/5"
          }`}
        >
          {a.label}
        </Link>
      ))}
    </div>
  );
}
