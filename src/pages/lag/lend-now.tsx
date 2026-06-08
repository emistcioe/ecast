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
    const savedAt = localStorage.getItem("lag_token_at");
    if (savedToken && savedEmail) {
      // Expire client-side after 50 minutes
      const elapsed = savedAt ? Date.now() - Number(savedAt) : Infinity;
      if (elapsed > 50 * 60 * 1000) {
        localStorage.removeItem("lag_token");
        localStorage.removeItem("lag_email");
        localStorage.removeItem("lag_token_at");
        return;
      }
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
        localStorage.setItem("lag_token_at", String(Date.now()));
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
    } catch (e: any) {
      const msg = e?.message || "Failed to submit request";
      setError(msg);
      // If token expired/invalid, clear session and go back to email
      if (msg.includes("LAG token") || msg.includes("token")) {
        localStorage.removeItem("lag_token");
        localStorage.removeItem("lag_email");
        localStorage.removeItem("lag_token_at");
        setToken(null);
        setStep("email");
      }
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
          {/* Header with progress */}
          <div className="flex items-end justify-between flex-wrap gap-4">
            <div>
              <h1 className="text-3xl md:text-4xl font-bold tracking-tight">Lend Now</h1>
              <p className="text-gray-400 mt-1 text-sm">
                Verify your email and request materials.
              </p>
            </div>
            <div className="flex items-center gap-2">
              {["Email", "OTP", "Cart", "Done"].map((label, i) => {
                const stepIndex = step === "email" ? 0 : step === "otp" ? 1 : step === "cart" ? 2 : 3;
                const isActive = i === stepIndex;
                const isDone = i < stepIndex;
                return (
                  <div key={label} className="flex items-center gap-2">
                    {i > 0 && <div className={`w-6 h-px ${isDone ? "bg-teal-500/60" : "bg-gray-700"}`} />}
                    <div className={`flex items-center gap-1.5 text-xs font-medium px-2.5 py-1 rounded-full transition-colors ${
                      isActive ? "bg-teal-600/20 text-teal-300 border border-teal-500/30" :
                      isDone ? "bg-gray-800 text-gray-300 border border-gray-700" :
                      "bg-gray-900 text-gray-500 border border-gray-800"
                    }`}>
                      {isDone ? (
                        <svg className="w-3 h-3" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2.5}><path strokeLinecap="round" strokeLinejoin="round" d="M5 13l4 4L19 7" /></svg>
                      ) : (
                        <span className="w-3 text-center">{i + 1}</span>
                      )}
                      <span className="hidden sm:inline">{label}</span>
                    </div>
                  </div>
                );
              })}
            </div>
          </div>

          {error && (
            <div className="mt-6 flex items-start gap-3 text-red-300 bg-red-500/8 border border-red-500/15 rounded-xl px-4 py-3">
              <svg className="w-5 h-5 mt-0.5 shrink-0" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}><path strokeLinecap="round" strokeLinejoin="round" d="M12 9v3.75m9-.75a9 9 0 11-18 0 9 9 0 0118 0zm-9 3.75h.008v.008H12v-.008z" /></svg>
              <span className="text-sm">{error}</span>
            </div>
          )}

          {/* Step 1: Email */}
          {step === "email" && (
            <div className="mt-10 max-w-lg mx-auto">
              <div className="bg-gray-900/80 border border-gray-800 rounded-2xl p-8">
                <div className="w-12 h-12 bg-gray-800 rounded-xl flex items-center justify-center mb-5">
                  <svg className="w-6 h-6 text-gray-400" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.5}><path strokeLinecap="round" strokeLinejoin="round" d="M21.75 6.75v10.5a2.25 2.25 0 01-2.25 2.25h-15a2.25 2.25 0 01-2.25-2.25V6.75m19.5 0A2.25 2.25 0 0019.5 4.5h-15a2.25 2.25 0 00-2.25 2.25m19.5 0v.243a2.25 2.25 0 01-1.07 1.916l-7.5 4.615a2.25 2.25 0 01-2.36 0L3.32 8.91a2.25 2.25 0 01-1.07-1.916V6.75" /></svg>
                </div>
                <h2 className="text-xl font-semibold">Verify your college email</h2>
                <p className="text-gray-400 text-sm mt-1.5">
                  We will send a one-time verification code to your @tcioe.edu.np address.
                </p>
                <div className="mt-5">
                  <label className="text-xs font-medium text-gray-400 uppercase tracking-wider">Email address</label>
                  <input
                    type="email"
                    value={email}
                    onChange={(e) => setEmail(e.target.value)}
                    placeholder="name@tcioe.edu.np"
                    className="mt-1.5 w-full bg-gray-950 border border-gray-800 rounded-xl px-4 py-3 text-white placeholder:text-gray-600 focus:outline-none focus:ring-2 focus:ring-teal-500/40 focus:border-teal-500/40 transition"
                  />
                </div>
                <button
                  onClick={handleRequestOtp}
                  disabled={loading}
                  className="mt-5 w-full bg-white text-gray-950 font-semibold px-4 py-3 rounded-xl hover:bg-gray-100 transition disabled:opacity-50"
                >
                  {loading ? "Sending..." : "Send verification code"}
                </button>
                <p className="text-xs text-gray-500 mt-4 text-center">
                  Only @tcioe.edu.np emails are accepted for verification.
                </p>
              </div>
            </div>
          )}

          {/* Step 2: OTP */}
          {step === "otp" && (
            <div className="mt-10 max-w-lg mx-auto">
              <div className="bg-gray-900/80 border border-gray-800 rounded-2xl p-8">
                <div className="w-12 h-12 bg-gray-800 rounded-xl flex items-center justify-center mb-5">
                  <svg className="w-6 h-6 text-gray-400" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.5}><path strokeLinecap="round" strokeLinejoin="round" d="M16.5 10.5V6.75a4.5 4.5 0 10-9 0v3.75m-.75 11.25h10.5a2.25 2.25 0 002.25-2.25v-6.75a2.25 2.25 0 00-2.25-2.25H6.75a2.25 2.25 0 00-2.25 2.25v6.75a2.25 2.25 0 002.25 2.25z" /></svg>
                </div>
                <h2 className="text-xl font-semibold">Enter verification code</h2>
                <p className="text-gray-400 text-sm mt-1.5">
                  A 6-digit code was sent to <span className="text-white font-medium">{email}</span>
                </p>
                <div className="mt-5">
                  <label className="text-xs font-medium text-gray-400 uppercase tracking-wider">Code</label>
                  <input
                    type="text"
                    value={otp}
                    onChange={(e) => setOtp(e.target.value)}
                    placeholder="000000"
                    maxLength={6}
                    className="mt-1.5 w-full bg-gray-950 border border-gray-800 rounded-xl px-4 py-3 text-white text-center text-lg tracking-[0.3em] font-mono placeholder:text-gray-600 focus:outline-none focus:ring-2 focus:ring-teal-500/40 focus:border-teal-500/40 transition"
                  />
                </div>
                <div className="mt-5 flex gap-3">
                  <button
                    onClick={handleVerifyOtp}
                    disabled={loading}
                    className="flex-1 bg-white text-gray-950 font-semibold px-4 py-3 rounded-xl hover:bg-gray-100 transition disabled:opacity-50"
                  >
                    {loading ? "Verifying..." : "Verify"}
                  </button>
                  <button
                    onClick={() => setStep("email")}
                    className="flex-1 bg-gray-800 hover:bg-gray-700 text-white font-medium px-4 py-3 rounded-xl transition"
                  >
                    Change email
                  </button>
                </div>
              </div>
            </div>
          )}

          {/* Step 3: Cart */}
          {step === "cart" && (
            <div className="mt-8 grid lg:grid-cols-5 gap-6">
              {/* Materials - wider */}
              <div className="lg:col-span-3 space-y-3">
                <div className="flex items-center justify-between">
                  <h2 className="text-lg font-semibold">Materials</h2>
                  <span className="text-xs text-gray-500">{materials.length} items</span>
                </div>
                {materials.length === 0 && (
                  <div className="bg-gray-900/80 border border-gray-800 rounded-xl p-8 text-center text-gray-400">
                    No materials available right now.
                  </div>
                )}
                <div className="grid sm:grid-cols-2 gap-3">
                  {materials.map((m) => {
                    const available = m.available_quantity ?? 0;
                    const qty = cart[m.id] || 0;
                    const inCart = qty > 0;
                    return (
                      <div
                        key={m.id}
                        className={`bg-gray-900/80 border rounded-xl overflow-hidden transition-colors ${
                          inCart ? "border-teal-500/30" : "border-gray-800"
                        }`}
                      >
                        <div className="h-32 bg-gray-950 overflow-hidden flex items-center justify-center">
                          {m.image_url ? (
                            // eslint-disable-next-line @next/next/no-img-element
                            <img
                              src={m.image_url}
                              alt={m.name}
                              className="w-full h-full object-cover"
                            />
                          ) : (
                            <div className="text-gray-700 text-xs">No image</div>
                          )}
                        </div>
                        <div className="p-3.5">
                          <div className="flex items-start justify-between gap-2">
                            <h3 className="font-medium text-sm leading-tight">{m.name}</h3>
                            <span className={`text-[10px] font-medium px-1.5 py-0.5 rounded-md shrink-0 ${
                              available > 0 ? "bg-teal-600/15 text-teal-300" : "bg-red-500/10 text-red-400"
                            }`}>
                              {available > 0 ? `${available} left` : "Unavailable"}
                            </span>
                          </div>
                          {m.description && m.description !== "No description" && (
                            <p className="text-gray-500 text-xs mt-1 line-clamp-1">{m.description}</p>
                          )}
                          <div className="mt-3 flex items-center justify-between">
                            <div className="flex items-center gap-1.5">
                              <button
                                onClick={() => handleAdjustQty(m.id, -1)}
                                disabled={qty === 0}
                                className="w-7 h-7 rounded-lg bg-gray-800 hover:bg-gray-700 flex items-center justify-center text-sm font-medium transition disabled:opacity-30"
                              >
                                -
                              </button>
                              <div className="w-8 text-center text-sm font-semibold tabular-nums">
                                {qty}
                              </div>
                              <button
                                onClick={() => handleAdjustQty(m.id, 1)}
                                disabled={available === 0 || qty >= available}
                                className="w-7 h-7 rounded-lg bg-gray-800 hover:bg-gray-700 flex items-center justify-center text-sm font-medium transition disabled:opacity-30"
                              >
                                +
                              </button>
                            </div>
                            {inCart && (
                              <span className="text-[10px] text-teal-400 font-medium">In cart</span>
                            )}
                          </div>
                        </div>
                      </div>
                    );
                  })}
                </div>
              </div>

              {/* Sidebar - cart + form */}
              <div className="lg:col-span-2">
                <div className="bg-gray-900/80 border border-gray-800 rounded-2xl p-5 lg:sticky lg:top-28">
                  {/* Cart summary */}
                  <h2 className="text-lg font-semibold">Your request</h2>
                  <div className="mt-3 space-y-2">
                    {cartItems.length === 0 ? (
                      <div className="text-gray-500 text-sm py-2">
                        Add materials from the left to get started.
                      </div>
                    ) : (
                      <>
                        {cartItems.map((c) => (
                          <div
                            key={c.material.id}
                            className="flex items-center justify-between text-sm bg-gray-950/60 rounded-lg px-3 py-2"
                          >
                            <span className="text-gray-200">{c.material.name}</span>
                            <span className="text-white font-semibold tabular-nums">x{c.quantity}</span>
                          </div>
                        ))}
                        <div className="flex items-center justify-between text-xs text-gray-400 pt-1 px-1">
                          <span>{cartItems.length} {cartItems.length === 1 ? "item" : "items"}</span>
                          <span>{cartItems.reduce((s, c) => s + c.quantity, 0)} total units</span>
                        </div>
                      </>
                    )}
                  </div>

                  {/* Divider */}
                  <div className="h-px bg-gray-800 my-4" />

                  {/* Form fields */}
                  <div className="space-y-3">
                    <div>
                      <label className="text-xs font-medium text-gray-400 uppercase tracking-wider">Full name</label>
                      <input
                        value={requesterName}
                        onChange={(e) => setRequesterName(e.target.value)}
                        className="mt-1 w-full bg-gray-950 border border-gray-800 rounded-lg px-3 py-2.5 text-sm text-white placeholder:text-gray-600 focus:outline-none focus:ring-2 focus:ring-teal-500/40 transition"
                        placeholder="Abhishek Panthee"
                      />
                    </div>
                    <div className="grid grid-cols-2 gap-3">
                      <div>
                        <label className="text-xs font-medium text-gray-400 uppercase tracking-wider">Phone</label>
                        <input
                          value={phoneNumber}
                          onChange={(e) => setPhoneNumber(e.target.value)}
                          className="mt-1 w-full bg-gray-950 border border-gray-800 rounded-lg px-3 py-2.5 text-sm text-white placeholder:text-gray-600 focus:outline-none focus:ring-2 focus:ring-teal-500/40 transition"
                          placeholder="98XXXXXXXX"
                        />
                      </div>
                      <div>
                        <label className="text-xs font-medium text-gray-400 uppercase tracking-wider">Roll no.</label>
                        <input
                          value={rollNumber}
                          onChange={(e) => setRollNumber(e.target.value)}
                          className="mt-1 w-full bg-gray-950 border border-gray-800 rounded-lg px-3 py-2.5 text-sm text-white placeholder:text-gray-600 focus:outline-none focus:ring-2 focus:ring-teal-500/40 transition"
                          placeholder="THA080BCT"
                        />
                      </div>
                    </div>
                    <div className="grid grid-cols-2 gap-3">
                      <div>
                        <label className="text-xs font-medium text-gray-400 uppercase tracking-wider">From</label>
                        <input
                          type="date"
                          value={requestedFrom}
                          onChange={(e) => setRequestedFrom(e.target.value)}
                          className="mt-1 w-full bg-gray-950 border border-gray-800 rounded-lg px-3 py-2.5 text-sm text-white focus:outline-none focus:ring-2 focus:ring-teal-500/40 [color-scheme:dark] transition"
                        />
                      </div>
                      <div>
                        <label className="text-xs font-medium text-gray-400 uppercase tracking-wider">To</label>
                        <input
                          type="date"
                          value={requestedTo}
                          onChange={(e) => setRequestedTo(e.target.value)}
                          className="mt-1 w-full bg-gray-950 border border-gray-800 rounded-lg px-3 py-2.5 text-sm text-white focus:outline-none focus:ring-2 focus:ring-teal-500/40 [color-scheme:dark] transition"
                        />
                      </div>
                    </div>
                    <div>
                      <label className="text-xs font-medium text-gray-400 uppercase tracking-wider">Notes <span className="normal-case text-gray-600">(optional)</span></label>
                      <textarea
                        value={notes}
                        onChange={(e) => setNotes(e.target.value)}
                        className="mt-1 w-full bg-gray-950 border border-gray-800 rounded-lg px-3 py-2.5 text-sm text-white placeholder:text-gray-600 focus:outline-none focus:ring-2 focus:ring-teal-500/40 transition resize-none"
                        rows={3}
                        placeholder="What will you use these for?"
                      />
                    </div>
                  </div>

                  <button
                    onClick={handleSubmitRequest}
                    disabled={loading || cartItems.length === 0}
                    className="mt-5 w-full bg-white text-gray-950 font-semibold px-4 py-3 rounded-xl hover:bg-gray-100 transition disabled:opacity-40 disabled:cursor-not-allowed"
                  >
                    {loading ? "Submitting..." : "Submit request"}
                  </button>
                </div>
              </div>
            </div>
          )}

          {/* Step 4: Done */}
          {step === "done" && (
            <div className="mt-10 max-w-lg mx-auto">
              <div className="bg-gray-900/80 border border-gray-800 rounded-2xl p-8 text-center">
                <div className="w-14 h-14 bg-teal-600/15 rounded-full flex items-center justify-center mx-auto mb-5">
                  <svg className="w-7 h-7 text-teal-400" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}><path strokeLinecap="round" strokeLinejoin="round" d="M9 12.75L11.25 15 15 9.75M21 12a9 9 0 11-18 0 9 9 0 0118 0z" /></svg>
                </div>
                <h2 className="text-xl font-semibold">Request submitted</h2>
                <p className="text-gray-400 text-sm mt-2">
                  Your request is pending approval. You will be notified at your email once processed.
                </p>
                {success?.id && (
                  <div className="mt-3 text-xs text-gray-500 font-mono">
                    ID: {success.id}
                  </div>
                )}
                <button
                  onClick={() => setStep("cart")}
                  className="mt-6 inline-flex items-center justify-center gap-2 px-5 py-2.5 rounded-xl bg-gray-800 hover:bg-gray-700 text-sm font-medium transition"
                >
                  <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}><path strokeLinecap="round" strokeLinejoin="round" d="M12 4.5v15m7.5-7.5h-15" /></svg>
                  Create another request
                </button>
              </div>
            </div>
          )}
        </section>
      </main>
      <Footer />
    </>
  );
}
