import {
  Controller,
  Get,
  Post,
  Delete,
  Body,
  Param,
  UseGuards,
} from '@nestjs/common';
import { ReactionsService } from './reactions.service';
import { CreateReactionDto, FollowDto } from './dto';
import { JwtAuthGuard } from '../auth/guards/jwt-auth.guard';
import { User } from '../../common/decorators';

@Controller('api/v1')
export class ReactionsController {
  constructor(private readonly reactionsService: ReactionsService) {}

  @Post('react')
  @UseGuards(JwtAuthGuard)
  async toggleReaction(
    @User('userId') userId: string,
    @Body() dto: CreateReactionDto,
  ) {
    return await this.reactionsService.toggleReaction(userId, dto);
  }

  @Delete('react')
  @UseGuards(JwtAuthGuard)
  async removeReaction(
    @User('userId') userId: string,
    @Body() dto: CreateReactionDto,
  ) {
    return await this.reactionsService.removeReaction(userId, dto);
  }

  @Get('tracks/:id/likes')
  async getTrackLikes(@Param('id') trackId: string) {
    return await this.reactionsService.getTrackLikes(trackId);
  }

  @Get('tracks/:id/reposts')
  async getTrackReposts(@Param('id') trackId: string) {
    return await this.reactionsService.getTrackReposts(trackId);
  }

  @Post('follow')
  @UseGuards(JwtAuthGuard)
  async followUser(
    @User('userId') userId: string,
    @Body() dto: FollowDto,
  ) {
    return await this.reactionsService.followUser(userId, dto);
  }

  @Delete('follow/:userId')
  @UseGuards(JwtAuthGuard)
  async unfollowUser(
    @User('userId') followerId: string,
    @Param('userId') userId: string,
  ) {
    return await this.reactionsService.unfollowUser(followerId, userId);
  }
}
