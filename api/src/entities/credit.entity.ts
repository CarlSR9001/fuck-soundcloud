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

export enum CreditRole {
  WRITER = 'writer',
  PRODUCER = 'producer',
  MIXER = 'mixer',
  MASTERING = 'mastering',
  FEATURE = 'feature',
  MUSICIAN = 'musician',
  OTHER = 'other',
}

@Entity('credits')
export class Credit {
  @PrimaryGeneratedColumn('uuid')
  id: string;

  @Column({ type: 'uuid' })
  @Index()
  track_id: string;

  @ManyToOne(() => Track, (track) => track.credits, { onDelete: 'CASCADE' })
  @JoinColumn({ name: 'track_id' })
  track: Track;

  @Column({ length: 200 })
  person_name: string;

  @Column({
    type: 'enum',
    enum: CreditRole,
  })
  role: CreditRole;

  @Column({ type: 'varchar', length: 500, nullable: true })
  url: string | null;

  @CreateDateColumn()
  created_at: Date;
}
