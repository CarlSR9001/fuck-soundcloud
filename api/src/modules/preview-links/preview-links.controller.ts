import {
  Controller,
  Get,
  Post,
  Delete,
  Body,
  Param,
  UseGuards,
} from '@nestjs/common';
import { PreviewLinksService } from './preview-links.service';
import { CreatePreviewLinkDto } from './dto';
import { JwtAuthGuard } from '../auth/guards/jwt-auth.guard';
import { User } from '../../common/decorators';

@Controller('api/v1')
export class PreviewLinksController {
  constructor(private readonly previewLinksService: PreviewLinksService) {}

  @Post('tracks/:trackId/preview-links')
  @UseGuards(JwtAuthGuard)
  async create(
    @Param('trackId') trackId: string,
    @Body() dto: CreatePreviewLinkDto,
    @User('userId') userId: string,
  ) {
    return await this.previewLinksService.create(trackId, userId, dto);
  }

  @Get('tracks/:trackId/preview-links')
  @UseGuards(JwtAuthGuard)
  async findByTrack(
    @Param('trackId') trackId: string,
    @User('userId') userId: string,
  ) {
    return await this.previewLinksService.findByTrack(trackId, userId);
  }

  @Get('preview/:token')
  async accessViaPreview(@Param('token') token: string) {
    const link = await this.previewLinksService.findByToken(token);
    await this.previewLinksService.incrementUseCount(link.id);
    return link.track;
  }

  @Delete('preview-links/:id')
  @UseGuards(JwtAuthGuard)
  async revoke(@Param('id') id: string, @User('userId') userId: string) {
    await this.previewLinksService.revoke(id, userId);
    return { success: true };
  }
}
