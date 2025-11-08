import {
  Entity,
  PrimaryGeneratedColumn,
  Column,
  CreateDateColumn,
  ManyToOne,
  JoinColumn,
  Index,
} from 'typeorm';
import { TrackVersion } from './track-version.entity';

export enum TranscodeFormat {
  HLS_OPUS = 'hls_opus',
  HLS_AAC = 'hls_aac',
  HLS_ALAC = 'hls_alac',
  MP3_320 = 'mp3_320',
}

export enum TranscodeStatus {
  PENDING = 'pending',
  PROCESSING = 'processing',
  READY = 'ready',
  FAILED = 'failed',
}

@Entity('transcodes')
export class Transcode {
  @PrimaryGeneratedColumn('uuid')
  id: string;

  @Column({ type: 'uuid' })
  @Index()
  track_version_id: string;

  @ManyToOne(() => TrackVersion, (version) => version.transcodes, {
    onDelete: 'CASCADE',
  })
  @JoinColumn({ name: 'track_version_id' })
  trackVersion: TrackVersion;

  @Column({
    type: 'enum',
    enum: TranscodeFormat,
  })
  @Index()
  format: TranscodeFormat;

  @Column({ type: 'uuid', nullable: true })
  playlist_asset_id: string | null;

  @Column({ length: 500, nullable: true })
  segment_prefix_key: string | null;

  @Column({
    type: 'enum',
    enum: TranscodeStatus,
    default: TranscodeStatus.PENDING,
  })
  @Index()
  status: TranscodeStatus;

  @Column({ type: 'text', nullable: true })
  error_message: string | null;

  @CreateDateColumn()
  created_at: Date;
}
