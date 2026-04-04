import {
  ArrowRight,
  Sparkles,
  Trophy,
  BarChart3,
  Zap,
  Check,
  Link2,
} from "lucide-react";
import { useState, useRef } from "react";
import { motion, useReducedMotion } from "motion/react";

interface LandingPageProps {
  onStart: () => void;
}

export function LandingPage({ onStart }: LandingPageProps) {
  const shouldReduce = useReducedMotion();
  const [cardZIndices, setCardZIndices] = useState<Record<string, number>>({});
  const zCounter = useRef(10);
  const bringToFront = (name: string) => {
    zCounter.current += 1;
    setCardZIndices((prev) => ({ ...prev, [name]: zCounter.current }));
  };

  const ease = [0.25, 1, 0.5, 1] as [number, number, number, number];

  const fadeUp = (delay = 0) =>
    shouldReduce
      ? {}
      : {
          initial: { opacity: 0, y: 24 },
          whileInView: { opacity: 1, y: 0 },
          viewport: { once: true, margin: "-60px" },
          transition: { duration: 0.55, ease, delay },
        };

  const staggerContainer = shouldReduce
    ? {}
    : {
        initial: "hidden",
        whileInView: "show",
        viewport: { once: true, margin: "-60px" },
        variants: {
          hidden: {},
          show: { transition: { staggerChildren: 0.11 } },
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

  const tableRows = [
    {
      cat: "Total price (4 nights)",
      a: "$1,840",
      b: "$2,190",
      winner: "a" as const,
    },
    { cat: "Bedrooms", a: "4", b: "4", winner: null },
    { cat: "Pool", a: "No", b: "Yes", winner: "b" as const },
    { cat: "Bathrooms", a: "3", b: "2", winner: "a" as const },
    { cat: "Hot tub", a: "Yes", b: "No", winner: "a" as const },
    {
      cat: "Drive time from LA",
      a: "1h 20m",
      b: "6h 10m",
      winner: "a" as const,
    },
    { cat: "Guest rating", a: "4.87 ★", b: "4.94 ★", winner: "b" as const },
  ];

  return (
    <main className="w-full bg-white font-sans selection:bg-brand-100 selection:text-brand-900">
      {/* ── Hero ──────────────────────────────────────────────── */}
      <section className="relative min-h-screen flex flex-col overflow-hidden">
        {/* Video background */}
        <video
          autoPlay
          muted
          loop
          playsInline
          poster="/beach_landing_poster.jpg"
          className="absolute inset-0 w-full h-full object-cover scale-105 blur-sm"
        >
          <source src="/beach_landing.webm" type="video/webm" />
          <source src="/beach_landing.mp4" type="video/mp4" />
        </video>
        <div className="absolute inset-0 bg-gradient-to-br from-gray-950/75 via-gray-950/55 to-brand-900/50" />

        {/* Content — padded to clear the decorative logo, capped by h-screen */}
        <div className="relative z-10 flex-1 flex items-start">
          <div className="w-full max-w-7xl mx-auto px-6 lg:px-10 pt-[14vh] pb-[8vh] md:pt-[19vh] md:pb-[9vh] lg:pt-[27vh] lg:pb-[11vh] xl:pt-[29vh] xl:pb-[11vh]">
            <div className="grid lg:grid-cols-[1fr_500px] xl:grid-cols-[1fr_580px] gap-10 xl:gap-14 items-start">
              {/* Left — copy */}
              <div>
                <motion.h1
                  initial={shouldReduce ? {} : { opacity: 0, y: 28 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ duration: 0.65, ease, delay: 0.1 }}
                  className="font-display text-[2.75rem] sm:text-6xl lg:text-[4.5rem] xl:text-[5rem] font-semibold text-white tracking-tight leading-[1.05] mb-6"
                >
                  Stop tab-switching.
                  <br />
                  <span className="text-brand-300">Start booking.</span>
                </motion.h1>

                <motion.p
                  initial={shouldReduce ? {} : { opacity: 0, y: 20 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ duration: 0.6, ease, delay: 0.25 }}
                  className="text-white/70 text-lg sm:text-xl mb-10 max-w-lg leading-relaxed font-normal"
                >
                  Paste your Airbnb and VRBO links, choose what matters to your
                  group, and get a side-by-side breakdown with an AI pick — in
                  under two minutes.
                </motion.p>

                <motion.div
                  initial={shouldReduce ? {} : { opacity: 0, y: 16 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ duration: 0.55, ease, delay: 0.38 }}
                  className="flex flex-wrap items-center gap-3"
                >
                  <button
                    onClick={onStart}
                    className="group inline-flex items-center gap-2.5 bg-brand-500 hover:bg-brand-600 text-white px-7 py-3.5 rounded-xl font-semibold text-sm transition-all shadow-lg shadow-brand-900/30 hover:-translate-y-px focus-visible:outline-none focus-visible:ring-4 focus-visible:ring-brand-400/40"
                  >
                    Get Started
                    <ArrowRight className="w-4 h-4 group-hover:translate-x-0.5 transition-transform duration-200" />
                  </button>
                  <button
                    onClick={() =>
                      document
                        .getElementById("how-it-works")
                        ?.scrollIntoView({ behavior: "smooth" })
                    }
                    className="inline-flex items-center gap-2 bg-white/10 hover:bg-white/20 backdrop-blur-sm text-white border border-white/20 px-7 py-3.5 rounded-xl font-semibold text-sm transition-all focus-visible:outline-none focus-visible:ring-4 focus-visible:ring-white/30"
                  >
                    Learn More
                  </button>
                </motion.div>
              </div>

              {/* Right — floating comparison card */}
              <motion.div
                initial={shouldReduce ? {} : { opacity: 0, y: 32, x: 12 }}
                animate={{ opacity: 1, y: 0, x: 0 }}
                transition={{ duration: 0.7, ease, delay: 0.25 }}
                className="block min-w-0"
              >
                <div className="bg-white rounded-2xl shadow-2xl shadow-black/30 border border-white/10 overflow-hidden">
                  {/* Card header */}
                  <div className="px-5 py-3.5 border-b border-gray-100 flex items-center justify-between">
                    <div className="flex items-center gap-2">
                      <span className="relative flex w-2 h-2">
                        <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-brand-400 opacity-75" />
                        <span className="relative inline-flex rounded-full w-2 h-2 bg-brand-500" />
                      </span>
                      <span className="text-xs font-semibold text-gray-500 tracking-wide uppercase">
                        Comparing 2 listings
                      </span>
                    </div>
                    <span className="text-[10px] font-medium text-gray-500 bg-gray-100 px-2.5 py-1 rounded-full border border-gray-200">
                      Sample
                    </span>
                  </div>

                  {/* Table */}
                  <div className="overflow-x-auto">
                    <table className="w-full border-collapse text-left">
                      <thead>
                        <tr className="border-b border-gray-100 bg-gray-50/80">
                          <th className="px-4 py-2.5 text-[10px] font-bold text-gray-400 uppercase tracking-widest w-36 border-r border-gray-100">
                            Category
                          </th>
                          <th className="px-4 py-2.5">
                            <p className="font-semibold text-gray-900 text-xs">
                              Coastal Retreat
                            </p>
                            <p className="text-[10px] text-gray-400 mt-0.5 font-normal">
                              Malibu, CA · 4 bed
                            </p>
                          </th>
                          <th className="px-4 py-2.5">
                            <p className="font-semibold text-gray-900 text-xs">
                              Lakeside Lodge
                            </p>
                            <p className="text-[10px] text-gray-400 mt-0.5 font-normal">
                              Lake Tahoe · 4 bed
                            </p>
                          </th>
                        </tr>
                      </thead>
                      <tbody className="divide-y divide-gray-100">
                        {tableRows.map(({ cat, a, b, winner }, i) => (
                          <tr
                            key={cat}
                            className={
                              i % 2 === 0 ? "bg-white" : "bg-gray-50/40"
                            }
                          >
                            <td className="px-4 py-2 text-xs font-medium text-gray-500 border-r border-gray-100 whitespace-nowrap">
                              {cat}
                            </td>
                            <td
                              className={`px-4 py-2 text-xs ${winner === "a" ? "bg-emerald-50/70" : ""}`}
                            >
                              <div className="flex items-center gap-1.5">
                                <span
                                  className={
                                    winner === "a"
                                      ? "font-semibold text-emerald-800"
                                      : "text-gray-700"
                                  }
                                >
                                  {a}
                                </span>
                                {winner === "a" && (
                                  <div className="w-3.5 h-3.5 rounded-full bg-emerald-100 flex items-center justify-center shrink-0">
                                    <Check
                                      className="w-2 h-2 text-emerald-600"
                                      strokeWidth={3}
                                    />
                                  </div>
                                )}
                              </div>
                            </td>
                            <td
                              className={`px-4 py-2 text-xs ${winner === "b" ? "bg-emerald-50/70" : ""}`}
                            >
                              <div className="flex items-center gap-1.5">
                                <span
                                  className={
                                    winner === "b"
                                      ? "font-semibold text-emerald-800"
                                      : "text-gray-700"
                                  }
                                >
                                  {b}
                                </span>
                                {winner === "b" && (
                                  <div className="w-3.5 h-3.5 rounded-full bg-emerald-100 flex items-center justify-center shrink-0">
                                    <Check
                                      className="w-2 h-2 text-emerald-600"
                                      strokeWidth={3}
                                    />
                                  </div>
                                )}
                              </div>
                            </td>
                          </tr>
                        ))}
                      </tbody>
                    </table>
                  </div>

                  {/* AI rec chip */}
                  <div className="mx-4 my-3 bg-brand-50 rounded-xl p-3 flex items-center gap-3 border border-brand-100/60">
                    <div className="w-8 h-8 rounded-lg bg-brand-500 flex items-center justify-center shrink-0">
                      <Sparkles className="w-4 h-4 text-white" />
                    </div>
                    <div>
                      <p className="text-[10px] font-semibold text-brand-700 uppercase tracking-wide">
                        AI Recommendation
                      </p>
                      <p className="text-xs font-medium text-gray-700 mt-0.5">
                        Coastal Retreat wins for your group
                      </p>
                    </div>
                  </div>
                </div>
              </motion.div>
            </div>
          </div>
        </div>

        {/* Wave transition */}
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
            <path
              d="M0,70 C80,30 200,95 380,50 C520,18 630,85 800,55 C930,32 1030,88 1190,46 C1290,18 1380,68 1440,50 L1440,120 L0,120 Z"
              fill="#f9fafb"
              fillOpacity="0.55"
            />
            <path
              d="M0,82 C60,42 165,105 325,65 C465,32 565,95 705,68 C825,45 940,92 1085,58 C1205,30 1345,82 1440,64 L1440,120 L0,120 Z"
              fill="#f9fafb"
            />
          </svg>
        </div>
      </section>

      {/* ── Feature cards ─────────────────────────────────────── */}
      <section id="how-it-works" className="py-24 md:py-32 bg-gray-50 -mt-px">
        <div className="max-w-6xl mx-auto px-6">
          <motion.div {...fadeUp()} className="mb-14 md:mb-16">
            <p className="text-brand-500 text-sm font-semibold tracking-wide uppercase mb-3">
              How it works
            </p>
            <h2 className="font-display text-3xl md:text-4xl lg:text-5xl font-semibold text-gray-900 tracking-tight leading-[1.1] mb-4 max-w-xl">
              Everything you need for the perfect booking.
            </h2>
            <p className="text-gray-500 text-lg leading-relaxed max-w-lg">
              Three steps towards one confident group decision.
            </p>
          </motion.div>

          <motion.div
            className="grid md:grid-cols-3 gap-6 lg:gap-8"
            {...staggerContainer}
          >
            {[
              {
                icon: <Link2 className="w-5 h-5" />,
                num: "01",
                title: "Paste any listing link",
                desc: "Drop in URLs from Airbnb, VRBO, Booking.com, or anywhere else. We handle the data extraction automatically.",
              },
              {
                icon: <BarChart3 className="w-5 h-5" />,
                num: "02",
                title: "Choose your categories",
                desc: "Pick from bedrooms, hot tubs, drive time, pricing, and more — or define custom metrics that matter to your group.",
              },
              {
                icon: <Zap className="w-5 h-5" />,
                num: "03",
                title: "Get your answer instantly",
                desc: "A clean side-by-side table and a personalized AI recommendation tailored to your trip arrive in seconds.",
              },
            ].map(({ icon, num, title, desc }) => (
              <motion.div
                key={num}
                {...staggerItem}
                className="bg-white rounded-2xl p-7 border border-gray-100 shadow-sm hover:shadow-md hover:-translate-y-0.5 transition-all duration-300"
              >
                <div className="flex items-start justify-between mb-5">
                  <div className="w-10 h-10 rounded-xl bg-brand-50 text-brand-500 flex items-center justify-center shrink-0">
                    {icon}
                  </div>
                  <span className="font-display text-3xl font-semibold text-gray-100 select-none leading-none">
                    {num}
                  </span>
                </div>
                <h3 className="font-display text-xl font-semibold text-gray-900 tracking-tight mb-2 leading-snug">
                  {title}
                </h3>
                <p className="text-gray-500 text-sm leading-relaxed">{desc}</p>
              </motion.div>
            ))}
          </motion.div>
        </div>
      </section>

      {/* ── Feature section A: Compare side-by-side ───────────── */}
      <section className="py-24 md:py-32 bg-white overflow-hidden">
        <div className="max-w-6xl mx-auto px-6">
          <div className="grid lg:grid-cols-2 gap-14 xl:gap-20 items-center">
            <motion.div {...fadeUp()}>
              <p className="text-brand-500 text-sm font-semibold tracking-wide uppercase mb-3">
                Side-by-side comparison
              </p>
              <h2 className="font-display text-3xl md:text-4xl font-semibold text-gray-900 tracking-tight leading-[1.1] mb-5">
                From dozens of tabs to one clear winner.
              </h2>
              <p className="text-gray-500 text-lg leading-relaxed mb-8">
                Every listing measured across the same categories so your group
                can stop arguing and start packing.
              </p>
              <ul className="space-y-3 mb-10">
                {[
                  "Price, bedrooms, bathrooms, amenities — all in one row",
                  "Drive time from your origin city calculated automatically",
                  "Winners highlighted so the best option jumps out",
                  "Paste up to 5 listings for a full group comparison",
                ].map((item) => (
                  <li
                    key={item}
                    className="flex items-start gap-3 text-sm text-gray-600 leading-relaxed"
                  >
                    <div className="w-5 h-5 rounded-full bg-brand-50 flex items-center justify-center shrink-0 mt-0.5">
                      <Check
                        className="w-3 h-3 text-brand-500"
                        strokeWidth={2.5}
                      />
                    </div>
                    {item}
                  </li>
                ))}
              </ul>
              <button
                onClick={onStart}
                className="group inline-flex items-center gap-2 text-brand-500 hover:text-brand-600 font-semibold text-sm transition-colors"
              >
                Try it now
                <ArrowRight className="w-4 h-4 group-hover:translate-x-0.5 transition-transform duration-200" />
              </button>
            </motion.div>

            {/* Scattered card deck */}
            <motion.div
              {...(shouldReduce
                ? {}
                : {
                    initial: { opacity: 0, x: 40 },
                    whileInView: { opacity: 1, x: 0 },
                    viewport: { once: true, margin: "-60px" },
                    transition: { duration: 0.6, ease },
                  })}
              className="relative"
            >
              {/* Scattered pile */}
              <div className="relative h-[460px]">
                {[
                  {
                    name: "Mountain Cabin",
                    loc: "Aspen, CO",
                    price: "$620/night",
                    rating: "4.91",
                    photo: "/Gemini_Generated_Image_ocfndocfndocfndo.png",
                    topPick: false,
                    zIndex: 2,
                    rotate: -14,
                    style: { left: -18, top: 55 },
                  },
                  {
                    name: "Desert Hideaway",
                    loc: "Scottsdale, AZ",
                    price: "$310/night",
                    rating: "4.78",
                    photo: "/Gemini_Generated_Image_zbas2uzbas2uzbas.png",
                    topPick: false,
                    zIndex: 3,
                    rotate: -7,
                    style: { left: 25, top: 200 },
                  },
                  {
                    name: "Coastal Retreat",
                    loc: "Malibu, CA",
                    price: "$460/night",
                    rating: "4.87",
                    photo: "/Gemini_Generated_Image_93p9b193p9b193p9.png",
                    topPick: true,
                    zIndex: 6,
                    rotate: -2,
                    style: { left: "calc(50% - 112px)", top: 0 },
                  },
                  {
                    name: "Lakeside Lodge",
                    loc: "Lake Tahoe, CA",
                    price: "$548/night",
                    rating: "4.94",
                    photo: "/Gemini_Generated_Image_soawoqsoawoqsoaw.png",
                    topPick: false,
                    zIndex: 4,
                    rotate: 11,
                    style: { right: -18, top: 35 },
                  },
                  {
                    name: "Big Sur Retreat",
                    loc: "Big Sur, CA",
                    price: "$710/night",
                    rating: "4.96",
                    photo: "/Gemini_Generated_Image_2e1fec2e1fec2e1f.png",
                    topPick: false,
                    zIndex: 5,
                    rotate: 17,
                    style: { right: 10, top: 210 },
                  },
                ].map((p) => (
                  <motion.div
                    key={p.name}
                    className="absolute"
                    style={{
                      ...(p.style as React.CSSProperties),
                      zIndex: cardZIndices[p.name] ?? p.zIndex,
                    }}
                    initial={
                      shouldReduce ? {} : { opacity: 0, scale: 0.88, y: 24 }
                    }
                    whileInView={{ opacity: 1, scale: 1, y: 0 }}
                    viewport={{ once: true, margin: "-80px" }}
                    transition={{
                      duration: 0.45,
                      ease,
                      delay: (p.zIndex - 2) * 0.1,
                    }}
                  >
                    <motion.div
                      drag
                      dragMomentum={false}
                      onClick={() => bringToFront(p.name)}
                      onDragStart={() => bringToFront(p.name)}
                      className="w-56 rounded-2xl overflow-hidden shadow-xl border-2 border-white bg-white cursor-grab active:cursor-grabbing select-none"
                      style={{ rotate: p.rotate }}
                      whileDrag={{ scale: 1.05 }}
                    >
                      <div className="h-36 relative overflow-hidden">
                        <img
                          src={p.photo}
                          alt={p.name}
                          draggable={false}
                          className="w-full h-full object-cover"
                        />
                        {p.topPick && (
                          <div className="absolute top-2 right-2 bg-brand-500 text-white text-[10px] font-bold px-2 py-0.5 rounded-full shadow">
                            Our pick
                          </div>
                        )}
                      </div>
                      <div className="p-4">
                        <p className="font-semibold text-gray-900 text-sm leading-tight truncate">
                          {p.name}
                        </p>
                        <p className="text-gray-400 text-xs mt-0.5">{p.loc}</p>
                        <div className="flex items-center justify-between mt-2">
                          <p className="text-sm font-bold text-gray-900">
                            {p.price}
                          </p>
                          <p className="text-xs text-gray-500">★ {p.rating}</p>
                        </div>
                      </div>
                    </motion.div>
                  </motion.div>
                ))}
              </div>
            </motion.div>
          </div>
        </div>
      </section>

      {/* ── Feature section B: AI recommendation ─────────────── */}
      <section className="py-24 md:py-32 bg-gray-50 overflow-hidden">
        <div className="max-w-6xl mx-auto px-6">
          <div className="grid lg:grid-cols-2 gap-14 xl:gap-20 items-center">
            {/* AI rec card */}
            <motion.div
              {...(shouldReduce
                ? {}
                : {
                    initial: { opacity: 0, x: -40 },
                    whileInView: { opacity: 1, x: 0 },
                    viewport: { once: true, margin: "-60px" },
                    transition: { duration: 0.6, ease },
                  })}
              className="order-2 lg:order-1"
            >
              <div className="bg-white rounded-2xl border border-gray-100 shadow-xl shadow-gray-200/60 p-6 sm:p-8">
                <div className="flex items-center gap-2.5 mb-6">
                  <div className="w-8 h-8 rounded-full bg-brand-50 text-brand-500 flex items-center justify-center shrink-0">
                    <Sparkles className="w-4 h-4" />
                  </div>
                  <h3 className="font-display text-lg font-semibold text-gray-900">
                    AI Recommendation
                  </h3>
                </div>

                <div className="rounded-2xl border border-brand-100 bg-gradient-to-br from-brand-50/80 via-white to-white p-5 shadow-sm mb-4">
                  <div className="flex items-start gap-4 mb-4">
                    <div className="w-11 h-11 rounded-xl bg-brand-500 flex items-center justify-center shrink-0">
                      <Trophy className="w-5 h-5 text-white" />
                    </div>
                    <div>
                      <p className="text-[10px] font-semibold text-brand-500 tracking-wider uppercase mb-0.5">
                        Top pick
                      </p>
                      <p className="font-display text-base font-semibold text-gray-900 leading-tight">
                        The Coastal Retreat
                      </p>
                    </div>
                  </div>
                  <p className="text-gray-600 text-sm leading-relaxed mb-4">
                    For a group driving from LA, The Coastal Retreat wins where
                    it counts — $350 cheaper, an extra bathroom, a hot tub, and
                    5 hours less in the car.
                  </p>
                  <div className="rounded-xl bg-gray-50 border border-gray-100 p-4">
                    <p className="text-sm text-gray-600 leading-relaxed">
                      <span className="font-semibold text-gray-900 block mb-1">
                        Consider Lakeside Lodge if:
                      </span>
                      Guest ratings are your top priority, or you'd prefer a
                      mountain setting over the beach.
                    </p>
                  </div>
                </div>
              </div>
            </motion.div>

            {/* Copy */}
            <motion.div {...fadeUp()} className="order-1 lg:order-2">
              <p className="text-brand-500 text-sm font-semibold tracking-wide uppercase mb-3">
                AI-powered insight
              </p>
              <h2 className="font-display text-3xl md:text-4xl font-semibold text-gray-900 tracking-tight leading-[1.1] mb-5">
                Find your home away from home.
              </h2>
              <p className="text-gray-500 text-lg leading-relaxed mb-8">
                Our AI reads the comparison data and gives your group a clear,
                reasoned recommendation based on your specific trip — not
                generic advice.
              </p>
              <ul className="space-y-3 mb-10">
                {[
                  "Personalized to your group size, travel method, and priorities",
                  "Generated from the same structured data shown in the table",
                  "Includes a nuanced case for each listing, not just a winner",
                  "Review summaries pulled directly from guest feedback",
                ].map((item) => (
                  <li
                    key={item}
                    className="flex items-start gap-3 text-sm text-gray-600 leading-relaxed"
                  >
                    <div className="w-5 h-5 rounded-full bg-brand-50 flex items-center justify-center shrink-0 mt-0.5">
                      <Check
                        className="w-3 h-3 text-brand-500"
                        strokeWidth={2.5}
                      />
                    </div>
                    {item}
                  </li>
                ))}
              </ul>
              <button
                onClick={onStart}
                className="group inline-flex items-center gap-2 text-brand-500 hover:text-brand-600 font-semibold text-sm transition-colors"
              >
                See it in action
                <ArrowRight className="w-4 h-4 group-hover:translate-x-0.5 transition-transform duration-200" />
              </button>
            </motion.div>
          </div>
        </div>
      </section>

      {/* ── Compatible platforms ───────────────────────────────── */}
      <section className="py-16 bg-white border-y border-gray-100">
        <div className="max-w-5xl mx-auto px-6">
          <motion.p
            {...fadeUp()}
            className="text-center text-[10px] font-semibold text-gray-400 tracking-widest uppercase mb-10"
          >
            Paste links from any of these platforms
          </motion.p>
          <motion.div
            className="flex items-center justify-center gap-10 md:gap-16 flex-wrap opacity-60"
            {...(shouldReduce
              ? {}
              : {
                  initial: "hidden",
                  whileInView: "show",
                  viewport: { once: true, margin: "-40px" },
                  variants: {
                    hidden: {},
                    show: { transition: { staggerChildren: 0.09 } },
                  },
                })}
          >
            {[
              { src: "/airbnb.png", alt: "Airbnb", href: "https://www.airbnb.com" },
              { src: "/vrbo.png", alt: "VRBO", href: "https://www.vrbo.com" },
              { src: "/booking.png", alt: "Booking.com", href: "https://www.booking.com" },
              { src: "/expedia.png", alt: "Expedia", href: "https://www.expedia.com" },
              { src: "/hotels.png", alt: "Hotels.com", href: "https://www.hotels.com" },
            ].map(({ src, alt, href }) => (
              <a key={alt} href={href} target="_blank" rel="noopener noreferrer">
                <motion.img
                  src={src}
                  alt={alt}
                  className="h-7 md:h-8 w-auto object-contain grayscale hover:grayscale-0 hover:opacity-100 transition-all duration-300 hover:scale-105"
                  {...(shouldReduce
                    ? {}
                    : {
                        variants: {
                          hidden: { opacity: 0, y: 12 },
                          show: {
                            opacity: 1,
                            y: 0,
                            transition: { duration: 0.4, ease },
                          },
                        },
                      })}
                />
              </a>
            ))}
          </motion.div>
        </div>
      </section>

      {/* ── Footer ────────────────────────────────────────────── */}
      <footer className="bg-gray-950 border-t border-gray-800/50">
        <div className="max-w-5xl mx-auto px-6 py-6 flex flex-col sm:flex-row items-center justify-between gap-3 text-xs font-medium text-gray-400">
          <p>© {new Date().getFullYear()} comparebnb</p>
          <p>Not affiliated with Airbnb, Inc.</p>
        </div>
      </footer>
    </main>
  );
}
