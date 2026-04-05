import { useEffect, useState, useCallback } from "react";
import { useAuth } from "../contexts/AuthContext";
import { supabase } from "../lib/supabase";

async function hashUrls(urls: string[]): Promise<string> {
  const text = [...urls].sort().join("|");
  const buffer = await crypto.subtle.digest("SHA-256", new TextEncoder().encode(text));
  return Array.from(new Uint8Array(buffer))
    .map((b) => b.toString(16).padStart(2, "0"))
    .join("");
}

export interface ComparisonSnapshot {
  tripDetails: any;
  selectedCategories: any[];
  listingInputs: string[];
  scrapedListingsData: any[];
  fillResult: any;
  recommendation: any | null;
  reviewSummaries: (string | null | undefined)[];
  title: string;
}

interface AccessState {
  credits: number;
  isSubscribed: boolean;
  isLoading: boolean;
  deductCredit: () => Promise<"ok" | "no_credits" | "sign_in">;
  saveSnapshot: (snapshot: ComparisonSnapshot) => Promise<void>;
  refetch: () => void;
}

export function useUserAccess(): AccessState {
  const { user } = useAuth();
  const [credits, setCredits] = useState(0);
  const [isSubscribed, setIsSubscribed] = useState(false);
  const [isLoading, setIsLoading] = useState(true);
  const [tick, setTick] = useState(0);

  const refetch = useCallback(() => setTick((t) => t + 1), []);

  useEffect(() => {
    if (!user) { setIsLoading(false); return; }
    let cancelled = false;
    setIsLoading(true);
    (async () => {
      const [creditsRes, subRes] = await Promise.all([
        supabase.from("credits").select("balance").eq("user_id", user.id).maybeSingle(),
        supabase.from("subscriptions").select("status, current_period_end").eq("user_id", user.id).maybeSingle(),
      ]);
      if (cancelled) return;
      setCredits(creditsRes.data?.balance ?? 0);
      const subActive =
        subRes.data?.status === "active" &&
        subRes.data?.current_period_end != null &&
        new Date(subRes.data.current_period_end) > new Date();
      setIsSubscribed(subActive);
      setIsLoading(false);
    })();
    return () => { cancelled = true; };
  }, [user, tick]);

  const deductCredit = useCallback(async (): Promise<"ok" | "no_credits" | "sign_in"> => {
    if (!user) return "sign_in";
    if (isSubscribed) return "ok";
    if (credits < 1) return "no_credits";
    const { error } = await supabase
      .from("credits")
      .update({ balance: credits - 1, updated_at: new Date().toISOString() })
      .eq("user_id", user.id)
      .eq("balance", credits);
    if (error) return "no_credits";
    refetch();
    return "ok";
  }, [user, isSubscribed, credits, refetch]);

  const saveSnapshot = useCallback(async (snapshot: ComparisonSnapshot) => {
    if (!user) return;
    const hash = await hashUrls(snapshot.listingInputs.filter((u) => u.trim()));
    await supabase.from("saved_comparisons").upsert({
      user_id: user.id,
      comparison_hash: hash,
      title: snapshot.title,
      snapshot,
    }, { onConflict: "user_id,comparison_hash" });
  }, [user]);

  return { credits, isSubscribed, isLoading, deductCredit, saveSnapshot, refetch };
}
