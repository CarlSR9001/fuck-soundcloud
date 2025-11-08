import {
  Controller,
  Get,
  Post,
  Delete,
  Body,
  Param,
  UseGuards,
} from '@nestjs/common';
import { CreditsService } from './credits.service';
import { CreateCreditDto } from './dto';
import { JwtAuthGuard } from '../auth/guards/jwt-auth.guard';
import { User } from '../../common/decorators';

@Controller('api/v1')
export class CreditsController {
  constructor(private readonly creditsService: CreditsService) {}

  @Post('tracks/:trackId/credits')
  @UseGuards(JwtAuthGuard)
  async create(
    @Param('trackId') trackId: string,
    @Body() dto: CreateCreditDto,
    @User('userId') userId: string,
  ) {
    return await this.creditsService.create(trackId, userId, dto);
  }

  @Delete('credits/:id')
  @UseGuards(JwtAuthGuard)
  async remove(@Param('id') id: string, @User('userId') userId: string) {
    return await this.creditsService.remove(id, userId);
  }

  @Get('tracks/:trackId/credits')
  async findByTrack(@Param('trackId') trackId: string) {
    return await this.creditsService.findByTrack(trackId);
  }
}
