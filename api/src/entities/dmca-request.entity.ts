import {
  Entity,
  PrimaryGeneratedColumn,
  Column,
  CreateDateColumn,
  UpdateDateColumn,
  Index,
} from 'typeorm';

export enum DmcaStatus {
  RECEIVED = 'received',
  UNDER_REVIEW = 'under_review',
  CONTENT_REMOVED = 'content_removed',
  COUNTER_NOTICE = 'counter_notice',
  DISMISSED = 'dismissed',
}

@Entity('dmca_requests')
export class DmcaRequest {
  @PrimaryGeneratedColumn('uuid')
  id: string;

  // Contact info of copyright holder
  @Column()
  complainant_name: string;

  @Column()
  complainant_email: string;

  @Column({ nullable: true })
  complainant_phone: string;

  @Column('text', { nullable: true })
  complainant_address: string;

  // Infringing content
  @Column()
  @Index()
  track_id: string;

  @Column('text')
  infringement_description: string;

  // Original work identification
  @Column('text')
  original_work_description: string;

  @Column({ nullable: true })
  original_work_url: string;

  // Good faith statement
  @Column({ default: true })
  good_faith_statement: boolean;

  // Penalty of perjury statement
  @Column({ default: true })
  perjury_statement: boolean;

  // Electronic signature
  @Column()
  signature: string;

  @Column({
    type: 'enum',
    enum: DmcaStatus,
    default: DmcaStatus.RECEIVED,
  })
  @Index()
  status: DmcaStatus;

  @Column('text', { nullable: true })
  resolution_notes: string;

  @CreateDateColumn()
  created_at: Date;

  @UpdateDateColumn()
  updated_at: Date;

  @Column({ type: 'timestamp', nullable: true })
  resolved_at: Date;
}
