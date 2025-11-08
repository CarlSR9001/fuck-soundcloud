import {
  Controller,
  Get,
  Post,
  Patch,
  Delete,
  Body,
  Param,
  UseGuards,
} from '@nestjs/common';
import { CommentsService } from './comments.service';
import { CreateCommentDto, UpdateCommentDto } from './dto';
import { JwtAuthGuard } from '../auth/guards/jwt-auth.guard';
import { User } from '../../common/decorators';

@Controller('api/v1')
export class CommentsController {
  constructor(private readonly commentsService: CommentsService) {}

  @Post('comments')
  @UseGuards(JwtAuthGuard)
  async create(
    @Body() dto: CreateCommentDto,
    @User('userId') userId: string,
  ) {
    return await this.commentsService.create(userId, dto);
  }

  @Get('tracks/:trackId/comments')
  async findByTrack(@Param('trackId') trackId: string) {
    return await this.commentsService.findByTrack(trackId);
  }

  @Patch('comments/:id')
  @UseGuards(JwtAuthGuard)
  async update(
    @Param('id') id: string,
    @Body() dto: UpdateCommentDto,
    @User('userId') userId: string,
  ) {
    return await this.commentsService.update(id, userId, dto);
  }

  @Delete('comments/:id')
  @UseGuards(JwtAuthGuard)
  async remove(@Param('id') id: string, @User('userId') userId: string) {
    return await this.commentsService.remove(id, userId);
  }
}
