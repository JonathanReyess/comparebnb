import { useEffect, useState, useCallback } from "react";
import { useAuth } from "../contexts/AuthContext";
import { supabase } from "../lib/supabase";

export interface SavedComparison {
  id: string;
  comparison_hash: string;
  title: string | null;
  snapshot: any;
  created_at: string;
}

export interface AccountData {
  credits: number;
  isSubscribed: boolean;
  subscriptionPeriodEnd: string | null;
  savedComparisons: SavedComparison[];
  isLoading: boolean;
  refetch: () => void;
}

export function useAccountData(): AccountData {
  const { user } = useAuth();
  const [credits, setCredits] = useState(0);
  const [isSubscribed, setIsSubscribed] = useState(false);
  const [subscriptionPeriodEnd, setSubscriptionPeriodEnd] = useState<string | null>(null);
  const [savedComparisons, setSavedComparisons] = useState<SavedComparison[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [tick, setTick] = useState(0);

  const refetch = useCallback(() => setTick((t) => t + 1), []);

  useEffect(() => {
    if (!user) {
      setIsLoading(false);
      return;
    }

    let cancelled = false;
    setIsLoading(true);

    (async () => {
      const [creditsRes, subRes, savedRes] = await Promise.all([
        supabase.from("credits").select("balance").eq("user_id", user.id).maybeSingle(),
        supabase.from("subscriptions").select("status, current_period_end").eq("user_id", user.id).maybeSingle(),
        supabase
          .from("saved_comparisons")
          .select("id, comparison_hash, title, snapshot, created_at")
          .eq("user_id", user.id)
          .order("created_at", { ascending: false }),
      ]);

      if (cancelled) return;

      setCredits(creditsRes.data?.balance ?? 0);

      const subActive =
        subRes.data?.status === "active" &&
        subRes.data?.current_period_end != null &&
        new Date(subRes.data.current_period_end) > new Date();
      setIsSubscribed(subActive);
      setSubscriptionPeriodEnd(subRes.data?.current_period_end ?? null);
      setSavedComparisons(savedRes.data ?? []);
      setIsLoading(false);
    })();

    return () => { cancelled = true; };
  }, [user, tick]);

  return { credits, isSubscribed, subscriptionPeriodEnd, savedComparisons, isLoading, refetch };
}
