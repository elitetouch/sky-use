"use client";

import { useSearchParams } from "next/navigation";
import { FormEvent, useCallback, useEffect, useState } from "react";
import { Button } from "@/components/ui/Button";
import { formatEstimatedDelivery } from "@/lib/delivery";
import { formatDateTime } from "@/lib/datetime";

type StatusEvent = {
  id: string;
  label: string;
  location: string | null;
  note: string | null;
  link: string | null;
  created_at: string;
};

type Shipment = {
  tracking_number: string;
  status_label: string;
  service_label: string;
  weight_kg: string;
  origin: string | null;
  destination: string | null;
  is_delivered: boolean;
  estimated_delivery_date: string | null;
  estimated_delivery_window: string | null;
  status_events: StatusEvent[];
};

export function TrackLookup() {
  const searchParams = useSearchParams();
  const [trackingNumber, setTrackingNumber] = useState(searchParams.get("number") ?? "");
  const [shipment, setShipment] = useState<Shipment | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [isLoading, setIsLoading] = useState(false);

  const lookup = useCallback(async (number: string) => {
    setError(null);
    setShipment(null);
    setIsLoading(true);

    try {
      const response = await fetch(`/api/tracking/${encodeURIComponent(number.trim())}`);
      const json = await response.json();

      if (!response.ok) {
        setError(json.message ?? "We couldn't find that shipment.");
        return;
      }

      setShipment(json.data);
    } finally {
      setIsLoading(false);
    }
  }, []);

  useEffect(() => {
    const number = searchParams.get("number");
    if (number) {
      // Fetching on mount based on a URL param is the standard escape hatch here;
      // eslint-plugin-react-hooks's set-state-in-effect check flags it anyway.
      // eslint-disable-next-line react-hooks/set-state-in-effect
      lookup(number);
    }
  }, [searchParams, lookup]);

  async function handleSubmit(event: FormEvent) {
    event.preventDefault();
    await lookup(trackingNumber);
  }

  return (
    <div>
      <form onSubmit={handleSubmit} className="flex flex-col gap-3 sm:flex-row">
        <input
          value={trackingNumber}
          onChange={(e) => setTrackingNumber(e.target.value)}
          placeholder="e.g. SKY20358051"
          required
          className="w-full rounded-lg border border-black/10 px-4 py-3 text-sm text-navy outline-none focus:border-navy sm:flex-1"
        />
        <Button type="submit" variant="accent" size="lg" disabled={isLoading}>
          {isLoading ? "Searching…" : "Track"}
        </Button>
      </form>

      {error ? <p className="mt-4 text-sm text-red">{error}</p> : null}

      {shipment ? (
        <div className="mt-8 rounded-2xl border border-black/5 p-6">
          <div className="flex flex-wrap items-center justify-between gap-2">
            <div>
              <p className="text-xs font-semibold uppercase tracking-wide text-body">
                Tracking Number
              </p>
              <p className="text-lg font-bold text-navy">{shipment.tracking_number}</p>
            </div>
            <span className="rounded-full bg-navy px-4 py-1.5 text-sm font-semibold text-white">
              {shipment.status_label}
            </span>
          </div>

          {shipment.origin || shipment.destination ? (
            <div className="mt-6 flex items-center gap-3">
              <div className="min-w-0 flex-1">
                <p className="text-xs font-semibold uppercase tracking-wide text-body">Origin</p>
                <p className="mt-0.5 truncate text-sm font-bold text-navy">{shipment.origin ?? "—"}</p>
              </div>
              <div className="flex flex-1 items-center px-1" aria-hidden="true">
                <span className="h-2.5 w-2.5 shrink-0 rounded-full bg-navy" />
                <span className="h-0.5 flex-1 bg-gradient-to-r from-navy to-red" />
                <svg viewBox="0 0 24 24" className="h-4 w-4 shrink-0 -scale-x-100 text-red" fill="currentColor">
                  <path d="M2.5 12l17-8-4 8 4 8-17-8z" />
                </svg>
                <span className="h-0.5 flex-1 bg-black/10" />
                <span
                  className={`h-2.5 w-2.5 shrink-0 rounded-full ${shipment.is_delivered ? "bg-red" : "border-2 border-red bg-white"}`}
                />
              </div>
              <div className="min-w-0 flex-1 text-right">
                <p className="text-xs font-semibold uppercase tracking-wide text-body">Destination</p>
                <p className="mt-0.5 truncate text-sm font-bold text-navy">{shipment.destination ?? "—"}</p>
              </div>
            </div>
          ) : null}

          {formatEstimatedDelivery(shipment.estimated_delivery_date, shipment.estimated_delivery_window) ? (
            <div className="mt-6 rounded-xl bg-[#f5f5f7] p-5">
              <p className="text-xs font-semibold uppercase tracking-wide text-body">Estimated Delivery</p>
              <p className="mt-1 text-2xl font-bold text-navy">
                {formatEstimatedDelivery(
                  shipment.estimated_delivery_date,
                  shipment.estimated_delivery_window,
                )}
              </p>
            </div>
          ) : null}

          <div className="mt-6 grid grid-cols-2 gap-4 text-sm sm:grid-cols-3">
            <div>
              <p className="text-body">Service</p>
              <p className="font-semibold text-navy">{shipment.service_label}</p>
            </div>
            <div>
              <p className="text-body">Weight</p>
              <p className="font-semibold text-navy">{shipment.weight_kg} kg</p>
            </div>
          </div>

          <div className="mt-8">
            <p className="text-sm font-semibold text-navy">Shipment Timeline</p>
            <ol className="mt-4 space-y-4 border-l-2 border-navy/10 pl-4">
              {shipment.status_events.map((event) => (
                <li key={event.id} className="relative">
                  <span className="absolute -left-[21px] top-1 h-2.5 w-2.5 rounded-full bg-red" />
                  <p className="text-sm font-semibold text-navy">{event.label}</p>
                  {event.location ? <p className="text-xs text-body">{event.location}</p> : null}
                  {event.note ? <p className="text-xs text-body">{event.note}</p> : null}
                  {event.link ? (
                    <a
                      href={event.link}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="mt-0.5 inline-block break-all text-xs font-semibold text-red hover:underline"
                    >
                      {event.link}
                    </a>
                  ) : null}
                  <p className="mt-1 text-xs text-body/70">
                    {formatDateTime(event.created_at)}
                  </p>
                </li>
              ))}
            </ol>
          </div>
        </div>
      ) : null}
    </div>
  );
}
