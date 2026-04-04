import { useState } from "react";
import {
  Plus,
  Trash2,
  ChevronLeft,
  ArrowRight,
  CheckCircle2,
  Loader2,
  AlertCircle,
} from "lucide-react";
import { cn } from "../../lib/utils";

function validateListingUrl(url: string): string | null {
  const trimmed = url.trim();
  if (!trimmed) return null;
  let parsed: URL;
  try {
    parsed = new URL(trimmed);
  } catch {
    return "Please enter a valid URL.";
  }
  if (!parsed.searchParams.has("check_in") || !parsed.searchParams.has("check_out")) {
    return "Link is missing check-in / check-out dates. Open the listing with your dates selected and paste the full URL.";
  }
  return null;
}

interface ListingsStepProps {
  listingInputs: string[];
  onUpdate: (index: number, value: string) => void;
  onAdd: () => void;
  onRemove: (index: number) => void;
  onBack: () => void;
  onNext: () => void;
  onSkip: () => void;
  isLoading: boolean;
}

export function ListingsStep({
  listingInputs,
  onUpdate,
  onAdd,
  onRemove,
  onBack,
  onNext,
  onSkip,
  isLoading,
}: ListingsStepProps) {
  const [touched, setTouched] = useState<boolean[]>(() =>
    listingInputs.map(() => false)
  );

  const handleBlur = (index: number) => {
    setTouched((prev) => {
      const next = [...prev];
      next[index] = true;
      return next;
    });
  };

  const syncedTouched = listingInputs.map((_, i) => touched[i] ?? false);
  const errors = listingInputs.map((url) => validateListingUrl(url));
  const filledCount = listingInputs.filter((u) => u.trim().length > 10).length;
  const canCompare =
    filledCount >= 2 &&
    listingInputs.every((u) => validateListingUrl(u) === null);

  return (
    <div className="relative min-h-[80vh] flex items-center justify-center w-full">
      {/* Frosted Glass Card */}
      <div className="w-full max-w-xl mx-auto bg-white/95 backdrop-blur-xl rounded-3xl shadow-2xl shadow-black/20 border border-white/40 p-6 sm:p-10 animate-in fade-in zoom-in-95 duration-500 my-8">
        <div className="mb-8">
          <h2 className="text-3xl font-semibold text-gray-900 tracking-tight font-display">
            Add your listings
          </h2>
          <p className="text-gray-500 mt-2 max-w-md">
            Paste the Airbnb links for the places you're comparing. We'll take it from there.
          </p>
        </div>

        <div className="space-y-6 mb-10">
          {listingInputs.map((input, index) => {
            const isFilled = input.trim().length > 10;
            const error = errors[index];
            const showError = syncedTouched[index] && error !== null;

            return (
              <div
                key={index}
                className="group relative flex gap-4 animate-in slide-in-from-right-4 duration-300"
              >
                <div className="flex-1 relative">
                  {/* Status indicator */}
                  <div
                    className={cn(
                      "absolute left-4 top-5 w-8 h-8 rounded-xl flex items-center justify-center text-sm font-bold transition-[background-color,color] duration-300 z-10",
                      showError
                        ? "bg-red-100 text-red-500"
                        : isFilled
                          ? "bg-brand-100 text-brand-600 shadow-sm"
                          : "bg-gray-100 text-gray-400 group-focus-within:bg-brand-100 group-focus-within:text-brand-600",
                    )}
                  >
                    {showError ? (
                      <AlertCircle className="w-5 h-5" />
                    ) : isFilled ? (
                      <CheckCircle2 className="w-5 h-5" />
                    ) : (
                      index + 1
                    )}
                  </div>

                  <textarea
                    placeholder="Paste an Airbnb link — e.g. airbnb.com/rooms/12345?check_in=…&check_out=…"
                    value={input}
                    onChange={(e) => onUpdate(index, e.target.value)}
                    onBlur={() => handleBlur(index)}
                    className={cn(
                      "w-full pl-16 pr-4 py-5 rounded-2xl border outline-none transition-[border-color,background-color,box-shadow] duration-200 min-h-[100px] resize-none text-sm leading-relaxed",
                      showError
                        ? "border-red-300 bg-red-50/30 focus:border-red-400 focus:ring-4 focus:ring-red-400/10"
                        : isFilled
                          ? "border-brand-200 bg-brand-50/20 focus:border-brand-500 focus:ring-4 focus:ring-brand-500/10"
                          : "border-gray-200 bg-gray-50/30 focus:bg-white focus:border-brand-500 focus:ring-4 focus:ring-brand-500/10",
                    )}
                  />

                  {showError && (
                    <p className="mt-2 text-xs text-red-500 flex items-start gap-1.5 pl-1">
                      <AlertCircle className="w-3.5 h-3.5 mt-0.5 shrink-0" />
                      {error}
                    </p>
                  )}
                </div>

                {/* Delete button — only rendered when listings are removable */}
                {listingInputs.length > 2 && (
                  <div className="flex flex-col justify-start pt-2">
                    <button
                      type="button"
                      aria-label={`Remove listing ${index + 1}`}
                      onClick={() => onRemove(index)}
                      className="p-3 text-gray-400 hover:text-red-500 hover:bg-red-50 rounded-2xl transition-[color,background-color] active:scale-90"
                    >
                      <Trash2 className="w-5 h-5" />
                    </button>
                  </div>
                )}
              </div>
            );
          })}
        </div>

        {/* Add listing button */}
        {listingInputs.length >= 5 ? (
          <p className="w-full text-center py-4 text-sm text-gray-400">
            Maximum of 5 listings reached.
          </p>
        ) : (
          <button
            type="button"
            onClick={onAdd}
            className="w-full flex items-center justify-center gap-3 py-6 rounded-2xl border-2 border-dashed border-gray-200 text-gray-500 hover:border-brand-300 hover:text-brand-600 hover:bg-brand-50/30 transition-[color,border-color,background-color] font-semibold group"
          >
            <div className="w-8 h-8 rounded-full bg-gray-100 group-hover:bg-brand-100 flex items-center justify-center transition-colors">
              <Plus className="w-5 h-5" />
            </div>
            Add another listing
          </button>
        )}

        {/* Navigation footer */}
        <div className="mt-12 flex items-center justify-between pt-8 border-t border-gray-100">
          <button
            type="button"
            onClick={onBack}
            className="flex items-center gap-2 text-gray-500 hover:text-gray-900 px-4 py-2 font-bold transition-[color,transform] hover:-translate-x-1"
          >
            <ChevronLeft className="w-5 h-5" /> Back
          </button>

          <div className="flex items-center gap-3">
            {import.meta.env.DEV && (
              <button
                type="button"
                onClick={onSkip}
                className="text-sm text-gray-400 hover:text-gray-600 px-3 py-2 transition-colors"
              >
                [dev] skip →
              </button>
            )}

            <button
              type="button"
              onClick={onNext}
              disabled={!canCompare || isLoading}
              className={cn(
                "flex items-center gap-2 px-5 py-3 sm:px-10 sm:py-4 text-sm sm:text-base rounded-2xl font-bold text-white transition-[color,background-color,transform,box-shadow] shadow-lg",
                canCompare && !isLoading
                  ? "bg-brand-500 hover:bg-brand-600 hover:-translate-y-0.5 active:translate-y-0 shadow-brand-200"
                  : "bg-gray-300 cursor-not-allowed shadow-none",
              )}
            >
              {isLoading ? (
                <>
                  <Loader2 className="w-5 h-5 animate-spin" />
                  Fetching…
                </>
              ) : (
                <>
                  Continue <ArrowRight className="w-5 h-5" />
                </>
              )}
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}
