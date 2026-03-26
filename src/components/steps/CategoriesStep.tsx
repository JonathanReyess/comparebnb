import { useEffect, useState } from "react";
import {
  Category,
  CategoryType,
  ListingDetails,
  TripDetails,
} from "../../types";
import { NON_REMOVABLE_CATEGORY_IDS } from "../../constants";
import { suggestCategories } from "../../services/geminiService";
import {
  X,
  ArrowRight,
  Plus,
  Sparkles,
  Loader2,
  ChevronLeft,
  Lock,
} from "lucide-react";

interface CategoriesStepProps {
  tripDetails: TripDetails;
  scrapedListings: ListingDetails[];
  selectedCategories: Category[];
  onAddCategory: (category: Category) => void;
  onRemoveCategory: (id: string) => void;
  customCategoryName: string;
  onCustomCategoryNameChange: (name: string) => void;
  customCategoryType: CategoryType;
  onCustomCategoryTypeChange: (type: CategoryType) => void;
  onAddCustomCategory: () => void;
  onBack: () => void;
  onNext: () => void;
}

export function CategoriesStep({
  tripDetails,
  scrapedListings,
  selectedCategories,
  onAddCategory,
  onRemoveCategory,
  customCategoryName,
  onCustomCategoryNameChange,
  customCategoryType,
  onCustomCategoryTypeChange,
  onAddCustomCategory,
  onBack,
  onNext,
}: CategoriesStepProps) {
  const [suggestions, setSuggestions] = useState<Category[]>([]);
  const [loadingSuggestions, setLoadingSuggestions] = useState(true);
  const [suggestionError, setSuggestionError] = useState(false);
  const [duplicateError, setDuplicateError] = useState(false);

  // eslint-disable-next-line react-hooks/exhaustive-deps
  useEffect(() => {
    setLoadingSuggestions(true);
    suggestCategories(tripDetails, scrapedListings)
      .then(setSuggestions)
      .catch(() => setSuggestionError(true))
      .finally(() => setLoadingSuggestions(false));
  }, []);

  const visibleSuggestions = suggestions.filter(
    (s) => !selectedCategories.some((c) => c.id === s.id),
  );

  const handleAddCustom = () => {
    const newId = customCategoryName.toLowerCase().replace(/\s+/g, "_");
    if (selectedCategories.some((c) => c.id === newId)) {
      setDuplicateError(true);
      return;
    }
    setDuplicateError(false);
    onAddCustomCategory();
  };

  return (
    <div className="relative min-h-[80vh] flex items-center justify-center w-full">
      {/* Frosted Glass Card */}
      <div className="w-full max-w-xl mx-auto bg-white/95 backdrop-blur-xl rounded-3xl shadow-2xl shadow-black/20 border border-white/40 p-6 sm:p-10 animate-in fade-in zoom-in-95 duration-500 my-8">
        <h2 className="text-3xl font-semibold text-gray-900 tracking-tight font-display mb-2">
          What do you want to compare?
        </h2>
        <p className="text-gray-500 mb-8">
          Pick what matters to your group — we'll pull the details from each listing.
        </p>

        {/* Selected categories */}
        <div className="flex flex-wrap gap-2 mb-8">
          {selectedCategories.map((cat) => {
            const nonRemovable = NON_REMOVABLE_CATEGORY_IDS.has(cat.id);
            return (
              <div
                key={cat.id}
                title={nonRemovable ? "Always included" : undefined}
                className="bg-gray-100 border border-gray-200 rounded-full px-4 py-1.5 flex items-center gap-2 text-sm"
              >
                <span className="font-medium text-gray-700">{cat.label}</span>
                {nonRemovable ? (
                  <Lock
                    className="w-3 h-3 text-gray-400 shrink-0"
                    aria-label="Always included"
                  />
                ) : (
                  <button
                    type="button"
                    aria-label={`Remove ${cat.label}`}
                    onClick={() => onRemoveCategory(cat.id)}
                    className="text-gray-400 hover:text-red-500 transition-colors"
                  >
                    <X className="w-4 h-4" />
                  </button>
                )}
              </div>
            );
          })}
        </div>

        {/* AI suggestions — left accent, no nested card */}
        <div className="border-l-2 border-brand-200 pl-4 mb-8">
          <h3 className="text-sm font-semibold text-brand-700 mb-3 flex items-center gap-2">
            <Sparkles className="w-4 h-4" />
            Suggested for your trip
          </h3>

          {loadingSuggestions ? (
            <div className="flex items-center gap-2 text-sm text-brand-600">
              <Loader2 className="w-4 h-4 animate-spin" />
              Generating suggestions based on your trip details…
            </div>
          ) : suggestionError ? (
            <p className="text-sm text-gray-500">
              Couldn't load suggestions — the categories above are a great starting point.
            </p>
          ) : visibleSuggestions.length === 0 ? (
            <p className="text-sm text-gray-500">All suggestions have been added.</p>
          ) : (
            <div className="flex flex-wrap gap-2">
              {visibleSuggestions.map((cat) => (
                <button
                  key={cat.id}
                  type="button"
                  onClick={() => onAddCategory(cat)}
                  className="flex items-center gap-1.5 bg-white border border-brand-200 hover:border-brand-400 hover:bg-brand-50 text-brand-700 rounded-full px-3 py-1.5 text-sm font-medium transition-[color,border-color,background-color]"
                >
                  <Plus className="w-3.5 h-3.5" />
                  {cat.label}
                </button>
              ))}
            </div>
          )}
        </div>

        {/* Custom category — flat section, no nested card */}
        <div className="border-t border-gray-100 pt-6">
          <h3 className="text-sm font-semibold text-gray-500 mb-4">
            Something we missed?
          </h3>
          <div className="flex flex-col sm:flex-row gap-3 items-end">
            <input
              type="text"
              placeholder="e.g. Has a pool table"
              value={customCategoryName}
              onChange={(e) => {
                onCustomCategoryNameChange(e.target.value);
                setDuplicateError(false);
              }}
              onKeyDown={(e) => e.key === "Enter" && handleAddCustom()}
              className="flex-1 px-4 py-2.5 rounded-2xl border border-gray-200 focus:ring-2 focus:ring-brand-500/20 focus:border-brand-500 outline-none transition-[border-color,box-shadow]"
            />
            <div className="flex flex-col gap-1">
              <span className="text-xs font-medium text-gray-400 pl-1">Format</span>
              <select
                value={customCategoryType}
                onChange={(e) =>
                  onCustomCategoryTypeChange(e.target.value as CategoryType)
                }
                className="px-4 py-2.5 rounded-2xl border border-gray-200 focus:ring-2 focus:ring-brand-500/20 focus:border-brand-500 outline-none bg-white transition-[border-color,box-shadow] text-sm"
              >
                <option value="string" title="Free text — for descriptions, names, or addresses">
                  Text
                </option>
                <option value="boolean" title="A simple Yes or No answer">
                  Yes / No
                </option>
                <option value="number" title="A numeric count, like bedrooms or max guests">
                  Number
                </option>
                <option value="price" title="A dollar amount, like nightly rate or cleaning fee">
                  Price ($)
                </option>
              </select>
            </div>
            <button
              type="button"
              onClick={handleAddCustom}
              disabled={!customCategoryName.trim()}
              className="px-6 py-2.5 rounded-2xl bg-brand-500 hover:bg-brand-600 disabled:bg-brand-200 text-white font-medium transition-[background-color] whitespace-nowrap"
            >
              Add
            </button>
          </div>
          {duplicateError && (
            <p className="mt-2 pl-1 text-sm text-red-500">
              Already in your list — try a different name.
            </p>
          )}
        </div>

        {/* Navigation footer */}
        <div className="mt-8 flex items-center justify-between">
          <button
            type="button"
            onClick={onBack}
            className="flex items-center gap-2 text-gray-500 hover:text-gray-900 px-4 py-2 font-bold transition-[color,transform] hover:-translate-x-1"
          >
            <ChevronLeft className="w-5 h-5" /> Back
          </button>
          <button
            type="button"
            onClick={onNext}
            className="flex items-center gap-2 px-8 py-3 rounded-2xl bg-brand-500 hover:bg-brand-600 text-white font-bold transition-[background-color,transform,box-shadow] hover:-translate-y-0.5 active:translate-y-0 shadow-lg shadow-brand-200"
          >
            Compare Listings <ArrowRight className="w-5 h-5" />
          </button>
        </div>
      </div>
    </div>
  );
}
