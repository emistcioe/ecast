import { useEffect, useState } from "react";
import { useLag } from "@/lib/hooks/lag";

type LagRequest = {
  id: string;
  requester_email: string;
  requester_name?: string;
  phone_number?: string;
  roll_number?: string;
  requested_from?: string;
  requested_to?: string;
  batch_label?: string;
  status: string;
  created_at: string;
  items: { material_name: string; quantity: number }[];
};

function formatDate(value?: string) {
  if (!value) return "-";
  const d = new Date(value);
  if (Number.isNaN(d.getTime())) return value;
  return d.toLocaleString();
}

export default function LagAdminSection() {
  const {
    listRequests,
    approveRequest,
    rejectRequest,
  } = useLag();
  const [requests, setRequests] = useState<LagRequest[]>([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const loadData = async () => {
    setLoading(true);
    setError(null);
    try {
      const data = await listRequests({ status: "PENDING" });
      setRequests(data);
    } catch (e) {
      setError("Failed to load requests");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadData();
  }, []);

  const handleApprove = async (id: string) => {
    setError(null);
    try {
      await approveRequest(id);
      await loadData();
    } catch (e) {
      setError("Failed to approve request");
    }
  };

  const handleReject = async (id: string) => {
    setError(null);
    try {
      await rejectRequest(id);
      await loadData();
    } catch (e) {
      setError("Failed to reject request");
    }
  };

  return (
    <div className="max-w-6xl mx-auto animate-fade-in">
      <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-4 mb-6">
        <div>
          <h1 className="text-2xl md:text-3xl font-bold text-teal-50">
            LAG Approvals
          </h1>
          <p className="text-gray-400 text-sm mt-1">
            Review and approve lending requests.
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

      <div className="bg-gray-900 border border-gray-800 rounded-lg p-6">
        <h2 className="text-xl font-semibold">Pending approvals</h2>
        <div className="mt-4 space-y-4">
          {requests.length === 0 && (
            <div className="text-sm text-gray-400">
              No pending requests.
            </div>
          )}
          {requests.map((r) => (
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
                    Requested: {formatDate(r.created_at)}
                  </div>
                  <div className="text-xs text-gray-500">
                    Duration: {formatDate(r.requested_from)} →{" "}
                    {formatDate(r.requested_to)}
                  </div>
                  <div className="text-xs text-gray-500">
                    Email: {r.requester_email}
                  </div>
                  <div className="text-xs text-gray-500">
                    Phone: {r.phone_number || "-"}
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
              <div className="mt-3 flex gap-2">
                <button
                  onClick={() => handleApprove(r.id)}
                  className="bg-green-600/20 hover:bg-green-600/30 border border-green-500/30 px-3 py-1.5 rounded-lg text-sm"
                >
                  Approve
                </button>
                <button
                  onClick={() => handleReject(r.id)}
                  className="bg-red-600/20 hover:bg-red-600/30 border border-red-500/30 px-3 py-1.5 rounded-lg text-sm"
                >
                  Reject
                </button>
              </div>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}
