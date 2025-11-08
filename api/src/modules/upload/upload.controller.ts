import { Controller, Post, Body, UseGuards } from '@nestjs/common';
import { UploadService } from './upload.service';
import { InitMultipartDto, CompleteMultipartDto } from './dto';
import { JwtAuthGuard } from '../auth/guards/jwt-auth.guard';
import { User } from '../../common/decorators';

@Controller('api/v1/upload')
export class UploadController {
  constructor(private readonly uploadService: UploadService) {}

  @Post('multipart/init')
  @UseGuards(JwtAuthGuard)
  async initMultipartUpload(@Body() dto: InitMultipartDto, @User('userId') userId: string) {
    return await this.uploadService.initMultipartUpload(dto);
  }

  @Post('multipart/complete')
  @UseGuards(JwtAuthGuard)
  async completeMultipartUpload(@Body() dto: CompleteMultipartDto, @User('userId') userId: string) {
    return await this.uploadService.completeMultipartUpload(dto);
  }
}
