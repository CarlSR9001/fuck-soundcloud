import {
  Entity,
  PrimaryGeneratedColumn,
  Column,
  CreateDateColumn,
  OneToOne,
  JoinColumn,
} from 'typeorm';
import { TrackVersion } from './track-version.entity';

@Entity('waveforms')
export class Waveform {
  @PrimaryGeneratedColumn('uuid')
  id: string;

  @Column({ type: 'uuid', unique: true })
  track_version_id: string;

  @OneToOne(() => TrackVersion, (version) => version.waveform, {
    onDelete: 'CASCADE',
  })
  @JoinColumn({ name: 'track_version_id' })
  trackVersion: TrackVersion;

  @Column({ type: 'uuid' })
  json_asset_id: string;

  @Column({ type: 'uuid', nullable: true })
  png_asset_id: string | null;

  @CreateDateColumn()
  created_at: Date;
}
