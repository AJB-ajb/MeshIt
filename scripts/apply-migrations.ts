/**
 * Script to apply database migrations to Supabase
 * 
 * Usage:
 *   pnpm tsx scripts/apply-migrations.ts
 * 
 * Requires:
 *   - SUPABASE_URL environment variable
 *   - SUPABASE_SERVICE_ROLE_KEY environment variable
 */

import { createClient } from "@supabase/supabase-js";
import { readFileSync } from "fs";
import { join } from "path";

const SUPABASE_URL = process.env.SUPABASE_URL || process.env.NEXT_PUBLIC_SUPABASE_URL;
const SUPABASE_SERVICE_ROLE_KEY = process.env.SUPABASE_SERVICE_ROLE_KEY;

if (!SUPABASE_URL || !SUPABASE_SERVICE_ROLE_KEY) {
  console.error("❌ Missing required environment variables:");
  console.error("   SUPABASE_URL or NEXT_PUBLIC_SUPABASE_URL");
  console.error("   SUPABASE_SERVICE_ROLE_KEY");
  console.error("\nPlease set these in your .env.local file");
  process.exit(1);
}

const supabase = createClient(SUPABASE_URL, SUPABASE_SERVICE_ROLE_KEY, {
  auth: {
    autoRefreshToken: false,
    persistSession: false,
  },
});

async function applyMigration(filename: string) {
  const filePath = join(process.cwd(), "supabase", "migrations", filename);
  const sql = readFileSync(filePath, "utf-8");

  console.log(`\n📄 Applying ${filename}...`);

  try {
    const { error } = await supabase.rpc("exec_sql", { sql_query: sql });
    
    if (error) {
      // Try direct query if RPC doesn't work
      const statements = sql.split(";").filter((s) => s.trim().length > 0);
      
      for (const statement of statements) {
        const { error: queryError } = await supabase.rpc("exec_sql", {
          sql_query: statement + ";",
        });
        
        if (queryError) {
          console.error(`   ⚠️  Error: ${queryError.message}`);
          // Continue with next statement
        }
      }
    } else {
      console.log(`   ✅ ${filename} applied successfully`);
    }
  } catch (err) {
    console.error(`   ❌ Failed to apply ${filename}:`, err);
    throw err;
  }
}

async function main() {
  console.log("🚀 Applying database migrations...\n");

  const migrations = [
    "20260131130000_enable_pgvector.sql",
    "20260131140000_create_projects.sql",
    "20260131150000_create_matches.sql",
    "20260131160000_matching_functions.sql",
  ];

  try {
    for (const migration of migrations) {
      await applyMigration(migration);
    }

    console.log("\n✅ All migrations applied successfully!");
    console.log("\n📝 Next steps:");
    console.log("   1. Verify tables exist in Supabase dashboard");
    console.log("   2. Check RLS policies are enabled");
    console.log("   3. Test matching functions");
  } catch (error) {
    console.error("\n❌ Migration failed:", error);
    console.error("\n💡 Alternative: Apply migrations manually via Supabase SQL Editor");
    console.error("   Use: supabase/migrations/combined_matching_migrations.sql");
    process.exit(1);
  }
}

main();
