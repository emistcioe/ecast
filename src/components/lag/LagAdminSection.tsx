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
          <h1 className="text-2xl md:text-3xl font-bold text-white tracking-tight">
            LAG Approvals
          </h1>
          <p className="text-gray-400 text-sm mt-1">
            Review and approve lending requests.
          </p>
        </div>
        <button
          onClick={loadData}
          disabled={loading}
          className="inline-flex items-center gap-2 bg-gray-800 hover:bg-gray-700 border border-gray-700 px-4 py-2 rounded-lg text-sm font-medium transition disabled:opacity-50"
        >
          <svg className={`w-4 h-4 ${loading ? "animate-spin" : ""}`} fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}><path strokeLinecap="round" strokeLinejoin="round" d="M16.023 9.348h4.992v-.001M2.985 19.644v-4.992m0 0h4.992m-4.993 0l3.181 3.183a8.25 8.25 0 0013.803-3.7M4.031 9.865a8.25 8.25 0 0113.803-3.7l3.181 3.182M2.985 19.644l3.181-3.183" /></svg>
          {loading ? "Loading..." : "Refresh"}
        </button>
      </div>

      {error && (
        <div className="mb-4 flex items-start gap-3 text-red-300 bg-red-500/8 border border-red-500/15 rounded-xl px-4 py-3">
          <svg className="w-5 h-5 mt-0.5 shrink-0" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}><path strokeLinecap="round" strokeLinejoin="round" d="M12 9v3.75m9-.75a9 9 0 11-18 0 9 9 0 0118 0zm-9 3.75h.008v.008H12v-.008z" /></svg>
          <span className="text-sm">{error}</span>
        </div>
      )}

      {requests.length === 0 && !loading && (
        <div className="bg-gray-900/80 border border-gray-800 rounded-2xl p-12 text-center">
          <div className="w-14 h-14 bg-gray-800 rounded-full flex items-center justify-center mx-auto mb-4">
            <svg className="w-7 h-7 text-gray-500" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.5}><path strokeLinecap="round" strokeLinejoin="round" d="M9 12.75L11.25 15 15 9.75M21 12a9 9 0 11-18 0 9 9 0 0118 0z" /></svg>
          </div>
          <p className="text-gray-400 font-medium">All clear</p>
          <p className="text-gray-500 text-sm mt-1">No pending requests right now.</p>
        </div>
      )}

      {requests.length > 0 && (
        <div className="space-y-3">
          <div className="flex items-center justify-between px-1">
            <h2 className="text-sm font-medium text-gray-400 uppercase tracking-wider">
              Pending ({requests.length})
            </h2>
          </div>

          {requests.map((r) => (
            <div
              key={r.id}
              className="bg-gray-900/80 border border-gray-800 rounded-xl overflow-hidden"
            >
              <div className="p-5">
                <div className="flex items-start justify-between gap-4">
                  {/* Left: requester info */}
                  <div className="flex items-start gap-3.5 min-w-0">
                    <div className="w-10 h-10 rounded-full bg-teal-600/15 flex items-center justify-center shrink-0 mt-0.5">
                      <span className="text-teal-300 font-semibold text-sm">
                        {(r.requester_name || "S")[0].toUpperCase()}
                      </span>
                    </div>
                    <div className="min-w-0">
                      <h3 className="font-semibold text-white truncate">
                        {r.requester_name || "Student"}
                      </h3>
                      <div className="flex flex-wrap items-center gap-x-3 gap-y-0.5 mt-0.5 text-xs text-gray-400">
                        {r.batch_label || r.roll_number ? (
                          <span>{r.batch_label || r.roll_number}</span>
                        ) : null}
                        <span>{r.requester_email}</span>
                        {r.phone_number && <span>{r.phone_number}</span>}
                      </div>
                    </div>
                  </div>

                  {/* Right: status badge */}
                  <span className="text-[10px] font-semibold uppercase tracking-wider px-2 py-1 rounded-md bg-amber-500/10 text-amber-400 border border-amber-500/20 shrink-0">
                    {r.status}
                  </span>
                </div>

                {/* Duration */}
                <div className="mt-3 flex items-center gap-2 text-xs text-gray-400">
                  <svg className="w-3.5 h-3.5 text-gray-500" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}><path strokeLinecap="round" strokeLinejoin="round" d="M6.75 3v2.25M17.25 3v2.25M3 18.75V7.5a2.25 2.25 0 012.25-2.25h13.5A2.25 2.25 0 0121 7.5v11.25m-18 0A2.25 2.25 0 005.25 21h13.5A2.25 2.25 0 0021 18.75m-18 0v-7.5A2.25 2.25 0 015.25 9h13.5A2.25 2.25 0 0121 11.25v7.5" /></svg>
                  <span>{formatDate(r.requested_from)}</span>
                  <svg className="w-3 h-3 text-gray-600" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}><path strokeLinecap="round" strokeLinejoin="round" d="M13.5 4.5L21 12m0 0l-7.5 7.5M21 12H3" /></svg>
                  <span>{formatDate(r.requested_to)}</span>
                </div>

                {/* Items */}
                <div className="mt-3 flex flex-wrap gap-2">
                  {r.items.map((item, idx) => (
                    <span
                      key={idx}
                      className="inline-flex items-center gap-1.5 text-xs bg-gray-950 border border-gray-800 rounded-lg px-2.5 py-1.5"
                    >
                      <span className="text-gray-300">{item.material_name}</span>
                      <span className="text-white font-semibold">x{item.quantity}</span>
                    </span>
                  ))}
                </div>

                <div className="text-[10px] text-gray-600 mt-3">
                  Requested {formatDate(r.created_at)}
                </div>
              </div>

              {/* Action bar */}
              <div className="flex border-t border-gray-800">
                <button
                  onClick={() => handleApprove(r.id)}
                  className="flex-1 flex items-center justify-center gap-2 px-4 py-3 text-sm font-medium text-green-400 hover:bg-green-500/8 transition"
                >
                  <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}><path strokeLinecap="round" strokeLinejoin="round" d="M4.5 12.75l6 6 9-13.5" /></svg>
                  Approve
                </button>
                <div className="w-px bg-gray-800" />
                <button
                  onClick={() => handleReject(r.id)}
                  className="flex-1 flex items-center justify-center gap-2 px-4 py-3 text-sm font-medium text-red-400 hover:bg-red-500/8 transition"
                >
                  <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}><path strokeLinecap="round" strokeLinejoin="round" d="M6 18L18 6M6 6l12 12" /></svg>
                  Reject
                </button>
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
