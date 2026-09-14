import { execFileSync } from "node:child_process";
import { randomUUID } from "node:crypto";
import { readFileSync } from "node:fs";
import { afterAll, beforeAll, describe, expect, it } from "vitest";

const container = process.env.BASELINE_MIGRATION_TEST_CONTAINER;
const database = `baseline_bootstrap_test_${randomUUID().replaceAll("-", "")}`;
const source = readFileSync(
  new URL("./migrations-baseline/20260815_102815.ts", import.meta.url),
  "utf8"
);
// Exercise only the bootstrap SQL, before unrelated generated table/enum DDL.
const bootstrap = source
  .slice(
    source.indexOf("CREATE EXTENSION"),
    source.indexOf("DO $guard$ BEGIN CREATE TYPE")
  )
  .replaceAll("\\$", "$");
const initializer = readFileSync(
  new URL("../../postgres/nanoid.sql", import.meta.url),
  "utf8"
);

function query(sql: string, target = database) {
  return execFileSync(
    "docker",
    [
      "exec",
      "-i",
      container!,
      "psql",
      "-X",
      "-qAt",
      "-v",
      "ON_ERROR_STOP=1",
      "-U",
      "readiness",
      "-d",
      target
    ],
    { input: sql, encoding: "utf8", stdio: ["pipe", "pipe", "pipe"] }
  ).trim();
}

describe
  .skipIf(!container)
  .sequential("baseline function bootstrap with PostgreSQL", () => {
    beforeAll(() => {
      query(`CREATE DATABASE "${database}"`, "postgres");
    });

    afterAll(() => {
      query(`DROP DATABASE IF EXISTS "${database}"`, "postgres");
    });

    it("creates usable functions on a fresh database and permits direct replay", () => {
      expect(
        query(
          `BEGIN; ${bootstrap} ${bootstrap} SELECT length(nanoid(11)); ROLLBACK;`
        )
      ).toBe("11");
    });

    it("preserves initialized function definitions and dependent column defaults", () => {
      const definitions = `SELECT pg_get_functiondef('public.nanoid(integer,text,double precision)'::regprocedure) || pg_get_functiondef('public.nanoid_optimized(integer,text,integer,integer)'::regprocedure)`;
      const output = query(`BEGIN;
      ${initializer}
      CREATE TABLE bootstrap_dependency (id text DEFAULT nanoid(11));
      CREATE TEMP TABLE original_definitions AS ${definitions};
      ${bootstrap}
      ${bootstrap}
      SELECT (SELECT * FROM original_definitions) = (${definitions});
      INSERT INTO bootstrap_dependency DEFAULT VALUES;
      SELECT length(id) FROM bootstrap_dependency;
      ROLLBACK;`);
      expect(output).toBe("t\n11");
    });
  });
