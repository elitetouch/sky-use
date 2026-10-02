"use client";

import { RefObject, useEffect, useRef } from "react";
import {
  isGoogleMapsConfigured,
  loadGoogleMaps,
  parseAddressComponents,
  type ParsedAddress,
} from "@/lib/googleMaps";

type Options = {
  /** Restrict suggestions to this country (ISO 3166-1 alpha-2, e.g. "NG"). */
  country?: string | null;
};

/**
 * Attaches Google Places Autocomplete to an <input> and fills the parsed address
 * via `onPick`. Uses the **new Places API** (`AutocompleteSuggestion` + `Place`)
 * which runs on "Places API (New)" — the legacy `Autocomplete` widget is not
 * available to projects created after March 2025. Renders its own suggestion
 * dropdown (appended to <body>) so it works with our own labelled inputs.
 *
 * No-op (plain input) when the Maps key isn't configured or the API fails to
 * load, so the field always degrades to manual entry.
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
    if (!isGoogleMapsConfigured() || !input) {
      return;
    }

    let cancelled = false;
    let places: google.maps.PlacesLibrary | null = null;
    let sessionToken: google.maps.places.AutocompleteSessionToken | null = null;
    let debounce: ReturnType<typeof setTimeout> | null = null;
    let requestSeq = 0;
    let activeIndex = -1;
    let suggestions: google.maps.places.AutocompleteSuggestion[] = [];

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

    function renderMenu() {
      menu.replaceChildren();
      if (suggestions.length === 0) {
        closeMenu();
        return;
      }
      suggestions.forEach((s, i) => {
        const p = s.placePrediction;
        if (!p) return;
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
        main.textContent = p.mainText?.text ?? p.text.text;
        main.style.fontWeight = "600";
        row.appendChild(main);

        const secondary = p.secondaryText?.text;
        if (secondary) {
          const sub = document.createElement("div");
          sub.textContent = secondary;
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
          void choose(i);
        });
        menu.appendChild(row);
      });
      positionMenu();
      menu.style.display = "block";
    }

    function highlight() {
      Array.from(menu.children).forEach((child, i) => {
        (child as HTMLElement).style.background =
          i === activeIndex ? "rgba(11,27,58,0.06)" : "transparent";
      });
    }

    async function choose(index: number) {
      const prediction = suggestions[index]?.placePrediction;
      if (!prediction) return;
      closeMenu();
      try {
        const place = prediction.toPlace();
        await place.fetchFields({ fields: ["addressComponents", "formattedAddress"] });
        if (cancelled) return;
        const parsed = parseAddressComponents(
          place.addressComponents ?? [],
          place.formattedAddress ?? prediction.text.text,
        );
        if (parsed.line1) onPickRef.current(parsed);
        // A fresh token must be minted for the next lookup session.
        sessionToken = places ? new places.AutocompleteSessionToken() : null;
      } catch {
        // Lookup failed — leave whatever the user typed in place.
      }
    }

    async function fetchSuggestions(value: string) {
      if (!places) return;
      const seq = ++requestSeq;
      if (!sessionToken) sessionToken = new places.AutocompleteSessionToken();

      const request: google.maps.places.AutocompleteRequest = {
        input: value,
        sessionToken,
        language: typeof navigator !== "undefined" ? navigator.language : undefined,
      };
      const region = countryRef.current;
      if (region) request.includedRegionCodes = [region.toLowerCase()];

      try {
        const { suggestions: result } =
          await places.AutocompleteSuggestion.fetchAutocompleteSuggestions(request);
        if (cancelled || seq !== requestSeq) return;
        suggestions = result.filter((s) => s.placePrediction);
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
      debounce = setTimeout(() => void fetchSuggestions(value), 220);
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
          void choose(activeIndex);
        }
      } else if (e.key === "Escape") {
        closeMenu();
      }
    }

    const onBlur = () => setTimeout(closeMenu, 120);
    const onReposition = () => {
      if (menu.style.display !== "none") positionMenu();
    };

    loadGoogleMaps()
      .then(async (google) => {
        if (cancelled) return;
        places = (await google.maps.importLibrary("places")) as google.maps.PlacesLibrary;
        if (cancelled) return;
        input.setAttribute("autocomplete", "off");
        input.addEventListener("input", onInput);
        input.addEventListener("keydown", onKeyDown);
        input.addEventListener("blur", onBlur);
        window.addEventListener("scroll", onReposition, true);
        window.addEventListener("resize", onReposition);
      })
      .catch(() => {
        // No key / load failure — the plain input keeps working.
      });

    return () => {
      cancelled = true;
      if (debounce) clearTimeout(debounce);
      input.removeEventListener("input", onInput);
      input.removeEventListener("keydown", onKeyDown);
      input.removeEventListener("blur", onBlur);
      window.removeEventListener("scroll", onReposition, true);
      window.removeEventListener("resize", onReposition);
      menu.remove();
    };
  }, [inputRef]);
}
