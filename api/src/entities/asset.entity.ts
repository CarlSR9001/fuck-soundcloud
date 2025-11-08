import {
  Entity,
  PrimaryGeneratedColumn,
  Column,
  CreateDateColumn,
  Index,
} from 'typeorm';

@Entity('assets')
export class Asset {
  @PrimaryGeneratedColumn('uuid')
  id: string;

  @Column({ length: 100 })
  bucket: string;

  @Column({ length: 500 })
  key: string;

  @Column({ type: 'bigint' })
  size_bytes: number;

  @Column({ length: 100 })
  mime: string;

  @Column({ length: 64 })
  @Index()
  sha256: string;

  @CreateDateColumn()
  created_at: Date;
}
