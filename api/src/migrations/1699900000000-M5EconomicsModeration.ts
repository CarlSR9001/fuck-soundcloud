import { MigrationInterface, QueryRunner } from 'typeorm';

export class M5EconomicsModeration1699900000000 implements MigrationInterface {
  public async up(queryRunner: QueryRunner): Promise<void> {
    // Charities table
    await queryRunner.query(`
      CREATE TABLE charities (
        id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
        slug VARCHAR NOT NULL UNIQUE,
        name VARCHAR NOT NULL,
        description TEXT NOT NULL,
        website_url VARCHAR NOT NULL,
        tax_id VARCHAR,
        is_active BOOLEAN DEFAULT true,
        logo_url VARCHAR,
        total_received_cents DECIMAL(12,2) DEFAULT 0,
        created_at TIMESTAMP DEFAULT NOW(),
        updated_at TIMESTAMP DEFAULT NOW()
      );
      CREATE INDEX idx_charities_slug ON charities(slug);
    `);

    // Contributions table
    await queryRunner.query(`
      CREATE TYPE contribution_type AS ENUM ('one_time', 'monthly');
      CREATE TYPE contribution_status AS ENUM ('pending', 'completed', 'failed', 'refunded');

      CREATE TABLE contributions (
        id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
        user_id UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
        amount_cents DECIMAL(10,2) NOT NULL,
        type contribution_type DEFAULT 'one_time',
        status contribution_status DEFAULT 'pending',
        payment_intent_id VARCHAR,
        provider VARCHAR DEFAULT 'stripe',
        artists_percentage INT DEFAULT 80,
        charity_percentage INT DEFAULT 10,
        platform_percentage INT DEFAULT 10,
        selected_charity_id UUID REFERENCES charities(id),
        created_at TIMESTAMP DEFAULT NOW(),
        processed_at TIMESTAMP
      );
      CREATE INDEX idx_contributions_user ON contributions(user_id);
      CREATE INDEX idx_contributions_status ON contributions(status);
      CREATE INDEX idx_contributions_charity ON contributions(selected_charity_id);
    `);

    // Artist payouts table
    await queryRunner.query(`
      CREATE TYPE payout_status AS ENUM ('pending', 'processing', 'completed', 'failed');

      CREATE TABLE artist_payouts (
        id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
        artist_id UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
        period VARCHAR NOT NULL,
        amount_cents DECIMAL(10,2) NOT NULL,
        contributor_count INT DEFAULT 0,
        total_listen_ms BIGINT DEFAULT 0,
        status payout_status DEFAULT 'pending',
        external_payout_id VARCHAR,
        provider VARCHAR DEFAULT 'stripe',
        created_at TIMESTAMP DEFAULT NOW(),
        processed_at TIMESTAMP,
        failure_reason TEXT
      );
      CREATE INDEX idx_artist_payouts_artist ON artist_payouts(artist_id);
      CREATE INDEX idx_artist_payouts_period ON artist_payouts(period);
      CREATE INDEX idx_artist_payouts_status ON artist_payouts(status);
    `);

    // Reports table
    await queryRunner.query(`
      CREATE TYPE report_reason AS ENUM ('copyright_infringement', 'spam', 'harassment', 'hate_speech', 'impersonation', 'other');
      CREATE TYPE report_status AS ENUM ('pending', 'under_review', 'resolved_removed', 'resolved_kept', 'dismissed');

      CREATE TABLE reports (
        id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
        reporter_id UUID NOT NULL REFERENCES users(id) ON DELETE SET NULL,
        track_id UUID NOT NULL REFERENCES tracks(id) ON DELETE CASCADE,
        reason report_reason NOT NULL,
        details TEXT NOT NULL,
        evidence_url VARCHAR,
        status report_status DEFAULT 'pending',
        reviewed_by_id UUID REFERENCES users(id) ON DELETE SET NULL,
        resolution_notes TEXT,
        created_at TIMESTAMP DEFAULT NOW(),
        updated_at TIMESTAMP DEFAULT NOW(),
        resolved_at TIMESTAMP
      );
      CREATE INDEX idx_reports_reporter ON reports(reporter_id);
      CREATE INDEX idx_reports_track ON reports(track_id);
      CREATE INDEX idx_reports_reason ON reports(reason);
      CREATE INDEX idx_reports_status ON reports(status);
    `);

    // Strikes table
    await queryRunner.query(`
      CREATE TYPE strike_reason AS ENUM ('copyright_infringement', 'dmca_takedown', 'spam', 'harassment', 'tos_violation');

      CREATE TABLE strikes (
        id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
        user_id UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
        reason strike_reason NOT NULL,
        details TEXT NOT NULL,
        report_id UUID REFERENCES reports(id) ON DELETE SET NULL,
        track_id UUID,
        issued_by_id UUID NOT NULL REFERENCES users(id) ON DELETE SET NULL,
        created_at TIMESTAMP DEFAULT NOW(),
        expires_at TIMESTAMP
      );
      CREATE INDEX idx_strikes_user ON strikes(user_id);
    `);

    // Copyright attestations table
    await queryRunner.query(`
      CREATE TABLE copyright_attestations (
        id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
        user_id UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
        track_id UUID NOT NULL REFERENCES tracks(id) ON DELETE CASCADE,
        attests_ownership BOOLEAN DEFAULT true,
        copyright_registration VARCHAR,
        isrc_code VARCHAR,
        ip_address VARCHAR NOT NULL,
        user_agent TEXT NOT NULL,
        attested_at TIMESTAMP DEFAULT NOW()
      );
      CREATE INDEX idx_copyright_attestations_user ON copyright_attestations(user_id);
      CREATE INDEX idx_copyright_attestations_track ON copyright_attestations(track_id);
    `);

    // Audio fingerprints table
    await queryRunner.query(`
      CREATE TABLE audio_fingerprints (
        id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
        track_version_id UUID NOT NULL REFERENCES track_versions(id) ON DELETE CASCADE,
        fingerprint TEXT NOT NULL,
        duration INT NOT NULL,
        acoustid VARCHAR,
        musicbrainz_id VARCHAR,
        created_at TIMESTAMP DEFAULT NOW()
      );
      CREATE INDEX idx_audio_fingerprints_version ON audio_fingerprints(track_version_id);
      CREATE INDEX idx_audio_fingerprints_fingerprint ON audio_fingerprints(fingerprint);
    `);

    // Artist verifications table
    await queryRunner.query(`
      CREATE TYPE verification_method AS ENUM ('domain', 'social_twitter', 'social_instagram', 'social_facebook', 'spotify_artist', 'bandcamp', 'manual');
      CREATE TYPE verification_status AS ENUM ('pending', 'verified', 'rejected', 'expired');

      CREATE TABLE artist_verifications (
        id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
        user_id UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
        method verification_method NOT NULL,
        status verification_status DEFAULT 'pending',
        evidence_data TEXT NOT NULL,
        verified_by_id UUID REFERENCES users(id) ON DELETE SET NULL,
        rejection_reason TEXT,
        created_at TIMESTAMP DEFAULT NOW(),
        updated_at TIMESTAMP DEFAULT NOW(),
        verified_at TIMESTAMP,
        expires_at TIMESTAMP
      );
      CREATE INDEX idx_artist_verifications_user ON artist_verifications(user_id);
      CREATE INDEX idx_artist_verifications_status ON artist_verifications(status);
    `);

    // DMCA requests table
    await queryRunner.query(`
      CREATE TYPE dmca_status AS ENUM ('received', 'under_review', 'content_removed', 'counter_notice', 'dismissed');

      CREATE TABLE dmca_requests (
        id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
        complainant_name VARCHAR NOT NULL,
        complainant_email VARCHAR NOT NULL,
        complainant_phone VARCHAR,
        complainant_address TEXT,
        track_id UUID NOT NULL,
        infringement_description TEXT NOT NULL,
        original_work_description TEXT NOT NULL,
        original_work_url VARCHAR,
        good_faith_statement BOOLEAN DEFAULT true,
        perjury_statement BOOLEAN DEFAULT true,
        signature VARCHAR NOT NULL,
        status dmca_status DEFAULT 'received',
        resolution_notes TEXT,
        created_at TIMESTAMP DEFAULT NOW(),
        updated_at TIMESTAMP DEFAULT NOW(),
        resolved_at TIMESTAMP
      );
      CREATE INDEX idx_dmca_requests_track ON dmca_requests(track_id);
      CREATE INDEX idx_dmca_requests_status ON dmca_requests(status);
    `);

    // Add is_banned field to users table
    await queryRunner.query(`
      ALTER TABLE users ADD COLUMN is_banned BOOLEAN DEFAULT false;
      ALTER TABLE users ADD COLUMN ban_reason TEXT;
      ALTER TABLE users ADD COLUMN banned_at TIMESTAMP;
    `);

    // Add is_verified field to users table
    await queryRunner.query(`
      ALTER TABLE users ADD COLUMN is_verified BOOLEAN DEFAULT false;
    `);
  }

