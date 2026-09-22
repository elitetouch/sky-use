"use client";

import { ClipboardEvent, KeyboardEvent, useEffect, useRef } from "react";

/**
 * Segmented one-time-code input: a row of single-character boxes with
 * auto-advance, backspace-to-previous, arrow-key nav and paste-to-fill.
 * Numeric only; value is the compact string of entered digits.
 */
export function OtpInput({
  value,
  onChange,
  length = 6,
  autoFocus = false,
  onComplete,
  disabled = false,
}: {
  value: string;
  onChange: (value: string) => void;
  length?: number;
  autoFocus?: boolean;
  onComplete?: (value: string) => void;
  disabled?: boolean;
}) {
  const inputs = useRef<Array<HTMLInputElement | null>>([]);
  // Mirror of the current value, updated synchronously so rapid keystrokes
  // (which fire before React re-renders) always read the latest digits.
  const valueRef = useRef(value);
  useEffect(() => {
    valueRef.current = value;
  }, [value]);

  const chars = Array.from({ length }, (_, i) => value[i] ?? "");

  function focus(index: number) {
    const el = inputs.current[index];
    if (el) {
      el.focus();
      el.select();
    }
  }

  function commit(next: string) {
    const cleaned = next.replace(/\D/g, "").slice(0, length);
    valueRef.current = cleaned;
    onChange(cleaned);
    if (cleaned.length === length) onComplete?.(cleaned);
  }

  function handleChange(index: number, raw: string) {
    const digits = raw.replace(/\D/g, "");
    if (digits === "") return;
    const arr = Array.from({ length }, (_, i) => valueRef.current[i] ?? "");
    let pos = index;
    for (const digit of digits) {
      if (pos >= length) break;
      arr[pos] = digit;
      pos++;
    }
    commit(arr.join(""));
    focus(Math.min(pos, length - 1));
  }

  function handleKeyDown(index: number, event: KeyboardEvent<HTMLInputElement>) {
    if (event.key === "Backspace") {
      event.preventDefault();
      const arr = [...chars];
      if (arr[index]) {
        arr[index] = "";
        commit(arr.join(""));
      } else if (index > 0) {
        arr[index - 1] = "";
        commit(arr.join(""));
        focus(index - 1);
      }
    } else if (event.key === "ArrowLeft" && index > 0) {
      focus(index - 1);
    } else if (event.key === "ArrowRight" && index < length - 1) {
      focus(index + 1);
    }
  }

  function handlePaste(event: ClipboardEvent<HTMLInputElement>) {
    event.preventDefault();
    const pasted = event.clipboardData.getData("text").replace(/\D/g, "").slice(0, length);
    if (pasted === "") return;
    commit(pasted);
    focus(Math.min(pasted.length, length - 1));
  }

  return (
    <div className="flex justify-center gap-2 sm:gap-3">
      {chars.map((char, index) => (
        <input
          key={index}
          ref={(el) => {
            inputs.current[index] = el;
          }}
          type="text"
          inputMode="numeric"
          autoComplete={index === 0 ? "one-time-code" : "off"}
          autoFocus={autoFocus && index === 0}
          maxLength={1}
          value={char}
          disabled={disabled}
          onChange={(e) => handleChange(index, e.target.value)}
          onKeyDown={(e) => handleKeyDown(index, e)}
          onPaste={handlePaste}
          onFocus={(e) => e.target.select()}
          className="h-12 w-11 rounded-xl border border-black/15 text-center text-lg font-bold text-navy outline-none focus:border-navy focus:ring-2 focus:ring-navy/20 disabled:opacity-50 sm:h-14 sm:w-12"
          aria-label={`Digit ${index + 1}`}
        />
      ))}
    </div>
  );
}
