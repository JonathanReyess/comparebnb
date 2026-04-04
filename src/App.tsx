import { useState, useRef } from "react";
import { TripDetails, ListingDetails, FillResult, Recommendation, Category, CategoryType } from "./types";
import { PREDEFINED_CATEGORIES, NON_REMOVABLE_CATEGORY_IDS } from "./constants";
import { fetchListingPrice, fetchListingDetails, fetchLocation, fetchFillData, fetchRecommendation, fetchReviewSummary } from "./services/geminiService";
import { Header } from "./components/Header";
import { LandingPage } from "./components/LandingPage";
import { StepIndicator } from "./components/StepIndicator";
import { TripDetailsStep } from "./components/steps/TripDetailsStep";
import { CategoriesStep } from "./components/steps/CategoriesStep";
import { ListingsStep } from "./components/steps/ListingsStep";
import { ResultsStep } from "./components/steps/ResultsStep";

export default function App() {
  const [step, setStep] = useState<0 | 1 | 2 | 3 | 4>(0);
  const slideDir = useRef<"right" | "left">("right");

  const goTo = (next: 0 | 1 | 2 | 3 | 4, back = false) => {
    slideDir.current = back ? "left" : "right";
    setStep(next);
  };

  const [tripDetails, setTripDetails] = useState<TripDetails>({
    numPeople: 2,
    purpose: "",
    priorities: "",
    travelMethod: "driving",
    origin: "",
  });

  const [selectedCategories, setSelectedCategories] = useState<Category[]>(PREDEFINED_CATEGORIES);
  const [customCategoryName, setCustomCategoryName] = useState("");
  const [customCategoryType, setCustomCategoryType] = useState<CategoryType>("string");

  const [listingInputs, setListingInputs] = useState<string[]>(["", ""]);
  const [scrapedListingsData, setScrapedListingsData] = useState<Array<{ details: ListingDetails | null; address: string | null; error?: string }>>([]);
  const [isScrapingListings, setIsScrapingListings] = useState(false);
  const [fillResult, setFillResult] = useState<FillResult | null>(null);
  const [recommendation, setRecommendation] = useState<Recommendation | null>(null);
  const [reviewSummaries, setReviewSummaries] = useState<(string | null | undefined)[]>([]);
  const [isComparing, setIsComparing] = useState(false);
  const [isLoadingRecommendation, setIsLoadingRecommendation] = useState(false);

  const handleAddCategory = (category: Category) => {
    if (!selectedCategories.some((c) => c.id === category.id)) {
      setSelectedCategories([...selectedCategories, category]);
    }
  };

  const handleRemoveCategory = (id: string) => {
    if (NON_REMOVABLE_CATEGORY_IDS.has(id)) return;
    setSelectedCategories(selectedCategories.filter((c) => c.id !== id));
  };

  const handleAddCustomCategory = () => {
    if (!customCategoryName.trim()) return;
    const newId = customCategoryName.toLowerCase().replace(/\s+/g, "_");
    if (selectedCategories.some((c) => c.id === newId)) return;
    setSelectedCategories([...selectedCategories, { id: newId, label: customCategoryName, type: customCategoryType, isCustom: true }]);
    setCustomCategoryName("");
  };

  const handleListingsNext = async () => {
    const validInputs = listingInputs.filter((input) => input.trim() !== "");
    if (validInputs.length < 2) {
      alert("Please provide at least 2 listings.");
      return;
    }

    setIsScrapingListings(true);

    const results = await Promise.all(
      validInputs.map(async (input) => {
        try {
          const details = await fetchListingDetails(input);
          const address =
            details.coordinates?.latitude && details.coordinates?.longitude
              ? await fetchLocation(details.coordinates.latitude, details.coordinates.longitude)
              : null;
          return { details, address };
        } catch (error: any) {
          return { details: null, address: null, error: error.message };
        }
      })
    );

    setScrapedListingsData(results);

    const driveTimeCat: Category =
      tripDetails.travelMethod === "driving"
        ? { id: "drive_time", label: "Drive time from origin", type: "string" }
        : { id: "drive_time_airport", label: "Drive time to nearest airport", type: "string" };

    setSelectedCategories((prev) =>
      prev.some((c) => c.id === driveTimeCat.id) ? prev : [...prev, driveTimeCat]
    );

    setIsScrapingListings(false);
    goTo(3);
  };

  const handleCompare = async () => {
    const validInputs = listingInputs.filter((input) => input.trim() !== "");

    setIsComparing(true);
    setFillResult(null);
    setRecommendation(null);
    setIsLoadingRecommendation(true);
    goTo(4);

    // Kick off review summaries immediately — they only need scraped data
    setReviewSummaries(validInputs.map(() => undefined));
    validInputs.forEach((_, i) => {
      const comments = scrapedListingsData[i]?.details?.review_comments ?? [];
      const title = scrapedListingsData[i]?.details?.title ?? `Listing ${i + 1}`;
      fetchReviewSummary({ reviews: comments, listing_title: title })
        .then((res) => setReviewSummaries((prev) => { const next = [...prev]; next[i] = res.summary; return next; }))
        .catch(() => setReviewSummaries((prev) => { const next = [...prev]; next[i] = null; return next; }));
    });

    // Fetch prices in parallel
    const prices = await Promise.all(
      validInputs.map(async (url) => {
        try { return await fetchListingPrice(url); }
        catch { return null; }
      })
    );

    // Fetch fill first — table becomes visible as soon as this resolves
    let fillRes: FillResult | null = null;
    try {
      fillRes = await fetchFillData({
        categories: selectedCategories,
        trip_details: tripDetails,
        listings: validInputs.map((url, i) => ({
          url,
          price_data: prices[i] ?? undefined,
          details: (scrapedListingsData[i]?.details ?? {}) as Record<string, any>,
        })),
      });
      setFillResult(fillRes);
    } catch (error: any) {
      console.error("Fill failed:", error);
    }

    setIsComparing(false);

    // Recommendation runs after fill — it receives structured comparison values + winners
    // so Gemini can reason from the same data the table shows (ratings, scores, ranked winners)
    if (fillRes) {
      fetchRecommendation({
        trip_details: tripDetails,
        listings: validInputs.map((url, i) => ({
          title: scrapedListingsData[i]?.details?.title ?? `Listing ${i + 1}`,
          url,
          details: (scrapedListingsData[i]?.details ?? {}) as Record<string, any>,
          fill_values: fillRes!.values[i] ?? {},
        })),
        winners: fillRes.winners,
      })
        .then(setRecommendation)
        .catch((e) => console.error("Recommendation failed:", e))
        .finally(() => setIsLoadingRecommendation(false));
    } else {
      setIsLoadingRecommendation(false);
    }
  };

  return (
    <div className={`min-h-screen text-gray-900 font-sans pb-20 transition-colors duration-500 ${step === 0 ? "bg-white" : "bg-transparent"}`}>
      {/* Persistent video background — always mounted so it's playing before step 0 → 1 transition */}
      <div className="fixed inset-0 z-[-1] overflow-hidden bg-gray-950">
        <video autoPlay muted loop playsInline poster="/beach_landing_poster.jpg" className="absolute inset-0 w-full h-full object-cover scale-105">
          <source src="/beach_landing.webm" type="video/webm" />
          <source src="/beach_landing.mp4" type="video/mp4" />
        </video>
        <div className="absolute inset-0 bg-gray-950/40 backdrop-blur-md" />
      </div>

      <Header step={step} onLogoClick={() => goTo(0, true)} onStartClick={() => goTo(1)} />

      <div
        key={step}
        className={`animate-in fade-in duration-400 ${slideDir.current === "right" ? "slide-in-from-right-8" : "slide-in-from-left-8"}`}
      >
        {step === 0 ? (
          <LandingPage onStart={() => goTo(1)} />
        ) : (
          <main className={`mx-auto px-4 sm:px-6 lg:px-8 pt-35 pb-8 ${step === 4 ? "max-w-screen-xl" : "max-w-5xl"}`}>
            {step < 4 && (
              <StepIndicator
                step={step}
                onStepClick={(s) => goTo(s as 0 | 1 | 2 | 3 | 4, true)}
              />
            )}
            <div>
            {step === 1 && (
              <TripDetailsStep
                tripDetails={tripDetails}
                onChange={setTripDetails}
                onNext={() => goTo(2)}
              />
            )}

            {step === 2 && (
              <ListingsStep
                listingInputs={listingInputs}
                onUpdate={(i, v) => { const next = [...listingInputs]; next[i] = v; setListingInputs(next); }}
                onAdd={() => { if (listingInputs.length < 5) setListingInputs([...listingInputs, ""]); }}
                onRemove={(i) => { if (listingInputs.length <= 2) return; setListingInputs(listingInputs.filter((_, idx) => idx !== i)); }}
                onBack={() => goTo(1, true)}
                onNext={handleListingsNext}
                onSkip={() => goTo(3)}
                isLoading={isScrapingListings}
              />
            )}

            {step === 3 && (
              <CategoriesStep
                tripDetails={tripDetails}
                scrapedListings={scrapedListingsData.map((d) => d.details).filter((d): d is ListingDetails => d !== null)}
                selectedCategories={selectedCategories}
                onAddCategory={handleAddCategory}
                onRemoveCategory={handleRemoveCategory}
                customCategoryName={customCategoryName}
                onCustomCategoryNameChange={setCustomCategoryName}
                customCategoryType={customCategoryType}
                onCustomCategoryTypeChange={setCustomCategoryType}
                onAddCustomCategory={handleAddCustomCategory}
                onBack={() => goTo(2, true)}
                onNext={handleCompare}
              />
            )}

            {step === 4 && (
              <ResultsStep
                selectedCategories={selectedCategories}
                listingHeaders={listingInputs
                  .filter((u) => u.trim() !== "")
                  .map((url, i) => ({
                    title: scrapedListingsData[i]?.details?.title ?? `Listing ${i + 1}`,
                    url,
                    coverImage: scrapedListingsData[i]?.details?.cover_image ?? null,
                    reviewComments: scrapedListingsData[i]?.details?.review_comments ?? [],
                  }))}
                tripDetails={tripDetails}
                listingDetails={listingInputs
                  .filter((u) => u.trim() !== "")
                  .map((_, i) => scrapedListingsData[i]?.details ?? null)}
                fillResult={fillResult}
                isComparing={isComparing}
                reviewSummaries={reviewSummaries}
                recommendation={recommendation}
                isLoadingRecommendation={isLoadingRecommendation}
                onEditListings={() => goTo(2, true)}
              />
            )}
            </div>
          </main>
        )}
      </div>
    </div>
  );
}
