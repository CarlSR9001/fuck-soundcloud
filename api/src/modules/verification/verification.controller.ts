import {
  Controller,
  Post,
  Get,
  Patch,
  Body,
  Param,
  UseGuards,
} from '@nestjs/common';
import { VerificationService } from './verification.service';
import { RequestVerificationDto, VerifyRequestDto } from './dto';
import { JwtAuthGuard } from '../auth/guards/jwt-auth.guard';
import { AdminGuard } from '../auth/guards/admin.guard';
import { User } from '../../common/decorators';

@Controller('api/v1/verification')
export class VerificationController {
  constructor(private readonly verificationService: VerificationService) {}

  /**
   * Request artist verification
   * POST /api/v1/verification/request
   */
  @Post('request')
  @UseGuards(JwtAuthGuard)
  async requestVerification(
    @Body() dto: RequestVerificationDto,
    @User('userId') userId: string,
  ) {
    return await this.verificationService.requestVerification(userId, dto);
  }

  /**
   * Get verification code for current user
   * GET /api/v1/verification/code
   */
  @Get('code')
  @UseGuards(JwtAuthGuard)
  getVerificationCode(@User('userId') userId: string) {
    const code = this.verificationService.getVerificationCode(userId);
    return {
      code,
      instructions: {
        domain:
          'Add a DNS TXT record with this code to your domain and request domain verification',
        social:
          'Create a public post with this code and include the post URL in your verification request',
      },
    };
  }

  /**
   * Get all pending verification requests (admin only)
   * GET /api/v1/admin/verification/pending
   */
  @Get('admin/pending')
  @UseGuards(JwtAuthGuard, AdminGuard)
  async getPendingVerifications() {
    return await this.verificationService.getPendingVerifications();
  }

  /**
   * Approve or reject verification request (admin only)
   * PATCH /api/v1/admin/verification/:id
   */
  @Patch('admin/:id')
  @UseGuards(JwtAuthGuard, AdminGuard)
  async reviewVerification(
    @Param('id') id: string,
    @Body() dto: VerifyRequestDto,
    @User('userId') adminId: string,
  ) {
    return await this.verificationService.reviewVerification(id, adminId, dto);
  }
}
