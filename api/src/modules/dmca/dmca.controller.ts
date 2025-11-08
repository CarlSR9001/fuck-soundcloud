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
import { DmcaService } from './dmca.service';
import { SubmitDmcaDto, ProcessDmcaDto } from './dto';
import { JwtAuthGuard } from '../auth/guards/jwt-auth.guard';
import { AdminGuard } from '../auth/guards/admin.guard';

@Controller('dmca')
export class DmcaController {
  constructor(private readonly dmcaService: DmcaService) {}

  @Post('takedown')
  submit(@Body() dto: SubmitDmcaDto) {
    return this.dmcaService.submit(dto);
  }

  @Get('admin')
  @UseGuards(JwtAuthGuard, AdminGuard)
  findAll(
    @Query('page', new ParseIntPipe({ optional: true })) page = 1,
    @Query('limit', new ParseIntPipe({ optional: true })) limit = 20,
  ) {
    return this.dmcaService.findAll(page, limit);
  }

  @Get('admin/:id')
  @UseGuards(JwtAuthGuard, AdminGuard)
  findOne(@Param('id') id: string) {
    return this.dmcaService.findOne(id);
  }

  @Patch('admin/:id')
  @UseGuards(JwtAuthGuard, AdminGuard)
  process(@Param('id') id: string, @Body() dto: ProcessDmcaDto) {
    return this.dmcaService.process(id, dto);
  }
}
