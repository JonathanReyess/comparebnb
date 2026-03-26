import { useState, useRef, useEffect } from "react";
import {
  Loader2,
  Pencil,
  Check,
  ChevronDown,
  ExternalLink,
  Sparkles,
  Trophy,
  MessageSquare,
  Send,
} from "lucide-react";
import {
  Category,
  CategoryType,
  FillResult,
  ListingDetails,
  Recommendation,
  TripDetails,
} from "../../types";
import { cn } from "../../lib/utils";
import { fetchAnswer, ChatMessage } from "../../services/geminiService";

interface ListingHeader {
  title: string;
  url: string;
  reviewComments: string[];
}

interface ResultsStepProps {
  selectedCategories: Category[];
  listingHeaders: ListingHeader[];
  fillResult: FillResult | null;
  isComparing: boolean;
  reviewSummaries: (string | null | undefined)[];
  recommendation: Recommendation | null;
  isLoadingRecommendation: boolean;
  onEditListings: () => void;
  tripDetails?: TripDetails;
  listingDetails?: (ListingDetails | null)[];
}

function formatValue(value: any, type: CategoryType): string {
  if (value === null || value === undefined) return "—";
  if (type === "boolean")
    return value === true || value === "true" ? "Yes" : "No";
  return String(value);
}

function isCellWinner(
  fillResult: FillResult,
  cat: Category,
  colIndex: number,
): boolean {
  const value = fillResult.values[colIndex]?.[cat.id];
  if (value === null || value === undefined) return false;

  if (cat.type === "boolean") return value === true || value === "true";

  if (cat.type === "string") {
    const winnerIndex = fillResult.winners[cat.id];
    if (winnerIndex === undefined || winnerIndex === null || winnerIndex < 0)
      return false;
    return winnerIndex === colIndex;
  }

  const winnerIndex = fillResult.winners[cat.id];
  if (winnerIndex === undefined || winnerIndex === null || winnerIndex < 0)
    return false;
  const winnerValue = fillResult.values[winnerIndex]?.[cat.id];
  return (
    winnerValue !== null &&
    winnerValue !== undefined &&
    String(value) === String(winnerValue)
  );
}

const SUGGESTED_QUESTIONS = [
  "Which listing has the better reviews?",
  "Does either listing allow pets?",
  "Which is the better value for money?",
];

