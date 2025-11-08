import {
  Entity,
  PrimaryGeneratedColumn,
  Column,
  ManyToOne,
  CreateDateColumn,
  Index,
} from 'typeorm';
import { User } from './user.entity';
import { Track } from './track.entity';

@Entity('copyright_attestations')
export class CopyrightAttestation {
  @PrimaryGeneratedColumn('uuid')
  id: string;

  @Column()
  @Index()
  user_id: string;

  @ManyToOne(() => User, { onDelete: 'CASCADE' })
  user: User;

  @Column()
  @Index()
  track_id: string;

  @ManyToOne(() => Track, { onDelete: 'CASCADE' })
  track: Track;

  // User attests they own all rights
  @Column({ default: true })
  attests_ownership: boolean;

  // Optional: Copyright registration number
  @Column({ nullable: true })
  copyright_registration: string;

  // Optional: ISRC code for the recording
  @Column({ nullable: true })
  isrc_code: string;

  // IP address of uploader (legal requirement)
  @Column()
  ip_address: string;

  // User agent
  @Column('text')
  user_agent: string;

  @CreateDateColumn()
  attested_at: Date;
}
