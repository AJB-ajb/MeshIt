/**
 * Backfill Project Images
 *
 * Generates AI images for all existing projects that don't have images yet.
 *
 * Run: set -a && source .env && set +a && npx tsx scripts/backfill-project-images.ts
 */

import { createClient } from '@supabase/supabase-js';

const SUPABASE_URL = process.env.NEXT_PUBLIC_SUPABASE_URL!;
const SUPABASE_SERVICE_KEY = process.env.SUPABASE_SERVICE_ROLE_KEY!;
const APP_URL = process.env.NEXT_PUBLIC_APP_URL || 'http://localhost:3000';

const supabase = createClient(SUPABASE_URL, SUPABASE_SERVICE_KEY, {
  auth: { autoRefreshToken: false, persistSession: false },
});

async function generateImageForProject(project: any) {
  console.log(`\n🎨 Generating image for: ${project.title}`);

  try {
    const response = await fetch(`${APP_URL}/api/projects/generate-image`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        project_id: project.id,
        title: project.title,
        description: project.description,
        required_skills: project.required_skills,
        team_size: project.team_size,
        timeline: project.timeline,
      }),
    });

    if (!response.ok) {
      const errorText = await response.text();
      throw new Error(`API error: ${errorText}`);
    }

    const result = await response.json();
    console.log(`   ✅ Image generated: ${result.image_url}`);
    return { success: true, project_id: project.id };
  } catch (error: any) {
    console.error(`   ❌ Failed: ${error.message}`);
    return { success: false, project_id: project.id, error: error.message };
  }
}

async function main() {
  console.log('\n╔══════════════════════════════════════════════════════════╗');
  console.log('║  Project Image Backfill - MeshIt                        ║');
  console.log('╚══════════════════════════════════════════════════════════╝\n');

  // Fetch all projects without images
  const { data: projects, error } = await supabase
    .from('projects')
    .select('id, title, description, required_skills, team_size, timeline')
    .is('image_url', null)
    .order('created_at', { ascending: false });

  if (error) {
    console.error('❌ Failed to fetch projects:', error);
    process.exit(1);
  }

  if (!projects || projects.length === 0) {
    console.log('✅ All projects already have images!');
    process.exit(0);
  }

  console.log(`📊 Found ${projects.length} projects without images\n`);
  console.log('🚀 Starting image generation...\n');

  const results = [];
  let successCount = 0;
  let errorCount = 0;

  // Process projects one at a time to avoid rate limits
  for (let i = 0; i < projects.length; i++) {
    const project = projects[i];
    console.log(`[${i + 1}/${projects.length}]`, project.title);

    const result = await generateImageForProject(project);
    results.push(result);

    if (result.success) {
      successCount++;
    } else {
      errorCount++;
    }

    // Add delay between requests to avoid rate limiting
    if (i < projects.length - 1) {
      console.log('   ⏱️  Waiting 2 seconds...');
      await new Promise(resolve => setTimeout(resolve, 2000));
    }
  }

  console.log('\n━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━');
  console.log('\n✨ Backfill Complete!\n');
  console.log(`   ✅ Success: ${successCount} images generated`);
  console.log(`   ❌ Errors: ${errorCount} failed`);

  if (errorCount > 0) {
    console.log('\n❌ Failed projects:');
    results
      .filter(r => !r.success)
      .forEach(r => {
        const project = projects.find(p => p.id === r.project_id);
        console.log(`   - ${project?.title}: ${r.error}`);
      });
  }

  console.log('\n🎉 All done!\n');
}

main().catch(console.error);
