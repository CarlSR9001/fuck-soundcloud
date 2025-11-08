import {
  Entity,
  PrimaryGeneratedColumn,
  Column,
  ManyToOne,
  CreateDateColumn,
  Index,
} from 'typeorm';
import { User } from './user.entity';

export enum PayoutStatus {
  PENDING = 'pending',
  PROCESSING = 'processing',
  COMPLETED = 'completed',
  FAILED = 'failed',
}

@Entity('artist_payouts')
export class ArtistPayout {
  @PrimaryGeneratedColumn('uuid')
  id: string;

  @Column()
  @Index()
  artist_id: string;

  @ManyToOne(() => User, { onDelete: 'CASCADE' })
  artist: User;

  // Period this payout covers (YYYY-MM format)
  @Column()
  @Index()
  period: string;

  // Amount earned from user-centric distribution
  @Column('decimal', { precision: 10, scale: 2 })
  amount_cents: number;

  // How many unique contributors this month
  @Column('int', { default: 0 })
  contributor_count: number;

  // Total listening time in milliseconds
  @Column('bigint', { default: 0 })
  total_listen_ms: number;

  @Column({
    type: 'enum',
    enum: PayoutStatus,
    default: PayoutStatus.PENDING,
  })
  @Index()
  status: PayoutStatus;

  // External payout ID (Stripe Transfer, PayPal Payout, etc.)
  @Column({ nullable: true })
  external_payout_id: string;

  @Column({ default: 'stripe' })
  provider: string;

  @CreateDateColumn()
  created_at: Date;

  @Column({ type: 'timestamp', nullable: true })
  processed_at: Date;

  @Column('text', { nullable: true })
  failure_reason: string;
}
