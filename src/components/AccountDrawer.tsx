import { useEffect, useRef } from "react";
import { Zap, Star, Crown, LogOut, CreditCard, History, RotateCcw } from "lucide-react";
import { useAuth } from "../contexts/AuthContext";
import { useAccountData, SavedComparison } from "../hooks/useAccountData";
import { createCheckoutSession } from "../services/stripeService";
import { cn } from "../lib/utils";

interface AccountDropdownProps {
  open: boolean;
  onClose: () => void;
  isLight?: boolean;
  onRestoreComparison?: (snapshot: SavedComparison["snapshot"]) => void;
}

export function AccountDropdown({ open, onClose, isLight, onRestoreComparison }: AccountDropdownProps) {
  const { user, signOut } = useAuth();
  const { credits, isSubscribed, subscriptionPeriodEnd, savedComparisons, isLoading } = useAccountData();
  const ref = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (!open) return;
    const handler = (e: MouseEvent) => {
      if (ref.current && !ref.current.contains(e.target as Node)) onClose();
    };
    // Delay so the click that opened it doesn't immediately close it
    const t = setTimeout(() => document.addEventListener("mousedown", handler), 0);
    return () => { clearTimeout(t); document.removeEventListener("mousedown", handler); };
  }, [open, onClose]);

  useEffect(() => {
    if (!open) return;
    const handler = (e: KeyboardEvent) => { if (e.key === "Escape") onClose(); };
    window.addEventListener("keydown", handler);
    return () => window.removeEventListener("keydown", handler);
  }, [open, onClose]);

  useEffect(() => {
    if (!open) return;
    window.addEventListener("scroll", onClose, { passive: true });
    return () => window.removeEventListener("scroll", onClose);
  }, [open, onClose]);

  const handleBuyCredits = async () => {
    if (!user) return;
    onClose();
    try {
      await createCheckoutSession(
        import.meta.env.VITE_STRIPE_CREDITS_PRICE_ID as string,
        user.id,
        "payment"
      );
    } catch (e) { console.error(e); }
  };

  const handleSubscribe = async () => {
    if (!user) return;
    onClose();
    try {
      await createCheckoutSession(
        import.meta.env.VITE_STRIPE_SUB_PRICE_ID as string,
        user.id,
        "subscription"
      );
    } catch (e) { console.error(e); }
  };

  if (!open || !user) return null;

  const glass = isLight
    ? "bg-white/90 backdrop-blur-xl border-gray-200 text-gray-900 shadow-xl"
    : "bg-white/10 backdrop-blur-xl border-white/20 text-white shadow-2xl";
  const muted = isLight ? "text-gray-500" : "text-white/50";
  const divider = isLight ? "border-gray-200/70" : "border-white/10";
  const sectionBg = isLight ? "bg-gray-100/70" : "bg-white/8";
  const labelMuted = isLight ? "text-gray-400" : "text-white/30";

  return (
    <div
      ref={ref}
      className={cn(
        "absolute right-0 top-full mt-2 w-72 rounded-2xl border overflow-hidden z-50 animate-in fade-in zoom-in-95 slide-in-from-top-1 duration-150 origin-top-right",
        glass,
      )}
    >
      {/* Profile */}
      <div className={cn("flex items-center gap-3 px-4 py-3.5 border-b", divider)}>
        {user.user_metadata?.avatar_url ? (
          <img src={user.user_metadata.avatar_url} alt="avatar" className="w-9 h-9 rounded-full" />
        ) : (
          <div className="w-9 h-9 rounded-full bg-brand-500 flex items-center justify-center text-white font-bold">
            {user.email?.[0]?.toUpperCase()}
          </div>
        )}
        <div className="min-w-0">
          <p className="font-semibold text-sm truncate">
            {user.user_metadata?.full_name ?? "Account"}
          </p>
          <p className={cn("text-xs truncate", muted)}>{user.email}</p>
        </div>
      </div>

      {/* Credits */}
      <div className={cn("px-4 py-3 border-b", divider)}>
        <div className="flex items-center justify-between mb-2">
          <div className="flex items-center gap-1.5">
            <Zap className="w-3.5 h-3.5 text-brand-400" />
            <span className="text-xs font-semibold">Credits</span>
          </div>
          {!isLoading && (
            <span className={cn("text-lg font-bold", credits > 0 ? "text-brand-400" : labelMuted)}>
              {credits}
            </span>
          )}
        </div>
        <button
          onClick={handleBuyCredits}
          className="w-full bg-brand-500 hover:bg-brand-600 text-white py-1.5 rounded-lg text-xs font-semibold transition-colors"
        >
          Buy 5 Credits — $2.99
        </button>
      </div>

      {/* Subscription */}
      <div className={cn("px-4 py-3 border-b", divider)}>
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-1.5">
            {isSubscribed
              ? <Crown className="w-3.5 h-3.5 text-amber-400" />
              : <Star className="w-3.5 h-3.5 opacity-40" />}
            <span className="text-xs font-semibold">Power Planner</span>
          </div>
          {isSubscribed ? (
            <span className="text-[10px] font-bold bg-amber-400/20 text-amber-400 px-2 py-0.5 rounded-full">
              ACTIVE
            </span>
          ) : (
            <button
              onClick={handleSubscribe}
              className="text-[10px] font-semibold text-brand-400 hover:text-brand-300 transition-colors"
            >
              Upgrade →
            </button>
          )}
        </div>
        {isSubscribed && subscriptionPeriodEnd && (
          <p className={cn("text-xs mt-1", muted)}>
            Renews {new Date(subscriptionPeriodEnd).toLocaleDateString("en-US", { month: "short", day: "numeric", year: "numeric" })}
          </p>
        )}
      </div>

      {/* Past comparisons */}
      <div className={cn("px-4 py-3 border-b", divider)}>
        <div className="flex items-center gap-1.5 mb-2">
          <History className="w-3.5 h-3.5 opacity-40" />
          <span className="text-xs font-semibold">Unlocked Comparisons</span>
        </div>

        {isLoading ? (
          <div className="space-y-1.5">
            {[1, 2].map((i) => (
              <div key={i} className={cn("h-10 rounded-lg animate-pulse", sectionBg)} />
            ))}
          </div>
        ) : savedComparisons.length === 0 ? (
          <div className={cn("flex items-center gap-2 py-1", muted)}>
            <CreditCard className="w-3.5 h-3.5 opacity-50" />
            <span className="text-xs">No comparisons unlocked yet</span>
          </div>
        ) : (
          <div className="space-y-1 max-h-44 overflow-y-auto">
            {savedComparisons.map((c) => (
              <button
                key={c.id}
                onClick={() => { onRestoreComparison?.(c.snapshot); onClose(); }}
                className={cn(
                  "w-full flex items-center justify-between px-2.5 py-2 rounded-lg text-left transition-colors group",
                  sectionBg,
                  isLight ? "hover:bg-gray-200/60" : "hover:bg-white/15",
                )}
              >
                <div className="min-w-0">
                  <p className="text-xs font-medium truncate">
                    {c.title ?? "Untitled Comparison"}
                  </p>
                  <p className={cn("text-[10px]", labelMuted)}>
                    {new Date(c.created_at).toLocaleDateString("en-US", { month: "short", day: "numeric", year: "numeric" })}
                  </p>
                </div>
                <RotateCcw className={cn("w-3 h-3 shrink-0 ml-2 opacity-0 group-hover:opacity-60 transition-opacity")} />
              </button>
            ))}
          </div>
        )}
      </div>

      {/* Sign out */}
      <button
        onClick={() => { signOut(); onClose(); }}
        className={cn(
          "w-full flex items-center gap-2 px-4 py-3 text-xs font-medium transition-colors",
          isLight ? "hover:bg-gray-100 text-gray-500 hover:text-gray-700" : "hover:bg-white/8 text-white/50 hover:text-white/80",
        )}
      >
        <LogOut className="w-3.5 h-3.5" />
        Sign out
      </button>
    </div>
  );
}
