import { Category, FillResult, Recommendation, TripDetails, ListingDetails } from '../types';

const API_BASE = 'http://localhost:8000';

async function post<T>(path: string, body: unknown): Promise<T> {
  const res = await fetch(`${API_BASE}${path}`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(body),
  });
  if (!res.ok) {
    const err = await res.json().catch(() => ({ detail: res.statusText }));
    throw new Error(err.detail ?? `Request failed: ${res.status}`);
  }
  return res.json();
}

export interface PriceResult {
  room_id: string;
  total: string;
  original_price: string;
  qualifier: string;
  check_in: string;
  check_out: string;
  breakdown: Record<string, string>;
}

export async function fetchListingPrice(url: string): Promise<PriceResult> {
  return post<PriceResult>('/scrape', { url });
}

export async function fetchListingDetails(url: string): Promise<ListingDetails> {
  return post<ListingDetails>('/details', { url });
}

export async function fetchLocation(latitude: number, longitude: number): Promise<string | null> {
  const result = await post<{ display_name: string | null }>('/location', { latitude, longitude });
  return result.display_name;
}

export interface FillRequestData {
  categories: Category[];
  listings: Array<{
    url: string;
    price_data?: any;
    details: Record<string, any>;
  }>;
  trip_details?: TripDetails;
}

export async function fetchReviewSummary(req: {
  reviews: string[];
  listing_title: string;
}): Promise<{ summary: string }> {
  const raw = await post<{ summary: string } | string>('/summarize', req);
  if (typeof raw === 'string') return JSON.parse(raw) as { summary: string };
  return raw;
}

export async function fetchFillData(req: FillRequestData): Promise<FillResult> {
  const raw = await post<FillResult | string>('/fill', req);
  // Guard against double-serialized JSON strings
  if (typeof raw === 'string') return JSON.parse(raw) as FillResult;
  return raw;
}

export interface RecommendRequestData {
  trip_details: TripDetails;
  listings: Array<{
    title: string;
    url: string;
    details: Record<string, any>;
    fill_values?: Record<string, any>;
  }>;
  winners?: Record<string, number>;
}

export async function fetchRecommendation(req: RecommendRequestData): Promise<Recommendation> {
  const raw = await post<Recommendation | string>('/recommend', req);
  if (typeof raw === 'string') return JSON.parse(raw) as Recommendation;
  return raw;
}

export interface ChatMessage {
  role: 'user' | 'assistant';
  content: string;
}

export interface AskRequestData {
  question: string;
  history: ChatMessage[];
  listings: Array<{
    title: string;
    fill_values?: Record<string, any>;
    details?: Record<string, any>;
  }>;
  categories?: Category[];
  winners?: Record<string, number>;
  trip_details?: TripDetails;
  review_summaries?: (string | null | undefined)[];
  recommendation?: Recommendation | null;
}

export async function fetchAnswer(req: AskRequestData): Promise<{ answer: string }> {
  return post<{ answer: string }>('/ask', req);
}

export async function suggestCategories(tripDetails: TripDetails, scrapedListings: ListingDetails[]): Promise<Category[]> {
  try {
    const result = await post<{ categories: Category[] }>('/suggest', {
      listing_details: scrapedListings,
      trip_details: tripDetails,
    });
    return result.categories ?? [];
  } catch {
    return [];
  }
}
