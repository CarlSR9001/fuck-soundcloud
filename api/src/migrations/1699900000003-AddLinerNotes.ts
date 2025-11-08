import { MigrationInterface, QueryRunner } from 'typeorm';

export class AddLinerNotes1699900000003 implements MigrationInterface {
  public async up(queryRunner: QueryRunner): Promise<void> {
    // Add liner notes fields to track_versions table
    await queryRunner.query(`
      ALTER TABLE track_versions
      ADD COLUMN liner_notes TEXT,
      ADD COLUMN session_date DATE,
      ADD COLUMN session_location VARCHAR(300),
      ADD COLUMN instruments_json JSONB,
      ADD COLUMN gear_json JSONB;
    `);
  }

  public async down(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query(`
      ALTER TABLE track_versions
      DROP COLUMN gear_json,
      DROP COLUMN instruments_json,
      DROP COLUMN session_location,
      DROP COLUMN session_date,
      DROP COLUMN liner_notes;
    `);
  }
}
