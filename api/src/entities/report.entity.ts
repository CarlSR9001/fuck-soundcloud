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
import { Track } from './track.entity';

export enum ReportReason {
  COPYRIGHT_INFRINGEMENT = 'copyright_infringement',
  SPAM = 'spam',
  HARASSMENT = 'harassment',
  HATE_SPEECH = 'hate_speech',
  IMPERSONATION = 'impersonation',
  OTHER = 'other',
}

export enum ReportStatus {
  PENDING = 'pending',
  UNDER_REVIEW = 'under_review',
  RESOLVED_REMOVED = 'resolved_removed',
  RESOLVED_KEPT = 'resolved_kept',
  DISMISSED = 'dismissed',
}

@Entity('reports')
export class Report {
  @PrimaryGeneratedColumn('uuid')
  id: string;

  @Column()
  @Index()
  reporter_id: string;

  @ManyToOne(() => User, { onDelete: 'SET NULL' })
  reporter: User;

  @Column()
  @Index()
  track_id: string;

  @ManyToOne(() => Track, { onDelete: 'CASCADE' })
  track: Track;

  @Column({
    type: 'enum',
    enum: ReportReason,
  })
  @Index()
  reason: ReportReason;

  @Column('text')
  details: string;

  // Link to evidence (Spotify URL, YouTube, etc.)
  @Column({ nullable: true })
  evidence_url: string;

  @Column({
    type: 'enum',
    enum: ReportStatus,
    default: ReportStatus.PENDING,
  })
  @Index()
  status: ReportStatus;

  // Admin who reviewed
  @Column({ nullable: true })
  reviewed_by_id: string;

  @ManyToOne(() => User, { onDelete: 'SET NULL' })
  reviewed_by: User;

  @Column('text', { nullable: true })
  resolution_notes: string;

  @CreateDateColumn()
  created_at: Date;

  @UpdateDateColumn()
  updated_at: Date;

  @Column({ type: 'timestamp', nullable: true })
  resolved_at: Date;
}
