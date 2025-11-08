import { Controller, Post, Body } from '@nestjs/common';
import { UploadService } from './upload.service';
import { InitMultipartDto, CompleteMultipartDto } from './dto';

@Controller('api/v1/upload')
export class UploadController {
  constructor(private readonly uploadService: UploadService) {}

  @Post('multipart/init')
  async initMultipartUpload(@Body() dto: InitMultipartDto) {
    return await this.uploadService.initMultipartUpload(dto);
  }

  @Post('multipart/complete')
  async completeMultipartUpload(@Body() dto: CompleteMultipartDto) {
    return await this.uploadService.completeMultipartUpload(dto);
  }
}
