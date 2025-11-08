import { SetMetadata } from '@nestjs/common';

export const CACHE_KEY_METADATA = 'cache:key';
export const CACHE_TTL_METADATA = 'cache:ttl';

/**
 * Cache decorator for HTTP endpoints
 * @param ttl Time to live in seconds
 */
export const CacheResponse = (ttl: number = 300) =>
  SetMetadata(CACHE_TTL_METADATA, ttl);

/**
 * Custom cache key generator
 * @param keyGenerator Function that generates cache key from request
 */
export const CacheKey = (keyGenerator: (req: any) => string) =>
  SetMetadata(CACHE_KEY_METADATA, keyGenerator);
