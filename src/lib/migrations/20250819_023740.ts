import {MigrateUpArgs, MigrateDownArgs, sql} from '@payloadcms/db-postgres'

export async function up({db, payload, req}: MigrateUpArgs): Promise<void> {
	await db.execute(sql`
        DROP INDEX "search_visibility_idx";
        ALTER TABLE "categories"
            ALTER COLUMN "slug" SET NOT NULL;
        ALTER TABLE "pages_blocks_cta_links"
            ALTER COLUMN "_parent_id" SET DATA TYPE varchar;
        ALTER TABLE "profile_slides"
            ALTER COLUMN "id" SET DATA TYPE varchar(24);
        ALTER TABLE "profile_slides"
            ALTER COLUMN "id" DROP DEFAULT;
        ALTER TABLE "search_author"
            ALTER COLUMN "_parent_id" SET DATA TYPE varchar;
        ALTER TABLE "search_author"
            ALTER COLUMN "id" SET DATA TYPE varchar(24);
        ALTER TABLE "search_author"
            ALTER COLUMN "id" DROP DEFAULT;
        ALTER TABLE "search_author"
            ALTER COLUMN "author_id" SET DATA TYPE varchar(24);
        ALTER TABLE "search_allow_list"
            ALTER COLUMN "_parent_id" SET DATA TYPE varchar;
        ALTER TABLE "search_allow_list"
            ALTER COLUMN "id" SET DATA TYPE varchar(24);
        ALTER TABLE "search_allow_list"
            ALTER COLUMN "id" DROP DEFAULT;
        ALTER TABLE "search_allow_list"
            ALTER COLUMN "allow_list_id" SET DATA TYPE varchar(24);
        ALTER TABLE "search_tags"
            ALTER COLUMN "_parent_id" SET DATA TYPE varchar;
        ALTER TABLE "search_tags"
            ALTER COLUMN "id" SET DATA TYPE varchar(24);
        ALTER TABLE "search_tags"
            ALTER COLUMN "id" DROP DEFAULT;
        ALTER TABLE "payload_locked_documents_rels"
            ALTER COLUMN "parent_id" SET DATA TYPE uuid;
        ALTER TABLE "search"
            DROP COLUMN "visibility";
        DROP TYPE "public"."enum_search_visibility";`)
}

export async function down({db, payload, req}: MigrateDownArgs): Promise<void> {
	await db.execute(sql`
        CREATE TYPE "public"."enum_search_visibility" AS ENUM ('public', 'private');
        ALTER TABLE "categories"
            ALTER COLUMN "slug" DROP NOT NULL;
        ALTER TABLE "pages_blocks_cta_links"
            ALTER COLUMN "_parent_id" SET DATA TYPE uuid;
        ALTER TABLE "profile_slides"
            ALTER COLUMN "id" SET DATA TYPE uuid;
        ALTER TABLE "profile_slides"
            ALTER COLUMN "id" SET DEFAULT uuidv7();
        ALTER TABLE "search_author"
            ALTER COLUMN "_parent_id" SET DATA TYPE uuid;
        ALTER TABLE "search_author"
            ALTER COLUMN "id" SET DATA TYPE uuid;
        ALTER TABLE "search_author"
            ALTER COLUMN "id" SET DEFAULT uuidv7();
        ALTER TABLE "search_author"
            ALTER COLUMN "author_id" SET DATA TYPE varchar(12);
        ALTER TABLE "search_allow_list"
            ALTER COLUMN "_parent_id" SET DATA TYPE uuid;
        ALTER TABLE "search_allow_list"
            ALTER COLUMN "id" SET DATA TYPE uuid;
        ALTER TABLE "search_allow_list"
            ALTER COLUMN "id" SET DEFAULT uuidv7();
        ALTER TABLE "search_allow_list"
            ALTER COLUMN "allow_list_id" SET DATA TYPE varchar(12);
        ALTER TABLE "search_tags"
            ALTER COLUMN "_parent_id" SET DATA TYPE uuid;
        ALTER TABLE "search_tags"
            ALTER COLUMN "id" SET DATA TYPE uuid;
        ALTER TABLE "search_tags"
            ALTER COLUMN "id" SET DEFAULT uuidv7();
        ALTER TABLE "payload_locked_documents_rels"
            ALTER COLUMN "parent_id" SET DATA TYPE varchar(24);
        ALTER TABLE "search"
            ADD COLUMN "visibility" "enum_search_visibility" DEFAULT 'public';
        CREATE INDEX "search_visibility_idx" ON "search" USING btree ("visibility");`)
}
