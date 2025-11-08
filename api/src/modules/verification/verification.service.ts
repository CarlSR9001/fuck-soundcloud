import { Injectable, NotFoundException, BadRequestException } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import {
  ArtistVerification,
  VerificationMethod,
  VerificationStatus,
  User,
} from '../../entities';
import { RequestVerificationDto, VerifyRequestDto } from './dto';
import * as crypto from 'crypto';
import * as dns from 'dns';
import { promisify } from 'util';

const resolveTxt = promisify(dns.resolveTxt);

@Injectable()
export class VerificationService {
  constructor(
    @InjectRepository(ArtistVerification)
    private verificationRepo: Repository<ArtistVerification>,
    @InjectRepository(User)
    private userRepo: Repository<User>,
  ) {}

  /**
   * Request artist verification
   */
  async requestVerification(userId: string, dto: RequestVerificationDto) {
    // Check if user already has a pending or verified request
    const existing = await this.verificationRepo.findOne({
      where: [
        { user_id: userId, status: VerificationStatus.PENDING },
        { user_id: userId, status: VerificationStatus.VERIFIED },
      ],
    });

    if (existing?.status === VerificationStatus.VERIFIED) {
      throw new BadRequestException('User is already verified');
    }

    if (existing?.status === VerificationStatus.PENDING) {
      throw new BadRequestException('You already have a pending verification request');
    }

    // Create verification request
    const verification = this.verificationRepo.create({
      user_id: userId,
      method: dto.method,
      evidence_data: dto.evidence_data,
      status: VerificationStatus.PENDING,
    });

    // Auto-verify domain if DNS record is correct
    if (dto.method === VerificationMethod.DOMAIN) {
      const verified = await this.verifyDomain(userId, dto.evidence_data);
      if (verified) {
        verification.status = VerificationStatus.VERIFIED;
        verification.verified_at = new Date();
        verification.expires_at = new Date(
          Date.now() + 365 * 24 * 60 * 60 * 1000,
        ); // 1 year
      }
    }

    await this.verificationRepo.save(verification);

    // Update user if verified
    if (verification.status === VerificationStatus.VERIFIED) {
      await this.userRepo.update(userId, { is_verified: true });
    }

    return verification;
  }

  /**
   * Get all pending verifications (admin only)
   */
  async getPendingVerifications() {
    return await this.verificationRepo.find({
      where: { status: VerificationStatus.PENDING },
      relations: ['user'],
      order: { created_at: 'ASC' },
    });
  }

  /**
   * Approve or reject verification (admin only)
   */
  async reviewVerification(
    verificationId: string,
    adminId: string,
    dto: VerifyRequestDto,
  ) {
    const verification = await this.verificationRepo.findOne({
      where: { id: verificationId },
    });

    if (!verification) {
      throw new NotFoundException('Verification request not found');
    }

    verification.status = dto.status;
    verification.verified_by_id = adminId;

    if (dto.status === VerificationStatus.VERIFIED) {
      verification.verified_at = new Date();
      verification.expires_at = new Date(
        Date.now() + 365 * 24 * 60 * 60 * 1000,
      ); // 1 year
    } else if (dto.status === VerificationStatus.REJECTED) {
      verification.rejection_reason = dto.rejection_reason;
    }

    await this.verificationRepo.save(verification);

    // Update user verification status
    if (dto.status === VerificationStatus.VERIFIED) {
      await this.userRepo.update(verification.user_id, { is_verified: true });
    }

    return verification;
  }

  /**
   * Get verification code for user (used in domain/social verification)
   */
  getVerificationCode(userId: string): string {
    // Generate deterministic verification code based on user ID
    const hash = crypto.createHash('sha256').update(userId).digest('hex');
    return `resonance-verify-${hash.substring(0, 16)}`;
  }

  /**
   * Verify domain by checking DNS TXT record
   */
  private async verifyDomain(
    userId: string,
    domain: string,
  ): Promise<boolean> {
    try {
      const verificationCode = this.getVerificationCode(userId);
      const records = await resolveTxt(domain);

      // Check if any TXT record contains the verification code
      for (const record of records) {
        const txtValue = record.join('');
        if (txtValue.includes(verificationCode)) {
          return true;
        }
      }

      return false;
    } catch (error) {
      console.error(`[Verification] DNS lookup failed for ${domain}:`, error);
      return false;
    }
  }
}
