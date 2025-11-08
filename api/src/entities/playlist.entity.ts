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
import { PlaylistItem } from './playlist-item.entity';

export enum PlaylistVisibility {
  PUBLIC = 'public',
  UNLISTED = 'unlisted',
  PRIVATE = 'private',
}

@Entity('playlists')
export class Playlist {
  @PrimaryGeneratedColumn('uuid')
  id: string;

  @Column({ type: 'uuid' })
  @Index()
  owner_user_id: string;

  @ManyToOne(() => User, { onDelete: 'CASCADE' })
  @JoinColumn({ name: 'owner_user_id' })
  owner: User;

  @Column({ length: 300 })
  title: string;

  @Column({ type: 'text', nullable: true })
  description_md: string | null;

  @Column({
    type: 'enum',
    enum: PlaylistVisibility,
    default: PlaylistVisibility.PRIVATE,
  })
  @Index()
  visibility: PlaylistVisibility;

  @Column({ type: 'uuid', nullable: true })
  artwork_asset_id: string | null;

  @CreateDateColumn()
  created_at: Date;

  @UpdateDateColumn()
  updated_at: Date;

  @OneToMany(() => PlaylistItem, (item) => item.playlist, { cascade: true })
  items: PlaylistItem[];
}
