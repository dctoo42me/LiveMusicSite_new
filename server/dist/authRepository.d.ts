import { Pool } from 'pg';
export declare function createUser(pool: Pool, username: string, email: string, passwordHash: string): Promise<any>;
export declare function findUserByUsername(pool: Pool, username: string): Promise<any>;
//# sourceMappingURL=authRepository.d.ts.map