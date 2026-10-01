export function VerifiedBadge({ label = "Verified", className = "" }: { label?: string; className?: string }) {
  return (
    <span
      className={`inline-flex items-center gap-1 rounded-md bg-green-600 px-2 py-0.5 text-xs font-semibold text-white ${className}`}
    >
      <svg viewBox="0 0 20 20" fill="currentColor" className="h-3.5 w-3.5" aria-hidden>
        <path
          fillRule="evenodd"
          d="M16.7 5.3a1 1 0 010 1.4l-7.5 7.5a1 1 0 01-1.4 0L3.3 10a1 1 0 011.4-1.4l3.3 3.3 6.8-6.8a1 1 0 011.4 0z"
          clipRule="evenodd"
        />
      </svg>
      {label}
    </span>
  );
}
