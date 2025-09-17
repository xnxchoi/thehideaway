import { sql } from "@payloadcms/db-postgres";

interface SearchFieldConfig {
  field: string;
  weight: "A" | "B" | "C" | "D";
}

interface CollectionSearchConfig {
  tableName: string;
  searchFields: SearchFieldConfig[];
  additionalIndexes?: string[]; // Additional fields for trigram indexes
}

export function generateSearchMigrationSQL(config: CollectionSearchConfig) {
  const { tableName, searchFields, additionalIndexes = [] } = config;

  const searchVectorExpression = searchFields
    .map(
      ({ field, weight }) =>
        `setweight(to_tsvector('simple', COALESCE(NEW.${field}, '')), '${weight}')`
    )
    .join(" ||\n        ");

  const updateSearchVectorExpression = searchFields
    .map(
      ({ field, weight }) =>
        `setweight(to_tsvector('simple', COALESCE(${field}, '')), '${weight}')`
    )
    .join(" ||\n      ");

  const triggramIndexes = [
    ...searchFields.map((f) => f.field),
    ...additionalIndexes
  ]
    .map(
      (field) =>
        `CREATE INDEX IF NOT EXISTS ${tableName}_${field}_gin_idx ON ${tableName} USING GIN(${field} gin_trgm_ops);`
    )
    .join("\n    ");

  const functionName = `update_${tableName}_search_vector`;
  const triggerName = `${tableName}_search_vector_update`;
  const indexName = `${tableName}_search_vector_idx`;

  const upSQL = `
    -- Enable trigram extension if not already enabled
    CREATE EXTENSION IF NOT EXISTS pg_trgm;

    -- Add tsvector column for full-text search
    ALTER TABLE ${tableName} ADD COLUMN IF NOT EXISTS search_vector tsvector;
    
    -- Create function to update search vector (using 'simple' config for mixed Korean/English)
    CREATE OR REPLACE FUNCTION ${functionName}()
    RETURNS trigger AS $$
    BEGIN
      NEW.search_vector := 
        ${searchVectorExpression};
      RETURN NEW;
    END;
    $$ LANGUAGE plpgsql;
    
    -- Create trigger to automatically update search vector
    DROP TRIGGER IF EXISTS ${triggerName} ON ${tableName};
    CREATE TRIGGER ${triggerName}
      BEFORE INSERT OR UPDATE ON ${tableName}
      FOR EACH ROW EXECUTE FUNCTION ${functionName}();
    
    -- Update existing records
    UPDATE ${tableName} SET search_vector = 
      ${updateSearchVectorExpression};
    
    -- Create GIN index for fast full-text search
    CREATE INDEX IF NOT EXISTS ${indexName} ON ${tableName} USING GIN(search_vector);
    
    -- Create trigram indexes for fuzzy matching
    ${triggramIndexes}
  `;

  const downSQL = `
    -- Drop indexes
    DROP INDEX IF EXISTS ${indexName};
    ${[...searchFields.map((f) => f.field), ...additionalIndexes]
      .map((field) => `DROP INDEX IF EXISTS ${tableName}_${field}_gin_idx;`)
      .join("\n    ")}
    
    -- Drop trigger and function
    DROP TRIGGER IF EXISTS ${triggerName} ON ${tableName};
    DROP FUNCTION IF EXISTS ${functionName}();
    
    -- Drop column
    ALTER TABLE ${tableName} DROP COLUMN IF EXISTS search_vector;
  `;

  return {
    up: sql.raw(upSQL),
    down: sql.raw(downSQL)
  };
}

// Predefined configurations for common collections
export const searchConfigs = {
  users: {
    tableName: "users",
    searchFields: [
      { field: "name", weight: "A" as const },
      { field: "username", weight: "A" as const },
      { field: "slug", weight: "B" as const },
      { field: "bio", weight: "C" as const },
      { field: "location", weight: "D" as const }
    ]
  },
  posts: {
    tableName: "posts",
    searchFields: [
      { field: "title", weight: "A" as const },
      { field: "subtitle", weight: "B" as const },
      { field: "slug", weight: "C" as const }
    ]
  },
  delta: {
    tableName: "delta",
    searchFields: [
      { field: "title", weight: "A" as const },
      { field: "source", weight: "B" as const },
      { field: "slug", weight: "C" as const }
    ]
  },
  albums: {
    tableName: "albums",
    searchFields: [
      { field: "title", weight: "A" as const },
      { field: "artist", weight: "A" as const },
      { field: "description", weight: "B" as const },
      { field: "slug", weight: "C" as const }
    ]
  },
  tracks: {
    tableName: "tracks",
    searchFields: [
      { field: "title", weight: "A" as const },
      { field: "artist", weight: "A" as const },
      { field: "description", weight: "B" as const },
      { field: "slug", weight: "C" as const }
    ]
  },
  playlists: {
    tableName: "playlists",
    searchFields: [
      { field: "title", weight: "A" as const },
      { field: "description", weight: "B" as const },
      { field: "slug", weight: "C" as const }
    ]
  },
  categories: {
    tableName: "categories",
    searchFields: [
      { field: "title", weight: "A" as const },
      { field: "description", weight: "B" as const },
      { field: "slug", weight: "C" as const }
    ]
  },
  tags: {
    tableName: "tags",
    searchFields: [
      { field: "title", weight: "A" as const },
      { field: "slug", weight: "B" as const }
    ]
  }
};
