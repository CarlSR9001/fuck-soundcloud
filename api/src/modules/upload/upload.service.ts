import { Injectable } from '@nestjs/common';

@Injectable()
export class UploadService {
  async initMultipartUpload(filename: string, size: number, sha256: string) {
    // UNIMPLEMENTED: Business logic agent will implement MinIO presigned URLs
    throw new Error('UNIMPLEMENTED: initMultipartUpload');
  }

  async completeMultipartUpload(uploadId: string, etags: string[]) {
    // UNIMPLEMENTED: Business logic agent will implement upload finalization
    throw new Error('UNIMPLEMENTED: completeMultipartUpload');
  }

  async abortMultipartUpload(uploadId: string) {
    // UNIMPLEMENTED: Business logic agent will implement upload cancellation
    throw new Error('UNIMPLEMENTED: abortMultipartUpload');
  }
}
