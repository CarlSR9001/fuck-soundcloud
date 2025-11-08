import {
  Controller,
  Post,
  Get,
  Patch,
  Body,
  Param,
  Query,
  UseGuards,
  ParseIntPipe,
} from '@nestjs/common';
import { ReportsService } from './reports.service';
import { CreateReportDto, ReviewReportDto } from './dto';
import { JwtAuthGuard } from '../auth/guards/jwt-auth.guard';
import { AdminGuard } from '../auth/guards/admin.guard';
import { User } from '../auth/decorators/user.decorator';

@Controller('reports')
export class ReportsController {
  constructor(private readonly reportsService: ReportsService) {}

  @Post()
  @UseGuards(JwtAuthGuard)
  create(@User('userId') userId: string, @Body() dto: CreateReportDto) {
    return this.reportsService.create(userId, dto);
  }

  @Get('admin')
  @UseGuards(JwtAuthGuard, AdminGuard)
  findAll(
    @Query('page', new ParseIntPipe({ optional: true })) page = 1,
    @Query('limit', new ParseIntPipe({ optional: true })) limit = 20,
  ) {
    return this.reportsService.findAll(page, limit);
  }

  @Get('admin/:id')
  @UseGuards(JwtAuthGuard, AdminGuard)
  findOne(@Param('id') id: string) {
    return this.reportsService.findOne(id);
  }

  @Patch('admin/:id')
  @UseGuards(JwtAuthGuard, AdminGuard)
  review(
    @Param('id') id: string,
    @User('userId') adminId: string,
    @Body() dto: ReviewReportDto,
  ) {
    return this.reportsService.review(id, adminId, dto);
  }
}
