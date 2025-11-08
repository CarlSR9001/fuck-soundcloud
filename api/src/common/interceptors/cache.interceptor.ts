import {
  Injectable,
  NestInterceptor,
  ExecutionContext,
  CallHandler,
} from '@nestjs/common';
import { Observable, of } from 'rxjs';
import { tap } from 'rxjs/operators';
import { Reflector } from '@nestjs/core';
import { InjectRedis } from '@nestjs-modules/ioredis';
import Redis from 'ioredis';
import { CACHE_TTL_METADATA, CACHE_KEY_METADATA } from '../decorators/cache.decorator';

/**
 * HTTP Response Caching Interceptor
 *
 * Caches GET request responses in Redis for performance optimization
 */
@Injectable()
export class HttpCacheInterceptor implements NestInterceptor {
  constructor(
    private reflector: Reflector,
    @InjectRedis() private readonly redis: Redis,
  ) {}

  async intercept(
    context: ExecutionContext,
    next: CallHandler,
  ): Promise<Observable<any>> {
    const request = context.switchToHttp().getRequest();

    // Only cache GET requests
    if (request.method !== 'GET') {
      return next.handle();
    }

    const ttl = this.reflector.get<number>(
      CACHE_TTL_METADATA,
      context.getHandler(),
    );

    if (!ttl) {
      return next.handle();
    }

    const keyGenerator = this.reflector.get<(req: any) => string>(
      CACHE_KEY_METADATA,
      context.getHandler(),
    );

    const cacheKey = keyGenerator
      ? keyGenerator(request)
      : this.generateDefaultKey(request);

    // Try to get from cache
    try {
      const cached = await this.redis.get(cacheKey);
      if (cached) {
        return of(JSON.parse(cached));
      }
    } catch (error) {
      // Cache miss or error, continue to handler
    }

    // Not in cache, execute handler and cache result
    return next.handle().pipe(
      tap(async (response) => {
        try {
          await this.redis.setex(cacheKey, ttl, JSON.stringify(response));
        } catch (error) {
          // Silently fail cache write
          console.error('Cache write error:', error);
        }
      }),
    );
  }

  private generateDefaultKey(request: any): string {
    const { url, user } = request;
    const userId = user?.id || 'anonymous';
    return `http:cache:${userId}:${url}`;
  }
}
