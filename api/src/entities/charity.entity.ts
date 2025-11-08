import {
  Entity,
  PrimaryGeneratedColumn,
  Column,
  CreateDateColumn,
  UpdateDateColumn,
  Index,
} from 'typeorm';

@Entity('charities')
export class Charity {
  @PrimaryGeneratedColumn('uuid')
  id: string;

  @Column({ unique: true })
  @Index()
  slug: string;

  @Column()
  name: string;

  @Column('text')
  description: string;

  @Column()
  website_url: string;

  // EIN for US 501(c)(3) verification
  @Column({ nullable: true })
  tax_id: string;

  @Column({ default: true })
  is_active: boolean;

  // Logo/icon URL
  @Column({ nullable: true })
  logo_url: string;

  // Total received via platform
  @Column('decimal', { precision: 12, scale: 2, default: 0 })
  total_received_cents: number;

  @CreateDateColumn()
  created_at: Date;

  @UpdateDateColumn()
  updated_at: Date;
}
