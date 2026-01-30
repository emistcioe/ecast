import { useEffect, useState } from "react";
import { useLag } from "@/lib/hooks/lag";

type LagRequest = {
  id: string;
  requester_email: string;
  requester_name?: string;
  roll_number?: string;
  batch_label?: string;
  requested_from?: string;
  requested_to?: string;
  status: string;
  created_at: string;
  approved_at?: string;
  issued_at?: string;
  returned_at?: string;
  items: { material_name: string; quantity: number }[];
};

function formatDate(value?: string) {
  if (!value) return "-";
  const d = new Date(value);
  if (Number.isNaN(d.getTime())) return value;
  return d.toLocaleString();
}

export default function LagVerificationSection() {
  const { listRequests, issueRequest, returnRequest } = useLag();
  const [approved, setApproved] = useState<LagRequest[]>([]);
  const [issued, setIssued] = useState<LagRequest[]>([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const loadData = async () => {
    setLoading(true);
    setError(null);
    try {
      const [approvedData, issuedData] = await Promise.all([
        listRequests({ status: "APPROVED" }),
        listRequests({ status: "ISSUED" }),
      ]);
      setApproved(approvedData);
      setIssued(issuedData);
    } catch (e) {
      setError("Failed to load LAG requests");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadData();
  }, []);

  const handleIssue = async (id: string) => {
    setError(null);
    try {
      await issueRequest(id);
      await loadData();
    } catch (e) {
      setError("Failed to mark as issued");
    }
  };

  const handleReturn = async (id: string) => {
    setError(null);
    try {
      await returnRequest(id);
      await loadData();
    } catch (e) {
      setError("Failed to mark as returned");
    }
  };

  return (
    <div className="max-w-6xl mx-auto animate-fade-in">
      <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-4 mb-6">
        <div>
          <h1 className="text-2xl md:text-3xl font-bold">LAG Verification</h1>
          <p className="text-gray-400 text-sm mt-1">
            Verify issued and returned materials.
          </p>
        </div>
        <button
          onClick={loadData}
          className="bg-white/5 hover:bg-white/10 border border-white/10 px-4 py-2 rounded-lg"
        >
          Refresh
        </button>
      </div>

      {error && (
        <div className="mb-4 text-red-400 bg-red-500/10 border border-red-500/20 rounded-lg p-4">
          {error}
        </div>
      )}

      <div className="grid lg:grid-cols-2 gap-6">
        <div className="bg-gray-900 border border-gray-800 rounded-lg p-6">
          <h2 className="text-xl font-semibold">Approved requests</h2>
          <div className="mt-4 space-y-4">
            {approved.length === 0 && (
              <div className="text-sm text-gray-400">No approved requests.</div>
            )}
            {approved.map((r) => (
              <div
                key={r.id}
                className="bg-gray-950 border border-gray-800 rounded-lg p-4"
              >
                <div className="flex items-start justify-between gap-3">
                  <div>
                    <div className="font-semibold">
                      {r.requester_name || "Student"}
                    </div>
                    <div className="text-xs text-gray-400">
                      {r.batch_label || r.roll_number || "-"}
                    </div>
                    <div className="text-xs text-gray-500">
                      Approved: {formatDate(r.approved_at)}
                    </div>
                    <div className="text-xs text-gray-500">
                      Duration: {formatDate(r.requested_from)} →{" "}
                      {formatDate(r.requested_to)}
                    </div>
                  </div>
                  <div className="text-xs text-gray-400">{r.status}</div>
                </div>
                <div className="mt-2 text-sm text-gray-300">
                  {r.items.map((i, idx) => (
                    <div key={idx}>
                      {i.material_name} x{i.quantity}
                    </div>
                  ))}
                </div>
                <button
                  onClick={() => handleIssue(r.id)}
                  className="mt-3 bg-cyan-500/20 hover:bg-cyan-500/30 border border-cyan-400/40 text-cyan-100 px-3 py-1.5 rounded-lg text-sm"
                >
                  Mark Issued
                </button>
              </div>
            ))}
          </div>
        </div>

        <div className="bg-gray-900 border border-gray-800 rounded-lg p-6">
          <h2 className="text-xl font-semibold">Issued requests</h2>
          <div className="mt-4 space-y-4">
            {issued.length === 0 && (
              <div className="text-sm text-gray-400">No issued requests.</div>
            )}
            {issued.map((r) => (
              <div
                key={r.id}
                className="bg-gray-950 border border-gray-800 rounded-lg p-4"
              >
                <div className="flex items-start justify-between gap-3">
                  <div>
                    <div className="font-semibold">
                      {r.requester_name || "Student"}
                    </div>
                    <div className="text-xs text-gray-400">
                      {r.batch_label || r.roll_number || "-"}
                    </div>
                    <div className="text-xs text-gray-500">
                      Issued: {formatDate(r.issued_at)}
                    </div>
                    <div className="text-xs text-gray-500">
                      Duration: {formatDate(r.requested_from)} →{" "}
                      {formatDate(r.requested_to)}
                    </div>
                  </div>
                  <div className="text-xs text-gray-400">{r.status}</div>
                </div>
                <div className="mt-2 text-sm text-gray-300">
                  {r.items.map((i, idx) => (
                    <div key={idx}>
                      {i.material_name} x{i.quantity}
                    </div>
                  ))}
                </div>
                <button
                  onClick={() => handleReturn(r.id)}
                  className="mt-3 bg-green-600/20 hover:bg-green-600/30 border border-green-500/30 px-3 py-1.5 rounded-lg text-sm"
                >
                  Mark Returned
                </button>
              </div>
            ))}
          </div>
        </div>
      </div>

      {loading && (
        <div className="mt-6 text-gray-400 text-sm">Loading...</div>
      )}
    </div>
  );
}
