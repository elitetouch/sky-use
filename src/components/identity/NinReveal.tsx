"use client";

import { useState } from "react";

/** Mask all but the last 4 digits (matches the API's masking). */
function mask(nin: string): string {
  if (nin.length <= 4) return nin;
  return "•".repeat(nin.length - 4) + nin.slice(-4);
}

/**
 * Shows a NIN masked by default with an eye icon to reveal/hide the full number.
 * Render only where the viewer is allowed to see it (owner or super admin).
 */
export function NinReveal({ nin, className = "" }: { nin: string | null | undefined; className?: string }) {
  const [shown, setShown] = useState(false);

  if (!nin) {
    return <span className={`text-body ${className}`}>—</span>;
  }

  return (
    <span className={`inline-flex items-center gap-1.5 ${className}`}>
      <span className="font-mono text-sm tracking-wider text-navy">{shown ? nin : mask(nin)}</span>
      <button
        type="button"
        onClick={() => setShown((s) => !s)}
        className="text-body hover:text-navy"
        aria-label={shown ? "Hide NIN" : "Show NIN"}
        title={shown ? "Hide NIN" : "Show NIN"}
      >
        {shown ? (
          <svg viewBox="0 0 20 20" fill="none" className="h-4 w-4" aria-hidden>
            <path
              d="M3 3l14 14M8.5 8.6a2 2 0 002.8 2.8M6.1 6.2C4.3 7.3 3 9 2.5 10c1.3 2.8 4.1 4.8 7.5 4.8 1.4 0 2.7-.3 3.8-.9M9.2 5.3c.3 0 .5-.1.8-.1 3.4 0 6.2 2 7.5 4.8-.4.8-1 1.6-1.7 2.3"
              stroke="currentColor"
              strokeWidth="1.5"
              strokeLinecap="round"
            />
          </svg>
        ) : (
          <svg viewBox="0 0 20 20" fill="none" className="h-4 w-4" aria-hidden>
            <path
              d="M2.5 10C3.8 7.2 6.6 5.2 10 5.2s6.2 2 7.5 4.8c-1.3 2.8-4.1 4.8-7.5 4.8S3.8 12.8 2.5 10z"
              stroke="currentColor"
              strokeWidth="1.5"
            />
            <circle cx="10" cy="10" r="2.25" stroke="currentColor" strokeWidth="1.5" />
          </svg>
        )}
      </button>
    </span>
  );
}
