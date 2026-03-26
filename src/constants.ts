import { Category } from './types';

export const PREDEFINED_CATEGORIES: Category[] = [
  { id: 'total_price', label: 'Total Price', type: 'price' },
  { id: 'location', label: 'Location', type: 'string' },
  { id: 'bedrooms', label: 'Bedrooms', type: 'number' },
  { id: 'host_rating', label: 'Host Rating', type: 'number' },
];

export const NON_REMOVABLE_CATEGORY_IDS = new Set<string>();
