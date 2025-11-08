import { Controller, Post, Body } from '@nestjs/common';
import { UploadService } from './upload.service';

@Controller('upload')
export class UploadController {
  constructor(private readonly uploadService: UploadService) {}

  @Post('multipart/init')
  async initMultipartUpload(@Body() initDto: any) {
    // UNIMPLEMENTED: Multipart upload initialization will be implemented by business logic agent
    return { message: 'UNIMPLEMENTED: multipart/init endpoint' };
  }

  @Post('multipart/complete')
  async completeMultipartUpload(@Body() completeDto: any) {
    // UNIMPLEMENTED: Multipart upload completion will be implemented by business logic agent
    return { message: 'UNIMPLEMENTED: multipart/complete endpoint' };
  }
}
