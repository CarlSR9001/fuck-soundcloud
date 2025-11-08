import { MigrationInterface, QueryRunner } from 'typeorm';

export class AddPlaylists1699900000000 implements MigrationInterface {
  name = 'AddPlaylists1699900000000';

  public async up(queryRunner: QueryRunner): Promise<void> {
    // Create playlist_visibility enum
    await queryRunner.query(`
      CREATE TYPE "playlist_visibility_enum" AS ENUM ('public', 'unlisted', 'private')
    `);

    // Create playlists table
    await queryRunner.query(`
      CREATE TABLE "playlists" (
        "id" uuid PRIMARY KEY DEFAULT uuid_generate_v4(),
        "owner_user_id" uuid NOT NULL,
        "title" varchar(300) NOT NULL,
        "description_md" text,
        "visibility" "playlist_visibility_enum" NOT NULL DEFAULT 'private',
        "artwork_asset_id" uuid,
        "created_at" timestamptz NOT NULL DEFAULT now(),
        "updated_at" timestamptz NOT NULL DEFAULT now(),
        CONSTRAINT "FK_playlists_owner" FOREIGN KEY ("owner_user_id")
          REFERENCES "users"("id") ON DELETE CASCADE
      )
    `);

    await queryRunner.query(
      `CREATE INDEX "IDX_playlists_owner_user_id" ON "playlists" ("owner_user_id")`,
    );
    await queryRunner.query(
      `CREATE INDEX "IDX_playlists_visibility" ON "playlists" ("visibility")`,
    );

    // Create playlist_items table
    await queryRunner.query(`
      CREATE TABLE "playlist_items" (
        "id" uuid PRIMARY KEY DEFAULT uuid_generate_v4(),
        "playlist_id" uuid NOT NULL,
        "track_id" uuid NOT NULL,
        "position" int NOT NULL,
        "added_at" timestamptz NOT NULL DEFAULT now(),
        CONSTRAINT "FK_playlist_items_playlist" FOREIGN KEY ("playlist_id")
          REFERENCES "playlists"("id") ON DELETE CASCADE,
        CONSTRAINT "FK_playlist_items_track" FOREIGN KEY ("track_id")
          REFERENCES "tracks"("id") ON DELETE CASCADE
      )
    `);

    await queryRunner.query(
      `CREATE INDEX "IDX_playlist_items_playlist_id" ON "playlist_items" ("playlist_id")`,
    );
    await queryRunner.query(
      `CREATE INDEX "IDX_playlist_items_track_id" ON "playlist_items" ("track_id")`,
    );
    await queryRunner.query(
      `CREATE INDEX "IDX_playlist_items_position" ON "playlist_items" ("position")`,
    );
    await queryRunner.query(
      `CREATE INDEX "IDX_playlist_items_playlist_position" ON "playlist_items" ("playlist_id", "position")`,
    );
  }

  public async down(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query(`DROP TABLE "playlist_items"`);
    await queryRunner.query(`DROP TABLE "playlists"`);
    await queryRunner.query(`DROP TYPE "playlist_visibility_enum"`);
  }
}
