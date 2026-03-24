export interface TripDetails {
  numPeople: number;
  purpose: string;
  priorities: string;
  travelMethod: 'driving' | 'flying';
  origin: string;
}

export type CategoryType = 'string' | 'number' | 'boolean' | 'price';

export interface Category {
  id: string;
  label: string;
  type: CategoryType;
  isCustom?: boolean;
}

export interface ListingData {
  input: string;
  data: Record<string, any>;
  error?: string;
  loading?: boolean;
}