  public async down(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query(`ALTER TABLE users DROP COLUMN is_verified`);
    await queryRunner.query(`ALTER TABLE users DROP COLUMN banned_at`);
    await queryRunner.query(`ALTER TABLE users DROP COLUMN ban_reason`);
    await queryRunner.query(`ALTER TABLE users DROP COLUMN is_banned`);
    await queryRunner.query(`DROP TABLE dmca_requests`);
    await queryRunner.query(`DROP TYPE dmca_status`);
    await queryRunner.query(`DROP TABLE artist_verifications`);
    await queryRunner.query(`DROP TYPE verification_status`);
    await queryRunner.query(`DROP TYPE verification_method`);
    await queryRunner.query(`DROP TABLE audio_fingerprints`);
    await queryRunner.query(`DROP TABLE copyright_attestations`);
    await queryRunner.query(`DROP TABLE strikes`);
    await queryRunner.query(`DROP TYPE strike_reason`);
    await queryRunner.query(`DROP TABLE reports`);
    await queryRunner.query(`DROP TYPE report_status`);
    await queryRunner.query(`DROP TYPE report_reason`);
    await queryRunner.query(`DROP TABLE artist_payouts`);
    await queryRunner.query(`DROP TYPE payout_status`);
    await queryRunner.query(`DROP TABLE contributions`);
    await queryRunner.query(`DROP TYPE contribution_status`);
    await queryRunner.query(`DROP TYPE contribution_type`);
    await queryRunner.query(`DROP TABLE charities`);
  }
}
