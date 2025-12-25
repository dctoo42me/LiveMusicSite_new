import { Pool } from 'pg';
export declare function addFavorite(pool: Pool, userId: number, venueId: number): Promise<any>;
export declare function removeFavorite(pool: Pool, userId: number, venueId: number): Promise<any>;
export declare function getFavorites(pool: Pool, userId: number, limit: number, offset: number): Promise<any>;
//# sourceMappingURL=favoriteRepository.d.ts.map