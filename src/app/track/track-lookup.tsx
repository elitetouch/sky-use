"use client";

import { FormEvent, useState } from "react";
import { Button } from "@/components/ui/Button";

type StatusEvent = {
  id: string;
  status: string;
  label: string;
  location: string | null;
  note: string | null;
  created_at: string;
};

type Shipment = {
  tracking_number: string;
  status: string;
  status_label: string;
  service_level: string;
  mode: string;
  weight_kg: string;
  status_events: StatusEvent[];
};

export function TrackLookup() {
  const [trackingNumber, setTrackingNumber] = useState("");
  const [shipment, setShipment] = useState<Shipment | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [isLoading, setIsLoading] = useState(false);

  async function handleSubmit(event: FormEvent) {
    event.preventDefault();
    setError(null);
    setShipment(null);
    setIsLoading(true);

    try {
      const response = await fetch(`/api/tracking/${encodeURIComponent(trackingNumber.trim())}`);
      const json = await response.json();

      if (!response.ok) {
        setError(json.message ?? "We couldn't find that shipment.");
        return;
      }

      setShipment(json.data);
    } finally {
      setIsLoading(false);
    }
  }

  return (
    <div>
      <form onSubmit={handleSubmit} className="flex flex-col gap-3 sm:flex-row">
        <input
          value={trackingNumber}
          onChange={(e) => setTrackingNumber(e.target.value)}
          placeholder="e.g. SKY-ABC1234567"
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

          <div className="mt-6 grid grid-cols-2 gap-4 text-sm sm:grid-cols-3">
            <div>
              <p className="text-body">Service</p>
              <p className="font-semibold text-navy capitalize">{shipment.service_level}</p>
            </div>
            <div>
              <p className="text-body">Mode</p>
              <p className="font-semibold text-navy capitalize">{shipment.mode}</p>
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
                  <p className="mt-1 text-xs text-body/70">
                    {new Date(event.created_at).toLocaleString()}
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
