import {
  Injectable,
  NestMiddleware,
  ForbiddenException,
} from '@nestjs/common';
import { Request, Response, NextFunction } from 'express';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { User } from '../../entities/user.entity';

@Injectable()
export class BanCheckMiddleware implements NestMiddleware {
  constructor(
    @InjectRepository(User)
    private usersRepo: Repository<User>,
  ) {}

  async use(req: Request, res: Response, next: NextFunction) {
    // Only check if user is authenticated
    if (!req.user || !req.user['userId']) {
      return next();
    }

    const userId = req.user['userId'];
    const user = await this.usersRepo.findOne({
      where: { id: userId },
      select: ['id', 'is_banned', 'ban_reason', 'banned_at'],
    });

    if (user && user.is_banned) {
      throw new ForbiddenException({
        message: 'Your account has been banned',
        reason: user.ban_reason,
        banned_at: user.banned_at,
      });
    }

    next();
  }
}
