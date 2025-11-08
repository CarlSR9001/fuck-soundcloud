import {
  Entity,
  PrimaryGeneratedColumn,
  Column,
  ManyToOne,
  JoinColumn,
  Index,
  CreateDateColumn,
} from 'typeorm';
import { Track } from './track.entity';
import { Tag } from './tag.entity';

@Entity('track_tags')
@Index(['track_id', 'tag_id'], { unique: true })
export class TrackTag {
  @PrimaryGeneratedColumn('uuid')
  id: string;

  @Column({ type: 'uuid' })
  @Index()
  track_id: string;

  @ManyToOne(() => Track, (track) => track.track_tags, { onDelete: 'CASCADE' })
  @JoinColumn({ name: 'track_id' })
  track: Track;

  @Column({ type: 'uuid' })
  @Index()
  tag_id: string;

  @ManyToOne(() => Tag, (tag) => tag.track_tags, { onDelete: 'CASCADE' })
  @JoinColumn({ name: 'tag_id' })
  tag: Tag;

  @CreateDateColumn()
  created_at: Date;
}
