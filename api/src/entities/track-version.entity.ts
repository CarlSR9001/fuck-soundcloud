import {
  Entity,
  PrimaryGeneratedColumn,
  Column,
  CreateDateColumn,
  ManyToOne,
  JoinColumn,
  OneToMany,
  OneToOne,
  Index,
} from 'typeorm';
import { Track } from './track.entity';
import { Transcode } from './transcode.entity';
import { Waveform } from './waveform.entity';

export enum TrackVersionStatus {
  PENDING = 'pending',
  READY = 'ready',
  FAILED = 'failed',
}

@Entity('track_versions')
export class TrackVersion {
  @PrimaryGeneratedColumn('uuid')
  id: string;

  @Column({ type: 'uuid' })
  @Index()
  track_id: string;

  @ManyToOne(() => Track, (track) => track.versions, { onDelete: 'CASCADE' })
  @JoinColumn({ name: 'track_id' })
  track: Track;

  @Column({ length: 100, default: 'v1' })
  version_label: string;

  @Column({ type: 'uuid' })
  original_asset_id: string;

  @Column({ type: 'int', nullable: true })
  duration_ms: number | null;

  @Column({ type: 'float', nullable: true })
  loudness_lufs: number | null;

  @Column({ type: 'int', nullable: true })
  sample_rate: number | null;

  @Column({ type: 'int', nullable: true })
  channels: number | null;

  @Column({
    type: 'enum',
    enum: TrackVersionStatus,
    default: TrackVersionStatus.PENDING,
  })
  @Index()
  status: TrackVersionStatus;

  @Column({ type: 'text', nullable: true })
  error_message: string | null;

  @CreateDateColumn()
  created_at: Date;

  @OneToMany(() => Transcode, (transcode) => transcode.trackVersion)
  transcodes: Transcode[];

  @OneToOne(() => Waveform, (waveform) => waveform.trackVersion)
  waveform: Waveform | null;
}
