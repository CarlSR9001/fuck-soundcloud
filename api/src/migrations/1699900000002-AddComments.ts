import { MigrationInterface, QueryRunner } from 'typeorm';

export class AddComments1699900000002 implements MigrationInterface {
  name = 'AddComments1699900000002';

  public async up(queryRunner: QueryRunner): Promise<void> {
    // Create comment visibility enum
    await queryRunner.query(`
      CREATE TYPE "comment_visibility_enum" AS ENUM (
        'public',
        'hidden'
      )
    `);

    // Create comments table
    await queryRunner.query(`
      CREATE TABLE "comments" (
        "id" uuid PRIMARY KEY DEFAULT uuid_generate_v4(),
        "track_id" uuid NOT NULL,
        "user_id" uuid NOT NULL,
        "parent_id" uuid,
        "at_ms" integer,
        "body_md" text NOT NULL,
        "visibility" "comment_visibility_enum" NOT NULL DEFAULT 'public',
        "created_at" timestamptz NOT NULL DEFAULT now(),
        "updated_at" timestamptz NOT NULL DEFAULT now(),
        CONSTRAINT "FK_comments_track" FOREIGN KEY ("track_id")
          REFERENCES "tracks"("id") ON DELETE CASCADE,
        CONSTRAINT "FK_comments_user" FOREIGN KEY ("user_id")
          REFERENCES "users"("id") ON DELETE CASCADE,
        CONSTRAINT "FK_comments_parent" FOREIGN KEY ("parent_id")
          REFERENCES "comments"("id") ON DELETE CASCADE
      )
    `);

    // Create indexes
    await queryRunner.query(
      `CREATE INDEX "IDX_comments_track_id" ON "comments" ("track_id")`,
    );
    await queryRunner.query(
      `CREATE INDEX "IDX_comments_user_id" ON "comments" ("user_id")`,
    );
    await queryRunner.query(
      `CREATE INDEX "IDX_comments_parent_id" ON "comments" ("parent_id")`,
    );
    await queryRunner.query(
      `CREATE INDEX "IDX_comments_at_ms" ON "comments" ("at_ms")`,
    );
  }

  public async down(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query(`DROP INDEX "IDX_comments_at_ms"`);
    await queryRunner.query(`DROP INDEX "IDX_comments_parent_id"`);
    await queryRunner.query(`DROP INDEX "IDX_comments_user_id"`);
    await queryRunner.query(`DROP INDEX "IDX_comments_track_id"`);
    await queryRunner.query(`DROP TABLE "comments"`);
    await queryRunner.query(`DROP TYPE "comment_visibility_enum"`);
  }
}
