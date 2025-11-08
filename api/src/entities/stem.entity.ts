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
import { Asset } from './asset.entity';

export enum StemRole {
  VOCAL = 'vocal',
  DRUM = 'drum',
  BASS = 'bass',
  GUITAR = 'guitar',
  SYNTH = 'synth',
  FX = 'fx',
  OTHER = 'other',
}

@Entity('stems')
export class Stem {
  @PrimaryGeneratedColumn('uuid')
  id: string;

  @Column({ type: 'uuid' })
  @Index()
  track_version_id: string;

  @ManyToOne(() => TrackVersion, { onDelete: 'CASCADE' })
  @JoinColumn({ name: 'track_version_id' })
  trackVersion: TrackVersion;

  @Column({
    type: 'enum',
    enum: StemRole,
  })
  @Index()
  role: StemRole;

  @Column({ length: 200 })
  title: string;

  @Column({ type: 'uuid' })
  asset_id: string;

  @ManyToOne(() => Asset, { onDelete: 'CASCADE' })
  @JoinColumn({ name: 'asset_id' })
  asset: Asset;

  @CreateDateColumn()
  created_at: Date;
}
