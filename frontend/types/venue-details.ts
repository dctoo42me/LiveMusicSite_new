export interface VenueDetails {
  id: number;
  name: string;
  city: string;
  state: string;
  zipcode: string | null;
  website: string | null;
  imageUrl: string | null;
  description: string | null;
  ownerId: number | null;
  verificationStatus: 'UNVERIFIED' | 'COMMUNITY_VERIFIED' | 'OWNER_VERIFIED' | 'FLAGGED';
  positiveConfirmations: number;
  negativeConfirmations: number;
  subscriptionTier: 'free' | 'pro' | 'enterprise';
  stripeCustomerId: string | null;
  foodServiceType: 'none' | 'bar_bites' | 'full_menu';
  barServiceType: 'none' | 'non_alcoholic' | 'alcoholic_only' | 'full_bar';
}

export interface VenueEvent {
  id: number;
  date: string;
  description: string | null;
  tags: string[] | null;
}
