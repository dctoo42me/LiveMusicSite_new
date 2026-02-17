export interface VenueDetails {
  id: number;
  name: string;
  city: string;
  state: string;
  zipcode: string | null;
  website: string | null;
  imageUrl: string | null;
  description: string | null;
  type: 'music' | 'meals' | 'both';
  ownerId: number | null;
  verificationStatus: 'UNVERIFIED' | 'COMMUNITY_VERIFIED' | 'OWNER_VERIFIED' | 'FLAGGED';
  positiveConfirmations: number;
  negativeConfirmations: number;
  subscriptionTier: 'free' | 'pro' | 'enterprise';
  stripeCustomerId: string | null;
}

export interface VenueEvent {
  id: number;
  date: string;
  type: 'music' | 'meals' | 'both';
  description: string | null;
  tags: string[] | null;
}
