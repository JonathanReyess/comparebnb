export type CategoryType = 'string' | 'number' | 'boolean' | 'price';

export interface Category {
  id: string;
  label: string;
  type: CategoryType;
  isCustom?: boolean;
}

export interface TripDetails {
  numPeople: number;
  purpose: string;
  priorities: string;
  travelMethod: 'driving' | 'flying';
  origin: string;
}

export interface ListingDetails {
  title: string;
  description: string;
  room_type: string;
  person_capacity: number;
  is_super_host: boolean;
  is_guest_favorite: boolean;
  rating: Record<string, any>;
  host_rating: number | null;
  highlights: Array<{ title: string; subtitle: string }>;
  available_amenities: string[];
  house_rules: { general_rules: string[]; additional_details: string };
  review_comments: string[];
  coordinates: { latitude: number | null; longitude: number | null };
}

export interface FillResult {
  values: Record<string, any>[];
  winners: Record<string, number>;
}

export interface Recommendation {
  top_pick: string;
  why: string;
  trade_off: string;
}

export interface ListingData {
  input: string;
  // price
  total: string | null;
  original_price: string | null;
  qualifier: string | null;
  check_in: string | null;
  check_out: string | null;
  // listing details
  details: ListingDetails | null;
  address: string | null;
  loading: boolean;
  error?: string;
}
