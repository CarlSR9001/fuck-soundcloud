import {
  Entity,
  PrimaryGeneratedColumn,
  Column,
  CreateDateColumn,
  UpdateDateColumn,
  ManyToOne,
  JoinColumn,
  OneToMany,
  Index,
} from 'typeorm';
import { User } from './user.entity';
import { TrackVersion } from './track-version.entity';
import { TrackTag } from './track-tag.entity';
import { Credit } from './credit.entity';

export enum TrackVisibility {
  PUBLIC = 'public',
  UNLISTED = 'unlisted',
  PRIVATE = 'private',
}

export enum DownloadPolicy {
  DISABLED = 'disabled',
  LOSSY = 'lossy',
  ORIGINAL = 'original',
  STEMS_INCLUDED = 'stems_included',
}

@Entity('tracks')
export class Track {
  @PrimaryGeneratedColumn('uuid')
  id: string;

  @Column({ type: 'uuid' })
  @Index()
  owner_user_id: string;

  @ManyToOne(() => User, (user) => user.tracks, { onDelete: 'CASCADE' })
  @JoinColumn({ name: 'owner_user_id' })
  owner: User;

  @Column({ unique: true, length: 200 })
  @Index()
  slug: string;

  @Column({ length: 300 })
  title: string;

  @Column({ type: 'text', nullable: true })
  description_md: string | null;

  @Column({
    type: 'enum',
    enum: TrackVisibility,
    default: TrackVisibility.PRIVATE,
  })
  @Index()
  visibility: TrackVisibility;

  @Column({ type: 'timestamptz', nullable: true })
  @Index()
  release_at: Date | null;

  @Column({ type: 'timestamptz', nullable: true })
  @Index()
  published_at: Date | null;

  @Column({ type: 'timestamptz', nullable: true })
  embargo_until: Date | null;

  @Column({ type: 'boolean', default: false })
  is_scheduled: boolean;

  @Column({ type: 'uuid', nullable: true })
  artwork_asset_id: string | null;

  @Column({ type: 'uuid', nullable: true })
  primary_version_id: string | null;

  @Column({
    type: 'enum',
    enum: DownloadPolicy,
    default: DownloadPolicy.DISABLED,
  })
  download_policy: DownloadPolicy;

  @Column({ type: 'integer', nullable: true })
  download_price_cents: number | null;

  @CreateDateColumn()
  created_at: Date;

  @UpdateDateColumn()
  updated_at: Date;

  @OneToMany(() => TrackVersion, (version) => version.track)
  versions: TrackVersion[];

  @OneToMany(() => TrackTag, (trackTag) => trackTag.track)
  track_tags: TrackTag[];

  @OneToMany(() => Credit, (credit) => credit.track)
  credits: Credit[];
}
