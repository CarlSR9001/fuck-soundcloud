import { MigrationInterface, QueryRunner } from 'typeorm';

export class AddReactionsAndFollows1699900000002 implements MigrationInterface {
  name = 'AddReactionsAndFollows1699900000002';

  public async up(queryRunner: QueryRunner): Promise<void> {
    // Create reaction_target_type enum
    await queryRunner.query(`
      CREATE TYPE "reaction_target_type_enum" AS ENUM ('track', 'comment', 'playlist')
    `);

    // Create reaction_kind enum
    await queryRunner.query(`
      CREATE TYPE "reaction_kind_enum" AS ENUM ('like', 'repost')
    `);

    // Create reactions table
    await queryRunner.query(`
      CREATE TABLE "reactions" (
        "id" uuid PRIMARY KEY DEFAULT uuid_generate_v4(),
        "user_id" uuid NOT NULL,
        "target_type" "reaction_target_type_enum" NOT NULL,
        "target_id" uuid NOT NULL,
        "kind" "reaction_kind_enum" NOT NULL,
        "created_at" timestamptz NOT NULL DEFAULT now(),
        CONSTRAINT "FK_reactions_user" FOREIGN KEY ("user_id")
          REFERENCES "users"("id") ON DELETE CASCADE,
        CONSTRAINT "UQ_reactions_user_target_kind" UNIQUE ("user_id", "target_type", "target_id", "kind")
      )
    `);

    // Create indexes for reactions
    await queryRunner.query(
      `CREATE INDEX "IDX_reactions_user_id" ON "reactions" ("user_id")`,
    );
    await queryRunner.query(
      `CREATE INDEX "IDX_reactions_target" ON "reactions" ("target_type", "target_id")`,
    );

    // Create follows table
    await queryRunner.query(`
      CREATE TABLE "follows" (
        "follower_id" uuid NOT NULL,
        "followee_id" uuid NOT NULL,
        "created_at" timestamptz NOT NULL DEFAULT now(),
        CONSTRAINT "PK_follows" PRIMARY KEY ("follower_id", "followee_id"),
        CONSTRAINT "FK_follows_follower" FOREIGN KEY ("follower_id")
          REFERENCES "users"("id") ON DELETE CASCADE,
        CONSTRAINT "FK_follows_followee" FOREIGN KEY ("followee_id")
          REFERENCES "users"("id") ON DELETE CASCADE
      )
    `);

    // Create indexes for follows
    await queryRunner.query(
      `CREATE INDEX "IDX_follows_follower_id" ON "follows" ("follower_id")`,
    );
    await queryRunner.query(
      `CREATE INDEX "IDX_follows_followee_id" ON "follows" ("followee_id")`,
    );
  }

  public async down(queryRunner: QueryRunner): Promise<void> {
    // Drop follows table and indexes
    await queryRunner.query(`DROP INDEX "IDX_follows_followee_id"`);
    await queryRunner.query(`DROP INDEX "IDX_follows_follower_id"`);
    await queryRunner.query(`DROP TABLE "follows"`);

    // Drop reactions table and indexes
    await queryRunner.query(`DROP INDEX "IDX_reactions_target"`);
    await queryRunner.query(`DROP INDEX "IDX_reactions_user_id"`);
    await queryRunner.query(`DROP TABLE "reactions"`);

    // Drop enums
    await queryRunner.query(`DROP TYPE "reaction_kind_enum"`);
    await queryRunner.query(`DROP TYPE "reaction_target_type_enum"`);
  }
}
