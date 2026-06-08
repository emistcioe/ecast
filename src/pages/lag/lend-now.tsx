import { useEffect, useMemo, useState } from "react";
import Head from "next/head";
import NavBar from "@/components/nav";
import Footer from "@/components/footar";
import { useLag } from "@/lib/hooks/lag";

type Material = {
  id: string;
  name: string;
  description: string;
  total_quantity: number;
  available?: number | null;
  max_concurrent_loans: number;
  image_url?: string | null;
  active_loaned?: number;
  available_quantity?: number;
};

type Step = "email" | "otp" | "cart" | "done";

export default function LagLendNowPage() {
  const { listMaterials, requestOtp, verifyOtp, createRequest } = useLag();
  const [step, setStep] = useState<Step>("email");
  const [email, setEmail] = useState("");
  const [otp, setOtp] = useState("");
  const [token, setToken] = useState<string | null>(null);
  const [materials, setMaterials] = useState<Material[]>([]);
  const [cart, setCart] = useState<Record<string, number>>({});
  const [notes, setNotes] = useState("");
  const [requesterName, setRequesterName] = useState("");
  const [phoneNumber, setPhoneNumber] = useState("");
  const [rollNumber, setRollNumber] = useState("");
  const [requestedFrom, setRequestedFrom] = useState("");
  const [requestedTo, setRequestedTo] = useState("");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState<any>(null);

  useEffect(() => {
    if (typeof window === "undefined") return;
    const savedToken = localStorage.getItem("lag_token");
    const savedEmail = localStorage.getItem("lag_email");
    if (savedToken && savedEmail) {
      setToken(savedToken);
      setEmail(savedEmail);
      setStep("cart");
    }
  }, []);

  useEffect(() => {
    if (step !== "cart") return;
    let mounted = true;
    listMaterials()
      .then((data) => {
        if (!mounted) return;
        setMaterials(data);
      })
      .catch(() => {
        if (!mounted) return;
        setError("Failed to load materials");
      });
    return () => {
      mounted = false;
    };
  }, [step, listMaterials]);

  const cartItems = useMemo(() => {
    return materials
      .filter((m) => (cart[m.id] || 0) > 0)
      .map((m) => ({ material: m, quantity: cart[m.id] }));
  }, [materials, cart]);

  const handleRequestOtp = async () => {
    setError(null);
    if (!email.endsWith("@tcioe.edu.np")) {
      setError("Email must end with @tcioe.edu.np");
      return;
    }
    setLoading(true);
    try {
      await requestOtp(email);
      setStep("otp");
    } catch (e) {
      setError("Failed to send OTP");
    } finally {
      setLoading(false);
    }
  };

  const handleVerifyOtp = async () => {
    setError(null);
    if (!otp.trim()) {
      setError("OTP is required");
      return;
    }
    setLoading(true);
    try {
      const data = await verifyOtp(email, otp.trim());
      setToken(data.token);
      if (typeof window !== "undefined") {
        localStorage.setItem("lag_token", data.token);
        localStorage.setItem("lag_email", email);
      }
      setStep("cart");
    } catch (e) {
      setError("Invalid OTP");
    } finally {
      setLoading(false);
    }
  };

  const handleAdjustQty = (id: string, delta: number) => {
    setCart((prev) => {
      const next = { ...prev };
      const current = next[id] || 0;
      const material = materials.find((m) => m.id === id);
      const available = material?.available_quantity ?? 0;
      const updated = Math.max(0, Math.min(current + delta, available));
      if (updated === 0) delete next[id];
      else next[id] = updated;
      return next;
    });
  };

  const handleSubmitRequest = async () => {
    setError(null);
    if (!token) {
      setError("OTP verification required");
      return;
    }
    if (!requesterName.trim()) {
      setError("Name is required");
      return;
    }
    if (!phoneNumber.trim()) {
      setError("Phone number is required");
      return;
    }
    if (!rollNumber.trim()) {
      setError("Roll number is required");
      return;
    }
    if (!requestedFrom || !requestedTo) {
      setError("Requested duration is required");
      return;
    }
    const fromDate = new Date(requestedFrom);
    const toDate = new Date(requestedTo);
    if (Number.isNaN(fromDate.getTime()) || Number.isNaN(toDate.getTime())) {
      setError("Invalid requested duration");
      return;
    }
    if (fromDate >= toDate) {
      setError("End time must be after start time");
      return;
    }
    if (cartItems.length === 0) {
      setError("Please add items to cart");
      return;
    }
    setLoading(true);
    try {
      const payload = {
        requester_name: requesterName.trim(),
        phone_number: phoneNumber.trim(),
        roll_number: rollNumber.trim(),
        requested_from: requestedFrom,
        requested_to: requestedTo,
        items: cartItems.map((c) => ({
          material_id: c.material.id,
          quantity: c.quantity,
        })),
        notes: notes.trim(),
      };
      const data = await createRequest(token, payload);
      setSuccess(data);
      setCart({});
      setNotes("");
      setRequesterName("");
      setPhoneNumber("");
      setRollNumber("");
      setRequestedFrom("");
      setRequestedTo("");
      setStep("done");
    } catch (e) {
      setError("Failed to submit request");
    } finally {
      setLoading(false);
    }
  };

  return (
    <>
      <Head>
        <title>LAG Lend Now</title>
      </Head>
      <NavBar />
      <main className="min-h-screen bg-gray-950 text-white pt-24">
        <section className="max-w-6xl mx-auto px-4 md:px-6 pb-16">
          <div className="flex items-center justify-between flex-wrap gap-4">
            <div>
              <h1 className="text-3xl md:text-4xl font-bold">Lend Now</h1>
              <p className="text-gray-400 mt-2">
                Verify your email and request materials.
              </p>
            </div>
            <div className="text-xs text-gray-400">
              Step {step === "email" ? 1 : step === "otp" ? 2 : step === "cart" ? 3 : 4} of 4
            </div>
          </div>

          {error && (
            <div className="mt-6 text-red-400 bg-red-500/10 border border-red-500/20 rounded-lg p-4">
              {error}
            </div>
          )}

          {step === "email" && (
            <div className="mt-8 grid md:grid-cols-2 gap-6">
              <div className="bg-gray-900 border border-gray-800 rounded-lg p-6">
                <h2 className="text-xl font-semibold">Enter your email</h2>
                <p className="text-gray-400 text-sm mt-2">
                  We will send a one-time code to your college email.
                </p>
                <div className="mt-4">
                  <input
                    type="email"
                    value={email}
                    onChange={(e) => setEmail(e.target.value)}
                    placeholder="name@tcioe.edu.np"
                    className="w-full bg-gray-950/70 border border-gray-800 rounded-lg px-4 py-3 text-white focus:outline-none focus:ring-2 focus:ring-cyan-500/40"
                  />
                </div>
                <button
                  onClick={handleRequestOtp}
                  disabled={loading}
                  className="mt-4 w-full bg-cyan-500/20 hover:bg-cyan-500/30 border border-cyan-400/40 text-cyan-100 font-semibold px-4 py-3 rounded-lg transition"
                >
                  {loading ? "Sending..." : "Send OTP"}
                </button>
              </div>
              <div className="bg-gray-900 border border-gray-800 rounded-lg p-6">
                <h3 className="text-lg font-semibold">Why OTP?</h3>
                <p className="text-gray-400 text-sm mt-2">
                  We verify every request with your official college email to keep
                  lending fair and secure.
                </p>
              </div>
            </div>
          )}

          {step === "otp" && (
            <div className="mt-8 grid md:grid-cols-2 gap-6">
              <div className="bg-gray-900 border border-gray-800 rounded-lg p-6">
                <h2 className="text-xl font-semibold">Enter OTP</h2>
                <p className="text-gray-400 text-sm mt-2">
                  Check {email} for your verification code.
                </p>
                <div className="mt-4">
                  <input
                    type="text"
                    value={otp}
                    onChange={(e) => setOtp(e.target.value)}
                    placeholder="6-digit code"
                    className="w-full bg-gray-950/70 border border-gray-800 rounded-lg px-4 py-3 text-white focus:outline-none focus:ring-2 focus:ring-cyan-500/40"
                  />
                </div>
                <div className="mt-4 flex gap-3">
                  <button
                    onClick={handleVerifyOtp}
                    disabled={loading}
                    className="flex-1 bg-cyan-500/20 hover:bg-cyan-500/30 border border-cyan-400/40 text-cyan-100 font-semibold px-4 py-3 rounded-lg transition"
                  >
                    {loading ? "Verifying..." : "Verify"}
                  </button>
                  <button
                    onClick={() => setStep("email")}
                    className="flex-1 bg-white/5 hover:bg-white/10 border border-white/10 text-white font-semibold px-4 py-3 rounded-lg transition"
                  >
                    Change Email
                  </button>
                </div>
              </div>
              <div className="bg-gray-900 border border-gray-800 rounded-lg p-6">
                <h3 className="text-lg font-semibold">Need a new code?</h3>
                <p className="text-gray-400 text-sm mt-2">
                  Wait a minute and request OTP again if needed.
                </p>
              </div>
            </div>
          )}

          {step === "cart" && (
            <div className="mt-8 grid lg:grid-cols-3 gap-6">
              <div className="lg:col-span-2 bg-gray-900 border border-gray-800 rounded-lg p-6">
                <h2 className="text-xl font-semibold">Choose materials</h2>
                <p className="text-gray-400 text-sm mt-2">
                  Add items to your cart. Availability is limited.
                </p>
                <div className="mt-4 space-y-4">
                  {materials.length === 0 && (
                    <div className="text-gray-400">No materials available.</div>
                  )}
                  {materials.map((m) => {
                    const available = m.available_quantity ?? 0;
                    const qty = cart[m.id] || 0;
                    return (
                      <div
                        key={m.id}
                        className="flex flex-col sm:flex-row gap-4 bg-gray-950 border border-gray-800 rounded-lg p-4"
                      >
                        <div className="w-full sm:w-32 h-24 bg-gray-900 rounded-lg overflow-hidden flex items-center justify-center">
                          {m.image_url ? (
                            // eslint-disable-next-line @next/next/no-img-element
                            <img
                              src={m.image_url}
                              alt={m.name}
                              className="w-full h-full object-cover"
                            />
                          ) : (
                            <div className="text-gray-600 text-xs">No image</div>
                          )}
                        </div>
                        <div className="flex-1">
                          <div className="flex items-center justify-between gap-3">
                            <h3 className="font-semibold">{m.name}</h3>
                            <span className="text-xs text-cyan-200 bg-cyan-500/10 border border-cyan-500/20 px-2 py-1 rounded-full">
                              Available {available}
                            </span>
                          </div>
                          <p className="text-gray-400 text-sm mt-1 line-clamp-2">
                            {m.description || "No description"}
                          </p>
                          <div className="mt-3 flex items-center gap-2">
                            <button
                              onClick={() => handleAdjustQty(m.id, -1)}
                              className="px-3 py-1 rounded-lg bg-white/5 hover:bg-white/10 border border-white/10"
                            >
                              -
                            </button>
                            <div className="min-w-[40px] text-center font-semibold">
                              {qty}
                            </div>
                            <button
                              onClick={() => handleAdjustQty(m.id, 1)}
                              disabled={available === 0 || qty >= available}
                              className="px-3 py-1 rounded-lg bg-white/5 hover:bg-white/10 border border-white/10 disabled:opacity-40"
                            >
                              +
                            </button>
                          </div>
                        </div>
                      </div>
                    );
                  })}
                </div>
              </div>
              <div className="bg-gray-900 border border-gray-800 rounded-lg p-6">
                <h2 className="text-xl font-semibold">Your cart</h2>
                <div className="mt-4 space-y-3">
                  {cartItems.length === 0 && (
                    <div className="text-gray-400 text-sm">
                      No items selected yet.
                    </div>
                  )}
                  {cartItems.map((c) => (
                    <div
                      key={c.material.id}
                      className="flex items-center justify-between text-sm"
                    >
                      <span>{c.material.name}</span>
                      <span className="text-cyan-200">x{c.quantity}</span>
                    </div>
                  ))}
                </div>
                <div className="mt-6">
                  <div className="grid gap-3">
                    <label className="text-sm text-gray-400">Name</label>
                    <input
                      value={requesterName}
                      onChange={(e) => setRequesterName(e.target.value)}
                      className="w-full bg-gray-950/70 border border-gray-800 rounded-lg px-3 py-2 text-sm text-white focus:outline-none focus:ring-2 focus:ring-cyan-500/40"
                      placeholder="Your full name"
                    />
                    <label className="text-sm text-gray-400">Phone number</label>
                    <input
                      value={phoneNumber}
                      onChange={(e) => setPhoneNumber(e.target.value)}
                      className="w-full bg-gray-950/70 border border-gray-800 rounded-lg px-3 py-2 text-sm text-white focus:outline-none focus:ring-2 focus:ring-cyan-500/40"
                      placeholder="98XXXXXXXX"
                    />
                    <label className="text-sm text-gray-400">Roll number</label>
                    <input
                      value={rollNumber}
                      onChange={(e) => setRollNumber(e.target.value)}
                      className="w-full bg-gray-950/70 border border-gray-800 rounded-lg px-3 py-2 text-sm text-white focus:outline-none focus:ring-2 focus:ring-cyan-500/40"
                      placeholder="THA080BCT"
                    />
                    <div className="grid sm:grid-cols-2 gap-3">
                      <div>
                        <label className="text-sm text-gray-400">From</label>
                        <input
                          type="datetime-local"
                          value={requestedFrom}
                          onChange={(e) => setRequestedFrom(e.target.value)}
                          className="mt-1 w-full bg-gray-950/70 border border-gray-800 rounded-lg px-3 py-2 text-sm text-white focus:outline-none focus:ring-2 focus:ring-cyan-500/40"
                        />
                      </div>
                      <div>
                        <label className="text-sm text-gray-400">To</label>
                        <input
                          type="datetime-local"
                          value={requestedTo}
                          onChange={(e) => setRequestedTo(e.target.value)}
                          className="mt-1 w-full bg-gray-950/70 border border-gray-800 rounded-lg px-3 py-2 text-sm text-white focus:outline-none focus:ring-2 focus:ring-cyan-500/40"
                        />
                      </div>
                    </div>
                  </div>
                </div>
                <div className="mt-4">
                  <label className="text-sm text-gray-400">Notes (optional)</label>
                  <textarea
                    value={notes}
                    onChange={(e) => setNotes(e.target.value)}
                    className="mt-2 w-full bg-gray-950/70 border border-gray-800 rounded-lg px-3 py-2 text-sm text-white focus:outline-none focus:ring-2 focus:ring-cyan-500/40"
                    rows={4}
                    placeholder="Tell us what you are using the items for"
                  />
                </div>
                <button
                  onClick={handleSubmitRequest}
                  disabled={loading}
                  className="mt-4 w-full bg-cyan-500/20 hover:bg-cyan-500/30 border border-cyan-400/40 text-cyan-100 font-semibold px-4 py-3 rounded-lg transition"
                >
                  {loading ? "Submitting..." : "Submit Request"}
                </button>
              </div>
            </div>
          )}

          {step === "done" && (
            <div className="mt-8 bg-gray-900 border border-gray-800 rounded-lg p-6">
              <h2 className="text-xl font-semibold">Request submitted</h2>
              <p className="text-gray-400 text-sm mt-2">
                Your request is pending approval. You will be notified once it is
                approved.
              </p>
              {success?.id && (
                <div className="mt-4 text-sm text-cyan-200">
                  Request ID: {success.id}
                </div>
              )}
              <button
                onClick={() => setStep("cart")}
                className="mt-4 inline-flex items-center justify-center px-4 py-2 rounded-lg bg-white/5 hover:bg-white/10 border border-white/10"
              >
                Create another request
              </button>
            </div>
          )}
        </section>
      </main>
      <Footer />
    </>
  );
}
