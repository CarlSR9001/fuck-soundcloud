/**
 * Analytics daily summary entity
 * Aggregated daily statistics per track
 */

import {
  Entity,
  PrimaryGeneratedColumn,
  Column,
  ManyToOne,
  JoinColumn,
  Index,
  Unique,
} from 'typeorm';
import { Track } from './track.entity';

@Entity('analytics_daily')
@Unique(['track_id', 'day'])
@Index(['track_id', 'day'])
@Index(['day'])
export class AnalyticsDaily {
  @PrimaryGeneratedColumn('uuid')
  id: string;

  @Column('uuid')
  track_id: string;

  @ManyToOne(() => Track, { onDelete: 'CASCADE' })
  @JoinColumn({ name: 'track_id' })
  track: Track;

  @Column('date')
  day: string; // Format: YYYY-MM-DD

  @Column('int', { default: 0 })
  plays: number;

  @Column('int', { default: 0 })
  uniques: number;

  @Column('int', { default: 0 })
  likes: number;

  @Column('int', { default: 0 })
  reposts: number;

  @Column('int', { default: 0 })
  downloads: number;

  @Column('int', { default: 0 })
  completions: number;
}
