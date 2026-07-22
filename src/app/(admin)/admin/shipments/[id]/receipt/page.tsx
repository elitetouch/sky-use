type Props = {
  params: Promise<{
    id: string;
  }>;
};

export default async function ShipmentReceiptPage({ params }: Props) {
  const { id } = await params;

  return (
    <main className="p-6">
      <div className="rounded-xl border p-6">
        <h1 className="text-2xl font-bold">Shipment Receipt</h1>

        <p className="mt-4">Shipment ID: {id}</p>

        <button
          className="mt-6 rounded-lg bg-navy px-4 py-2 text-white"
          onClick={() => window.print()}
        >
          Print Receipt
        </button>
      </div>
    </main>
  );
}
