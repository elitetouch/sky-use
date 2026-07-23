import { PrintButton } from "@/components/admin/PrintButton";

type Props = {
  params: Promise<{
    id: string;
  }>;
};

export default async function ShipmentReceiptPage({ params }: Props) {
  const { id } = await params;

  return (
    <main className="p-6 print:p-0 print:bg-white">
      <div className="mx-auto max-w-5xl print:max-w-none">
        <div className="mb-6 flex justify-end print:hidden">
          <PrintButton />
        </div>

        <div className="rounded-xl border bg-white p-8 shadow-lg print:rounded-none print:border-0 print:shadow-none">
          <h1 className="text-2xl font-bold text-center">Shipment Receipt</h1>

          <p className="mt-6 text-center text-gray-600">Shipment ID: {id}</p>
        </div>
      </div>
    </main>
  );
}
