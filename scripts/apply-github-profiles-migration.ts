/**
 * Script to apply the GitHub profiles migration to Supabase
 * 
 * Usage:
 *   pnpm tsx scripts/apply-github-profiles-migration.ts
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

async function applyMigration() {
  const filePath = join(process.cwd(), "supabase", "migrations", "20260201100000_create_github_profiles.sql");
  const sql = readFileSync(filePath, "utf-8");

  console.log("\n📄 Applying GitHub profiles migration...");

  try {
    // Split SQL into individual statements
    const statements = sql
      .split(";")
      .map((s) => s.trim())
      .filter((s) => s.length > 0 && !s.startsWith("--"));

    for (const statement of statements) {
      if (statement.trim().length === 0) continue;
      
      const { error } = await supabase.rpc("exec_sql", {
        sql_query: statement + ";",
      });

      if (error) {
        // If exec_sql doesn't exist, try direct query (requires service role)
        console.log(`   ⚠️  RPC failed, trying direct query...`);
        
        // For direct queries, we need to use a different approach
        // Since Supabase JS client doesn't support raw SQL directly,
        // we'll need to use the REST API or provide manual instructions
        console.error(`   ⚠️  Could not apply via RPC: ${error.message}`);
        console.log(`   💡 Please apply this migration manually via Supabase SQL Editor`);
        console.log(`   📄 File: supabase/migrations/20260201100000_create_github_profiles.sql`);
        return false;
      }
    }

    console.log("   ✅ GitHub profiles migration applied successfully!");
    return true;
  } catch (err) {
    console.error("   ❌ Failed to apply migration:", err);
    console.log("\n💡 Alternative: Apply migration manually via Supabase SQL Editor");
    console.log("   📄 File: supabase/migrations/20260201100000_create_github_profiles.sql");
    return false;
  }
}

async function main() {
  console.log("🚀 Applying GitHub profiles migration...\n");

  const success = await applyMigration();

  if (success) {
    console.log("\n✅ Migration applied successfully!");
    console.log("\n📝 Next steps:");
    console.log("   1. Verify the github_profiles table exists in Supabase dashboard");
    console.log("   2. Check RLS policies are enabled");
    console.log("   3. Try syncing your GitHub profile again");
  } else {
    console.log("\n⚠️  Could not apply migration automatically.");
    console.log("\n📋 Manual Instructions:");
    console.log("   1. Open Supabase Dashboard → SQL Editor");
    console.log("   2. Copy contents of: supabase/migrations/20260201100000_create_github_profiles.sql");
    console.log("   3. Paste and run in SQL Editor");
    console.log("   4. Verify the github_profiles table was created");
  }
}

main();
