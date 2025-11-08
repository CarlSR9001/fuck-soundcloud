import {
  Entity,
  PrimaryGeneratedColumn,
  Column,
  ManyToOne,
  CreateDateColumn,
  UpdateDateColumn,
  Index,
} from 'typeorm';
import { User } from './user.entity';

export enum VerificationMethod {
  DOMAIN = 'domain',
  SOCIAL_TWITTER = 'social_twitter',
  SOCIAL_INSTAGRAM = 'social_instagram',
  SOCIAL_FACEBOOK = 'social_facebook',
  SPOTIFY_ARTIST = 'spotify_artist',
  BANDCAMP = 'bandcamp',
  MANUAL = 'manual',
}

export enum VerificationStatus {
  PENDING = 'pending',
  VERIFIED = 'verified',
  REJECTED = 'rejected',
  EXPIRED = 'expired',
}

@Entity('artist_verifications')
export class ArtistVerification {
  @PrimaryGeneratedColumn('uuid')
  id: string;

  @Column()
  @Index()
  user_id: string;

  @ManyToOne(() => User, { onDelete: 'CASCADE' })
  user: User;

  @Column({
    type: 'enum',
    enum: VerificationMethod,
  })
  method: VerificationMethod;

  @Column({
    type: 'enum',
    enum: VerificationStatus,
    default: VerificationStatus.PENDING,
  })
  @Index()
  status: VerificationStatus;

  // Evidence data (domain name, social URL, etc.)
  @Column('text')
  evidence_data: string;

  // Admin who verified (for manual reviews)
  @Column({ nullable: true })
  verified_by_id: string;

  @ManyToOne(() => User, { onDelete: 'SET NULL' })
  verified_by: User;

  @Column('text', { nullable: true })
  rejection_reason: string;

  @CreateDateColumn()
  created_at: Date;

  @UpdateDateColumn()
  updated_at: Date;

  @Column({ type: 'timestamp', nullable: true })
  verified_at: Date;

  // Verifications can expire (re-verify yearly)
  @Column({ type: 'timestamp', nullable: true })
  expires_at: Date;
}
