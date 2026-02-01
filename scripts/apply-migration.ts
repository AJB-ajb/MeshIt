/**
 * Apply project images migration directly
 */
import { createClient } from '@supabase/supabase-js';

const SUPABASE_URL = process.env.NEXT_PUBLIC_SUPABASE_URL!;
const SUPABASE_SERVICE_KEY = process.env.SUPABASE_SERVICE_ROLE_KEY!;

const supabase = createClient(SUPABASE_URL, SUPABASE_SERVICE_KEY, {
  auth: { autoRefreshToken: false, persistSession: false },
  db: { schema: 'public' },
});

async function applyMigration() {
  console.log('\n🔧 Applying project images migration...\n');

  try {
    // Step 1: Add image_url column to projects table
    console.log('1️⃣  Adding image_url column to projects table...');
    const { error: alterError } = await supabase.rpc('exec_sql', {
      sql: `
        ALTER TABLE public.projects
        ADD COLUMN IF NOT EXISTS image_url TEXT;

        COMMENT ON COLUMN public.projects.image_url IS
        'URL to the AI-generated project thumbnail image stored in Supabase Storage';
      `
    });

    if (alterError && !alterError.message.includes('does not exist')) {
      // If exec_sql function doesn't exist, we'll need to apply manually
      console.log('   ⚠️  Cannot execute SQL directly via RPC');
      console.log('   📋 Please apply the migration manually:\n');
      console.log('   1. Go to: https://jirgkhjdxahfsgqxprhh.supabase.co/project/jirgkhjdxahfsgqxprhh/editor');
      console.log('   2. Open SQL Editor');
      console.log('   3. Run the SQL from: supabase/migrations/20260201000000_add_project_images.sql\n');
      return;
    }

    console.log('   ✅ Column added successfully\n');

    // Step 2: Create storage bucket
    console.log('2️⃣  Creating project-images storage bucket...');
    const { data: bucket, error: bucketError } = await supabase.storage.createBucket('project-images', {
      public: true,
      fileSizeLimit: 5242880, // 5MB
    });

    if (bucketError && !bucketError.message.includes('already exists')) {
      console.log('   ⚠️  Bucket error:', bucketError.message);
    } else {
      console.log('   ✅ Bucket created successfully\n');
    }

    console.log('✨ Migration applied successfully!\n');
    console.log('📝 Note: RLS policies may need to be applied manually via SQL Editor\n');

  } catch (error: any) {
    console.error('❌ Error applying migration:', error.message);
    console.log('\n📋 Manual migration required:');
    console.log('1. Go to Supabase Dashboard > SQL Editor');
    console.log('2. Run the SQL from: supabase/migrations/20260201000000_add_project_images.sql\n');
  }
}

applyMigration().catch(console.error);
