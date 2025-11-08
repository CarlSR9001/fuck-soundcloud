import {
  Entity,
  PrimaryGeneratedColumn,
  Column,
  CreateDateColumn,
  UpdateDateColumn,
  Index,
  OneToMany,
} from 'typeorm';
import { Session } from './session.entity';
import { Track } from './track.entity';

@Entity('users')
export class User {
  @PrimaryGeneratedColumn('uuid')
  id: string;

  @Column({ unique: true, length: 50 })
  @Index()
  handle: string;

  @Column({ length: 100 })
  display_name: string;

  @Column({ unique: true, length: 255 })
  @Index()
  email: string;

  @Column({ length: 255 })
  password_hash: string;

  @Column({ type: 'text', nullable: true })
  bio: string | null;

  @Column({ type: 'uuid', nullable: true })
  avatar_asset_id: string | null;

  @Column({ default: false })
  is_admin: boolean;

  @Column({ default: false })
  is_banned: boolean;

  @Column({ type: 'text', nullable: true })
  ban_reason: string | null;

  @Column({ type: 'timestamp', nullable: true })
  banned_at: Date | null;

  @Column({ default: false })
  prefer_lossless: boolean;

  @CreateDateColumn()
  created_at: Date;

  @UpdateDateColumn()
  updated_at: Date;

  @OneToMany(() => Session, (session) => session.user)
  sessions: Session[];

  @OneToMany(() => Track, (track) => track.owner)
  tracks: Track[];
}
