'use client';

import type { Venue } from '../../types/venue'; // We'll create this type definition file
import { useAuth } from '../../contexts/AuthContext';
import { addFavorite, removeFavorite } from '../../services/api';
import { useState } from 'react';
import { useToast } from '../../contexts/ToastContext'; // Import useToast

interface SearchResultsProps {
  venues: Venue[];
  loading: boolean;
  error: string | null;
  totalCount: number; // New prop for total number of results
  limit: number;     // New prop for items per page
  offset: number;    // New prop for current offset
  onPageChange: (newOffset: number) => void; // New prop for page change handler
}

export default function SearchResults({ venues, loading, error, totalCount, limit, offset, onPageChange }: SearchResultsProps) {
  const { token, logout } = useAuth(); // Assuming useAuth also provides userId from token
  const { showToast } = useToast(); // Initialize useToast

  // Placeholder for managing favorited status. In a real app, this would come from global state or API.
  const [favoritedVenueIds, setFavoritedVenueIds] = useState<Set<number>>(new Set());

  const handleToggleFavorite = async (venueId: number) => {
    if (!token) {
      showToast('Please log in to favorite venues.', 'info');
      return;
    }

    try {
      if (favoritedVenueIds.has(venueId)) {
        // Remove from favorites
        await removeFavorite(token, venueId);
        setFavoritedVenueIds(prev => {
          const newSet = new Set(prev);
          newSet.delete(venueId);
          return newSet;
        });
        showToast('Venue removed from favorites!', 'info');
      } else {
        // Add to favorites
        const response = await addFavorite(token, venueId);
        if (response && response.user_id) { // Check for successful addition
          setFavoritedVenueIds(prev => new Set(prev.add(venueId)));
          showToast('Venue added to favorites!', 'success');
        } else if (response && response.error) {
          showToast(response.error, 'error');
        } else {
          showToast('Failed to add venue to favorites.', 'error');
        }
      }
    } catch (err) {
      console.error('Failed to toggle favorite:', err); // Keep console.error for debugging
      showToast('An error occurred while updating favorites.', 'error');
    }
  };
  
  // Pagination logic
  const totalPages = Math.ceil(totalCount / limit);
  const currentPage = offset / limit + 1;

  const handlePreviousPage = () => {
    if (currentPage > 1) {
      onPageChange(offset - limit);
    }
  };

  const handleNextPage = () => {
    if (currentPage < totalPages) {
      onPageChange(offset + limit);
    }
  };


  if (loading) {
    return (
      <div className="flex justify-center items-center p-10">
        <div className="flex flex-col items-center space-y-3">
          <div className="animate-spin rounded-full h-12 w-12 border-4 border-blue-500 border-t-transparent"></div>
          <p className="text-lg text-blue-600 font-semibold">Loading venues...</p>
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="flex justify-center items-center p-10 bg-red-50 border border-red-200 rounded-lg text-red-700">
        <div className="flex flex-col items-center space-y-3">
          <svg xmlns="http://www.w3.org/2000/svg" className="h-12 w-12 text-red-500" fill="none" viewBox="0 0 24 24" stroke="currentColor">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M12 8v4m0 4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
          </svg>
          <p className="text-xl font-bold">Error!</p>
          <p className="text-md">{error}</p>
          <p className="text-sm text-gray-500">Please try again later.</p>
        </div>
      </div>
    );
  }

  if (venues.length === 0) {
    return (
      <div className="flex justify-center items-center p-10 bg-gray-50 rounded-lg text-gray-700">
        <div className="flex flex-col items-center space-y-3">
          <svg xmlns="http://www.w3.org/2000/svg" className="h-12 w-12 text-gray-400" fill="none" viewBox="0 0 24 24" stroke="currentColor">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M9.172 16.172a4 4 0 015.656 0M9 10h.01M15 10h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
          </svg>
          <p className="text-xl font-bold">No Venues Found</p>
          <p className="text-md">Try adjusting your search criteria or explore other options.</p>
        </div>
      </div>
    );
  }

  return (
    <div className="flex flex-col items-center">
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8">
        {venues.map((venue) => (
          <div key={venue.id} className="bg-white rounded-xl shadow-lg overflow-hidden border border-gray-200 hover:shadow-xl hover:border-blue-400 transition-all duration-300 transform hover:-translate-y-1">
            <div className="p-6">
              <div className="mb-4 flex justify-between items-start">
                <div>
                  <p className="text-xs text-blue-600 font-bold uppercase tracking-widest">{venue.type === 'both' ? 'Music & Dining' : venue.type}</p>
                  <h3 className="text-2xl font-extrabold text-gray-900 mt-2 leading-tight">{venue.name}</h3>
                  <p className="text-sm text-gray-500 mt-1">{venue.city}, {venue.state}</p>
                </div>
                {token && (
                  <button
                    onClick={() => handleToggleFavorite(venue.id)}
                    className={`p-2 rounded-full transition-colors duration-200 ${favoritedVenueIds.has(venue.id) ? 'bg-red-500 text-white hover:bg-red-600' : 'bg-gray-100 text-gray-400 hover:bg-red-100 hover:text-red-500'}`}
                    title={favoritedVenueIds.has(venue.id) ? 'Remove from Favorites' : 'Add to Favorites'}
                  >
                    <svg xmlns="http://www.w3.org/2000/svg" className="h-6 w-6" fill="currentColor" viewBox="0 0 24 24" stroke="currentColor">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M4.318 6.318a4.5 4.5 0 000 6.364L12 20.364l7.682-7.682a4.5 4.5 0 00-6.364-6.364L12 7.636l-1.318-1.318a4.5 4.5 0 00-6.364 0z" />
                    </svg>
                  </button>
                )}
              </div>
              
              <p className="text-gray-700 mb-6 text-sm leading-relaxed h-16 overflow-hidden">{venue.description || 'No description available.'}</p>

              <div className="flex justify-between items-center pt-4 border-t border-gray-100">
                  <p className="text-xs font-medium text-gray-500 flex items-center space-x-1">
                      <svg xmlns="http://www.w3.org/2000/svg" className="h-4 w-4 text-blue-500" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M8 7V3m8 4V3m-9 8h.01M7 12h.01M7 16h.01M16 12h.01M16 16h.01M12 16h.01M12 12h.01M9 16h.01M9 12h.01M5 19h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v10a2 2 0 002 2z" />
                      </svg>
                      <span>{new Date(venue.date).toLocaleDateString()}</span>
                  </p>
                  {venue.website && (
                      <a 
                          href={venue.website} 
                          target="_blank" 
                          rel="noopener noreferrer"
                          className="bg-blue-600 text-white font-bold py-2 px-4 rounded-full text-sm hover:bg-blue-700 transition-colors duration-200 shadow-md"
                      >
                          Visit Site
                      </a>
                  )}
              </div>
            </div>
          </div>
        ))}
      </div>

      {/* Pagination Controls */}
      {totalPages > 1 && (
        <div className="flex justify-center mt-8 space-x-4">
          <button
            onClick={handlePreviousPage}
            disabled={currentPage === 1}
            className="px-4 py-2 bg-blue-600 text-white font-semibold rounded-lg hover:bg-blue-700 disabled:bg-gray-400 disabled:cursor-not-allowed transition-colors"
          >
            Previous
          </button>
          <span className="text-lg font-semibold text-gray-800">
            Page {currentPage} of {totalPages}
          </span>
          <button
            onClick={handleNextPage}
            disabled={currentPage === totalPages}
            className="px-4 py-2 bg-blue-600 text-white font-semibold rounded-lg hover:bg-blue-700 disabled:bg-gray-400 disabled:cursor-not-allowed transition-colors"
          >
            Next
          </button>
        </div>
      )}
    </div>
  );
}
