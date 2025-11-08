import { Injectable, NotFoundException } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { Strike } from '../../entities/strike.entity';
import { User } from '../../entities/user.entity';
import { CreateStrikeDto } from './dto/create-strike.dto';

@Injectable()
export class StrikesService {
  constructor(
    @InjectRepository(Strike)
    private strikesRepo: Repository<Strike>,
    @InjectRepository(User)
    private usersRepo: Repository<User>,
  ) {}

  async create(adminId: string, dto: CreateStrikeDto): Promise<Strike> {
    const user = await this.usersRepo.findOne({
      where: { id: dto.user_id },
    });

    if (!user) {
      throw new NotFoundException('User not found');
    }

    const strike = this.strikesRepo.create({
      user_id: dto.user_id,
      reason: dto.reason,
      details: dto.details,
      track_id: dto.track_id,
      issued_by_id: adminId,
      expires_at: dto.expires_at ? new Date(dto.expires_at) : null,
    });

    await this.strikesRepo.save(strike);

    // Check if user should be banned (3-strike policy)
    await this.checkAndBanUser(dto.user_id);

    return strike;
  }

  async findByUserId(userId: string): Promise<Strike[]> {
    return this.strikesRepo.find({
      where: { user_id: userId },
      relations: ['issued_by', 'report'],
      order: { created_at: 'DESC' },
    });
  }

  async remove(id: string): Promise<void> {
    const strike = await this.strikesRepo.findOne({
      where: { id },
    });

    if (!strike) {
      throw new NotFoundException('Strike not found');
    }

    await this.strikesRepo.remove(strike);

    // Check if user should be unbanned after strike removal
    await this.recheckBanStatus(strike.user_id);
  }

  private async checkAndBanUser(userId: string) {
    const strikeCount = await this.strikesRepo.count({
      where: { user_id: userId },
    });

    if (strikeCount >= 3) {
      const user = await this.usersRepo.findOne({ where: { id: userId } });
      if (user && !user.is_banned) {
        user.is_banned = true;
        user.ban_reason = 'Automatic ban: 3 strikes accumulated';
        user.banned_at = new Date();
        await this.usersRepo.save(user);
      }
    }
  }

  private async recheckBanStatus(userId: string) {
    const user = await this.usersRepo.findOne({ where: { id: userId } });
    if (!user || !user.is_banned) {
      return;
    }

    const strikeCount = await this.strikesRepo.count({
      where: { user_id: userId },
    });

    // If strikes reduced below 3 and ban was automatic, unban
    if (
      strikeCount < 3 &&
      user.ban_reason?.includes('Automatic ban: 3 strikes')
    ) {
      user.is_banned = false;
      user.ban_reason = null;
      user.banned_at = null;
      await this.usersRepo.save(user);
    }
  }

  async countByUserId(userId: string): Promise<number> {
    return this.strikesRepo.count({
      where: { user_id: userId },
    });
  }
}
