// frontend/types/venue.ts

// This interface is the single source of truth for the Venue data structure.
// It is used by frontend components and API routes for type consistency.
export interface Venue {
  id: number; // This is the Event ID
  venueId: number; // This is the Venue ID
  name: string;
  city: string;
  state: string;
  zipcode: string | null;
  date: string; 
  type: 'music' | 'meals' | 'both';
  description: string | null;
  tags: string[] | null;
  website: string | null;
  imageUrl: string | null;
  verificationStatus: 'UNVERIFIED' | 'COMMUNITY_VERIFIED' | 'OWNER_VERIFIED' | 'FLAGGED';
  subscriptionTier: 'free' | 'pro' | 'enterprise';
}