export function ResultsStep({
  selectedCategories,
  listingHeaders,
  fillResult,
  isComparing,
  reviewSummaries,
  recommendation,
  isLoadingRecommendation,
  onEditListings,
  tripDetails,
  listingDetails,
}: ResultsStepProps) {
  const [expandedReviews, setExpandedReviews] = useState<Set<number>>(
    new Set([0]),
  );

  const [chatMessages, setChatMessages] = useState<ChatMessage[]>([]);
  const [askInput, setAskInput] = useState("");
  const [isAsking, setIsAsking] = useState(false);
  const messagesEndRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: "smooth" });
  }, [chatMessages, isAsking]);

  const handleAsk = async (question?: string) => {
    const q = (question ?? askInput).trim();
    if (!q || isAsking || !fillResult) return;
    setAskInput("");
    const userMsg: ChatMessage = { role: "user", content: q };
    setChatMessages((prev) => [...prev, userMsg]);
    setIsAsking(true);
    try {
      const res = await fetchAnswer({
        question: q,
        history: chatMessages,
        listings: listingHeaders.map((h, i) => ({
          title: h.title,
          fill_values: fillResult.values[i] ?? {},
          details: listingDetails?.[i]
            ? {
                available_amenities: listingDetails[i]!.available_amenities,
                house_rules: listingDetails[i]!.house_rules,
                highlights: listingDetails[i]!.highlights,
                description: listingDetails[i]!.description,
              }
            : {},
        })),
        categories: selectedCategories,
        winners: fillResult.winners,
        trip_details: tripDetails,
        review_summaries: reviewSummaries,
        recommendation,
      });
      setChatMessages((prev) => [
        ...prev,
        { role: "assistant", content: res.answer },
      ]);
    } catch {
      setChatMessages((prev) => [
        ...prev,
        {
          role: "assistant",
          content: "Sorry, I couldn't answer that. Please try again.",
        },
      ]);
    } finally {
      setIsAsking(false);
    }
  };

  const toggleReview = (i: number) => {
    setExpandedReviews((prev) => {
      const next = new Set(prev);
      if (next.has(i)) next.delete(i);
      else next.add(i);
      return next;
    });
  };

  if (isComparing || !fillResult) {
    return (
      <div className="fixed inset-0 flex flex-col items-center justify-center bg-zinc-950/50 backdrop-blur-sm z-50 animate-in fade-in duration-500">
        <div className="relative flex items-center justify-center">
          <div className="absolute inset-0 bg-brand-100 rounded-full blur-xl opacity-50 animate-pulse" />
          <Loader2 className="w-14 h-14 animate-spin text-brand-500 relative z-10" />
        </div>
        <div className="text-center mt-5 space-y-1">
          <p className="text-xl font-semibold text-white">
            Analyzing your listings…
          </p>
        </div>
      </div>
    );
  }

  // Winner counts per listing column — for the table header badges
  const categoryWins = listingHeaders.map(
    (_, colIndex) =>
      selectedCategories.filter((cat) =>
        isCellWinner(fillResult, cat, colIndex),
      ).length,
  );
  const maxWins = Math.max(...categoryWins);

  // Match top pick to a listing index for the booking section
  const topPickIndex = recommendation
    ? listingHeaders.findIndex((h) => h.title === recommendation.top_pick)
    : -1;

  return (
    <div className="w-full space-y-12 animate-in fade-in slide-in-from-bottom-4 duration-700">
      <div className="w-full bg-white/95 backdrop-blur-xl rounded-3xl shadow-2xl shadow-black/20 border border-white/40 p-6 sm:p-10 space-y-12">
        {/* Card header */}
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 pb-5 border-b border-gray-200">
          <h2 className="text-3xl font-semibold text-gray-900 tracking-tight font-display">
            Comparison
          </h2>
          <button
            type="button"
            onClick={onEditListings}
            className="inline-flex items-center justify-center gap-2 px-4 py-2.5 rounded-xl border border-gray-200 text-gray-700 font-medium text-sm hover:bg-gray-50 hover:text-gray-900 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-brand-500 transition-all shadow-sm"
          >
            <Pencil className="w-4 h-4" /> Edit listings
          </button>
        </div>

        {/* ① VERDICT — AI Recommendation (shown first) */}
        {(isLoadingRecommendation || recommendation) && (
          <div className="space-y-5">
            <div className="flex items-center gap-2">
              <div className="flex items-center justify-center w-8 h-8 rounded-full bg-brand-50 text-brand-500">
                <Sparkles className="w-4 h-4" />
              </div>
              <h3 className="text-xl font-semibold text-gray-900 tracking-tight font-display">
                Our Recommendation
              </h3>
            </div>

            {isLoadingRecommendation && !recommendation ? (
              <div className="rounded-2xl border border-brand-100 bg-brand-50/30 p-6 space-y-4">
                <div className="h-6 w-32 bg-brand-100 rounded-md animate-pulse mb-6" />
                <div className="space-y-3">
                  <div className="h-4 w-full bg-gray-200 rounded animate-pulse" />
                  <div className="h-4 w-11/12 bg-gray-200 rounded animate-pulse" />
                  <div className="h-4 w-4/5 bg-gray-200 rounded animate-pulse" />
                </div>
                <div className="h-px w-full bg-gray-200/60 my-4" />
                <div className="h-4 w-2/3 bg-gray-200 rounded animate-pulse" />
              </div>
            ) : recommendation ? (
              <div className="rounded-2xl border border-brand-200 bg-gradient-to-br from-brand-50/80 via-white to-white p-6 shadow-sm">
                <div className="flex items-start gap-4 mb-5">
                  <div className="w-12 h-12 rounded-xl bg-brand-500 flex items-center justify-center shrink-0 shadow-inner shadow-white/20">
                    <Trophy className="w-6 h-6 text-white" />
                  </div>
                  <div>
                    <p className="text-xs font-semibold text-brand-600 tracking-tight mb-1">
                      Top pick
                    </p>
                    <p className="text-xl font-semibold text-gray-900 leading-tight font-display">
                      {recommendation.top_pick}
                    </p>
                  </div>
                </div>

                <p className="text-gray-700 leading-relaxed text-sm mb-6">
                  {recommendation.why}
                </p>

                <div className="rounded-xl bg-gray-50 border border-gray-100 p-4">
                  <p className="text-sm text-gray-600 leading-relaxed">
                    <span className="font-semibold text-gray-900 block mb-1">
                      Consider the runner-up if:
                    </span>
                    {recommendation.trade_off}
                  </p>
                </div>
              </div>
            ) : null}
          </div>
        )}

        {/* ② SOCIAL PROOF — What people are saying */}
        <div className="space-y-5">
          <h3 className="text-xl font-semibold text-gray-900 tracking-tight font-display">
            What people are saying
          </h3>
          <div className="flex flex-col gap-3">
            {listingHeaders.map((h, i) => {
              const isExpanded = expandedReviews.has(i);
              return (
                <div
                  key={i}
                  className={cn(
                    "rounded-xl border transition-all duration-200 overflow-hidden",
                    isExpanded
                      ? "border-gray-300 bg-white shadow-sm"
                      : "border-gray-200 bg-white hover:border-gray-300 hover:bg-gray-50",
                  )}
                >
                  <button
                    type="button"
                    onClick={() => toggleReview(i)}
                    aria-expanded={isExpanded}
                    className="w-full flex items-center justify-between p-4 text-left focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-inset focus-visible:ring-brand-500/40 rounded-xl"
                  >
                    <span className="font-semibold text-gray-900 pr-4">
                      {h.title}
                    </span>
                    <ChevronDown
                      className={cn(
                        "w-5 h-5 text-gray-400 shrink-0 transition-transform duration-200",
                        isExpanded && "rotate-180 text-brand-500",
                      )}
                    />
                  </button>

                  {isExpanded && (
                    <div className="px-4 pb-5 pt-1 text-sm text-gray-600 leading-relaxed animate-in fade-in slide-in-from-top-2 duration-200">
                      {reviewSummaries[i] === undefined ? (
                        <div className="space-y-3 pt-2">
                          <div className="h-4 w-full bg-gray-100 rounded animate-pulse" />
                          <div className="h-4 w-5/6 bg-gray-100 rounded animate-pulse" />
                          <div className="h-4 w-4/6 bg-gray-100 rounded animate-pulse" />
                        </div>
                      ) : reviewSummaries[i] === null ? (
                        <p className="italic text-gray-400 bg-gray-50 p-3 rounded-lg">
                          Could not load review summary.
                        </p>
                      ) : (
                        <p className="bg-gray-50/50 p-4 rounded-xl border border-gray-100 text-gray-700">
                          {reviewSummaries[i]}
                        </p>
                      )}
                    </div>
                  )}
                </div>
              );
            })}
          </div>
        </div>

        {/* ③ EVIDENCE — Comparison table */}
        <div className="space-y-5">
          <h3 className="text-xl font-semibold text-gray-900 tracking-tight font-display">
            The details
          </h3>
          <div className="relative rounded-2xl border border-gray-200 bg-white shadow-sm overflow-hidden">
            <div className="overflow-x-auto">
              <table className="w-full border-collapse text-left">
                <thead>
                  <tr className="border-b border-gray-200 bg-gray-50/80">
                    <th
                      scope="col"
                      className="sticky left-0 z-20 bg-gray-50 p-4 text-xs font-bold text-gray-500 uppercase tracking-wider w-48 border-r border-gray-200 shadow-[1px_0_0_0_rgba(0,0,0,0.05)]"
                    >
                      Category
                    </th>
                    {listingHeaders.map((h, i) => (
                      <th key={i} scope="col" className="p-4 min-w-[240px]">
                        <p className="font-semibold text-gray-900 line-clamp-2">
                          {h.title}
                        </p>
                        <p
                          className={cn(
                            "text-xs mt-1 font-medium",
                            categoryWins[i] === maxWins && maxWins > 0
                              ? "text-emerald-600"
                              : "text-gray-400",
                          )}
                        >
                          {categoryWins[i]} of {selectedCategories.length}{" "}
                          categories won
                        </p>
                      </th>
                    ))}
                  </tr>
                </thead>
                <tbody className="divide-y divide-gray-100">
                  {selectedCategories.map((cat, rowIndex) => {
                    const isEven = rowIndex % 2 === 0;
                    const rowBg = isEven ? "bg-white" : "bg-gray-50/50";
                    const stickyBg = isEven ? "bg-white" : "bg-gray-50";

                    return (
                      <tr
                        key={cat.id}
                        className={cn(
                          rowBg,
                          "hover:bg-gray-50 transition-colors",
                        )}
                      >
                        <th
                          scope="row"
                          className={cn(
                            "sticky left-0 z-10 p-4 text-sm font-medium text-gray-600 border-r border-gray-100 whitespace-nowrap shadow-[1px_0_0_0_rgba(0,0,0,0.05)]",
                            stickyBg,
                          )}
                        >
                          {cat.label}
                        </th>
                        {listingHeaders.map((_, colIndex) => {
                          const value =
                            fillResult.values[colIndex]?.[cat.id] ?? null;
                          const isWinner = isCellWinner(
                            fillResult,
                            cat,
                            colIndex,
                          );

                          return (
                            <td
                              key={colIndex}
                              className={cn(
                                "p-4 text-sm transition-colors duration-200",
                                isWinner ? "bg-emerald-50/60" : "",
                              )}
                            >
                              <div className="flex items-center gap-2">
                                <span
                                  className={cn(
                                    "font-medium",
                                    isWinner
                                      ? "text-emerald-800"
                                      : value === null
                                        ? "text-gray-400"
                                        : "text-gray-800",
                                  )}
                                >
                                  {formatValue(value, cat.type)}
                                </span>
                                {isWinner && (
                                  <div className="flex items-center justify-center w-5 h-5 rounded-full bg-emerald-100 text-emerald-600">
                                    <Check className="w-3.5 h-3.5 stroke-[3]" />
                                  </div>
                                )}
                              </div>
                            </td>
                          );
                        })}
                      </tr>
                    );
                  })}
                </tbody>
              </table>
            </div>
          </div>
        </div>
        {/* ⑤ Q&A */}
        {fillResult && (
          <div className="border-t border-gray-200 pt-10 space-y-5">
            <div className="flex items-center gap-2">
              <div className="flex items-center justify-center w-8 h-8 rounded-full bg-brand-50 text-brand-500">
                <MessageSquare className="w-4 h-4" />
              </div>
              <h3 className="text-xl font-semibold text-gray-900 tracking-tight font-display">
                Ask about your listings
              </h3>
            </div>

            {/* Message history */}
            {chatMessages.length > 0 && (
              <div className="space-y-3 max-h-96 overflow-y-auto pr-1">
                {chatMessages.map((msg, i) => (
                  <div
                    key={i}
                    className={cn(
                      "flex",
                      msg.role === "user" ? "justify-end" : "justify-start",
                    )}
                  >
                    <div
                      className={cn(
                        "max-w-[85%] rounded-2xl px-4 py-3 text-sm leading-relaxed",
                        msg.role === "user"
                          ? "bg-brand-500 text-white"
                          : "bg-gray-100 text-gray-800",
                      )}
                    >
                      {msg.content}
                    </div>
                  </div>
                ))}
                {isAsking && (
                  <div className="flex justify-start">
                    <div className="bg-gray-100 rounded-2xl px-4 py-3.5">
                      <div className="flex items-center gap-1">
                        {[0, 150, 300].map((delay) => (
                          <span
                            key={delay}
                            className="w-1.5 h-1.5 bg-gray-400 rounded-full animate-bounce"
                            style={{ animationDelay: `${delay}ms` }}
                          />
                        ))}
                      </div>
                    </div>
                  </div>
                )}
                <div ref={messagesEndRef} />
              </div>
            )}

            {/* Suggested questions (empty state) */}
            {chatMessages.length === 0 && (
              <div className="flex flex-wrap gap-2">
                {SUGGESTED_QUESTIONS.map((q) => (
                  <button
                    key={q}
                    type="button"
                    onClick={() => handleAsk(q)}
                    disabled={isAsking}
                    className="text-sm px-4 py-2 rounded-full border border-gray-200 text-gray-600 hover:border-brand-300 hover:text-brand-600 hover:bg-brand-50 transition-colors disabled:opacity-50"
                  >
                    {q}
                  </button>
                ))}
              </div>
            )}

            {/* Input */}
            <div className="flex gap-2">
              <input
                type="text"
                value={askInput}
                onChange={(e) => setAskInput(e.target.value)}
                onKeyDown={(e) => e.key === "Enter" && handleAsk()}
                placeholder="e.g. Which listing is better for families?"
                disabled={isAsking}
                className="flex-1 px-4 py-2.5 rounded-xl border border-gray-200 text-sm focus:ring-2 focus:ring-brand-500/20 focus:border-brand-500 outline-none transition-[border-color,box-shadow] disabled:opacity-60"
              />
              <button
                type="button"
                onClick={() => handleAsk()}
                disabled={!askInput.trim() || isAsking}
                className="flex items-center justify-center w-10 h-10 rounded-xl bg-brand-500 hover:bg-brand-600 disabled:bg-brand-200 text-white transition-colors shrink-0"
                aria-label="Send question"
              >
                <Send className="w-4 h-4" />
              </button>
            </div>
          </div>
        )}
        {/* ④ CONVERSION — Ready to book? */}
        <div className="border-t border-gray-200 pt-10 space-y-5">
          <div>
            <h3 className="text-xl font-semibold text-gray-900 tracking-tight font-display">
              Ready to book?
            </h3>
            <p className="text-gray-500 text-sm mt-1">
              You've done the research. Now make it official.
            </p>
          </div>
          <div className="flex flex-col sm:flex-row gap-4">
            {listingHeaders.map((h, i) => {
              const isTopPick = topPickIndex === i;
              return (
                <a
                  key={i}
                  href={h.url}
                  target="_blank"
                  rel="noopener noreferrer"
                  className={cn(
                    "flex-1 group flex flex-col gap-1.5 px-6 py-5 rounded-2xl transition-all",
                    isTopPick
                      ? "bg-brand-500 hover:bg-brand-600 text-white shadow-lg shadow-brand-200"
                      : "border-2 border-gray-200 hover:border-gray-300 hover:bg-gray-50 text-gray-900",
                  )}
                >
                  {isTopPick && (
                    <span className="text-xs font-semibold text-white/70 tracking-tight">
                      Top pick
                    </span>
                  )}
                  <span className="font-bold text-base line-clamp-2 leading-snug">
                    {h.title}
                  </span>
                  <span
                    className={cn(
                      "flex items-center gap-1.5 text-xs font-medium mt-1",
                      isTopPick
                        ? "text-white/70 group-hover:text-white/90"
                        : "text-gray-400 group-hover:text-brand-500",
                    )}
                  >
                    Book on Airbnb{" "}
                    <ExternalLink className="w-3.5 h-3.5 transition-transform group-hover:translate-x-0.5" />
                  </span>
                </a>
              );
            })}
          </div>
        </div>
      </div>
    </div>
  );
}
