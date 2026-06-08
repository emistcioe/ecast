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
  active_loaned?: number;
  available_quantity?: number;
};

export default function LagInventorySection() {
  const {
    listMaterials,
    createMaterial,
    updateMaterial,
    deleteMaterial,
  } = useLag();
  const [materials, setMaterials] = useState<Material[]>([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const [dialogOpen, setDialogOpen] = useState(false);
  const [editingId, setEditingId] = useState<string | null>(null);
  const [editingImageUrl, setEditingImageUrl] = useState<string | null>(null);
  const [name, setName] = useState("");
  const [description, setDescription] = useState("");
  const [totalQuantity, setTotalQuantity] = useState(1);
  const [availableQty, setAvailableQty] = useState<string>("");
  const [maxConcurrent, setMaxConcurrent] = useState(1);
  const [imageFile, setImageFile] = useState<File | null>(null);
  const [isActive, setIsActive] = useState(true);
  const backdropRef = useRef<HTMLDivElement>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);

  const loadData = async () => {
    setLoading(true);
    setError(null);
    try {
      const data = await listMaterials(undefined, true);
      setMaterials(data);
    } catch (e) {
      setError("Failed to load materials");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadData();
  }, []);

  const resetForm = () => {
    setEditingId(null);
    setEditingImageUrl(null);
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
    setEditingImageUrl(m.image_url || null);
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

  const imagePreview = imageFile
    ? URL.createObjectURL(imageFile)
    : editingImageUrl;

  return (
    <div className="max-w-6xl mx-auto animate-fade-in">
      <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-4 mb-6">
        <div>
          <h1 className="text-2xl md:text-3xl font-bold text-teal-50">
            LAG Inventory
          </h1>
          <p className="text-gray-400 text-sm mt-1">
            Add, edit, and manage lending materials.
          </p>
        </div>
        <div className="flex gap-3">
          <button
            onClick={openAdd}
            className="bg-teal-500/20 hover:bg-teal-500/30 border border-teal-400/40 text-teal-100 font-semibold px-4 py-2 rounded-lg"
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
      {dialogOpen &&
        createPortal(
          <div
            ref={backdropRef}
            onClick={(e) => {
              if (e.target === backdropRef.current) resetForm();
            }}
            className="fixed inset-0 z-[9999] flex items-center justify-center bg-black/60 backdrop-blur-sm"
          >
            <div className="bg-gray-900 border border-gray-700 rounded-xl shadow-2xl w-full max-w-lg mx-4 p-6 max-h-[90vh] overflow-y-auto">
              <div className="flex items-center justify-between mb-5">
                <h2 className="text-xl font-semibold text-white">
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
                  <label className="block text-xs text-gray-400 mb-1">
                    Name
                  </label>
                  <input
                    className="w-full bg-gray-950 border border-gray-700 rounded-lg px-4 py-2 text-white placeholder-gray-500 focus:border-teal-500 focus:outline-none"
                    placeholder="Material name"
                    value={name}
                    onChange={(e) => setName(e.target.value)}
                  />
                </div>
                <div>
                  <label className="block text-xs text-gray-400 mb-1">
                    Description
                  </label>
                  <textarea
                    className="w-full bg-gray-950 border border-gray-700 rounded-lg px-4 py-2 text-white placeholder-gray-500 focus:border-teal-500 focus:outline-none"
                    placeholder="Description"
                    rows={3}
                    value={description}
                    onChange={(e) => setDescription(e.target.value)}
                  />
                </div>
                <div className="grid grid-cols-3 gap-3">
                  <div>
                    <label className="block text-xs text-gray-400 mb-1">
                      Total qty
                    </label>
                    <input
                      type="number"
                      min={1}
                      className="w-full bg-gray-950 border border-gray-700 rounded-lg px-4 py-2 text-white focus:border-teal-500 focus:outline-none"
                      value={totalQuantity}
                      onChange={(e) =>
                        setTotalQuantity(Number(e.target.value))
                      }
                    />
                  </div>
                  <div>
                    <label className="block text-xs text-gray-400 mb-1">
                      Available
                    </label>
                    <input
                      type="number"
                      min={0}
                      max={totalQuantity}
                      className="w-full bg-gray-950 border border-gray-700 rounded-lg px-4 py-2 text-white placeholder-gray-500 focus:border-teal-500 focus:outline-none"
                      placeholder="All"
                      value={availableQty}
                      onChange={(e) => setAvailableQty(e.target.value)}
                    />
                  </div>
                  <div>
                    <label className="block text-xs text-gray-400 mb-1">
                      Max loans
                    </label>
                    <input
                      type="number"
                      min={1}
                      className="w-full bg-gray-950 border border-gray-700 rounded-lg px-4 py-2 text-white focus:border-teal-500 focus:outline-none"
                      value={maxConcurrent}
                      onChange={(e) =>
                        setMaxConcurrent(Number(e.target.value))
                      }
                    />
                  </div>
                </div>
                <p className="text-xs text-gray-500 -mt-2">
                  Available limits how many can be lent out. Leave blank to use
                  total quantity.
                </p>
                <div className="flex items-center gap-3">
                  <input
                    type="checkbox"
                    checked={isActive}
                    onChange={(e) => setIsActive(e.target.checked)}
                    className="accent-teal-500"
                  />
                  <span className="text-sm text-gray-300">Active</span>
                </div>

                {/* Image section */}
                <div>
                  <label className="block text-xs text-gray-400 mb-2">
                    Image
                  </label>
                  {imagePreview && (
                    <div className="mb-3 w-28 h-28 rounded-lg overflow-hidden border border-gray-700 bg-gray-950">
                      {/* eslint-disable-next-line @next/next/no-img-element */}
                      <img
                        src={imagePreview}
                        alt="Preview"
                        className="w-full h-full object-cover"
                      />
                    </div>
                  )}
                  <input
                    ref={fileInputRef}
                    type="file"
                    accept="image/*"
                    onChange={(e) =>
                      setImageFile(e.target.files?.[0] || null)
                    }
                    className="hidden"
                  />
                  <button
                    type="button"
                    onClick={() => fileInputRef.current?.click()}
                    className="bg-white/5 hover:bg-white/10 border border-gray-700 text-gray-300 text-sm px-4 py-2 rounded-lg"
                  >
                    {imageFile
                      ? imageFile.name
                      : editingImageUrl
                        ? "Change image"
                        : "Choose image"}
                  </button>
                </div>

                <div className="flex gap-3 pt-2">
                  <button
                    onClick={submitMaterial}
                    disabled={loading}
                    className="flex-1 bg-teal-600 hover:bg-teal-700 text-white font-semibold px-4 py-2 rounded-lg disabled:opacity-50"
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

      <div className="grid md:grid-cols-2 gap-4">
        {materials.map((m) => (
          <div
            key={m.id}
            className="bg-gray-900 border border-gray-800 rounded-lg p-4 flex gap-4"
          >
            <div className="w-20 h-20 bg-gray-950 rounded-lg overflow-hidden flex items-center justify-center flex-shrink-0">
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
            <div className="flex-1 min-w-0">
              <div className="flex items-start justify-between gap-3">
                <div className="min-w-0">
                  <div className="font-semibold truncate">{m.name}</div>
                  <div className="text-xs text-gray-500">
                    Total {m.total_quantity}
                    {m.available_quantity != null && ` | Available ${m.available_quantity}`} | Max{" "}
                    {m.max_concurrent_loans}
                  </div>
                </div>
                <span
                  className={`text-xs px-2 py-1 rounded-full border flex-shrink-0 ${
                    m.is_active
                      ? "text-teal-200 bg-teal-500/10 border-teal-500/20"
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
  );
}
