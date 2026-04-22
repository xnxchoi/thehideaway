import { MigrateUpArgs, MigrateDownArgs } from "@payloadcms/db-postgres";
import {
  generateSearchMigrationSQL,
  searchConfigs
} from "@/lib/utils/createSearchMigration";

export async function up({ db }: MigrateUpArgs): Promise<void> {
  // Apply search indexing to all configured collections
  const collections = [
    "users",
    "posts",
    "delta",
    "albums",
    "tracks",
    "playlists",
    "categories",
    "tags"
  ] as const;

  for (const collection of collections) {
    const config = searchConfigs[collection];
    const { up: migrationSQL } = generateSearchMigrationSQL(config);
    await db.execute(migrationSQL);
  }
}

export async function down({ db }: MigrateDownArgs): Promise<void> {
  // Remove search indexing from all configured collections
  const collections = [
    "users",
    "posts",
    "delta",
    "albums",
    "tracks",
    "playlists",
    "categories",
    "tags"
  ] as const;

  for (const collection of collections) {
    const config = searchConfigs[collection];
    const { down: migrationSQL } = generateSearchMigrationSQL(config);
    await db.execute(migrationSQL);
  }
}
