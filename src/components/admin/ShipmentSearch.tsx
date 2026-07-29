"use client";

import { useRouter, useSearchParams } from "next/navigation";
import { FormEvent, useState } from "react";
import { Button } from "@/components/ui/Button";

export function ShipmentSearch({ initialValue }: { initialValue: string }) {
  const router = useRouter();
  const searchParams = useSearchParams();
  const [term, setTerm] = useState(initialValue);

  function apply(value: string) {
    const params = new URLSearchParams(searchParams.toString());
    if (value.trim()) {
      params.set("search", value.trim());
    } else {
      params.delete("search");
    }
    router.push(`/admin/shipments?${params.toString()}`);
  }

  function handleSubmit(event: FormEvent) {
    event.preventDefault();
    apply(term);
  }

  return (
    <form onSubmit={handleSubmit} className="flex gap-2">
      <input
        value={term}
        onChange={(e) => setTerm(e.target.value)}
        placeholder="Search tracking number or customer…"
        className="w-full rounded-lg border border-black/10 px-4 py-2.5 text-sm text-navy outline-none focus:border-navy"
      />
      <Button type="submit" variant="primary">
        Search
      </Button>
      {initialValue ? (
        <Button
          type="button"
          variant="ghost"
          onClick={() => {
            setTerm("");
            apply("");
          }}
        >
          Clear
        </Button>
      ) : null}
    </form>
  );
}
