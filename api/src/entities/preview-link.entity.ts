import {
  Entity,
  PrimaryGeneratedColumn,
  Column,
  CreateDateColumn,
  ManyToOne,
  JoinColumn,
  Index,
} from 'typeorm';
import { Track } from './track.entity';
import { User } from './user.entity';

@Entity('preview_links')
export class PreviewLink {
  @PrimaryGeneratedColumn('uuid')
  id: string;

  @Column({ type: 'uuid' })
  @Index()
  track_id: string;

  @ManyToOne(() => Track, { onDelete: 'CASCADE' })
  @JoinColumn({ name: 'track_id' })
  track: Track;

  @Column({ type: 'uuid', unique: true })
  @Index()
  token: string;

  @Column({ type: 'timestamptz', nullable: true })
  expires_at: Date | null;

  @Column({ type: 'int', nullable: true })
  max_uses: number | null;

  @Column({ type: 'int', default: 0 })
  use_count: number;

  @Column({ type: 'uuid' })
  @Index()
  created_by_user_id: string;

  @ManyToOne(() => User, { onDelete: 'CASCADE' })
  @JoinColumn({ name: 'created_by_user_id' })
  created_by: User;

  @CreateDateColumn()
  created_at: Date;
}
