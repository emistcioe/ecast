import Head from "next/head";
import Link from "next/link";
import NavBar from "@/components/nav";
import Footer from "@/components/footar";

export default function LagLandingPage() {
  return (
    <>
      <Head>
        <title>LAG - Lend and Grow</title>
      </Head>
      <NavBar />
      <main className="min-h-screen bg-gray-950 text-white pt-24">
        <section className="max-w-6xl mx-auto px-4 md:px-6">
          <div className="grid lg:grid-cols-2 gap-10 items-center">
            <div>
              <div className="inline-flex items-center gap-2 text-xs uppercase tracking-[0.2em] text-cyan-300/80 bg-cyan-500/10 border border-cyan-500/20 px-3 py-1.5 rounded-full">
                Lend and Grow
              </div>
              <h1 className="mt-4 text-4xl md:text-5xl font-bold leading-tight">
                LAG is our club lending system for electronics and lab
                materials.
              </h1>
              <p className="mt-4 text-gray-300 text-lg leading-relaxed">
                Request what you need, verify with your college email, and track
                approvals and returns. Inventory limits are enforced so every
                member gets fair access.
              </p>
              <div className="mt-8 flex flex-col sm:flex-row gap-4">
                <Link
                  href="/lag/lend-now"
                  className="inline-flex items-center justify-center px-6 py-3 rounded-lg bg-cyan-500/20 hover:bg-cyan-500/30 border border-cyan-400/40 text-cyan-100 font-semibold transition"
                >
                  Lend Now
                </Link>
                <Link
                  href="/lag/inventory"
                  className="inline-flex items-center justify-center px-6 py-3 rounded-lg bg-white/5 hover:bg-white/10 border border-white/10 text-white font-semibold transition"
                >
                  View Inventory
                </Link>
              </div>
            </div>
            <div className="bg-gray-900 border border-gray-800 rounded-lg p-6">
              <div className="grid gap-4">
                <div className="bg-gray-950 border border-gray-800 rounded-lg p-4">
                  <div className="text-sm text-gray-400">Step 1</div>
                  <div className="font-semibold">Verify with OTP</div>
                  <div className="text-sm text-gray-400 mt-1">
                    Use your @tcioe.edu.np email to receive a code.
                  </div>
                </div>
                <div className="bg-gray-950 border border-gray-800 rounded-lg p-4">
                  <div className="text-sm text-gray-400">Step 2</div>
                  <div className="font-semibold">Choose items</div>
                  <div className="text-sm text-gray-400 mt-1">
                    Add materials to your cart and request approval.
                  </div>
                </div>
                <div className="bg-gray-950 border border-gray-800 rounded-lg p-4">
                  <div className="text-sm text-gray-400">Step 3</div>
                  <div className="font-semibold">Get it verified</div>
                  <div className="text-sm text-gray-400 mt-1">
                    Club members verify issue and return with timestamps.
                  </div>
                </div>
              </div>
            </div>
          </div>
        </section>

        {/* Minimal info section, only transparent inventory */}
        <section className="max-w-3xl mx-auto px-4 md:px-6 mt-16 pb-16">
          <div className="bg-gray-900 border border-gray-800 rounded-lg p-8 text-center">
            <h3 className="text-2xl font-semibold mb-2">Transparent inventory</h3>
            <p className="text-gray-400 text-base">
              See what is available and how many are currently on loan.
            </p>
          </div>
        </section>
      </main>
      <Footer />
    </>
  );
}
