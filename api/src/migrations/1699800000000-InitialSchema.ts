import { MigrationInterface, QueryRunner } from 'typeorm';

export class InitialSchema1699800000000 implements MigrationInterface {
  name = 'InitialSchema1699800000000';

  public async up(queryRunner: QueryRunner): Promise<void> {
    // Create users table
    await queryRunner.query(`
      CREATE TABLE "users" (
        "id" uuid PRIMARY KEY DEFAULT uuid_generate_v4(),
        "handle" varchar(50) NOT NULL UNIQUE,
        "display_name" varchar(100) NOT NULL,
        "email" varchar(255) NOT NULL UNIQUE,
        "password_hash" varchar(255) NOT NULL,
        "bio" text,
        "avatar_asset_id" uuid,
        "is_admin" boolean NOT NULL DEFAULT false,
        "created_at" timestamptz NOT NULL DEFAULT now(),
        "updated_at" timestamptz NOT NULL DEFAULT now()
      )
    `);

    await queryRunner.query(
      `CREATE INDEX "IDX_users_handle" ON "users" ("handle")`,
    );
    await queryRunner.query(
      `CREATE INDEX "IDX_users_email" ON "users" ("email")`,
    );

    // Create sessions table
    await queryRunner.query(`
      CREATE TABLE "sessions" (
        "id" uuid PRIMARY KEY DEFAULT uuid_generate_v4(),
        "user_id" uuid NOT NULL,
        "jwt_id" varchar(255) NOT NULL UNIQUE,
        "expires_at" timestamptz NOT NULL,
        "created_at" timestamptz NOT NULL DEFAULT now(),
        CONSTRAINT "FK_sessions_user" FOREIGN KEY ("user_id")
          REFERENCES "users"("id") ON DELETE CASCADE
      )
    `);

    await queryRunner.query(
      `CREATE INDEX "IDX_sessions_user_id" ON "sessions" ("user_id")`,
    );
    await queryRunner.query(
      `CREATE INDEX "IDX_sessions_expires_at" ON "sessions" ("expires_at")`,
    );

    // Create assets table
    await queryRunner.query(`
      CREATE TABLE "assets" (
        "id" uuid PRIMARY KEY DEFAULT uuid_generate_v4(),
        "bucket" varchar(100) NOT NULL,
        "key" varchar(500) NOT NULL,
        "size_bytes" bigint NOT NULL,
        "mime" varchar(100) NOT NULL,
        "sha256" varchar(64) NOT NULL,
        "created_at" timestamptz NOT NULL DEFAULT now()
      )
    `);

    await queryRunner.query(
      `CREATE INDEX "IDX_assets_sha256" ON "assets" ("sha256")`,
    );

    // Create tracks table
    await queryRunner.query(`
      CREATE TYPE "track_visibility_enum" AS ENUM ('public', 'unlisted', 'private')
    `);

    await queryRunner.query(`
      CREATE TABLE "tracks" (
        "id" uuid PRIMARY KEY DEFAULT uuid_generate_v4(),
        "owner_user_id" uuid NOT NULL,
        "slug" varchar(200) NOT NULL UNIQUE,
        "title" varchar(300) NOT NULL,
        "description_md" text,
        "visibility" "track_visibility_enum" NOT NULL DEFAULT 'private',
        "release_at" timestamptz,
        "artwork_asset_id" uuid,
        "primary_version_id" uuid,
        "created_at" timestamptz NOT NULL DEFAULT now(),
        "updated_at" timestamptz NOT NULL DEFAULT now(),
        CONSTRAINT "FK_tracks_owner" FOREIGN KEY ("owner_user_id")
          REFERENCES "users"("id") ON DELETE CASCADE
      )
    `);

    await queryRunner.query(
      `CREATE INDEX "IDX_tracks_owner_user_id" ON "tracks" ("owner_user_id")`,
    );
    await queryRunner.query(
      `CREATE INDEX "IDX_tracks_slug" ON "tracks" ("slug")`,
    );
    await queryRunner.query(
      `CREATE INDEX "IDX_tracks_visibility" ON "tracks" ("visibility")`,
    );
    await queryRunner.query(
      `CREATE INDEX "IDX_tracks_release_at" ON "tracks" ("release_at")`,
    );

    // Create track_versions table
    await queryRunner.query(`
      CREATE TYPE "track_version_status_enum" AS ENUM ('pending', 'ready', 'failed')
    `);

    await queryRunner.query(`
      CREATE TABLE "track_versions" (
        "id" uuid PRIMARY KEY DEFAULT uuid_generate_v4(),
        "track_id" uuid NOT NULL,
        "version_label" varchar(100) NOT NULL DEFAULT 'v1',
        "original_asset_id" uuid NOT NULL,
        "duration_ms" int,
        "loudness_lufs" float,
        "sample_rate" int,
        "channels" int,
        "status" "track_version_status_enum" NOT NULL DEFAULT 'pending',
        "error_message" text,
        "created_at" timestamptz NOT NULL DEFAULT now(),
        CONSTRAINT "FK_track_versions_track" FOREIGN KEY ("track_id")
          REFERENCES "tracks"("id") ON DELETE CASCADE
      )
    `);

    await queryRunner.query(
      `CREATE INDEX "IDX_track_versions_track_id" ON "track_versions" ("track_id")`,
    );
    await queryRunner.query(
      `CREATE INDEX "IDX_track_versions_status" ON "track_versions" ("status")`,
    );

    // Create transcodes table
    await queryRunner.query(`
      CREATE TYPE "transcode_format_enum" AS ENUM ('hls_opus', 'hls_aac', 'hls_alac', 'mp3_320')
    `);

    await queryRunner.query(`
      CREATE TYPE "transcode_status_enum" AS ENUM ('pending', 'processing', 'ready', 'failed')
    `);

    await queryRunner.query(`
      CREATE TABLE "transcodes" (
        "id" uuid PRIMARY KEY DEFAULT uuid_generate_v4(),
        "track_version_id" uuid NOT NULL,
        "format" "transcode_format_enum" NOT NULL,
        "playlist_asset_id" uuid,
        "segment_prefix_key" varchar(500),
        "status" "transcode_status_enum" NOT NULL DEFAULT 'pending',
        "error_message" text,
        "created_at" timestamptz NOT NULL DEFAULT now(),
        CONSTRAINT "FK_transcodes_track_version" FOREIGN KEY ("track_version_id")
          REFERENCES "track_versions"("id") ON DELETE CASCADE
      )
    `);

    await queryRunner.query(
      `CREATE INDEX "IDX_transcodes_track_version_id" ON "transcodes" ("track_version_id")`,
    );
    await queryRunner.query(
      `CREATE INDEX "IDX_transcodes_format" ON "transcodes" ("format")`,
    );
    await queryRunner.query(
      `CREATE INDEX "IDX_transcodes_status" ON "transcodes" ("status")`,
    );

    // Create waveforms table
    await queryRunner.query(`
      CREATE TABLE "waveforms" (
        "id" uuid PRIMARY KEY DEFAULT uuid_generate_v4(),
        "track_version_id" uuid NOT NULL UNIQUE,
        "json_asset_id" uuid NOT NULL,
        "png_asset_id" uuid,
        "created_at" timestamptz NOT NULL DEFAULT now(),
        CONSTRAINT "FK_waveforms_track_version" FOREIGN KEY ("track_version_id")
          REFERENCES "track_versions"("id") ON DELETE CASCADE
      )
    `);

    // Enable uuid-ossp extension for uuid_generate_v4()
    await queryRunner.query(`CREATE EXTENSION IF NOT EXISTS "uuid-ossp"`);
  }

  public async down(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query(`DROP TABLE "waveforms"`);
    await queryRunner.query(`DROP TABLE "transcodes"`);
    await queryRunner.query(`DROP TYPE "transcode_status_enum"`);
    await queryRunner.query(`DROP TYPE "transcode_format_enum"`);
    await queryRunner.query(`DROP TABLE "track_versions"`);
    await queryRunner.query(`DROP TYPE "track_version_status_enum"`);
    await queryRunner.query(`DROP TABLE "tracks"`);
    await queryRunner.query(`DROP TYPE "track_visibility_enum"`);
    await queryRunner.query(`DROP TABLE "assets"`);
    await queryRunner.query(`DROP TABLE "sessions"`);
    await queryRunner.query(`DROP TABLE "users"`);
  }
}
