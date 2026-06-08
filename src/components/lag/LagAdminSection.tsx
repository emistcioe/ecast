import { useEffect, useRef, useState } from "react";
import { createPortal } from "react-dom";
import { useLag } from "@/lib/hooks/lag";

type Material = {
  id: string;
  name: string;
  description: string;
  total_quantity: number;
  available?: number | null;
  max_concurrent_loans: number;
  image_url?: string | null;
  is_active: boolean;
};

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
    listMaterials,
    createMaterial,
    updateMaterial,
    deleteMaterial,
    listRequests,
    approveRequest,
    rejectRequest,
  } = useLag();
  const [materials, setMaterials] = useState<Material[]>([]);
  const [requests, setRequests] = useState<LagRequest[]>([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const [dialogOpen, setDialogOpen] = useState(false);
  const [editingId, setEditingId] = useState<string | null>(null);
  const [name, setName] = useState("");
  const [description, setDescription] = useState("");
  const [totalQuantity, setTotalQuantity] = useState(1);
  const [availableQty, setAvailableQty] = useState<string>("");
  const [maxConcurrent, setMaxConcurrent] = useState(1);
  const [imageFile, setImageFile] = useState<File | null>(null);
  const [isActive, setIsActive] = useState(true);
  const backdropRef = useRef<HTMLDivElement>(null);

  const loadData = async () => {
    setLoading(true);
    setError(null);
    try {
      const [materialsData, requestsData] = await Promise.all([
        listMaterials(undefined, true),
        listRequests({ status: "PENDING" }),
      ]);
      setMaterials(materialsData);
      setRequests(requestsData);
    } catch (e) {
      setError("Failed to load LAG data");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadData();
  }, []);

  const resetForm = () => {
    setEditingId(null);
    setName("");
    setDescription("");
    setTotalQuantity(1);
    setAvailableQty("");
    setMaxConcurrent(1);
    setImageFile(null);
    setIsActive(true);
    setDialogOpen(false);
  };

  const openAdd = () => {
    resetForm();
    setDialogOpen(true);
  };

  const startEdit = (m: Material) => {
    setEditingId(m.id);
    setName(m.name);
    setDescription(m.description || "");
    setTotalQuantity(m.total_quantity);
    setAvailableQty(m.available != null ? String(m.available) : "");
    setMaxConcurrent(m.max_concurrent_loans);
    setImageFile(null);
    setIsActive(m.is_active);
    setDialogOpen(true);
  };

  const submitMaterial = async () => {
    setError(null);
    const form = new FormData();
    form.append("name", name);
    form.append("description", description);
    form.append("total_quantity", String(totalQuantity));
    form.append("max_concurrent_loans", String(maxConcurrent));
    form.append("is_active", String(isActive));
    if (availableQty !== "") {
      form.append("available", availableQty);
    }
    if (imageFile) form.append("image", imageFile);

    try {
      if (editingId) {
        await updateMaterial(editingId, form);
      } else {
        await createMaterial(form);
      }
      resetForm();
      await loadData();
    } catch (e) {
      setError("Failed to save material");
    }
  };

  const handleDelete = async (id: string) => {
    if (!confirm("Delete this material?")) return;
    setError(null);
    try {
      await deleteMaterial(id);
      await loadData();
    } catch (e) {
      setError("Failed to delete material");
    }
  };

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
          <h1 className="text-2xl md:text-3xl font-bold">LAG Admin</h1>
          <p className="text-gray-400 text-sm mt-1">
            Manage inventory and approve lending requests.
          </p>
        </div>
        <div className="flex gap-3">
          <button
            onClick={openAdd}
            className="bg-cyan-500/20 hover:bg-cyan-500/30 border border-cyan-400/40 text-cyan-100 font-semibold px-4 py-2 rounded-lg"
          >
            + Add material
          </button>
          <button
            onClick={loadData}
            className="bg-white/5 hover:bg-white/10 border border-white/10 px-4 py-2 rounded-lg"
          >
            Refresh
          </button>
        </div>
      </div>

      {error && (
        <div className="mb-4 text-red-400 bg-red-500/10 border border-red-500/20 rounded-lg p-4">
          {error}
        </div>
      )}

      {/* Material dialog */}
      {dialogOpen && createPortal(
        <div
          ref={backdropRef}
          onClick={(e) => {
            if (e.target === backdropRef.current) resetForm();
          }}
          className="fixed inset-0 z-[9999] flex items-center justify-center bg-black/60 backdrop-blur-sm"
        >
          <div className="bg-gray-900 border border-gray-700 rounded-xl shadow-2xl w-full max-w-lg mx-4 p-6 animate-fade-in">
            <div className="flex items-center justify-between mb-5">
              <h2 className="text-xl font-semibold">
                {editingId ? "Edit material" : "Add material"}
              </h2>
              <button
                onClick={resetForm}
                className="text-gray-400 hover:text-white text-xl leading-none px-2"
              >
                x
              </button>
            </div>
            <div className="grid gap-4">
              <div>
                <label className="block text-xs text-gray-400 mb-1">Name</label>
                <input
                  className="w-full bg-gray-950/70 border border-gray-800 rounded-lg px-4 py-2"
                  placeholder="Material name"
                  value={name}
                  onChange={(e) => setName(e.target.value)}
                />
              </div>
              <div>
                <label className="block text-xs text-gray-400 mb-1">Description</label>
                <textarea
                  className="w-full bg-gray-950/70 border border-gray-800 rounded-lg px-4 py-2"
                  placeholder="Description"
                  rows={3}
                  value={description}
                  onChange={(e) => setDescription(e.target.value)}
                />
              </div>
              <div className="grid grid-cols-3 gap-3">
                <div>
                  <label className="block text-xs text-gray-400 mb-1">Total qty</label>
                  <input
                    type="number"
                    min={1}
                    className="w-full bg-gray-950/70 border border-gray-800 rounded-lg px-4 py-2"
                    value={totalQuantity}
                    onChange={(e) => setTotalQuantity(Number(e.target.value))}
                  />
                </div>
                <div>
                  <label className="block text-xs text-gray-400 mb-1">Available</label>
                  <input
                    type="number"
                    min={0}
                    max={totalQuantity}
                    className="w-full bg-gray-950/70 border border-gray-800 rounded-lg px-4 py-2"
                    placeholder="All"
                    value={availableQty}
                    onChange={(e) => setAvailableQty(e.target.value)}
                  />
                </div>
                <div>
                  <label className="block text-xs text-gray-400 mb-1">Max loans</label>
                  <input
                    type="number"
                    min={1}
                    className="w-full bg-gray-950/70 border border-gray-800 rounded-lg px-4 py-2"
                    value={maxConcurrent}
                    onChange={(e) => setMaxConcurrent(Number(e.target.value))}
                  />
                </div>
              </div>
              <p className="text-xs text-gray-500 -mt-2">
                Available limits how many can be lent out. Leave blank to use total quantity.
              </p>
              <div className="flex items-center gap-3">
                <input
                  type="checkbox"
                  checked={isActive}
                  onChange={(e) => setIsActive(e.target.checked)}
                />
                <span className="text-sm text-gray-300">Active</span>
              </div>
              <input
                type="file"
                accept="image/*"
                onChange={(e) => setImageFile(e.target.files?.[0] || null)}
                className="text-sm text-gray-400"
              />
              <div className="flex gap-3 pt-2">
                <button
                  onClick={submitMaterial}
                  disabled={loading}
                  className="flex-1 bg-cyan-500/20 hover:bg-cyan-500/30 border border-cyan-400/40 text-cyan-100 font-semibold px-4 py-2 rounded-lg"
                >
                  {editingId ? "Update" : "Create"}
                </button>
                <button
                  onClick={resetForm}
                  className="flex-1 bg-white/5 hover:bg-white/10 border border-white/10 px-4 py-2 rounded-lg"
                >
                  Cancel
                </button>
              </div>
            </div>
          </div>
        </div>,
        document.body
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

      <div className="mt-8 bg-gray-900 border border-gray-800 rounded-lg p-6">
        <h2 className="text-xl font-semibold">Inventory</h2>
        <div className="mt-4 grid md:grid-cols-2 gap-4">
          {materials.map((m) => (
            <div
              key={m.id}
              className="bg-gray-950 border border-gray-800 rounded-lg p-4 flex gap-4"
            >
              <div className="w-20 h-20 bg-gray-900 rounded-lg overflow-hidden flex items-center justify-center">
                {m.image_url ? (
                  // eslint-disable-next-line @next/next/no-img-element
                  <img
                    src={m.image_url}
                    alt={m.name}
                    className="w-full h-full object-cover"
                  />
                ) : (
                  <div className="text-xs text-gray-600">No image</div>
                )}
              </div>
              <div className="flex-1">
                <div className="flex items-start justify-between gap-3">
                  <div>
                    <div className="font-semibold">{m.name}</div>
                    <div className="text-xs text-gray-500">
                      Total {m.total_quantity}
                      {m.available != null && ` | Available ${m.available}`}
                      {" "}| Max {m.max_concurrent_loans}
                    </div>
                  </div>
                  <span
                    className={`text-xs px-2 py-1 rounded-full border ${
                      m.is_active
                        ? "text-cyan-200 bg-cyan-500/10 border-cyan-500/20"
                        : "text-gray-400 bg-white/5 border-white/10"
                    }`}
                  >
                    {m.is_active ? "Active" : "Inactive"}
                  </span>
                </div>
                <div className="mt-2 flex gap-2">
                  <button
                    onClick={() => startEdit(m)}
                    className="text-xs bg-white/5 hover:bg-white/10 border border-white/10 px-2 py-1 rounded"
                  >
                    Edit
                  </button>
                  <button
                    onClick={() => handleDelete(m.id)}
                    className="text-xs bg-red-600/20 hover:bg-red-600/30 border border-red-500/30 px-2 py-1 rounded"
                  >
                    Delete
                  </button>
                </div>
              </div>
            </div>
          ))}
          {materials.length === 0 && (
            <div className="text-sm text-gray-400">No materials yet.</div>
          )}
        </div>
      </div>
    </div>
  );
}
