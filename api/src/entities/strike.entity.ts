import {
  Entity,
  PrimaryGeneratedColumn,
  Column,
  ManyToOne,
  CreateDateColumn,
  Index,
} from 'typeorm';
import { User } from './user.entity';
import { Report } from './report.entity';

export enum StrikeReason {
  COPYRIGHT_INFRINGEMENT = 'copyright_infringement',
  DMCA_TAKEDOWN = 'dmca_takedown',
  SPAM = 'spam',
  HARASSMENT = 'harassment',
  TOS_VIOLATION = 'tos_violation',
}

@Entity('strikes')
export class Strike {
  @PrimaryGeneratedColumn('uuid')
  id: string;

  @Column()
  @Index()
  user_id: string;

  @ManyToOne(() => User, { onDelete: 'CASCADE' })
  user: User;

  @Column({
    type: 'enum',
    enum: StrikeReason,
  })
  reason: StrikeReason;

  @Column('text')
  details: string;

  // Related report ID if from community report
  @Column({ nullable: true })
  report_id: string;

  @ManyToOne(() => Report, { onDelete: 'SET NULL' })
  report: Report;

  // Track ID that was removed (for reference)
  @Column({ nullable: true })
  track_id: string;

  // Admin who issued strike
  @Column()
  issued_by_id: string;

  @ManyToOne(() => User, { onDelete: 'SET NULL' })
  issued_by: User;

  @CreateDateColumn()
  created_at: Date;

  // Strikes can expire after N months
  @Column({ type: 'timestamp', nullable: true })
  expires_at: Date;
}
