import {
  Controller,
  Get,
  Post,
  Delete,
  Body,
  Param,
  UseGuards,
} from '@nestjs/common';
import { StemsService } from './stems.service';
import { CreateStemDto } from './dto';
import { JwtAuthGuard } from '../auth/guards/jwt-auth.guard';
import { User } from '../../common/decorators';

@Controller('api/v1')
export class StemsController {
  constructor(private readonly stemsService: StemsService) {}

  @Post('versions/:versionId/stems')
  @UseGuards(JwtAuthGuard)
  async create(
    @Param('versionId') versionId: string,
    @Body() dto: CreateStemDto,
    @User('userId') userId: string,
  ) {
    return await this.stemsService.create(versionId, dto, userId);
  }

  @Get('versions/:versionId/stems')
  async findByVersion(@Param('versionId') versionId: string) {
    return await this.stemsService.findByVersion(versionId);
  }

  @Get('stems/:id/download')
  async getDownloadUrl(@Param('id') id: string) {
    return await this.stemsService.getDownloadUrl(id);
  }

  @Delete('stems/:id')
  @UseGuards(JwtAuthGuard)
  async delete(@Param('id') id: string, @User('userId') userId: string) {
    return await this.stemsService.delete(id, userId);
  }
}
