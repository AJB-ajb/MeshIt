# n8n Workflow Setup - MeshIt Project Image Generator (Google Gemini)

This workflow automatically generates AI-powered thumbnails for new projects created in MeshIt using Google Gemini.

## Features
- 🎨 Automatic image generation when a project is created
- 🤖 Uses Google Gemini 2.0 Flash for intelligent prompt optimization
- 🖼️ Uses Google Imagen 3.0 for high-quality image generation
- ☁️ Uploads images to Supabase Storage
- 🔄 Updates project records with image URLs
- 💰 Free tier available with Google AI

## Prerequisites

1. **n8n** installed and running (https://n8n.io)
2. **Supabase** project with service role key
3. **Google AI API key** (free tier available):
   - Get your key at https://aistudio.google.com/apikey
   - Includes access to Gemini 2.0 Flash and Imagen 3.0

## Setup Instructions

### 1. Run Database Migration

First, add the `image_url` column to your projects table:

\`\`\`bash
# Navigate to project root
cd /Users/shankavi/Documents/MeshIt

# Run the migration
npx supabase db push
# or if you have supabase CLI:
supabase migration up
\`\`\`

### 2. Import n8n Workflow

1. Open your n8n instance (usually http://localhost:5678)
2. Click **"Workflows"** → **"Import from File"**
3. Select `project-image-generator.json`
4. Click **"Import"**

### 3. Configure Environment Variables in n8n

Add these environment variables to your n8n instance:

\`\`\`env
SUPABASE_URL=https://your-project.supabase.co
SUPABASE_SERVICE_KEY=your-service-role-key
GOOGLE_API_KEY=your-google-ai-api-key
\`\`\`

**How to add in n8n:**
- Settings → Environment Variables
- Or add to your `.env` file if running n8n locally

**Getting your Google API Key:**
1. Go to https://aistudio.google.com/apikey
2. Click "Create API Key"
3. Copy the key and add to n8n environment variables

### 4. Get Webhook URL

1. Open the imported workflow
2. Click on **"Webhook - New Project"** node
3. Click **"Test URL"** or **"Production URL"**
4. Copy the webhook URL (e.g., `https://your-n8n.com/webhook/project-created`)

### 5. Configure Supabase Database Webhook

**Option A: Via Supabase Dashboard (Recommended)**
1. Go to your Supabase project dashboard
2. Navigate to **Database** → **Webhooks**
3. Click **"Create a new webhook"**
4. Configure:
   - **Name:** Project Image Generator
   - **Table:** `projects`
   - **Events:** `INSERT`
   - **Type:** HTTP Request
   - **HTTP URL:** (paste your n8n webhook URL)
   - **HTTP Method:** POST
   - **HTTP Headers:** `Content-Type: application/json`

**Option B: Via SQL**
\`\`\`sql
-- Create webhook function
create or replace function notify_project_created()
returns trigger as $$
declare
  webhook_url text := 'YOUR_N8N_WEBHOOK_URL';
begin
  perform
    net.http_post(
      url := webhook_url,
      body := jsonb_build_object(
        'type', TG_OP,
        'table', TG_TABLE_NAME,
        'record', row_to_json(NEW)
      )
    );
  return NEW;
end;
$$ language plpgsql;

-- Create trigger
create trigger on_project_created
  after insert on public.projects
  for each row
  execute function notify_project_created();
\`\`\`

### 6. Activate the Workflow

1. In n8n, click **"Active"** toggle at the top right
2. The workflow is now live!

## Testing

Create a test project in your Supabase database:

\`\`\`sql
insert into public.projects (
  creator_id,
  title,
  description,
  required_skills,
  team_size,
  experience_level,
  timeline,
  expires_at
) values (
  'YOUR_USER_ID',
  'AI-Powered Task Manager',
  'Build a smart task management app with AI-powered prioritization and scheduling',
  ARRAY['React', 'Node.js', 'OpenAI API', 'PostgreSQL'],
  4,
  'intermediate',
  '1_month',
  now() + interval '30 days'
);
\`\`\`

Check:
1. n8n workflow execution log
2. Supabase Storage for the generated image
3. Project record updated with `image_url`

## Workflow Architecture

\`\`\`
Supabase Trigger (new project)
    ↓
n8n Webhook Receives Data
    ↓
Gemini 2.0 Flash: Generate Optimized Image Prompt
    ↓
Extract Prompt from Gemini Response
    ↓
Gemini Imagen 3.0: Generate Image
    ↓
Process Image Data (base64)
    ↓
Upload to Supabase Storage
    ↓
Update Project Record with image_url
    ↓
Done! ✅
\`\`\`

## Cost Optimization Tips

1. **Use Stability AI Free Tier**: 25 free images/month
2. **Use Hugging Face**: Completely free with rate limits
3. **Cache Prompts**: Avoid regenerating similar images
4. **Compress Images**: Add an image optimization step
5. **Lazy Generation**: Generate only when project is viewed

## Troubleshooting

### Webhook Not Triggering
- Check Supabase webhook configuration
- Verify n8n webhook URL is correct
- Check n8n logs for incoming requests

### Image Generation Fails
- Verify API credentials are correct
- Check API quota/limits
- Review prompt for policy violations

### Image Not Uploading
- Verify Supabase Storage bucket exists
- Check service role key permissions
- Review storage policies

## Alternative Image Providers

You can easily swap out the image generation node:

### Hugging Face (Free)
\`\`\`javascript
// HTTP Request Node
URL: https://api-inference.huggingface.co/models/stabilityai/stable-diffusion-xl-base-1.0
Headers: {
  "Authorization": "Bearer YOUR_HF_TOKEN"
}
Body: {
  "inputs": "{{ $json.prompt }}"
}
\`\`\`

### Replicate (Free Tier)
\`\`\`javascript
URL: https://api.replicate.com/v1/predictions
Headers: {
  "Authorization": "Token YOUR_REPLICATE_TOKEN"
}
Body: {
  "version": "stability-ai/sdxl",
  "input": { "prompt": "{{ $json.prompt }}" }
}
\`\`\`

## Support

For issues or questions:
- n8n Documentation: https://docs.n8n.io
- Supabase Documentation: https://supabase.com/docs
- MeshIt GitHub: [Your repo URL]
