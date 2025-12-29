'use client'; 

import React, { useState, FormEvent } from 'react';
import type { ChangeEvent } from 'react';

// Define the props the component will receive
interface SearchFormProps {
    initialLocation: string;
    initialDate: string;
    initialType: string;
    initialShowAdvancedFilters: boolean;
    onSearchSubmit: (location: string, date: string, type: string, showAdvancedFilters: boolean) => void;
    isLoading: boolean; // Receive loading state to disable the button
}

export default function SearchForm({ 
    initialLocation, 
    initialDate, 
    initialType,
    initialShowAdvancedFilters,
    onSearchSubmit, 
    isLoading 
}: SearchFormProps) {
    // STATE MANAGEMENT: Now uses props as initial values and calls onSearchSubmit
    const [location, setLocation] = useState(initialLocation);
    const [date, setDate] = useState(initialDate);
    const [type, setType] = useState(initialType);
    const [showAdvancedFilters, setShowAdvancedFilters] = useState(initialShowAdvancedFilters);

    // API SUBMIT LOGIC: Now calls the onSearchSubmit prop
    const handleSubmit = async (event: FormEvent) => {
        event.preventDefault();
        onSearchSubmit(location, date, type, showAdvancedFilters);
    };
    
    // JSX RENDER: Only the form is left
    return (
        <form onSubmit={handleSubmit} className="space-y-8"> 
            <div className="grid grid-cols-1 gap-6"> {/* Simplified grid for location only initially */}
                
                {/* Input 1: Location */}
                <div>
                    <label htmlFor="location" className="block text-sm font-medium text-gray-700 mb-1"> 
                        Location
                    </label>
                    <input
                        id="location"
                        type="text"
                        value={location}
                        onChange={(e: ChangeEvent<HTMLInputElement>) => setLocation(e.target.value)}
                        placeholder="City, State, or Zip Code"
                        className="w-full p-4 border-2 border-gray-200 text-gray-900 placeholder:text-gray-500 rounded-lg shadow-md transition duration-200 focus:border-blue-500 focus:ring-4 focus:ring-blue-500/20" 
                        required
                    />
                </div>
            </div>

            {/* Toggle Advanced Filters Button */}
            <div className="flex justify-center mt-4">
                <button
                    type="button"
                    onClick={() => setShowAdvancedFilters(!showAdvancedFilters)}
                    className="
                        flex items-center space-x-2 text-primary hover:text-primary-darker
                        font-semibold text-sm transition-colors duration-200
                    "
                >
                    <span>{showAdvancedFilters ? 'Hide Advanced Filters' : 'Show Advanced Filters'}</span>
                    <svg 
                        className={`w-4 h-4 transition-transform duration-200 ${showAdvancedFilters ? 'rotate-180' : ''}`} 
                        fill="none" 
                        stroke="currentColor" 
                        viewBox="0 0 24 24" 
                        xmlns="http://www.w3.org/2000/svg"
                    >
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M19 9l-7 7-7-7"></path>
                    </svg>
                </button>
            </div>

            {/* Advanced Filters (conditionally rendered) */}
            {showAdvancedFilters && (
                <div className="grid grid-cols-1 md:grid-cols-2 gap-6 mt-4"> {/* Grid for advanced filters */}
                    {/* Input 2: Date */}
                    <div>
                        <label htmlFor="date" className="block text-sm font-medium text-gray-700 mb-1">
                            Date
                        </label>
                        <input
                            id="date"
                            type="date"
                            value={date}
                            onChange={(e: ChangeEvent<HTMLInputElement>) => setDate(e.target.value)}
                            className="w-full p-4 border-2 border-gray-200 text-gray-900 rounded-lg shadow-md transition duration-200 focus:border-primary focus:ring-4 focus:ring-primary/20"
                        />
                    </div>

                    {/* Input 3: Type Selector */}
                    <div>
                        <label htmlFor="type" className="block text-sm font-medium text-gray-700 mb-1">
                            Looking For
                        </label>
                        <div className="relative">
                            <select
                                id="type"
                                value={type}
                                onChange={(e: ChangeEvent<HTMLSelectElement>) => setType(e.target.value)}
                                className="w-full p-4 border-2 border-gray-200 text-gray-900 rounded-lg shadow-md transition duration-200 focus:border-primary focus:ring-4 focus:ring-primary/20 appearance-none bg-white pr-10" // Added pr-10 for arrow spacing
                            >
                                <option value="both">Live Music & Meals</option>
                                <option value="music">Live Music Only</option>
                                <option value="meals">Meal Options Only</option>
                            </select>
                            <div className="pointer-events-none absolute inset-y-0 right-0 flex items-center px-2 text-gray-700">
                                <svg className="fill-current h-4 w-4" xmlns="http://www.w3.org/2000/svg" viewBox="0 0 20 20">
                                    <path d="M9.293 12.95l.707.707L15.657 8l-1.414-1.414L10 10.828 5.757 6.586 4.343 8z"/>
                                </svg>
                            </div>
                        </div>
                    </div>
                </div>
            )}

            {/* Submit Button */}
            <div className="pt-2"> 
                <button
                    type="submit" 
                    disabled={isLoading}
                    className="
                        w-full bg-primary text-white font-extrabold text-xl py-4 rounded-lg 
                        shadow-xl shadow-primary/40 tracking-widest uppercase
                        transition duration-200 ease-in-out
                        hover:bg-primary-darker hover:shadow-2xl 
                        active:scale-[0.99] active:shadow-md
                        disabled:opacity-50 disabled:cursor-not-allowed
                        flex items-center justify-center space-x-3
                    "
                >
                    {isLoading ? (
                        <>
                            <div className="animate-spin rounded-full h-5 w-5 border-b-2 border-white"></div>
                            <span>SEARCHING...</span>
                        </>
                    ) : (
                        <span>SEARCH NOW</span>
                    )}
                </button>
            </div>
        </form>
    );
}