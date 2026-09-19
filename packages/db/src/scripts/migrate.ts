import path from "path";
import fs from "fs";

export function getMigrationFiles(): { filename: string; content: string }[] {
  const migrationsDir = path.resolve(__dirname, "../../migrations");
  if (!fs.existsSync(migrationsDir)) {
    return [];
  }

  const files = fs.readdirSync(migrationsDir).filter((f) => f.endsWith(".sql")).sort();
  return files.map((filename) => ({
    filename,
    content: fs.readFileSync(path.join(migrationsDir, filename), "utf-8"),
  }));
}

export async function runMigrations(): Promise<void> {
  console.log("=================================================");
  console.log("  CampusOS Database Migration Runner");
  console.log("=================================================");

  const migrations = getMigrationFiles();
  console.log(`Found ${migrations.length} migration file(s):`);
  for (const m of migrations) {
    console.log(` - ${m.filename} (${m.content.length} bytes)`);
  }

  console.log("\nMigrations are located at:");
  console.log(" 1. packages/db/migrations/");
  console.log(" 2. supabase/migrations/");
  console.log("\nTo apply to Supabase directly:");
  console.log(" - Using Supabase CLI: `npx supabase db push`");
  console.log(" - Or copy 00001_initial_schema.sql and 00002_seed_data.sql into your Supabase Dashboard SQL Editor.");
  console.log("=================================================\n");
}

if (require.main === module) {
  runMigrations().catch((err) => {
    console.error("[Migration Error]", err);
    process.exit(1);
  });
}
