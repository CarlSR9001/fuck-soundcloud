import { MigrationInterface, QueryRunner } from 'typeorm';

export class AddStems1699900000003 implements MigrationInterface {
  name = 'AddStems1699900000003';

  public async up(queryRunner: QueryRunner): Promise<void> {
    // Create stem role enum
    await queryRunner.query(`
      CREATE TYPE "stem_role_enum" AS ENUM (
        'vocal',
        'drum',
        'bass',
        'guitar',
        'synth',
        'fx',
        'other'
      )
    `);

    // Create stems table
    await queryRunner.query(`
      CREATE TABLE "stems" (
        "id" uuid PRIMARY KEY DEFAULT uuid_generate_v4(),
        "track_version_id" uuid NOT NULL,
        "role" "stem_role_enum" NOT NULL,
        "title" varchar(200) NOT NULL,
        "asset_id" uuid NOT NULL,
        "created_at" timestamptz NOT NULL DEFAULT now(),
        CONSTRAINT "FK_stems_track_version" FOREIGN KEY ("track_version_id")
          REFERENCES "track_versions"("id") ON DELETE CASCADE,
        CONSTRAINT "FK_stems_asset" FOREIGN KEY ("asset_id")
          REFERENCES "assets"("id") ON DELETE CASCADE
      )
    `);

    await queryRunner.query(
      `CREATE INDEX "IDX_stems_track_version_id" ON "stems" ("track_version_id")`,
    );
    await queryRunner.query(
      `CREATE INDEX "IDX_stems_role" ON "stems" ("role")`,
    );
  }

  public async down(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query(`DROP TABLE "stems"`);
    await queryRunner.query(`DROP TYPE "stem_role_enum"`);
  }
}
