import { Request, Response, NextFunction } from 'express';
import { Pool } from 'pg';
export declare function register(pool: Pool, req: Request, res: Response): Promise<Response<any, Record<string, any>> | undefined>;
export declare function login(pool: Pool, req: Request, res: Response): Promise<Response<any, Record<string, any>> | undefined>;
export declare function verifyToken(req: Request, res: Response, next: NextFunction): Response<any, Record<string, any>> | undefined;
export declare function logout(req: Request, res: Response): Promise<void>;
//# sourceMappingURL=auth.d.ts.map