import { MigrationInterface, QueryRunner } from 'typeorm';

export class AddCredits1699800000001 implements MigrationInterface {
  name = 'AddCredits1699800000001';

  public async up(queryRunner: QueryRunner): Promise<void> {
    // Create credit role enum
    await queryRunner.query(`
      CREATE TYPE "credit_role_enum" AS ENUM (
        'writer',
        'producer',
        'mixer',
        'mastering',
        'feature',
        'musician',
        'other'
      )
    `);

    // Create credits table
    await queryRunner.query(`
      CREATE TABLE "credits" (
        "id" uuid PRIMARY KEY DEFAULT uuid_generate_v4(),
        "track_id" uuid NOT NULL,
        "person_name" varchar(200) NOT NULL,
        "role" "credit_role_enum" NOT NULL,
        "url" varchar(500),
        "created_at" timestamptz NOT NULL DEFAULT now(),
        CONSTRAINT "FK_credits_track" FOREIGN KEY ("track_id")
          REFERENCES "tracks"("id") ON DELETE CASCADE
      )
    `);

    await queryRunner.query(
      `CREATE INDEX "IDX_credits_track_id" ON "credits" ("track_id")`,
    );
  }

  public async down(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query(`DROP TABLE "credits"`);
    await queryRunner.query(`DROP TYPE "credit_role_enum"`);
  }
}
