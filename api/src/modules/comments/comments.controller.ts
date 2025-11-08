import {
  Controller,
  Get,
  Post,
  Patch,
  Delete,
  Body,
  Param,
  Request,
} from '@nestjs/common';
import { CommentsService } from './comments.service';
import { CreateCommentDto, UpdateCommentDto } from './dto';

@Controller('api/v1')
export class CommentsController {
  constructor(private readonly commentsService: CommentsService) {}

  @Post('comments')
  async create(
    @Body() dto: CreateCommentDto,
    @Request() req: any,
  ) {
    // TODO: Get user ID from JWT token after auth is implemented
    const userId = req.user?.id || 'temp-user-id';
    return await this.commentsService.create(userId, dto);
  }

  @Get('tracks/:trackId/comments')
  async findByTrack(@Param('trackId') trackId: string) {
    return await this.commentsService.findByTrack(trackId);
  }

  @Patch('comments/:id')
  async update(
    @Param('id') id: string,
    @Body() dto: UpdateCommentDto,
    @Request() req: any,
  ) {
    // TODO: Get user ID from JWT token after auth is implemented
    const userId = req.user?.id || 'temp-user-id';
    return await this.commentsService.update(id, userId, dto);
  }

  @Delete('comments/:id')
  async remove(@Param('id') id: string, @Request() req: any) {
    // TODO: Get user ID from JWT token after auth is implemented
    const userId = req.user?.id || 'temp-user-id';
    return await this.commentsService.remove(id, userId);
  }
}
