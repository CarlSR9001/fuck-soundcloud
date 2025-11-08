import {
  Controller,
  Post,
  Get,
  Delete,
  Body,
  Param,
  UseGuards,
} from '@nestjs/common';
import { StrikesService } from './strikes.service';
import { CreateStrikeDto } from './dto';
import { JwtAuthGuard } from '../auth/guards/jwt-auth.guard';
import { AdminGuard } from '../auth/guards/admin.guard';
import { User } from '../auth/decorators/user.decorator';

@Controller('strikes')
export class StrikesController {
  constructor(private readonly strikesService: StrikesService) {}

  @Get('me')
  @UseGuards(JwtAuthGuard)
  getMyStrikes(@User('userId') userId: string) {
    return this.strikesService.findByUserId(userId);
  }

  @Post('admin')
  @UseGuards(JwtAuthGuard, AdminGuard)
  create(@User('userId') adminId: string, @Body() dto: CreateStrikeDto) {
    return this.strikesService.create(adminId, dto);
  }

  @Delete('admin/:id')
  @UseGuards(JwtAuthGuard, AdminGuard)
  remove(@Param('id') id: string) {
    return this.strikesService.remove(id);
  }
}
