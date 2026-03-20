import fs from "fs/promises";
import path from "path";

// --- Configuration ---
// Adjust these paths to match your project structure.
const ROOT_DIR=path.resolve(process.cwd());
const MIGRATIONS_DIR =  path.resolve(ROOT_DIR,"src/lib/migrations");
const EXTENSION_SQL_FILE = path.resolve( ROOT_DIR,"postgres", "nanoid.sql");
// ---------------------

// The exact string we want to find and prepend our SQL to.
// We target the opening backtick of the sql`` template literal.
const TARGET_STRING = /execute\(sql`/;

async function appendExtensionSql() {
  try {
    console.log("🚀 Starting post-migration script...");

    // 1. Read the SQL content to inject.
    const sqlToInject = await fs.readFile(EXTENSION_SQL_FILE, "utf-8");
    console.log("✅ Read nanoid.sql file.");

    // 2. Find the first migration file.
    const files = await fs.readdir(MIGRATIONS_DIR);
    const firstMigrationFile = files

      .filter((file) => /^\d+(_\d+)*\.ts$/.test(file))
      .sort()[0]; // Drizzle's naming convention (0000_, 0001_) makes sorting reliable

    if (!firstMigrationFile) {
      throw new Error("No migration files found. Aborting.");
    }

    const migrationFilePath = path.join(MIGRATIONS_DIR, firstMigrationFile);
    console.log(`🎯 Found target migration file: ${firstMigrationFile}`);

    // 3. Read the content of the first migration file.
    const originalContent = await fs.readFile(migrationFilePath, "utf-8");

    // 4. Check if the script has already been added.
    if (originalContent.includes("CREATE OR REPLACE FUNCTION nanoid")) {
      console.log("✅ Extension SQL already exists. Nothing to do. Exiting.");
      return;
    }
    const cleanedSql = sqlToInject
      // Remove /* ... */ block comments
      .replace(/\/\*[\s\S]*?\*\//g, "")
      // Remove -- line comments
      .replace(/--.*$/gm, "")
      // Trim whitespace from the start and end
      .trim();

    // Escape all dollar signs to prevent template literal issues
    const escapedSqlToInject = cleanedSql.replace(/\$/g, "\\$");
    // 5. Inject the SQL content.
    // We replace the target string with itself plus our SQL content and a newline.
    const newContent = originalContent.replace(
      TARGET_STRING,
      `execute(sql\`\n${escapedSqlToInject}\n`
    );

    if (newContent === originalContent) {
      console.warn(
        "⚠️  Could not find target string in migration file. No changes were made."
      );
      return;
    }

    // 6. Write the modified content back to the file.
    await fs.writeFile(migrationFilePath, newContent, "utf-8");
    console.log(
      "✅ Successfully appended NanoID extension SQL to the first migration."
    );
    console.log("🎉 Script finished.");
  } catch (error) {
    if (error instanceof Error) {
      console.error("❌ An error occurred:", error.message);
    } else {
      console.error("❌ An error occurred:", error);
    }
    process.exit(1); // Exit with an error code
  }
}

appendExtensionSql();
