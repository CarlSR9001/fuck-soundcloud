import {
  Entity,
  PrimaryGeneratedColumn,
  Column,
  CreateDateColumn,
  ManyToOne,
  JoinColumn,
  Index,
  Unique,
} from 'typeorm';
import { User } from './user.entity';

export enum ReactionTargetType {
  TRACK = 'track',
  COMMENT = 'comment',
  PLAYLIST = 'playlist',
}

export enum ReactionKind {
  LIKE = 'like',
  REPOST = 'repost',
}

@Entity('reactions')
@Unique(['user_id', 'target_type', 'target_id', 'kind'])
@Index(['target_type', 'target_id'])
@Index(['user_id'])
export class Reaction {
  @PrimaryGeneratedColumn('uuid')
  id: string;

  @Column({ type: 'uuid' })
  @Index()
  user_id: string;

  @ManyToOne(() => User, { onDelete: 'CASCADE' })
  @JoinColumn({ name: 'user_id' })
  user: User;

  @Column({
    type: 'enum',
    enum: ReactionTargetType,
  })
  target_type: ReactionTargetType;

  @Column({ type: 'uuid' })
  target_id: string;

  @Column({
    type: 'enum',
    enum: ReactionKind,
  })
  kind: ReactionKind;

  @CreateDateColumn()
  created_at: Date;
}
