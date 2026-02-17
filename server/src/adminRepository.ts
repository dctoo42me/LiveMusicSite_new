// server/src/adminRepository.ts
import { Pool } from 'pg';
import redisClient from './utils/redis.js';
import logger from './utils/logger.js';

export interface AdminStats {
  totalUsers: number;
  totalOperators: number;
  totalVenues: number;
  verifiedVenues: number;
  totalEvents: number;
  openTickets: number;
}

const STATS_CACHE_KEY = 'admin:platform_stats';
const CACHE_TTL = 300; // 5 minutes

export async function getPlatformStats(pool: Pool): Promise<AdminStats> {
  try {
    const cachedStats = await redisClient.get(STATS_CACHE_KEY);
    if (cachedStats) {
      return JSON.parse(cachedStats);
    }
  } catch (err) {
    logger.error('Redis error fetching admin stats:', err);
  }

  const statsQuery = `
    SELECT 
      (SELECT COUNT(*) FROM users) as "totalUsers",
      (SELECT COUNT(*) FROM users WHERE role = 'operator') as "totalOperators",
      (SELECT COUNT(*) FROM venues) as "totalVenues",
      (SELECT COUNT(*) FROM venues WHERE verification_status IN ('OWNER_VERIFIED', 'COMMUNITY_VERIFIED')) as "verifiedVenues",
      (SELECT COUNT(*) FROM events WHERE date >= CURRENT_DATE) as "totalEvents",
      (SELECT COUNT(*) FROM support_tickets WHERE status IN ('OPEN', 'IN_PROGRESS')) as "openTickets"
  `;
  const res = await pool.query(statsQuery);
  const row = res.rows[0];
  const stats: AdminStats = {
    totalUsers: parseInt(row.totalUsers, 10),
    totalOperators: parseInt(row.totalOperators, 10),
    totalVenues: parseInt(row.totalVenues, 10),
    verifiedVenues: parseInt(row.verifiedVenues, 10),
    totalEvents: parseInt(row.totalEvents, 10),
    openTickets: parseInt(row.openTickets, 10)
  };

  try {
    await redisClient.setex(STATS_CACHE_KEY, CACHE_TTL, JSON.stringify(stats));
  } catch (err) {
    logger.error('Redis error saving admin stats:', err);
  }

  return stats;
}

export interface AuditLogEntry {
  id: number;
  userId: number | null;
  username: string | null;
  action: string;
  entityType: string;
  entityId: number | null;
  details: any;
  createdAt: string;
}

export async function getRecentAuditLogs(pool: Pool, limit: number = 20): Promise<AuditLogEntry[]> {
  const query = `
    SELECT 
      al.id, 
      al.user_id as "userId", 
      u.username, 
      al.action, 
      al.entity_type as "entityType", 
      al.entity_id as "entityId", 
      al.details, 
      al.created_at as "createdAt"
    FROM audit_logs al
    LEFT JOIN users u ON al.user_id = u.id
    ORDER BY al.created_at DESC
    LIMIT $1
  `;
  const res = await pool.query(query, [limit]);
  return res.rows;
}

export async function getProVenues(pool: Pool) {
  const query = `
    SELECT 
      v.id, 
      v.name, 
      v.subscription_tier as "subscriptionTier",
      v.subscription_status as "subscriptionStatus",
      u.username as "ownerName",
      u.email as "ownerEmail"
    FROM venues v
    LEFT JOIN users u ON v.owner_id = u.id
    WHERE v.subscription_tier IN ('pro', 'enterprise')
    ORDER BY v.name ASC
  `;
  const res = await pool.query(query);
  return res.rows;
}
