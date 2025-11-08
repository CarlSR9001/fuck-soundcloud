/**
 * Analytics play event entity
 * Records individual play events for tracks
 */

import {
  Entity,
  PrimaryGeneratedColumn,
  Column,
  CreateDateColumn,
  ManyToOne,
  JoinColumn,
  Index,
} from 'typeorm';
import { Track } from './track.entity';
import { User } from './user.entity';

@Entity('analytics_play')
@Index(['track_id', 'started_at'])
@Index(['user_id'])
@Index(['started_at'])
export class AnalyticsPlay {
  @PrimaryGeneratedColumn('uuid')
  id: string;

  @Column('uuid')
  track_id: string;

  @ManyToOne(() => Track, { onDelete: 'CASCADE' })
  @JoinColumn({ name: 'track_id' })
  track: Track;

  @Column('uuid', { nullable: true })
  user_id: string | null;

  @ManyToOne(() => User, { onDelete: 'SET NULL', nullable: true })
  @JoinColumn({ name: 'user_id' })
  user: User | null;

  @Column('varchar', { length: 64 })
  ip_hash: string;

  @Column('text', { nullable: true })
  user_agent: string | null;

  @CreateDateColumn({ type: 'timestamptz' })
  started_at: Date;

  @Column('boolean', { default: false })
  completed: boolean;

  @Column('int', { default: 0 })
  watch_ms: number;

  @Column('text', { nullable: true })
  referrer: string | null;

  @Column('varchar', { length: 2, nullable: true })
  country: string | null;
}
