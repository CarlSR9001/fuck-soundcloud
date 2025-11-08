import { MigrationInterface, QueryRunner } from 'typeorm';

export class AddTags1699900000001 implements MigrationInterface {
  name = 'AddTags1699900000001';

  public async up(queryRunner: QueryRunner): Promise<void> {
    // Create tags table
    await queryRunner.query(`
      CREATE TABLE "tags" (
        "id" uuid PRIMARY KEY DEFAULT uuid_generate_v4(),
        "name" varchar(100) NOT NULL,
        "slug" varchar(100) NOT NULL UNIQUE,
        "created_at" timestamptz NOT NULL DEFAULT now()
      )
    `);

    await queryRunner.query(
      `CREATE INDEX "IDX_tags_slug" ON "tags" ("slug")`,
    );

    // Create track_tags junction table
    await queryRunner.query(`
      CREATE TABLE "track_tags" (
        "id" uuid PRIMARY KEY DEFAULT uuid_generate_v4(),
        "track_id" uuid NOT NULL,
        "tag_id" uuid NOT NULL,
        "created_at" timestamptz NOT NULL DEFAULT now(),
        CONSTRAINT "FK_track_tags_track" FOREIGN KEY ("track_id")
          REFERENCES "tracks"("id") ON DELETE CASCADE,
        CONSTRAINT "FK_track_tags_tag" FOREIGN KEY ("tag_id")
          REFERENCES "tags"("id") ON DELETE CASCADE,
        CONSTRAINT "UQ_track_tags_track_tag" UNIQUE ("track_id", "tag_id")
      )
    `);

    await queryRunner.query(
      `CREATE INDEX "IDX_track_tags_track_id" ON "track_tags" ("track_id")`,
    );
    await queryRunner.query(
      `CREATE INDEX "IDX_track_tags_tag_id" ON "track_tags" ("tag_id")`,
    );
  }

  public async down(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query(`DROP TABLE "track_tags"`);
    await queryRunner.query(`DROP TABLE "tags"`);
  }
}
