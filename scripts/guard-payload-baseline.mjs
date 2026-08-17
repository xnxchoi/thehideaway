import { readFile, writeFile } from "node:fs/promises";
import path from "node:path";

const target = process.argv[2];
if (!target) throw new Error("migration path is required");

const migrationPath = path.resolve(process.cwd(), target);
let source = await readFile(migrationPath, "utf8");

source = source
  .replace(
    /^(\s*)CREATE TYPE (.+);$/gm,
    "$1DO $guard$ BEGIN CREATE TYPE $2; EXCEPTION WHEN duplicate_object THEN NULL; END $guard$;"
  )
  .replace(
    /^(\s*)CREATE TABLE (?!IF NOT EXISTS)/gm,
    "$1CREATE TABLE IF NOT EXISTS "
  )
  .replace(
    /^(\s*)CREATE UNIQUE INDEX (?!IF NOT EXISTS)/gm,
    "$1CREATE UNIQUE INDEX IF NOT EXISTS "
  )
  .replace(
    /^(\s*)CREATE INDEX (?!IF NOT EXISTS)/gm,
    "$1CREATE INDEX IF NOT EXISTS "
  )
  .replace(
    /^(\s*)ALTER TABLE ("[^"]+") ADD CONSTRAINT "([^"]+)" (.+);$/gm,
    (_match, indent, table, constraint, definition) =>
      `${indent}DO $guard$ BEGIN IF NOT EXISTS (` +
      `SELECT 1 FROM pg_constraint WHERE conname = '${constraint}'` +
      `) THEN ALTER TABLE ${table} ADD CONSTRAINT "${constraint}" ${definition}; ` +
      `END IF; END $guard$;`
  )
  .replace(/^(\s*)DROP TABLE (?!IF EXISTS)/gm, "$1DROP TABLE IF EXISTS ")
  .replace(/^(\s*)DROP TYPE (?!IF EXISTS)/gm, "$1DROP TYPE IF EXISTS ")
  .replace(/^(\s*)DROP INDEX (?!IF EXISTS)/gm, "$1DROP INDEX IF EXISTS ");

await writeFile(migrationPath, source);
