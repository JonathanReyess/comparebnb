import { ArrowRight, Sparkles, Trophy } from "lucide-react";
import { motion, useReducedMotion } from "motion/react";

interface LandingPageProps {
  onStart: () => void;
}

export function LandingPage({ onStart }: LandingPageProps) {
  const shouldReduce = useReducedMotion();

  const ease = [0.25, 1, 0.5, 1] as [number, number, number, number];

  const fadeUp = (delay = 0) =>
    shouldReduce
      ? {}
      : {
          initial: { opacity: 0, y: 20 },
          whileInView: { opacity: 1, y: 0 },
          viewport: { once: true, margin: "-60px" },
          transition: { duration: 0.5, ease, delay },
        };

  const staggerContainer = shouldReduce
    ? {}
    : {
        initial: "hidden",
        whileInView: "show",
        viewport: { once: true, margin: "-60px" },
        variants: {
          hidden: {},
          show: { transition: { staggerChildren: 0.12 } },
        },
      };

  const staggerItem = shouldReduce
    ? {}
    : {
        variants: {
          hidden: { opacity: 0, y: 20 },
          show: {
            opacity: 1,
            y: 0,
            transition: { duration: 0.5, ease },
          },
        },
      };

  return (
    <main className="w-full bg-white font-sans selection:bg-brand-100 selection:text-brand-900">
      {/* Hero: full-screen video */}
      <section className="relative h-[90vh] min-h-[600px] flex flex-col items-center justify-center overflow-hidden">
        {/* Because your file is in the "public" folder, it is served at the root "/".
          'muted' is required for 'autoPlay' and 'loop' to work in modern browsers.
        */}
        <video
          autoPlay
          muted
          loop
          playsInline
          poster="/beach_landing_poster.jpg"
          className="absolute inset-0 w-full h-full object-cover scale-105"
        >
          <source src="/beach_landing.mp4" type="video/mp4" />
        </video>

        {/* Deep, refined gradient for maximum text contrast over the moving video */}
        <div className="absolute inset-0 bg-gradient-to-b from-gray-950/60 via-gray-950/40 to-gray-950/80" />

        <div className="relative z-10 text-center px-6 max-w-4xl mx-auto mt-12 animate-in fade-in slide-in-from-bottom-8 duration-1000">
          <div className="inline-flex items-center gap-2 px-3 py-1.5 rounded-full bg-white/10 backdrop-blur-md border border-white/20 text-white text-sm font-medium mb-8">
            <Sparkles className="w-4 h-4 text-brand-300" />
            <span>AI-powered · Free · No signup</span>
          </div>

          <h1 className="font-display text-5xl md:text-7xl font-semibold text-white tracking-tight leading-[1.1] mb-6 drop-shadow-md">
            Stop guessing.
            <br />
            Start <span className="text-brand-300">comparing.</span>
          </h1>
          <p className="text-gray-300 text-xl md:text-2xl mb-12 max-w-xl mx-auto leading-relaxed font-normal drop-shadow-sm">
            Paste your listings, pick what matters, and find the perfect match
            in seconds.
          </p>

          {/* CTA — single, unambiguous action */}
          <div className="flex flex-col items-center gap-4 w-full max-w-md mx-auto">
            <button
              onClick={onStart}
              aria-label="Start comparing listings"
              className="group w-full flex items-center justify-between bg-white rounded-2xl shadow-2xl shadow-black/20 hover:shadow-brand-500/20 transition-all border border-white/10 px-6 py-4 focus-visible:outline-none focus-visible:ring-4 focus-visible:ring-brand-500/50 hover:scale-[1.015] duration-300"
            >
              <div className="text-left">
                <p className="text-base font-bold text-gray-900 tracking-tight">
                  Compare your listings
                </p>
                <p className="text-sm text-gray-400 mt-0.5">
                  Airbnb · VRBO · Booking.com · more
                </p>
              </div>
              <div className="bg-brand-500 group-hover:bg-brand-600 text-white px-5 py-3 rounded-xl font-semibold text-sm transition-all shrink-0 ml-4 shadow-sm flex items-center gap-2">
                Start free
                <ArrowRight className="w-4 h-4 group-hover:translate-x-0.5 transition-transform duration-200" />
              </div>
            </button>
            <p className="text-white/50 text-xs font-medium">
              Takes 2 minutes · No signup required
            </p>
          </div>
        </div>

        {/* Wave cutout — organic transition to gray-50 */}
        <div
          className="absolute bottom-0 left-0 right-0 z-10 pointer-events-none"
          aria-hidden="true"
        >
          <svg
            viewBox="0 0 1440 120"
            xmlns="http://www.w3.org/2000/svg"
            preserveAspectRatio="none"
            className="w-full h-24 md:h-36 block"
          >
            {/* Back layer — offset phase, foam depth */}
            <path
              d="M0,70 C80,30 200,95 380,50 C520,18 630,85 800,55 C930,32 1030,88 1190,46 C1290,18 1380,68 1440,50 L1440,120 L0,120 Z"
              fill="#f9fafb"
              fillOpacity="0.55"
            />
            {/* Main fill — irregular crests, ~55px amplitude */}
            <path
              d="M0,82 C60,42 165,105 325,65 C465,32 565,95 705,68 C825,45 940,92 1085,58 C1205,30 1345,82 1440,64 L1440,120 L0,120 Z"
              fill="#f9fafb"
            />
          </svg>
        </div>
      </section>

      {/* How it works */}
      <section id="how-it-works" className="py-24 md:py-32 bg-gray-50">
        <div className="max-w-5xl mx-auto px-6">
          <motion.div {...fadeUp()} className="mb-12 md:mb-16">
            <h2 className="font-display text-3xl md:text-4xl font-semibold text-gray-900 tracking-tight mb-3">
              How it works
            </h2>
            <p className="text-gray-500 text-lg leading-relaxed max-w-xl">
              Three steps from spreadsheet-induced confusion to confident group
              booking.
            </p>
          </motion.div>

          <motion.div
            className="divide-y divide-gray-200"
            {...staggerContainer}
          >
            {[
              {
                num: "1",
                title: "Tell us about your trip",
                desc: "Enter your group size, travel method, and what matters most so we can tailor every comparison to your needs.",
              },
              {
                num: "2",
                title: "Choose your categories",
                desc: "Pick from bedrooms, hot tubs, drive time, and more — or let our AI extract custom metrics from the listings.",
              },
              {
                num: "3",
                title: "Compare & decide",
                desc: "Paste your URLs and get a beautiful side-by-side table plus a personalized AI recommendation instantly.",
              },
            ].map(({ num, title, desc }) => (
              <motion.div
                key={num}
                className="grid grid-cols-[64px_1fr] md:grid-cols-[120px_1fr] gap-6 md:gap-14 py-10 md:py-12 items-start"
                {...staggerItem}
              >
                <span className="font-display text-6xl md:text-8xl font-semibold leading-none text-brand-200 select-none">
                  {num}
                </span>
                <div className="pt-1 md:pt-3">
                  <h3 className="font-display text-2xl md:text-3xl font-semibold text-gray-900 tracking-tight mb-3 leading-tight">
                    {title}
                  </h3>
                  <p className="text-gray-500 text-base md:text-lg leading-relaxed max-w-lg">
                    {desc}
                  </p>
                </div>
              </motion.div>
            ))}
          </motion.div>

          <motion.div {...fadeUp(0.1)} className="mt-14 md:mt-16">
            <button
              onClick={onStart}
              className="bg-brand-500 hover:bg-brand-600 text-white px-8 py-4 rounded-2xl font-semibold text-base transition-all inline-flex items-center gap-2 shadow-lg shadow-brand-200/50 hover:-translate-y-0.5 focus-visible:outline-none focus-visible:ring-4 focus-visible:ring-brand-500/30"
            >
              Start comparing <ArrowRight className="w-5 h-5" />
            </button>
          </motion.div>
        </div>
      </section>

      {/* Results preview */}
      <section className="py-24 md:py-32 bg-white">
        <div className="max-w-7xl mx-auto px-6">
          <motion.div {...fadeUp()} className="mb-12 md:mb-16 text-center">
            <h2 className="font-display text-3xl md:text-4xl font-semibold text-gray-900 tracking-tight mb-3">
              From 15 tabs to one clear winner
            </h2>
            <p className="text-gray-500 text-lg max-w-xl mx-auto leading-relaxed">
              A side-by-side breakdown with an AI recommendation tailored to
              your group's priorities — no spreadsheet required.
            </p>
          </motion.div>

          <motion.div
            className="bg-white rounded-3xl border border-gray-100 shadow-2xl shadow-gray-200/60 p-6 sm:p-8 md:p-10"
            {...(shouldReduce
              ? {}
              : {
                  initial: { opacity: 0, y: 40 },
                  whileInView: { opacity: 1, y: 0 },
                  viewport: { once: true, margin: "-80px" },
                  transition: { duration: 0.65, ease },
                })}
          >
            <div className="flex items-center justify-between mb-8 pb-6 border-b border-gray-100">
              <h3 className="font-display text-xl font-semibold text-gray-900">
                Comparison
              </h3>
              <span className="text-xs font-medium text-gray-400 bg-gray-50 px-3 py-1.5 rounded-full border border-gray-100">
                Sample preview
              </span>
            </div>

            <div className="grid grid-cols-1 xl:grid-cols-[1fr_300px] gap-8 xl:gap-10">
              {/* Table mockup */}
              <div className="rounded-2xl border border-gray-200 overflow-hidden shadow-sm">
                <div className="overflow-x-auto">
                  <table className="w-full border-collapse text-left min-w-[460px]">
                    <thead>
                      <tr className="border-b border-gray-200 bg-gray-50/80">
                        <th className="p-4 text-xs font-bold text-gray-500 uppercase tracking-wider w-40 border-r border-gray-200">
                          Category
                        </th>
                        <th className="p-4 min-w-[180px]">
                          <p className="font-semibold text-gray-900 text-sm">
                            The Coastal Retreat
                          </p>
                          <p className="text-xs text-gray-400 mt-0.5 font-normal">
                            Malibu, CA · 4 bed · 3 bath
                          </p>
                        </th>
                        <th className="p-4 min-w-[180px]">
                          <p className="font-semibold text-gray-900 text-sm">
                            Lakeside Lodge
                          </p>
                          <p className="text-xs text-gray-400 mt-0.5 font-normal">
                            Lake Tahoe, CA · 4 bed · 2 bath
                          </p>
                        </th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-gray-100">
                      {(
                        [
                          {
                            cat: "Total price (4 nights)",
                            a: "$1,840",
                            b: "$2,190",
                            winner: "a",
                          },
                          { cat: "Bedrooms", a: "4", b: "4", winner: null },
                          { cat: "Pool", a: "No", b: "Yes", winner: "b" },
                          { cat: "Bathrooms", a: "3", b: "2", winner: "a" },
                          { cat: "Hot tub", a: "Yes", b: "No", winner: "a" },
                          {
                            cat: "Drive time from LA",
                            a: "1h 20m",
                            b: "6h 10m",
                            winner: "a",
                          },
                          {
                            cat: "Guest rating",
                            a: "4.87 ★",
                            b: "4.94 ★",
                            winner: "b",
                          },
                        ] as {
                          cat: string;
                          a: string;
                          b: string;
                          winner: "a" | "b" | null;
                        }[]
                      ).map(({ cat, a, b, winner }, i) => (
                        <tr
                          key={cat}
                          className={i % 2 === 0 ? "bg-white" : "bg-gray-50/50"}
                        >
                          <td className="p-4 text-sm font-medium text-gray-600 border-r border-gray-100 whitespace-nowrap">
                            {cat}
                          </td>
                          <td
                            className={`p-4 text-sm ${winner === "a" ? "bg-emerald-50/60" : ""}`}
                          >
                            <div className="flex items-center gap-2">
                              <span
                                className={
                                  winner === "a"
                                    ? "font-medium text-emerald-800"
                                    : "font-medium text-gray-800"
                                }
                              >
                                {a}
                              </span>
                              {winner === "a" && (
                                <div className="flex items-center justify-center w-5 h-5 rounded-full bg-emerald-100 text-emerald-600 shrink-0">
                                  <svg
                                    className="w-3 h-3"
                                    fill="none"
                                    viewBox="0 0 24 24"
                                    stroke="currentColor"
                                    strokeWidth={3}
                                  >
                                    <path
                                      strokeLinecap="round"
                                      strokeLinejoin="round"
                                      d="M5 13l4 4L19 7"
                                    />
                                  </svg>
                                </div>
                              )}
                            </div>
                          </td>
                          <td
                            className={`p-4 text-sm ${winner === "b" ? "bg-emerald-50/60" : ""}`}
                          >
                            <div className="flex items-center gap-2">
                              <span
                                className={
                                  winner === "b"
                                    ? "font-medium text-emerald-800"
                                    : "font-medium text-gray-800"
                                }
                              >
                                {b}
                              </span>
                              {winner === "b" && (
                                <div className="flex items-center justify-center w-5 h-5 rounded-full bg-emerald-100 text-emerald-600 shrink-0">
                                  <svg
                                    className="w-3 h-3"
                                    fill="none"
                                    viewBox="0 0 24 24"
                                    stroke="currentColor"
                                    strokeWidth={3}
                                  >
                                    <path
                                      strokeLinecap="round"
                                      strokeLinejoin="round"
                                      d="M5 13l4 4L19 7"
                                    />
                                  </svg>
                                </div>
                              )}
                            </div>
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              </div>

              {/* AI Recommendation card */}
              <div className="space-y-4">
                <div className="flex items-center gap-2.5">
                  <div className="flex items-center justify-center w-8 h-8 rounded-full bg-brand-50 text-brand-500 shrink-0">
                    <Sparkles className="w-4 h-4" />
                  </div>
                  <h3 className="font-display text-lg font-semibold text-gray-900">
                    AI Recommendation
                  </h3>
                </div>

                <div className="rounded-2xl border border-brand-200 bg-gradient-to-br from-brand-50/80 via-white to-white p-6 shadow-sm">
                  <div className="flex items-start gap-4 mb-5">
                    <div className="w-12 h-12 rounded-xl bg-brand-500 flex items-center justify-center shrink-0 shadow-inner shadow-white/20">
                      <Trophy className="w-6 h-6 text-white" />
                    </div>
                    <div>
                      <p className="text-xs font-semibold text-brand-600 tracking-tight mb-1">
                        Top pick
                      </p>
                      <p className="font-display text-base font-semibold text-gray-900 leading-tight">
                        The Coastal Retreat
                      </p>
                    </div>
                  </div>

                  <p className="text-gray-700 leading-relaxed text-sm mb-5">
                    For a group driving from LA, The Coastal Retreat wins where
                    it counts — $350 cheaper, an extra bathroom, a hot tub, and
                    5 hours less in the car. Lakeside Lodge has the edge on
                    guest rating (4.94 vs 4.87), but not enough to close the
                    gap.
                  </p>

                  <div className="rounded-xl bg-gray-50 border border-gray-100 p-4">
                    <p className="text-sm text-gray-600 leading-relaxed">
                      <span className="font-semibold text-gray-900 block mb-1">
                        Consider Lakeside Lodge if:
                      </span>
                      Guest ratings are your group's top priority, or you'd
                      prefer a mountain setting over the beach.
                    </p>
                  </div>
                </div>
              </div>
            </div>
          </motion.div>
        </div>
      </section>

      {/* Compatible platforms */}
      <section className="py-16 bg-white border-y border-gray-100">
        <div className="max-w-5xl mx-auto px-6">
          <p className="text-center text-xs font-semibold text-gray-400 tracking-tight mb-10">
            Paste links from any of these platforms
          </p>
          <div className="flex items-center justify-center gap-10 md:gap-16 flex-wrap opacity-70">
            {[
              { src: "/airbnb.png", alt: "Airbnb" },
              { src: "/vrbo.png", alt: "VRBO" },
              { src: "/booking.png", alt: "Booking.com" },
              { src: "/expedia.png", alt: "Expedia" },
              { src: "/hotels.png", alt: "Hotels.com" },
            ].map(({ src, alt }) => (
              <img
                key={alt}
                src={src}
                alt={alt}
                className="h-7 md:h-8 w-auto object-contain grayscale hover:grayscale-0 transition-all duration-300 hover:scale-105 cursor-pointer"
              />
            ))}
          </div>
        </div>
      </section>

      {/* Footer */}
      <footer className="bg-gray-950">
        <div className="max-w-5xl mx-auto px-6 py-20 text-center">
          <p className="font-display text-2xl md:text-3xl font-medium text-white/70 leading-snug max-w-xl mx-auto mb-10">
            Made for groups who hate spreadsheets and decision paralysis.
          </p>

          {/* Fixed-height wrapper prevents layout shift while image scales */}
          <div className="h-12 flex items-center justify-center">
            <img
              src="/compare_white.svg"
              alt="CompareBnB"
              className="h-64 w-auto object-contain opacity-30 pointer-events-none"
            />
          </div>
        </div>

        <div className="border-t border-gray-800/50">
          <div className="max-w-5xl mx-auto px-6 py-6 flex flex-col sm:flex-row items-center justify-between gap-3 text-xs font-medium text-gray-600">
            <p>© {new Date().getFullYear()} CompareBnB</p>
            <p>Not affiliated with Airbnb, Inc.</p>
          </div>
        </div>
      </footer>
    </main>
  );
}
