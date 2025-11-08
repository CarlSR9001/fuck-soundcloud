import {
  Injectable,
  NotFoundException,
  BadRequestException,
  ConflictException,
} from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import {
  Reaction,
  Follow,
  User,
  Track,
  Playlist,
  ReactionTargetType,
  ReactionKind,
} from '../../entities';
import { CreateReactionDto, FollowDto } from './dto';

@Injectable()
export class ReactionsService {
  constructor(
    @InjectRepository(Reaction)
    private reactionRepository: Repository<Reaction>,
    @InjectRepository(Follow)
    private followRepository: Repository<Follow>,
    @InjectRepository(User)
    private userRepository: Repository<User>,
    @InjectRepository(Track)
    private trackRepository: Repository<Track>,
    @InjectRepository(Playlist)
    private playlistRepository: Repository<Playlist>,
  ) {}

  async toggleReaction(userId: string, dto: CreateReactionDto) {
    await this.validateTarget(dto.target_type, dto.target_id);
    const where = {
      user_id: userId,
      target_type: dto.target_type,
      target_id: dto.target_id,
      kind: dto.kind,
    };
    const existing = await this.reactionRepository.findOne({ where });

    if (existing) {
      await this.reactionRepository.remove(existing);
      return { action: 'removed', reaction: null };
    }

    const reaction = this.reactionRepository.create(where);
    await this.reactionRepository.save(reaction);
    return { action: 'created', reaction };
  }

  async removeReaction(userId: string, dto: CreateReactionDto) {
    const where = {
      user_id: userId,
      target_type: dto.target_type,
      target_id: dto.target_id,
      kind: dto.kind,
    };
    const reaction = await this.reactionRepository.findOne({ where });
    if (!reaction) throw new NotFoundException('Reaction not found');
    await this.reactionRepository.remove(reaction);
    return { message: 'Reaction removed successfully' };
  }

  async getTrackLikes(trackId: string) {
    return this.getTrackReactions(trackId, ReactionKind.LIKE);
  }

  async getTrackReposts(trackId: string) {
    return this.getTrackReactions(trackId, ReactionKind.REPOST);
  }

  private async getTrackReactions(trackId: string, kind: ReactionKind) {
    await this.validateTrack(trackId);
    const reactions = await this.reactionRepository.find({
      where: {
        target_type: ReactionTargetType.TRACK,
        target_id: trackId,
        kind,
      },
      relations: ['user'],
      order: { created_at: 'DESC' },
    });
    return reactions.map((r) => this.sanitizeReaction(r));
  }

  async followUser(followerId: string, dto: FollowDto) {
    if (followerId === dto.user_id) {
      throw new BadRequestException('Cannot follow yourself');
    }
    const followee = await this.userRepository.findOne({
      where: { id: dto.user_id },
    });
    if (!followee) throw new NotFoundException('User to follow not found');

    const where = { follower_id: followerId, followee_id: dto.user_id };
    const existing = await this.followRepository.findOne({ where });
    if (existing) throw new ConflictException('Already following this user');

    const follow = this.followRepository.create(where);
    await this.followRepository.save(follow);
    return { message: 'Successfully followed user', follow };
  }

  async unfollowUser(followerId: string, userId: string) {
    const where = { follower_id: followerId, followee_id: userId };
    const follow = await this.followRepository.findOne({ where });
    if (!follow) throw new NotFoundException('Follow relationship not found');
    await this.followRepository.remove(follow);
    return { message: 'Successfully unfollowed user' };
  }

  async getFollowers(userId: string) {
    await this.validateUser(userId);
    const follows = await this.followRepository.find({
      where: { followee_id: userId },
      relations: ['follower'],
      order: { created_at: 'DESC' },
    });
    return follows.map((f) => ({
      ...this.sanitizeUser(f.follower),
      followed_at: f.created_at,
    }));
  }

  async getFollowing(userId: string) {
    await this.validateUser(userId);
    const follows = await this.followRepository.find({
      where: { follower_id: userId },
      relations: ['followee'],
      order: { created_at: 'DESC' },
    });
    return follows.map((f) => ({
      ...this.sanitizeUser(f.followee),
      followed_at: f.created_at,
    }));
  }

  private async validateTarget(targetType: ReactionTargetType, targetId: string) {
    if (targetType === ReactionTargetType.TRACK) {
      await this.validateTrack(targetId);
    } else if (targetType === ReactionTargetType.PLAYLIST) {
      await this.validatePlaylist(targetId);
    }
  }

  private async validateUser(userId: string) {
    const user = await this.userRepository.findOne({ where: { id: userId } });
    if (!user) throw new NotFoundException('User not found');
  }

  private async validateTrack(trackId: string) {
    const track = await this.trackRepository.findOne({ where: { id: trackId } });
    if (!track) throw new NotFoundException('Track not found');
  }

  private async validatePlaylist(playlistId: string) {
    const playlist = await this.playlistRepository.findOne({
      where: { id: playlistId },
    });
    if (!playlist) throw new NotFoundException('Playlist not found');
  }

  private sanitizeReaction(reaction: Reaction) {
    return {
      id: reaction.id,
      user: this.sanitizeUser(reaction.user),
      created_at: reaction.created_at,
    };
  }

  private sanitizeUser(user: User) {
    const { password_hash, ...sanitized } = user;
    return sanitized;
  }
}
