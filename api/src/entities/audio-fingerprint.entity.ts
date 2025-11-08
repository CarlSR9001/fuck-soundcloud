import {
  Entity,
  PrimaryGeneratedColumn,
  Column,
  ManyToOne,
  CreateDateColumn,
  Index,
} from 'typeorm';
import { TrackVersion } from './track-version.entity';

@Entity('audio_fingerprints')
export class AudioFingerprint {
  @PrimaryGeneratedColumn('uuid')
  id: string;

  @Column()
  @Index()
  track_version_id: string;

  @ManyToOne(() => TrackVersion, { onDelete: 'CASCADE' })
  track_version: TrackVersion;

  // Chromaprint fingerprint (base64 encoded)
  @Column('text')
  @Index()
  fingerprint: string;

  // Duration in seconds
  @Column('int')
  duration: number;

  // AcoustID if matched to their database
  @Column({ nullable: true })
  acoustid: string;

  // MusicBrainz recording ID if matched
  @Column({ nullable: true })
  musicbrainz_id: string;

  @CreateDateColumn()
  created_at: Date;
}
