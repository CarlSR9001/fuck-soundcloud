import { MigrationInterface, QueryRunner } from 'typeorm';

export class AddReleaseScheduling1699900000003 implements MigrationInterface {
  name = 'AddReleaseScheduling1699900000003';

  public async up(queryRunner: QueryRunner): Promise<void> {
    // Add scheduling fields to tracks table
    await queryRunner.query(`
      ALTER TABLE "tracks"
      ADD COLUMN "published_at" timestamptz,
      ADD COLUMN "embargo_until" timestamptz,
      ADD COLUMN "is_scheduled" boolean NOT NULL DEFAULT false
    `);

    await queryRunner.query(
      `CREATE INDEX "IDX_tracks_published_at" ON "tracks" ("published_at")`,
    );

    // Create preview_links table
    await queryRunner.query(`
      CREATE TABLE "preview_links" (
        "id" uuid PRIMARY KEY DEFAULT uuid_generate_v4(),
        "track_id" uuid NOT NULL,
        "token" uuid UNIQUE NOT NULL DEFAULT uuid_generate_v4(),
        "expires_at" timestamptz,
        "max_uses" int,
        "use_count" int NOT NULL DEFAULT 0,
        "created_by_user_id" uuid NOT NULL,
        "created_at" timestamptz NOT NULL DEFAULT now(),
        CONSTRAINT "FK_preview_links_track" FOREIGN KEY ("track_id")
          REFERENCES "tracks"("id") ON DELETE CASCADE,
        CONSTRAINT "FK_preview_links_user" FOREIGN KEY ("created_by_user_id")
          REFERENCES "users"("id") ON DELETE CASCADE
      )
    `);

    await queryRunner.query(
      `CREATE INDEX "IDX_preview_links_track_id" ON "preview_links" ("track_id")`,
    );

    await queryRunner.query(
      `CREATE INDEX "IDX_preview_links_token" ON "preview_links" ("token")`,
    );

    await queryRunner.query(
      `CREATE INDEX "IDX_preview_links_created_by" ON "preview_links" ("created_by_user_id")`,
    );
  }

  public async down(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query(`DROP TABLE "preview_links"`);
    await queryRunner.query(`DROP INDEX "IDX_tracks_published_at"`);
    await queryRunner.query(`
      ALTER TABLE "tracks"
      DROP COLUMN "published_at",
      DROP COLUMN "embargo_until",
      DROP COLUMN "is_scheduled"
    `);
  }
}
