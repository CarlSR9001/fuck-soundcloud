import {
  Injectable,
  CanActivate,
  ExecutionContext,
  HttpException,
  HttpStatus,
  Inject,
} from '@nestjs/common';
import { Reflector } from '@nestjs/core';
import Redis from 'ioredis';

/**
 * Rate limit guard using Redis
 * Enforces upload quotas based on user verification status
 */
@Injectable()
export class RateLimitGuard implements CanActivate {
  constructor(
    @Inject('REDIS_CLIENT') private readonly redis: Redis,
    private reflector: Reflector,
  ) {}

  async canActivate(context: ExecutionContext): Promise<boolean> {
    const request = context.switchToHttp().getRequest();
    const user = request.user;

    if (!user) {
      throw new HttpException('Unauthorized', HttpStatus.UNAUTHORIZED);
    }

    const userId = user.userId;
    const isVerified = user.is_verified || false;

    // Get rate limit config
    const maxUploads = isVerified ? 50 : 10; // verified: 50/day, new: 10/day
    const windowSeconds = 24 * 60 * 60; // 24 hours

    // Redis key for rate limiting
    const key = `rate_limit:upload:${userId}:${this.getDayKey()}`;

    // Get current count
    const current = await this.redis.get(key);
    const count = current ? parseInt(current, 10) : 0;

    if (count >= maxUploads) {
      throw new HttpException(
        {
          statusCode: HttpStatus.TOO_MANY_REQUESTS,
          message: `Upload limit reached. ${isVerified ? 'Verified artists' : 'New users'} can upload ${maxUploads} tracks per day.`,
          limit: maxUploads,
          resetAt: this.getNextResetTime(),
        },
        HttpStatus.TOO_MANY_REQUESTS,
      );
    }

    // Increment counter
    const newCount = await this.redis.incr(key);

    // Set expiry on first increment
    if (newCount === 1) {
      await this.redis.expire(key, windowSeconds);
    }

    // Add remaining count to response headers
    request.res.setHeader('X-RateLimit-Limit', maxUploads);
    request.res.setHeader('X-RateLimit-Remaining', maxUploads - newCount);
    request.res.setHeader('X-RateLimit-Reset', this.getNextResetTime());

    return true;
  }

  /**
   * Get current day key for rate limiting (YYYY-MM-DD)
   */
  private getDayKey(): string {
    const now = new Date();
    return now.toISOString().split('T')[0];
  }

  /**
   * Get next reset time (midnight UTC)
   */
  private getNextResetTime(): string {
    const tomorrow = new Date();
    tomorrow.setUTCHours(24, 0, 0, 0);
    return tomorrow.toISOString();
  }
}
