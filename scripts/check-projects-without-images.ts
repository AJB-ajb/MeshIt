/**
 * Check how many projects need images
 */
import { createClient } from '@supabase/supabase-js';

const SUPABASE_URL = process.env.NEXT_PUBLIC_SUPABASE_URL!;
const SUPABASE_SERVICE_KEY = process.env.SUPABASE_SERVICE_ROLE_KEY!;

const supabase = createClient(SUPABASE_URL, SUPABASE_SERVICE_KEY, {
  auth: { autoRefreshToken: false, persistSession: false },
});

async function main() {
  console.log('\n📊 Checking project image status...\n');

  // Count total projects
  const { count: totalCount, error: totalError } = await supabase
    .from('projects')
    .select('*', { count: 'exact', head: true });

  if (totalError) {
    console.error('❌ Error:', totalError);
    return;
  }

  // Count projects without images
  const { count: withoutImagesCount, error: withoutError } = await supabase
    .from('projects')
    .select('*', { count: 'exact', head: true })
    .is('image_url', null);

  if (withoutError) {
    console.error('❌ Error:', withoutError);
    return;
  }

  // Fetch sample projects without images
  const { data: sampleProjects } = await supabase
    .from('projects')
    .select('id, title, created_at')
    .is('image_url', null)
    .order('created_at', { ascending: false })
    .limit(10);

  console.log(`📈 Total projects: ${totalCount}`);
  console.log(`🖼️  Projects with images: ${totalCount! - withoutImagesCount!}`);
  console.log(`❌ Projects without images: ${withoutImagesCount}\n`);

  if (sampleProjects && sampleProjects.length > 0) {
    console.log('📋 Sample projects without images:');
    sampleProjects.forEach((p, i) => {
      console.log(`   ${i + 1}. ${p.title} (${new Date(p.created_at).toLocaleDateString()})`);
    });
    console.log('');
  }

  if (withoutImagesCount && withoutImagesCount > 0) {
    console.log('💡 To generate images for these projects, run:');
    console.log('   set -a && source .env && set +a && npx tsx scripts/backfill-project-images.ts\n');
  } else {
    console.log('✅ All projects have images!\n');
  }
}

main().catch(console.error);
