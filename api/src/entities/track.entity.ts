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

export enum TrackVisibility {
  PUBLIC = 'public',
  UNLISTED = 'unlisted',
  PRIVATE = 'private',
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

  @Column({ type: 'uuid', nullable: true })
  artwork_asset_id: string | null;

  @Column({ type: 'uuid', nullable: true })
  primary_version_id: string | null;

  @CreateDateColumn()
  created_at: Date;

  @UpdateDateColumn()
  updated_at: Date;

  @OneToMany(() => TrackVersion, (version) => version.track)
  versions: TrackVersion[];
}
