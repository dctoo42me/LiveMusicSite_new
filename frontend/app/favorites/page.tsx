// frontend/app/favorites/page.tsx
'use client';

import { useEffect, useState } from 'react';
import { useAuth } from '@/contexts/AuthContext';
import { getFavorites, removeFavorite } from '@/services/api';
import { useRouter } from 'next/navigation';
import type { Venue } from '@/types/venue';
import { useToast } from '@/contexts/ToastContext';

const ITEMS_PER_PAGE = 9; // Define items per page for favorites

export default function FavoritesPage() {
  const { token } = useAuth();
  const router = useRouter();
  const { showToast } = useToast(); // Initialize useToast

  const [favorites, setFavorites] = useState<Venue[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [totalCount, setTotalCount] = useState(0); // For pagination
  const [offset, setOffset] = useState(0); // For pagination

  useEffect(() => {
    if (!token) {
      showToast('You must be logged in to view favorites.', 'info');
      router.push('/login'); // Redirect to login if not authenticated
      return;
    }

    const fetchFavorites = async () => {
      try {
        setLoading(true);
        // Pass limit and offset to getFavorites
        const data = await getFavorites(token, ITEMS_PER_PAGE, offset); 
        if (data.error) {
          showToast(data.error, 'error');
          setError(data.error); // Keep local error for display in component
        } else {
          setFavorites(data.venues); // Assuming backend returns { venues: [], totalCount: N }
          setTotalCount(data.totalCount);
        }
      } catch (err) {
        showToast('Failed to fetch favorites.', 'error');
        setError('Failed to fetch favorites.'); // Keep local error for display in component
        console.error('Failed to fetch favorites:', err);
      } finally {
        setLoading(false);
      }
    };

    fetchFavorites();
  }, [token, offset, router, showToast]); // Add offset and showToast to dependencies

  const handleRemoveFavorite = async (venueId: number) => {
    if (!token) {
      showToast('You must be logged in to remove favorites.', 'info');
      return;
    }

    try {
      const res = await removeFavorite(token, venueId);
      if (res.ok) {
        setFavorites(prevFavorites => prevFavorites.filter(venue => venue.id !== venueId));
        setTotalCount(prevCount => prevCount - 1); // Decrement total count
        showToast('Venue removed from favorites!', 'info');
      } else {
        const errorData = await res.json().catch(() => ({ error: 'Unknown server error' }));
        showToast(errorData.error || 'Failed to remove venue from favorites.', 'error');
      }
    } catch (err) {
      console.error('Failed to remove favorite:', err);
      showToast('An error occurred while removing favorite.', 'error');
    }
  };

  if (loading) {
    return (
      <div className="flex justify-center items-center p-10">
        <div className="flex flex-col items-center space-y-3">
          <div className="animate-spin rounded-full h-12 w-12 border-4 border-blue-500 border-t-transparent"></div>
          <p className="text-lg text-blue-600 font-semibold">Loading favorites...</p>
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

  // Pagination logic
  const totalPages = Math.ceil(totalCount / ITEMS_PER_PAGE);
  const currentPage = offset / ITEMS_PER_PAGE + 1;

  const handlePreviousPage = () => {
    if (currentPage > 1) {
      setOffset(prevOffset => prevOffset - ITEMS_PER_PAGE);
    }
  };

  const handleNextPage = () => {
    if (currentPage < totalPages) {
      setOffset(prevOffset => prevOffset + ITEMS_PER_PAGE);
    }
  };

  if (favorites.length === 0 && !loading) { // Only show "No favorites" if not loading and empty
    return (
      <div className="flex justify-center items-center p-10 bg-gray-50 rounded-lg text-gray-700">
        <div className="flex flex-col items-center space-y-3">
          <svg xmlns="http://www.w3.org/2000/svg" className="h-12 w-12 text-gray-400" fill="none" viewBox="0 0 24 24" stroke="currentColor">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M9.172 16.172a4 4 0 015.656 0M9 10h.01M15 10h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
          </svg>
          <p className="text-xl font-bold">No Favorite Venues</p>
          <p className="text-md">Start adding some venues to your favorites!</p>
        </div>
      </div>
    );
  }

  return (
    <div className="container mx-auto p-4">
      <h1 className="text-3xl font-bold mb-6 text-white">Your Favorite Venues</h1> {/* Added text-white here */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8">
        {favorites.map((venue) => (
          <div key={venue.id} className="bg-white rounded-xl shadow-lg overflow-hidden border border-gray-200 hover:shadow-xl hover:border-blue-400 transition-all duration-300 transform hover:-translate-y-1">
            <div className="p-6">
              <div className="mb-4 flex justify-between items-start">
                <div>
                  <p className="text-xs text-blue-600 font-bold uppercase tracking-widest">{venue.type === 'both' ? 'Music & Dining' : venue.type}</p>
                  <h3 className="text-2xl font-extrabold text-gray-900 mt-2 leading-tight">{venue.name}</h3>
                  <p className="text-sm text-gray-500 mt-1">{venue.city}, {venue.state}</p>
                </div>
                <button
                  onClick={() => handleRemoveFavorite(venue.id)}
                  className="p-2 rounded-full bg-red-500 text-white hover:bg-red-600 transition-colors"
                  title="Remove from Favorites"
                >
                  <svg xmlns="http://www.w3.org/2000/svg" className="h-6 w-6" fill="currentColor" viewBox="0 0 24 24" stroke="currentColor">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" />
                  </svg>
                </button>
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