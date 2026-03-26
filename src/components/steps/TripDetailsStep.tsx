import { useRef, useState } from "react";
import { TripDetails } from "../../types";
import {
  Users,
  MapPin,
  Car,
  Plane,
  ArrowRight,
  Plus,
  Minus,
  Sparkles,
  Lightbulb,
} from "lucide-react";
import { cn } from "../../lib/utils";

interface TripDetailsStepProps {
  tripDetails: TripDetails;
  onChange: (details: TripDetails) => void;
  onNext: () => void;
}

const sharedFieldClass =
  "w-full rounded-2xl border border-gray-200 bg-gray-50/30 focus:bg-white focus:ring-4 focus:ring-brand-500/10 focus:border-brand-500 outline-none transition-[color,border-color,background-color,box-shadow] placeholder:text-gray-400";

export function TripDetailsStep({
  tripDetails,
  onChange,
  onNext,
}: TripDetailsStepProps) {
  const [triedToContinue, setTriedToContinue] = useState(false);
  const originRef = useRef<HTMLInputElement>(null);

  const updatePeople = (val: number) => {
    onChange({
      ...tripDetails,
      numPeople: Math.min(100, Math.max(1, tripDetails.numPeople + val)),
    });
  };

  const isComplete = tripDetails.origin.trim().length > 2;

  const handleContinue = () => {
    if (isComplete) {
      onNext();
    } else {
      setTriedToContinue(true);
      originRef.current?.focus();
    }
  };

  return (
    <div className="relative min-h-[80vh] flex items-center justify-center w-full">
      {/* Frosted Glass Card */}
      <div className="w-full max-w-xl mx-auto bg-white/95 backdrop-blur-xl rounded-3xl shadow-2xl shadow-black/20 border border-white/40 p-6 sm:p-10 animate-in fade-in zoom-in-95 duration-500 my-8">
        <div className="mb-8">
          <h2 className="text-3xl font-semibold text-gray-900 tracking-tight font-display">
            Tell us about your trip
          </h2>
          <p className="text-gray-500 mt-2">
            We'll use these details to tailor your comparison.
          </p>
        </div>

        <div className="space-y-8">
          {/* Row 1: People + Travel Method */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
            <div>
              <label className="flex items-center gap-2 text-sm font-semibold text-gray-700 mb-3">
                <Users className="w-4 h-4 text-brand-500 shrink-0" />
                Number of People
              </label>
              <div className="flex items-center justify-between border border-gray-200 rounded-2xl p-1 bg-gray-50/50">
                <button
                  type="button"
                  aria-label="Decrease number of people"
                  onClick={() => updatePeople(-1)}
                  className="w-10 h-10 flex items-center justify-center rounded-xl bg-white border border-gray-200 shadow-sm hover:bg-gray-50 active:scale-95 transition-[color,background-color,border-color,box-shadow]"
                >
                  <Minus className="w-4 h-4" />
                </button>
                <input
                  type="number"
                  min="1"
                  max="100"
                  value={tripDetails.numPeople}
                  onChange={(e) => {
                    const val = parseInt(e.target.value);
                    if (!isNaN(val) && val >= 1 && val <= 100)
                      onChange({ ...tripDetails, numPeople: val });
                  }}
                  className="text-lg font-bold w-12 text-center bg-transparent outline-none [appearance:textfield] [&::-webkit-outer-spin-button]:appearance-none [&::-webkit-inner-spin-button]:appearance-none"
                />
                <button
                  type="button"
                  aria-label="Increase number of people"
                  onClick={() => updatePeople(1)}
                  className="w-10 h-10 flex items-center justify-center rounded-xl bg-white border border-gray-200 shadow-sm hover:bg-gray-50 active:scale-95 transition-[color,background-color,border-color,box-shadow]"
                >
                  <Plus className="w-4 h-4" />
                </button>
              </div>
            </div>

            <div>
              <label className="flex items-center gap-2 text-sm font-semibold text-gray-700 mb-3">
                {tripDetails.travelMethod === "driving" ? (
                  <Car className="w-4 h-4 text-brand-500 shrink-0" />
                ) : (
                  <Plane className="w-4 h-4 text-brand-500 shrink-0" />
                )}
                Travel Method
              </label>
              <div className="relative grid grid-cols-2 p-1 bg-gray-50/50 border border-gray-200 rounded-2xl">
                <div
                  className={cn(
                    "absolute top-1 bottom-1 w-[calc(50%-4px)] bg-white shadow-sm rounded-xl border border-gray-100 transition-transform duration-300 ease-in-out",
                    tripDetails.travelMethod === "flying"
                      ? "translate-x-[calc(100%+4px)]"
                      : "translate-x-0",
                  )}
                  style={{ left: "4px" }}
                />
                {(["driving", "flying"] as const).map((method) => (
                  <button
                    key={method}
                    type="button"
                    onClick={() =>
                      onChange({ ...tripDetails, travelMethod: method })
                    }
                    className={cn(
                      "relative z-10 flex items-center justify-center gap-2 py-2.5 rounded-xl text-sm font-medium transition-colors duration-200",
                      tripDetails.travelMethod === method
                        ? "text-brand-600"
                        : "text-gray-500 hover:text-gray-700",
                    )}
                  >
                    {method === "driving" ? (
                      <Car className="w-4 h-4" />
                    ) : (
                      <Plane className="w-4 h-4" />
                    )}
                    {method.charAt(0).toUpperCase() + method.slice(1)}
                  </button>
                ))}
              </div>
            </div>
          </div>

          {/* Origin — required */}
          <div>
            <label className="flex items-center gap-2 text-sm font-semibold text-gray-700 mb-3">
              <MapPin className="w-4 h-4 text-brand-500 shrink-0" />
              {tripDetails.travelMethod === "driving"
                ? "Starting From"
                : "Destination Airport"}
              <span className="text-brand-500" aria-hidden="true"></span>
            </label>
            <input
              ref={originRef}
              type="text"
              placeholder={
                tripDetails.travelMethod === "driving"
                  ? "e.g. Durham, NC or Bay Area, CA"
                  : "e.g. JFK, LAX, or SFO"
              }
              value={tripDetails.origin}
              onChange={(e) =>
                onChange({ ...tripDetails, origin: e.target.value })
              }
              className={cn(
                sharedFieldClass,
                "pl-5 pr-4 py-4",
                triedToContinue && !isComplete && "border-amber-400",
              )}
            />
          </div>

          {/* Purpose + Priorities */}
          <div className="space-y-6">
            <div>
              <label className="flex items-center gap-2 text-sm font-semibold text-gray-700 mb-3">
                <Sparkles className="w-4 h-4 text-brand-500 shrink-0" />
                Trip Purpose & Vibe
                <span className="ml-auto text-xs font-normal text-gray-400">
                  Optional
                </span>
              </label>
              <textarea
                placeholder="e.g. A relaxing 30th birthday weekend with focus on good food and spas."
                value={tripDetails.purpose}
                onChange={(e) =>
                  onChange({ ...tripDetails, purpose: e.target.value })
                }
                className={cn(sharedFieldClass, "p-5 min-h-[88px] resize-none")}
              />
            </div>

            <div>
              <label className="flex items-center gap-2 text-sm font-semibold text-gray-700 mb-3">
                <Lightbulb className="w-4 h-4 text-brand-500 shrink-0" />
                Must-Haves & Priorities
                <span className="ml-auto text-xs font-normal text-gray-400">
                  Optional
                </span>
              </label>
              <textarea
                placeholder="e.g. Must be pet friendly, walking distance to a grocery store, or has a private pool."
                value={tripDetails.priorities}
                onChange={(e) =>
                  onChange({ ...tripDetails, priorities: e.target.value })
                }
                className={cn(sharedFieldClass, "p-5 min-h-[88px] resize-none")}
              />
            </div>
          </div>
        </div>

        <div className="mt-10">
          <div className="flex md:justify-end">
            <button
              type="button"
              onClick={handleContinue}
              className={cn(
                "w-full md:w-auto flex items-center justify-center gap-2 px-10 py-4 rounded-2xl font-bold text-white transition-[color,background-color,transform,box-shadow] shadow-lg",
                isComplete
                  ? "bg-brand-500 hover:bg-brand-600 hover:-translate-y-0.5 active:translate-y-0 shadow-brand-200"
                  : "bg-gray-300 shadow-none",
              )}
            >
              Continue <ArrowRight className="w-5 h-5" />
            </button>
          </div>
          {!isComplete && triedToContinue && (
            <p className="mt-2.5 text-sm text-amber-600 flex items-center gap-1.5 md:justify-end">
              <MapPin className="w-3.5 h-3.5 shrink-0" />
              Add your{" "}
              {tripDetails.travelMethod === "driving"
                ? "starting location"
                : "airport"}{" "}
              to continue
            </p>
          )}
        </div>
      </div>
    </div>
  );
}
