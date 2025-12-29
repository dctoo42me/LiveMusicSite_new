'use client'; // This must be a Client Component to manage state

import { useState, useEffect } from 'react';
import SearchForm from './components/SearchForm';
import SearchResults from './components/SearchResults';
import type { Venue } from '../types/venue';

export default function HomePage() {
  // State is "lifted up" to this parent component
  const [venues, setVenues] = useState<Venue[]>([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  // Pagination states
  const [limit, setLimit] = useState(10);
  const [offset, setOffset] = useState(0);
  const [totalCount, setTotalCount] = useState(0);

  // Search parameters state (lifted up from SearchForm)
  const [location, setLocation] = useState('');
  const [date, setDate] = useState('');
  const [type, setType] = useState('both');
  const [showAdvancedFilters, setShowAdvancedFilters] = useState(false);

  // --- API SUBMIT LOGIC: Talks to the Next.js API proxy ---
  // This function is now responsible for making the actual API call
  // It's called when search parameters change or pagination changes
  const performSearch = async () => {
    setLoading(true);
    setError(null);
    setVenues([]); // Clear previous results immediately

    // Use a relative path for the API proxy
    const apiUrl = `/api/search?location=${encodeURIComponent(location)}${date ? `&date=${date}` : ''}${type ? `&type=${type}` : ''}&limit=${limit}&offset=${offset}`;

    try {
      const response = await fetch(apiUrl);
      
      if (!response.ok) {
        const errorData = await response.json().catch(() => ({ error: 'Unknown server error' }));
        throw new Error(`HTTP error ${response.status}: ${errorData.error || 'Check server logs.'}`);
      }

      const data = await response.json();
      setVenues(data.venues);
      setTotalCount(data.totalCount);
      setLoading(false);

    } catch (err) {
      let errorMessage = "Could not connect to the API. Ensure backend and frontend are running.";
      if (err instanceof Error) {
        errorMessage = err.message;
      }
      setError(errorMessage);
      setLoading(false);
    }
  };

  // Effect to trigger search when pagination or search params change
  useEffect(() => {
    // Only perform search if location is not empty (or other required fields)
    if (location) { 
        performSearch();
    }
  }, [location, date, type, limit, offset]); // Dependencies for re-running search

  // Handlers for SearchForm to update parameters
  const handleFormSubmit = (newLocation: string, newDate: string, newType: string, newShowAdvancedFilters: boolean) => {
    // Reset offset to 0 when new search parameters are submitted
    setOffset(0); 
    setLocation(newLocation);
    setDate(newDate);
    setType(newType);
    setShowAdvancedFilters(newShowAdvancedFilters); // Update showAdvancedFilters state
  };

  // Handlers for pagination
  const handlePageChange = (newOffset: number) => {
    setOffset(newOffset);
  };
  
  return (
    <div className="page-content flex flex-col items-center justify-center min-h-screen p-4 bg-gray-50">
      
      <div className="text-center max-w-4xl mb-12">
        <h1 className="text-5xl md:text-6xl font-extrabold text-text-dark leading-tight mb-4">
          Find Your Perfect <span className="text-primary">Tune</span> & <span className="text-secondary">Dine</span> Experience
        </h1>
        <p className="text-xl text-gray-700">
          Discover local venues offering delicious meals paired with live music events near you.
        </p>
      </div>

      {/* Main Search Area */}
      <div className="w-full max-w-3xl bg-gradient-to-br from-primary to-secondary p-1 rounded-xl shadow-2xl">
        <div className="bg-white p-6 md:p-10 rounded-lg">
          <h2 className="text-2xl font-semibold text-gray-900 mb-6">Start Your Search</h2>
          <SearchForm 
            initialLocation={location}
            initialDate={date}
            initialType={type}
            initialShowAdvancedFilters={showAdvancedFilters}
            onSearchSubmit={handleFormSubmit}
            isLoading={loading}
          />
        </div>
      </div>

      {/* Results Section */}
      <div className="w-full max-w-7xl mx-auto mt-12 px-4">
        <SearchResults
          venues={venues}
          loading={loading}
          error={error}
          totalCount={totalCount}
          limit={limit}
          offset={offset}
          onPageChange={handlePageChange}
        />
      </div>

    </div>
  );
}