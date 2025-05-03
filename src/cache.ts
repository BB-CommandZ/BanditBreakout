import Redis from 'ioredis';

const redis = new Redis({
    host: process.env.REDIS_HOST || 'localhost',
    port: Number(process.env.REDIS_PORT) || 6379,
    password: process.env.REDIS_PASSWORD || undefined
});

redis.on('connect', () => {
    console.log('Connected to Redis');
});

redis.on('error', (err) => {
    console.error('Redis connection error:', err);
});

/**
 * Get data from cache by key
 * @param key The cache key
 * @returns The cached data or null if not found
 */
export async function getFromCache(key: string): Promise<any> {
    try {
        const data = await redis.get(key);
        return data ? JSON.parse(data) : null;
    } catch (error) {
        console.error('Error getting data from cache:', error);
        return null;
    }
}

/**
 * Set data to cache with a specific key and TTL
 * @param key The cache key
 * @param data The data to cache
 * @param ttl Time to live in seconds (default: 1 hour)
 */
export async function setToCache(key: string, data: any, ttl: number = 3600): Promise<void> {
    try {
        await redis.set(key, JSON.stringify(data), 'EX', ttl);
    } catch (error) {
        console.error('Error setting data to cache:', error);
    }
}

/**
 * Invalidate cache by key
 * @param key The cache key to invalidate
 */
export async function invalidateCache(key: string): Promise<void> {
    try {
        await redis.del(key);
    } catch (error) {
        console.error('Error invalidating cache:', error);
    }
}

/**
 * Get the Redis client instance for direct operations
 * @returns The Redis client
 */
export function getRedisClient(): Redis {
    return redis;
}
