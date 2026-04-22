import { MigrateUpArgs, MigrateDownArgs, sql } from "@payloadcms/db-postgres";

export async function up({ db, payload, req }: MigrateUpArgs): Promise<void> {
  await db.execute(sql`
    -- Add tsvector column for full-text search
    ALTER TABLE users ADD COLUMN IF NOT EXISTS search_vector tsvector;
    
    -- Create function to update search vector
    CREATE OR REPLACE FUNCTION update_user_search_vector()
    RETURNS trigger AS $$
    BEGIN
      NEW.search_vector := 
        setweight(to_tsvector('english', COALESCE(NEW.name, '')), 'A') ||
        setweight(to_tsvector('english', COALESCE(NEW.username, '')), 'A') ||
        setweight(to_tsvector('english', COALESCE(NEW.slug, '')), 'B') ||
        setweight(to_tsvector('english', COALESCE(NEW.bio, '')), 'C') ||
        setweight(to_tsvector('english', COALESCE(NEW.location, '')), 'D');
      RETURN NEW;
    END;
    $$ LANGUAGE plpgsql;
    
    -- Create trigger to automatically update search vector
    DROP TRIGGER IF EXISTS users_search_vector_update ON users;
    CREATE TRIGGER users_search_vector_update
      BEFORE INSERT OR UPDATE ON users
      FOR EACH ROW EXECUTE FUNCTION update_user_search_vector();
    
    -- Update existing records
    UPDATE users SET search_vector = 
      setweight(to_tsvector('english', COALESCE(name, '')), 'A') ||
      setweight(to_tsvector('english', COALESCE(username, '')), 'A') ||
      setweight(to_tsvector('english', COALESCE(slug, '')), 'B') ||
      setweight(to_tsvector('english', COALESCE(bio, '')), 'C') ||
      setweight(to_tsvector('english', COALESCE(location, '')), 'D');
    
    -- Create GIN index for fast full-text search
    CREATE INDEX IF NOT EXISTS users_search_vector_idx ON users USING GIN(search_vector);
    
    -- Create additional indexes for exact matches
    CREATE INDEX IF NOT EXISTS users_username_gin_idx ON users USING GIN(username gin_trgm_ops);
    CREATE INDEX IF NOT EXISTS users_slug_gin_idx ON users USING GIN(slug gin_trgm_ops);
    CREATE INDEX IF NOT EXISTS users_name_gin_idx ON users USING GIN(name gin_trgm_ops);
    
    -- Enable trigram extension if not already enabled
    CREATE EXTENSION IF NOT EXISTS pg_trgm;
  `);
}

export async function down({
  db,
  payload,
  req
}: MigrateDownArgs): Promise<void> {
  await db.execute(sql`
    -- Drop indexes
    DROP INDEX IF EXISTS users_search_vector_idx;
    DROP INDEX IF EXISTS users_username_gin_idx;
    DROP INDEX IF EXISTS users_slug_gin_idx;
    DROP INDEX IF EXISTS users_name_gin_idx;
    
    -- Drop trigger and function
    DROP TRIGGER IF EXISTS users_search_vector_update ON users;
    DROP FUNCTION IF EXISTS update_user_search_vector();
    
    -- Drop column
    ALTER TABLE users DROP COLUMN IF EXISTS search_vector;
  `);
}
