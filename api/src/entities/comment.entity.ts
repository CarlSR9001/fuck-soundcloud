import {
  Entity,
  PrimaryGeneratedColumn,
  Column,
  CreateDateColumn,
  UpdateDateColumn,
  ManyToOne,
  JoinColumn,
  Index,
  OneToMany,
} from 'typeorm';
import { Track } from './track.entity';
import { User } from './user.entity';

export enum CommentVisibility {
  PUBLIC = 'public',
  HIDDEN = 'hidden',
}

@Entity('comments')
export class Comment {
  @PrimaryGeneratedColumn('uuid')
  id: string;

  @Column({ type: 'uuid' })
  @Index()
  track_id: string;

  @ManyToOne(() => Track, { onDelete: 'CASCADE' })
  @JoinColumn({ name: 'track_id' })
  track: Track;

  @Column({ type: 'uuid' })
  @Index()
  user_id: string;

  @ManyToOne(() => User, { onDelete: 'CASCADE' })
  @JoinColumn({ name: 'user_id' })
  user: User;

  @Column({ type: 'uuid', nullable: true })
  @Index()
  parent_id: string | null;

  @ManyToOne(() => Comment, (comment) => comment.replies, {
    onDelete: 'CASCADE',
    nullable: true,
  })
  @JoinColumn({ name: 'parent_id' })
  parent: Comment | null;

  @OneToMany(() => Comment, (comment) => comment.parent)
  replies: Comment[];

  @Column({ type: 'integer', nullable: true })
  @Index()
  at_ms: number | null;

  @Column({ type: 'text' })
  body_md: string;

  @Column({
    type: 'enum',
    enum: CommentVisibility,
    default: CommentVisibility.PUBLIC,
  })
  visibility: CommentVisibility;

  @CreateDateColumn()
  created_at: Date;

  @UpdateDateColumn()
  updated_at: Date;
}
