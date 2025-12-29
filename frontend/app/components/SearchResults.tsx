'use client';

import type { Venue } from '@/types/venue';
import { useAuth } from '@/contexts/AuthContext';
import { addFavorite, removeFavorite } from '@/services/api';
import { useState } from 'react';
import { useToast } from '@/contexts/ToastContext';
import VenueCardSkeleton from './VenueCardSkeleton';

interface SearchResultsProps {
  venues: Venue[];
  loading: boolean;
  error: string | null;
  totalCount: number; // New prop for total number of results
  limit: number;     // New prop for items per page
  offset: number;    // New prop for current offset
  onPageChange: (newOffset: number) => void; // New prop for page change handler
}

import VenueCardSkeleton from './VenueCardSkeleton';

// ... (imports and interface definition remain the same)

export default function SearchResults({ venues, loading, error, totalCount, limit, offset, onPageChange }: SearchResultsProps) {
  // ... (hooks and handlers remain the same)

  if (loading) {
    return (
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8">
        {Array.from({ length: 6 }).map((_, index) => (
          <VenueCardSkeleton key={index} />
        ))}
      </div>
    );
  }

  if (error) {
    return (
      <div className="flex flex-col items-center justify-center p-10 bg-red-50 border-2 border-dashed border-red-200 rounded-2xl text-red-700">
        <svg xmlns="http://www.w3.org/2000/svg" className="h-16 w-16 text-red-400 mb-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z" />
        </svg>
        <p className="text-2xl font-extrabold text-red-800">Oops! Something went wrong.</p>
        <p className="text-md mt-2 text-red-600">{error}</p>
        <p className="text-sm mt-4 text-gray-500">Please check your connection and try refreshing the page.</p>
      </div>
    );
  }

  if (venues.length === 0) {
    return (
      <div className="flex flex-col items-center justify-center p-10 bg-gray-50 border-2 border-dashed border-gray-200 rounded-2xl text-gray-700">
        <svg xmlns="http://www.w3.org/2000/svg" className="h-16 w-16 text-gray-400 mb-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" />
        </svg>
        <p className="text-2xl font-extrabold text-gray-800">No Venues Found</p>
        <p className="text-md mt-2 text-gray-600">Try adjusting your search criteria or explore other options.</p>
      </div>
    );
  }

  return (
    // ... (the rest of the component remains the same)
  );
}
