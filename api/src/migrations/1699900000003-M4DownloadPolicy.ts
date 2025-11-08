import { MigrationInterface, QueryRunner } from 'typeorm';

export class M4DownloadPolicy1699900000003 implements MigrationInterface {
  public async up(queryRunner: QueryRunner): Promise<void> {
    // Add download policy fields to tracks table
    await queryRunner.query(`
      CREATE TYPE download_policy AS ENUM ('disabled', 'lossy', 'original', 'stems_included');

      ALTER TABLE tracks ADD COLUMN download_policy download_policy DEFAULT 'disabled';
      ALTER TABLE tracks ADD COLUMN download_price_cents INTEGER;
    `);

    // Downloads table
    await queryRunner.query(`
      CREATE TYPE download_format AS ENUM ('original', '320kbps', 'stems');

      CREATE TABLE downloads (
        id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
        user_id UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
        track_id UUID NOT NULL REFERENCES tracks(id) ON DELETE CASCADE,
        track_version_id UUID NOT NULL REFERENCES track_versions(id) ON DELETE CASCADE,
        format download_format NOT NULL,
        ip_hash VARCHAR NOT NULL,
        created_at TIMESTAMP DEFAULT NOW()
      );
      CREATE INDEX idx_downloads_user ON downloads(user_id);
      CREATE INDEX idx_downloads_track ON downloads(track_id);
      CREATE INDEX idx_downloads_version ON downloads(track_version_id);
    `);
  }

  public async down(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query(`DROP TABLE downloads`);
    await queryRunner.query(`DROP TYPE download_format`);
    await queryRunner.query(`
      ALTER TABLE tracks DROP COLUMN download_price_cents;
      ALTER TABLE tracks DROP COLUMN download_policy;
    `);
    await queryRunner.query(`DROP TYPE download_policy`);
  }
}
