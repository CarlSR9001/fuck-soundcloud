import {
  Entity,
  PrimaryGeneratedColumn,
  Column,
  ManyToOne,
  CreateDateColumn,
  Index,
} from 'typeorm';
import { User } from './user.entity';

export enum ContributionType {
  ONE_TIME = 'one_time',
  MONTHLY = 'monthly',
}

export enum ContributionStatus {
  PENDING = 'pending',
  COMPLETED = 'completed',
  FAILED = 'failed',
  REFUNDED = 'refunded',
}

@Entity('contributions')
export class Contribution {
  @PrimaryGeneratedColumn('uuid')
  id: string;

  @Column()
  @Index()
  user_id: string;

  @ManyToOne(() => User, { onDelete: 'CASCADE' })
  user: User;

  @Column('decimal', { precision: 10, scale: 2 })
  amount_cents: number;

  @Column({
    type: 'enum',
    enum: ContributionType,
    default: ContributionType.ONE_TIME,
  })
  type: ContributionType;

  @Column({
    type: 'enum',
    enum: ContributionStatus,
    default: ContributionStatus.PENDING,
  })
  @Index()
  status: ContributionStatus;

  // Stripe/PayPal/etc payment intent ID
  @Column({ nullable: true })
  payment_intent_id: string;

  // Provider: stripe, paypal, crypto, etc.
  @Column({ default: 'stripe' })
  provider: string;

  // Split percentages (must sum to 100)
  @Column('int', { default: 80 })
  artists_percentage: number;

  @Column('int', { default: 10 })
  charity_percentage: number;

  @Column('int', { default: 10 })
  platform_percentage: number;

  @Column({ nullable: true })
  @Index()
  selected_charity_id: string;

  @CreateDateColumn()
  created_at: Date;

  @Column({ type: 'timestamp', nullable: true })
  processed_at: Date;
}
