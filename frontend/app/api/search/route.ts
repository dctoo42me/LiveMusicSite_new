// frontend/app/api/search/route.ts

// The environment variable should point to your Express backend URL (e.g., http://localhost:5000)
const BACKEND_URL = process.env.NEXT_PUBLIC_BACKEND_URL || 'http://localhost:5001';

/**
 * Handles incoming GET requests from the Next.js frontend search components.
 * This function acts as a proxy, forwarding the query parameters to the Express backend.
 * * @param request The incoming Next.js Request object.
 * @returns A Response object containing the JSON search results or an error.
 */
export async function GET(request: Request) {
    try {
        // 1. Get the query parameters from the incoming frontend request (e.g., ?location=Austin&venue_name=...)
        const { searchParams } = new URL(request.url);
        
        // 2. Construct the full URL to the Express backend's search endpoint
        // This includes passing all search parameters directly to the Express server.
        const expressSearchUrl = `${BACKEND_URL}/api/venues/search?${searchParams.toString()}`;

        // 3. Make the fetch request to the Express backend
        const response = await fetch(expressSearchUrl, {
            // Revalidate on every request to get fresh data
            cache: 'no-store', 
        });

        if (!response.ok) {
            // If the backend returns an error (e.g., 400 or 500), throw it
            const errorBody = await response.json();
            throw new Error(errorBody.error || `Backend error: ${response.status}`);
        }

        // 4. Return the response (JSON data) directly from the backend to the frontend client
        const data = await response.json();
        return Response.json(data, { status: 200 });

    } catch (error) {
        let errorMessage = 'An unknown error occurred.';
        if (error instanceof Error) {
            errorMessage = error.message;
        } else if (typeof error === 'string') {
            errorMessage = error;
        }

        console.error('Next.js API Proxy Error:', errorMessage);
        return Response.json(
            { error: 'Failed to fetch search results from backend.', details: errorMessage },
            { status: 500 }
        );
    }
}