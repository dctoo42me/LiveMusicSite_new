import type { Pool } from 'pg';
export interface Venue {
    id: number;
    name: string;
    city: string;
    state: string;
    zipcode: string | null;
    date: string;
    type: 'music' | 'meals' | 'both';
    description: string | null;
    website: string | null;
    imageUrl: string | null;
}
export interface SearchResult {
    totalCount: number;
    venues: Venue[];
}
export declare function searchVenues(pool: Pool, // Add pool argument
location: string, date: string, type: string, limit: number, offset: number): Promise<SearchResult>;
//# sourceMappingURL=venueRepository.d.ts.map