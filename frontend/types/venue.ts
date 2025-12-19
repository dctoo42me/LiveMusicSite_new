// frontend/types/venue.ts

// This interface is the single source of truth for the Venue data structure.
// It is used by frontend components and API routes for type consistency.
export interface Venue {
  id: number;
  name: string;
  city: string;
  state: string;
  zipcode: string | null;
  date: string; 
  type: 'music' | 'meals' | 'both';
  description: string | null;
  website: string | null;
  imageUrl: string | null;
}
