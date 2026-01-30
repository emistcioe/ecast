import { useEffect, useState } from "react";
import Head from "next/head";
import NavBar from "@/components/nav";
import Footer from "@/components/footar";
import { useLag } from "@/lib/hooks/lag";

type Material = {
  id: string;
  name: string;
  description: string;
  total_quantity: number;
  max_concurrent_loans: number;
  image_url?: string | null;
  active_loaned?: number;
  available_quantity?: number;
};

type PublicLoan = {
  id: string;
  batch_label?: string;
  issued_at?: string;
  items: { material_name: string; quantity: number }[];
};

export default function LagInventoryPage() {
  const { listMaterials, listPublicLoans } = useLag();
  const [materials, setMaterials] = useState<Material[]>([]);
  const [loans, setLoans] = useState<PublicLoan[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    let mounted = true;
    Promise.all([listMaterials(), listPublicLoans()])
      .then(([materialsData, loansData]) => {
        if (!mounted) return;
        setMaterials(materialsData);
        setLoans(loansData);
      })
      .catch(() => {
        if (!mounted) return;
        setError("Failed to load inventory");
      })
      .finally(() => {
        if (!mounted) return;
        setLoading(false);
      });
    return () => {
      mounted = false;
    };
  }, [listMaterials]);

  return (
    <>
      <Head>
        <title>LAG Inventory</title>
      </Head>
      <NavBar />
      <main className="min-h-screen bg-gray-950 text-white pt-24">
        <section className="max-w-6xl mx-auto px-4 md:px-6 pb-16">
          <div className="flex flex-col md:flex-row md:items-end md:justify-between gap-4">
            <div>
              <h1 className="text-3xl md:text-4xl font-bold">Inventory</h1>
              <p className="text-gray-400 mt-2">
                Available electronics and materials for LAG lending.
              </p>
            </div>
          </div>

          {loading && (
            <div className="mt-10 text-gray-400">Loading inventory...</div>
          )}
          {error && (
            <div className="mt-10 text-red-400 bg-red-500/10 border border-red-500/20 rounded-lg p-4">
              {error}
            </div>
          )}

          {!loading && !error && materials.length === 0 && (
            <div className="mt-10 text-gray-400">No materials yet.</div>
          )}

          <div className="mt-8 grid sm:grid-cols-2 lg:grid-cols-3 gap-6">
            {materials.map((m) => (
              <div
                key={m.id}
                className="bg-gray-900 border border-gray-800 rounded-lg overflow-hidden"
              >
                <div className="h-44 bg-gray-950 flex items-center justify-center overflow-hidden">
                  {m.image_url ? (
                    // eslint-disable-next-line @next/next/no-img-element
                    <img
                      src={m.image_url}
                      alt={m.name}
                      className="w-full h-full object-cover"
                    />
                  ) : (
                    <div className="text-gray-600 text-sm">No image</div>
                  )}
                </div>
                <div className="p-5">
                  <div className="flex items-start justify-between gap-3">
                    <h3 className="text-lg font-semibold">{m.name}</h3>
                    <span className="text-xs px-2 py-1 rounded-full bg-cyan-500/10 border border-cyan-500/20 text-cyan-200">
                      Available {m.available_quantity ?? 0}
                    </span>
                  </div>
                  <p className="text-gray-400 text-sm mt-2 line-clamp-3">
                    {m.description || "No description"}
                  </p>
                  <div className="grid grid-cols-2 gap-3 mt-4 text-xs text-gray-400">
                    <div className="bg-gray-950 border border-gray-800 rounded-lg p-2">
                      <div>Total</div>
                      <div className="text-white font-semibold">
                        {m.total_quantity}
                      </div>
                    </div>
                    <div className="bg-gray-950 border border-gray-800 rounded-lg p-2">
                      <div>Max loans</div>
                      <div className="text-white font-semibold">
                        {m.max_concurrent_loans}
                      </div>
                    </div>
                  </div>
                </div>
              </div>
            ))}
          </div>

          <div className="mt-12 bg-gray-900 border border-gray-800 rounded-lg p-6">
            <h2 className="text-xl font-semibold">Current Lendings</h2>
            <p className="text-gray-400 text-sm mt-1">
              Shows batch and items currently issued (no personal names).
            </p>
            <div className="mt-4 space-y-3">
              {loans.length === 0 && (
                <div className="text-sm text-gray-400">
                  No active lendings.
                </div>
              )}
              {loans.map((loan) => (
                <div
                  key={loan.id}
                  className="bg-gray-950 border border-gray-800 rounded-lg p-4"
                >
                  <div className="flex items-center justify-between text-sm">
                    <span className="font-semibold text-cyan-200">
                      {loan.batch_label || "Batch"}
                    </span>
                    <span className="text-gray-500">
                      {loan.issued_at
                        ? new Date(loan.issued_at).toLocaleString()
                        : "-"}
                    </span>
                  </div>
                  <div className="mt-2 text-sm text-gray-300">
                    {loan.items.map((item, idx) => (
                      <div key={idx}>
                        {item.material_name} x{item.quantity}
                      </div>
                    ))}
                  </div>
                </div>
              ))}
            </div>
          </div>
        </section>
      </main>
      <Footer />
    </>
  );
}
