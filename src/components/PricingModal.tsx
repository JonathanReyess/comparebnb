import { useState } from "react";
import { createPortal } from "react-dom";
import { Lock, Zap, Star, Sparkles, X, Loader2 } from "lucide-react";
import { useAuth } from "../contexts/AuthContext";
import { createCheckoutSession } from "../services/stripeService";

interface PricingModalProps {
  onClose: () => void;
}

export function PricingModal({ onClose }: PricingModalProps) {
  const { user } = useAuth();
  const [loading, setLoading] = useState<"credits" | "sub" | null>(null);

  const checkout = async (type: "credits" | "sub") => {
    if (!user) return;
    setLoading(type);
    try {
      const priceId = type === "credits"
        ? import.meta.env.VITE_STRIPE_CREDITS_PRICE_ID as string
        : import.meta.env.VITE_STRIPE_SUB_PRICE_ID as string;
      await createCheckoutSession(priceId, user.id, type === "credits" ? "payment" : "subscription");
    } catch (e) {
      console.error(e);
      setLoading(null);
    }
  };

  return createPortal(
    <div className="fixed inset-0 z-[100] flex items-center justify-center p-4">
      <div className="absolute inset-0 bg-gray-950/60 backdrop-blur-sm" onClick={onClose} />
      <div className="relative bg-white rounded-3xl shadow-2xl border border-gray-100 p-8 max-w-sm w-full animate-in fade-in zoom-in-95 duration-200">
        <button
          onClick={onClose}
          className="absolute top-4 right-4 p-2 text-gray-400 hover:text-gray-600 hover:bg-gray-100 rounded-xl transition-colors"
        >
          <X className="w-4 h-4" />
        </button>

        <div className="text-center mb-7">
          <div className="w-12 h-12 rounded-2xl bg-brand-500 flex items-center justify-center mx-auto mb-4 shadow-lg shadow-brand-500/30">
            <Lock className="w-6 h-6 text-white" />
          </div>
          <h3 className="font-semibold text-gray-900 text-xl">Credits Required</h3>
          <p className="text-gray-500 text-sm mt-1.5">
            Each comparison uses 1 credit. Get credits to run AI-powered comparisons.
          </p>
        </div>

        <div className="space-y-3">
          <div className="border-2 border-gray-200 hover:border-brand-300 rounded-2xl p-4 transition-colors">
            <div className="flex items-start justify-between mb-3">
              <div>
                <div className="flex items-center gap-2">
                  <Zap className="w-4 h-4 text-brand-500" />
                  <span className="font-semibold text-gray-900">One-Trip Pass</span>
                </div>
                <p className="text-xs text-gray-500 mt-0.5">5 credits · run any 5 comparisons</p>
              </div>
              <span className="font-bold text-gray-900 text-lg">$2.99</span>
            </div>
            <button
              onClick={() => checkout("credits")}
              disabled={!!loading}
              className="w-full bg-brand-500 hover:bg-brand-600 text-white py-2.5 rounded-xl text-sm font-semibold transition-colors disabled:opacity-60 flex items-center justify-center gap-2"
            >
              {loading === "credits" ? <Loader2 className="w-4 h-4 animate-spin" /> : null}
              Buy 5 Credits
            </button>
          </div>

          <div className="border-2 border-brand-500 rounded-2xl p-4 relative overflow-hidden">
            <div className="absolute top-0 right-0 bg-brand-500 text-white text-[10px] font-bold px-3 py-1 rounded-bl-xl tracking-wide">
              BEST VALUE
            </div>
            <div className="flex items-start justify-between mb-3">
              <div>
                <div className="flex items-center gap-2">
                  <Star className="w-4 h-4 text-brand-500" />
                  <span className="font-semibold text-gray-900">Power Planner</span>
                </div>
                <p className="text-xs text-gray-500 mt-0.5">Unlimited comparisons + history</p>
              </div>
              <div className="text-right">
                <span className="font-bold text-gray-900 text-lg">$7.99</span>
                <span className="text-xs text-gray-400">/mo</span>
              </div>
            </div>
            <button
              onClick={() => checkout("sub")}
              disabled={!!loading}
              className="w-full bg-brand-500 hover:bg-brand-600 text-white py-2.5 rounded-xl text-sm font-semibold transition-colors disabled:opacity-60 flex items-center justify-center gap-1.5"
            >
              {loading === "sub" ? <Loader2 className="w-4 h-4 animate-spin" /> : <Sparkles className="w-3.5 h-3.5" />}
              Start Power Planner
            </button>
          </div>
        </div>

        <button onClick={onClose} className="w-full mt-4 text-xs text-gray-400 hover:text-gray-600 transition-colors py-1">
          Maybe later
        </button>
      </div>
    </div>,
    document.body
  );
}
