import type { Metadata } from "next";
import { RatesCalculator } from "@/components/dashboard/RatesCalculator";

export const metadata: Metadata = {
  title: "Rates Calculator",
};

export default function RatesCalculatorPage() {
  return (
    <div>
      <h1 className="text-2xl font-bold text-navy">Rates Calculator</h1>
      <p className="mt-1 text-body">Find out how much a delivery could cost — free, before you book.</p>
      <RatesCalculator />
    </div>
  );
}
