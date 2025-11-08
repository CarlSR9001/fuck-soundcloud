import {
  Injectable,
  NotFoundException,
  ForbiddenException,
  BadRequestException,
} from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { Comment, Track } from '../../entities';
import { CreateCommentDto, UpdateCommentDto } from './dto';

@Injectable()
export class CommentsService {
  constructor(
    @InjectRepository(Comment)
    private commentRepository: Repository<Comment>,
    @InjectRepository(Track)
    private trackRepository: Repository<Track>,
  ) {}

  async create(userId: string, dto: CreateCommentDto) {
    // Verify track exists
    const track = await this.trackRepository.findOne({
      where: { id: dto.track_id },
    });

    if (!track) {
      throw new NotFoundException(
        `Track with ID ${dto.track_id} not found`,
      );
    }

    // Verify parent comment exists if parent_id is provided
    if (dto.parent_id) {
      const parentComment = await this.commentRepository.findOne({
        where: { id: dto.parent_id },
      });

      if (!parentComment) {
        throw new NotFoundException(
          `Parent comment with ID ${dto.parent_id} not found`,
        );
      }

      // Ensure parent comment is on the same track
      if (parentComment.track_id !== dto.track_id) {
        throw new BadRequestException(
          'Parent comment must belong to the same track',
        );
      }

      // Prevent nested replies (only allow one level of nesting)
      if (parentComment.parent_id !== null) {
        throw new BadRequestException(
          'Cannot reply to a reply. Please reply to the parent comment',
        );
      }
    }

    // Create comment
    const comment = this.commentRepository.create({
      track_id: dto.track_id,
      user_id: userId,
      parent_id: dto.parent_id || null,
      at_ms: dto.at_ms || null,
      body_md: dto.body_md,
    });

    const savedComment = await this.commentRepository.save(comment);

    // Load relations for response
    return await this.commentRepository.findOne({
      where: { id: savedComment.id },
      relations: ['user'],
    });
  }

  async findByTrack(trackId: string) {
    // Get all comments for the track
    const comments = await this.commentRepository.find({
      where: { track_id: trackId },
      relations: ['user', 'replies', 'replies.user'],
      order: {
        at_ms: 'ASC',
        created_at: 'ASC',
      },
    });

    // Filter to get only top-level comments (no parent)
    const topLevelComments = comments.filter(
      (comment) => comment.parent_id === null,
    );

    // Sort replies within each comment
    topLevelComments.forEach((comment) => {
      if (comment.replies) {
        comment.replies.sort(
          (a, b) => a.created_at.getTime() - b.created_at.getTime(),
        );
      }
    });

    return topLevelComments;
  }

  async update(commentId: string, userId: string, dto: UpdateCommentDto) {
    const comment = await this.commentRepository.findOne({
      where: { id: commentId },
    });

    if (!comment) {
      throw new NotFoundException(
        `Comment with ID ${commentId} not found`,
      );
    }

    // Verify ownership
    if (comment.user_id !== userId) {
      throw new ForbiddenException(
        'You can only update your own comments',
      );
    }

    // Update comment
    comment.body_md = dto.body_md;
    const savedComment = await this.commentRepository.save(comment);

    // Load relations for response
    return await this.commentRepository.findOne({
      where: { id: savedComment.id },
      relations: ['user'],
    });
  }

  async remove(commentId: string, userId: string) {
    const comment = await this.commentRepository.findOne({
      where: { id: commentId },
    });

    if (!comment) {
      throw new NotFoundException(
        `Comment with ID ${commentId} not found`,
      );
    }

    // Verify ownership
    if (comment.user_id !== userId) {
      throw new ForbiddenException(
        'You can only delete your own comments',
      );
    }

    await this.commentRepository.remove(comment);
    return { message: 'Comment deleted successfully' };
  }
}
