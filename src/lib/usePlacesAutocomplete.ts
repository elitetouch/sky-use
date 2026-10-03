"use client";

import { RefObject, useEffect, useRef } from "react";
import {
  fetchAddressSuggestions,
  isAddressAutocompleteEnabled,
  type AddressSuggestion,
  type ParsedAddress,
} from "@/lib/geocode";

// NOTE: This used to drive Google Places (see src/lib/googleMaps.ts, kept for
// reference). It now uses the free, keyless Photon/OpenStreetMap geocoder via
// @/lib/geocode, so address autocomplete works without a billing-enabled Google
// Cloud project. To switch back to Google, restore the googleMaps-based version.

type Options = {
  /** Restrict suggestions to this country (ISO 3166-1 alpha-2, e.g. "NG"). */
  country?: string | null;
};

/**
 * Attaches address autocomplete to an <input> and fills the parsed address via
 * `onPick`. Renders its own suggestion dropdown (appended to <body>) so it works
 * with our own labelled inputs. Degrades silently to a plain input on failure.
 */
export function usePlacesAutocomplete(
  inputRef: RefObject<HTMLInputElement | null>,
  onPick: (address: ParsedAddress) => void,
  options?: Options,
): void {
  const onPickRef = useRef(onPick);
  const countryRef = useRef(options?.country ?? null);
  useEffect(() => {
    onPickRef.current = onPick;
    countryRef.current = options?.country ?? null;
  });

  useEffect(() => {
    const input = inputRef.current;
    if (!isAddressAutocompleteEnabled() || !input) {
      return;
    }

    let cancelled = false;
    let debounce: ReturnType<typeof setTimeout> | null = null;
    let controller: AbortController | null = null;
    let requestSeq = 0;
    let activeIndex = -1;
    let suggestions: AddressSuggestion[] = [];

    // --- Dropdown element (plain DOM so it can live outside React). ----------
    const menu = document.createElement("div");
    Object.assign(menu.style, {
      position: "fixed",
      zIndex: "9999",
      background: "#fff",
      border: "1px solid rgba(0,0,0,0.1)",
      borderRadius: "12px",
      boxShadow: "0 12px 32px rgba(0,0,0,0.14)",
      overflow: "hidden",
      display: "none",
      font: "inherit",
    } as CSSStyleDeclaration);
    menu.setAttribute("role", "listbox");
    document.body.appendChild(menu);

    function positionMenu() {
      const el = inputRef.current;
      if (!el) return;
      const rect = el.getBoundingClientRect();
      menu.style.left = `${rect.left}px`;
      menu.style.top = `${rect.bottom + 4}px`;
      menu.style.width = `${rect.width}px`;
    }

    function closeMenu() {
      menu.style.display = "none";
      menu.replaceChildren();
      suggestions = [];
      activeIndex = -1;
    }

    function highlight() {
      Array.from(menu.children).forEach((child, i) => {
        (child as HTMLElement).style.background =
          i === activeIndex ? "rgba(11,27,58,0.06)" : "transparent";
      });
    }

    function renderMenu() {
      menu.replaceChildren();
      if (suggestions.length === 0) {
        closeMenu();
        return;
      }
      suggestions.forEach((s, i) => {
        const row = document.createElement("div");
        row.setAttribute("role", "option");
        Object.assign(row.style, {
          padding: "10px 14px",
          cursor: "pointer",
          fontSize: "14px",
          lineHeight: "1.3",
          color: "#0b1b3a",
          background: i === activeIndex ? "rgba(11,27,58,0.06)" : "transparent",
        } as CSSStyleDeclaration);

        const main = document.createElement("div");
        main.textContent = s.label;
        main.style.fontWeight = "600";
        row.appendChild(main);

        if (s.secondary) {
          const sub = document.createElement("div");
          sub.textContent = s.secondary;
          sub.style.fontSize = "12px";
          sub.style.color = "rgba(11,27,58,0.6)";
          row.appendChild(sub);
        }

        row.addEventListener("mouseenter", () => {
          activeIndex = i;
          highlight();
        });
        // mousedown (not click) so selection fires before the input blurs.
        row.addEventListener("mousedown", (e) => {
          e.preventDefault();
          choose(i);
        });
        menu.appendChild(row);
      });
      positionMenu();
      menu.style.display = "block";
    }

    function choose(index: number) {
      const picked = suggestions[index];
      if (!picked) return;
      closeMenu();
      if (picked.address.line1) onPickRef.current(picked.address);
    }

    async function runSearch(value: string) {
      const seq = ++requestSeq;
      controller?.abort();
      controller = new AbortController();
      try {
        const results = await fetchAddressSuggestions(value, {
          country: countryRef.current,
          signal: controller.signal,
        });
        if (cancelled || seq !== requestSeq) return;
        suggestions = results;
        activeIndex = -1;
        renderMenu();
      } catch {
        if (seq === requestSeq) closeMenu();
      }
    }

    function onInput() {
      const el = inputRef.current;
      if (!el) return;
      const value = el.value.trim();
      if (debounce) clearTimeout(debounce);
      if (value.length < 3) {
        closeMenu();
        return;
      }
      debounce = setTimeout(() => void runSearch(value), 250);
    }

    function onKeyDown(e: KeyboardEvent) {
      if (menu.style.display === "none" || suggestions.length === 0) return;
      if (e.key === "ArrowDown") {
        e.preventDefault();
        activeIndex = (activeIndex + 1) % suggestions.length;
        highlight();
      } else if (e.key === "ArrowUp") {
        e.preventDefault();
        activeIndex = (activeIndex - 1 + suggestions.length) % suggestions.length;
        highlight();
      } else if (e.key === "Enter") {
        if (activeIndex >= 0) {
          e.preventDefault();
          choose(activeIndex);
        }
      } else if (e.key === "Escape") {
        closeMenu();
      }
    }

    const onBlur = () => setTimeout(closeMenu, 120);
    const onReposition = () => {
      if (menu.style.display !== "none") positionMenu();
    };

    input.setAttribute("autocomplete", "off");
    input.addEventListener("input", onInput);
    input.addEventListener("keydown", onKeyDown);
    input.addEventListener("blur", onBlur);
    window.addEventListener("scroll", onReposition, true);
    window.addEventListener("resize", onReposition);

    return () => {
      cancelled = true;
      if (debounce) clearTimeout(debounce);
      controller?.abort();
      input.removeEventListener("input", onInput);
      input.removeEventListener("keydown", onKeyDown);
      input.removeEventListener("blur", onBlur);
      window.removeEventListener("scroll", onReposition, true);
      window.removeEventListener("resize", onReposition);
      menu.remove();
    };
  }, [inputRef]);
}
