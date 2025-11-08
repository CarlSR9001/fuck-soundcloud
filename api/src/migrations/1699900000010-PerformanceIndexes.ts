import { MigrationInterface, QueryRunner } from 'typeorm';

/**
 * Migration: Add Performance Indexes
 *
 * Creates database indexes for improved query performance across M4 features
 */
export class PerformanceIndexes1699900000010 implements MigrationInterface {
  public async up(queryRunner: QueryRunner): Promise<void> {
    // Track indexes
    await queryRunner.query(`
      CREATE INDEX IF NOT EXISTS idx_tracks_owner
      ON tracks(owner_user_id);
    `);

    await queryRunner.query(`
      CREATE INDEX IF NOT EXISTS idx_tracks_visibility_published
      ON tracks(visibility, published_at)
      WHERE published_at IS NOT NULL;
    `);

    await queryRunner.query(`
      CREATE INDEX IF NOT EXISTS idx_tracks_slug
      ON tracks(slug);
    `);

    // Track version indexes
    await queryRunner.query(`
      CREATE INDEX IF NOT EXISTS idx_versions_track
      ON track_versions(track_id);
    `);

    await queryRunner.query(`
      CREATE INDEX IF NOT EXISTS idx_versions_status
      ON track_versions(status);
    `);

    await queryRunner.query(`
      CREATE INDEX IF NOT EXISTS idx_versions_track_status
      ON track_versions(track_id, status);
    `);

    // Download indexes
    await queryRunner.query(`
      CREATE INDEX IF NOT EXISTS idx_downloads_track_created
      ON downloads(track_id, created_at DESC);
    `);

    await queryRunner.query(`
      CREATE INDEX IF NOT EXISTS idx_downloads_user_created
      ON downloads(user_id, created_at DESC);
    `);

    await queryRunner.query(`
      CREATE INDEX IF NOT EXISTS idx_downloads_version
      ON downloads(track_version_id);
    `);

    // Stem indexes
    await queryRunner.query(`
      CREATE INDEX IF NOT EXISTS idx_stems_version
      ON stems(track_version_id);
    `);

    await queryRunner.query(`
      CREATE INDEX IF NOT EXISTS idx_stems_version_role
      ON stems(track_version_id, role);
    `);

    // Transcode indexes
    await queryRunner.query(`
      CREATE INDEX IF NOT EXISTS idx_transcodes_version_format
      ON transcodes(track_version_id, format);
    `);

    await queryRunner.query(`
      CREATE INDEX IF NOT EXISTS idx_transcodes_status
      ON transcodes(status)
      WHERE status IN ('pending', 'processing');
    `);

    await queryRunner.query(`
      CREATE INDEX IF NOT EXISTS idx_transcodes_version_status
      ON transcodes(track_version_id, status);
    `);

    // Asset indexes
    await queryRunner.query(`
      CREATE INDEX IF NOT EXISTS idx_assets_bucket_key
      ON assets(bucket, key);
    `);

    // User indexes for authentication performance
    await queryRunner.query(`
      CREATE INDEX IF NOT EXISTS idx_users_email
      ON users(email);
    `);

    await queryRunner.query(`
      CREATE INDEX IF NOT EXISTS idx_users_username
      ON users(username);
    `);

    // Composite index for track discovery
    await queryRunner.query(`
      CREATE INDEX IF NOT EXISTS idx_tracks_discovery
      ON tracks(visibility, published_at DESC)
      WHERE visibility = 'public' AND published_at IS NOT NULL;
    `);
  }

  public async down(queryRunner: QueryRunner): Promise<void> {
    // Drop indexes in reverse order
    await queryRunner.query(`DROP INDEX IF EXISTS idx_tracks_discovery;`);
    await queryRunner.query(`DROP INDEX IF EXISTS idx_users_username;`);
    await queryRunner.query(`DROP INDEX IF EXISTS idx_users_email;`);
    await queryRunner.query(`DROP INDEX IF EXISTS idx_assets_bucket_key;`);
    await queryRunner.query(`DROP INDEX IF EXISTS idx_transcodes_version_status;`);
    await queryRunner.query(`DROP INDEX IF EXISTS idx_transcodes_status;`);
    await queryRunner.query(`DROP INDEX IF EXISTS idx_transcodes_version_format;`);
    await queryRunner.query(`DROP INDEX IF EXISTS idx_stems_version_role;`);
    await queryRunner.query(`DROP INDEX IF EXISTS idx_stems_version;`);
    await queryRunner.query(`DROP INDEX IF EXISTS idx_downloads_version;`);
    await queryRunner.query(`DROP INDEX IF EXISTS idx_downloads_user_created;`);
    await queryRunner.query(`DROP INDEX IF EXISTS idx_downloads_track_created;`);
    await queryRunner.query(`DROP INDEX IF EXISTS idx_versions_track_status;`);
    await queryRunner.query(`DROP INDEX IF EXISTS idx_versions_status;`);
    await queryRunner.query(`DROP INDEX IF EXISTS idx_versions_track;`);
    await queryRunner.query(`DROP INDEX IF EXISTS idx_tracks_slug;`);
    await queryRunner.query(`DROP INDEX IF EXISTS idx_tracks_visibility_published;`);
    await queryRunner.query(`DROP INDEX IF EXISTS idx_tracks_owner;`);
  }
}
