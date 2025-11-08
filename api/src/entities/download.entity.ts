import {
  Entity,
  PrimaryGeneratedColumn,
  Column,
  CreateDateColumn,
  ManyToOne,
  JoinColumn,
  Index,
} from 'typeorm';
import { User } from './user.entity';
import { Track } from './track.entity';
import { TrackVersion } from './track-version.entity';

export enum DownloadFormat {
  ORIGINAL = 'original',
  LOSSY_320 = '320kbps',
  STEMS = 'stems',
}

@Entity('downloads')
export class Download {
  @PrimaryGeneratedColumn('uuid')
  id: string;

  @Column({ type: 'uuid' })
  @Index()
  user_id: string;

  @ManyToOne(() => User, { onDelete: 'CASCADE' })
  @JoinColumn({ name: 'user_id' })
  user: User;

  @Column({ type: 'uuid' })
  @Index()
  track_id: string;

  @ManyToOne(() => Track, { onDelete: 'CASCADE' })
  @JoinColumn({ name: 'track_id' })
  track: Track;

  @Column({ type: 'uuid' })
  @Index()
  track_version_id: string;

  @ManyToOne(() => TrackVersion, { onDelete: 'CASCADE' })
  @JoinColumn({ name: 'track_version_id' })
  track_version: TrackVersion;

  @Column({
    type: 'enum',
    enum: DownloadFormat,
  })
  format: DownloadFormat;

  // Hashed IP address for privacy
  @Column()
  ip_hash: string;

  @CreateDateColumn()
  created_at: Date;
}
