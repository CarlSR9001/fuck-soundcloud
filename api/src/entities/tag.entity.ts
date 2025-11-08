import {
  Entity,
  PrimaryGeneratedColumn,
  Column,
  CreateDateColumn,
  OneToMany,
  Index,
} from 'typeorm';
import { TrackTag } from './track-tag.entity';

@Entity('tags')
export class Tag {
  @PrimaryGeneratedColumn('uuid')
  id: string;

  @Column({ length: 100 })
  name: string;

  @Column({ unique: true, length: 100 })
  @Index()
  slug: string;

  @CreateDateColumn()
  created_at: Date;

  @OneToMany(() => TrackTag, (trackTag) => trackTag.tag)
  track_tags: TrackTag[];
}
