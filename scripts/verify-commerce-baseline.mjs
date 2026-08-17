import { spawnSync } from "node:child_process";
import { readdir } from "node:fs/promises";
import path from "node:path";
import { pathToFileURL } from "node:url";

const source = process.env.DATABASE_URI;
if (!source) throw new Error("DATABASE_URI is required");

const testDatabase = "thehideaway_commerce_baseline_test";
if (!/^thehideaway_commerce_baseline_test$/.test(testDatabase)) {
  throw new Error("unsafe test database name");
}

const sourceUrl = new URL(source);
const maintenanceUrl = new URL(sourceUrl);
maintenanceUrl.pathname = "/postgres";
const testUrl = new URL(sourceUrl);
testUrl.pathname = `/${testDatabase}`;
const migrationFiles = await readdir(
  path.resolve("src/lib/migrations-baseline")
);
const baselineMigration = migrationFiles
  .filter((name) => /^\d+.*\.ts$/.test(name))
  .map((name) => name.replace(/\.ts$/, ""))
  .sort()
  .at(-1);
if (!baselineMigration) throw new Error("baseline migration is unavailable");

const pnpmPackages = await readdir(path.resolve("node_modules/.pnpm"));
const pgPackage = pnpmPackages.find((name) => /^pg@\d/.test(name));
if (!pgPackage) throw new Error("pg package is unavailable");
const pgModule = await import(
  pathToFileURL(
    path.resolve(
      "node_modules/.pnpm",
      pgPackage,
      "node_modules/pg/lib/index.js"
    )
  ).href
);
const Client = pgModule.Client ?? pgModule.default?.Client;
if (!Client) throw new Error("pg Client is unavailable");

async function dropTestDatabase() {
  const client = new Client({ connectionString: maintenanceUrl.toString() });
  await client.connect();
  try {
    await client.query(
      `DROP DATABASE IF EXISTS "${testDatabase}" WITH (FORCE)`
    );
  } finally {
    await client.end();
  }
}

try {
  await dropTestDatabase();
  const maintenanceClient = new Client({
    connectionString: maintenanceUrl.toString()
  });
  await maintenanceClient.connect();
  try {
    await maintenanceClient.query(`CREATE DATABASE "${testDatabase}"`);
  } finally {
    await maintenanceClient.end();
  }

  const migrationEnv = {
    ...process.env,
    DATABASE_URI: testUrl.toString(),
    SKIP_ENV_VALIDATION: "1"
  };
  // The database was created immediately above, so the first migrate is the
  // clean-slate equivalent of migrate:fresh without an interactive prompt.
  // The second run proves the migration ledger is replay-safe.
  for (const [index, script] of ["migrate", "migrate"].entries()) {
    const result = spawnSync("rtk", ["pnpm", script], {
      cwd: process.cwd(),
      env: migrationEnv,
      encoding: "utf8",
      stdio: "pipe"
    });
    if (result.status !== 0) {
      const output = `${result.stdout ?? ""}\n${result.stderr ?? ""}`;
      const marker = ["PostgresError", "cause:", "error:"]
        .map((candidate) => output.lastIndexOf(candidate))
        .reduce((largest, index) => Math.max(largest, index), -1);
      const diagnosticLines = output
        .split("\n")
        .filter((line) =>
          /error|cause|syntax|does not exist|already exists/i.test(line)
        )
        .slice(-30)
        .join("\n");
      const details =
        marker >= 0
          ? output.slice(marker, marker + 3000)
          : diagnosticLines || output.slice(-6000);
      throw new Error(
        `${script} failed with status ${result.status}\n${details}`
      );
    }
    if (index === 0) {
      const replayClient = new Client({ connectionString: testUrl.toString() });
      await replayClient.connect();
      try {
        await replayClient.query(
          "DELETE FROM payload_migrations WHERE name = $1",
          [baselineMigration]
        );
      } finally {
        await replayClient.end();
      }
    }
  }

  const testClient = new Client({ connectionString: testUrl.toString() });
  await testClient.connect();
  const result = await testClient.query(
    "SELECT concat_ws(',', to_regclass('public.commerce_products'), to_regclass('public.commerce_orders'), to_regclass('public.product_orders'), to_regclass('public.inventory_levels')) AS relations"
  );
  await testClient.end();
  const relationCheck = String(result.rows[0]?.relations ?? "");
  if (relationCheck !== "commerce_products,commerce_orders") {
    throw new Error(`unexpected commerce relations: ${relationCheck}`);
  }
} finally {
  await dropTestDatabase();
}
