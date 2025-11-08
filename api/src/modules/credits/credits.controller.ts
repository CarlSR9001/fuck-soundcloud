import {
  Controller,
  Get,
  Post,
  Delete,
  Body,
  Param,
  Request,
} from '@nestjs/common';
import { CreditsService } from './credits.service';
import { CreateCreditDto } from './dto';

@Controller('api/v1')
export class CreditsController {
  constructor(private readonly creditsService: CreditsService) {}

  @Post('tracks/:trackId/credits')
  async create(
    @Param('trackId') trackId: string,
    @Body() dto: CreateCreditDto,
    @Request() req: any,
  ) {
    // TODO: Get user ID from JWT token after auth is implemented
    const userId = req.user?.id || 'temp-user-id';
    return await this.creditsService.create(trackId, userId, dto);
  }

  @Delete('credits/:id')
  async remove(@Param('id') id: string, @Request() req: any) {
    // TODO: Get user ID from JWT token after auth is implemented
    const userId = req.user?.id || 'temp-user-id';
    return await this.creditsService.remove(id, userId);
  }

  @Get('tracks/:trackId/credits')
  async findByTrack(@Param('trackId') trackId: string) {
    return await this.creditsService.findByTrack(trackId);
  }
}
