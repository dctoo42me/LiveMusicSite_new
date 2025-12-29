import React from 'react';

const VenueCardSkeleton = () => {
  return (
    <div className="bg-white rounded-xl shadow-lg overflow-hidden border border-gray-200">
      <div className="p-6 animate-pulse">
        <div className="mb-4 flex justify-between items-start">
          <div>
            <div className="h-4 bg-gray-200 rounded w-1/4"></div>
            <div className="h-8 bg-gray-300 rounded w-3/4 mt-2"></div>
            <div className="h-4 bg-gray-200 rounded w-1/2 mt-1"></div>
          </div>
          <div className="h-8 w-8 bg-gray-200 rounded-full"></div>
        </div>
        
        <div className="h-4 bg-gray-200 rounded w-full mb-2"></div>
        <div className="h-4 bg-gray-200 rounded w-5/6"></div>

        <div className="flex justify-between items-center pt-4 mt-6 border-t border-gray-100">
          <div className="h-4 bg-gray-200 rounded w-1/3"></div>
          <div className="h-10 w-24 bg-gray-300 rounded-full"></div>
        </div>
      </div>
    </div>
  );
};

export default VenueCardSkeleton;
