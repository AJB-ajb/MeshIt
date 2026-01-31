# Database Migration Guide

## Status Check

### API Keys Status
- ❌ `OPENAI_API_KEY` - **Not set** (required for embeddings)
- ❌ `GOOGLE_AI_API_KEY` - **Not set** (required for match explanations)

### Supabase Connection
- ❌ Supabase credentials not found in `.env.local`

## Applying Migrations

### Option 1: Manual Application (Recommended)

1. **Open Supabase Dashboard**
   - Go to your Supabase project dashboard
   - Navigate to **SQL Editor**

2. **Run the Combined Migration**
   - Open `supabase/migrations/combined_matching_migrations.sql`
   - Copy the entire file contents
   - Paste into SQL Editor
   - Click **Run** or press `Ctrl+Enter`

3. **Verify Success**
   - Check that all tables exist: `profiles`, `projects`, `matches`
   - Verify RLS policies are enabled
   - Test functions: `match_projects_to_user`, `match_users_to_project`

### Option 2: Using Supabase CLI (If Installed)

```bash
# Install Supabase CLI if not already installed
npm install -g supabase

# Link to your project
supabase link --project-ref your-project-ref

# Apply migrations
supabase db push
```

### Option 3: Programmatic Application

```bash
# Set environment variables
export SUPABASE_URL="your-supabase-url"
export SUPABASE_SERVICE_ROLE_KEY="your-service-role-key"

# Run migration script (if implemented)
pnpm tsx scripts/apply-migrations.ts
```

## Setting Up API Keys

### 1. OpenAI API Key (for embeddings)

1. Go to [OpenAI Platform](https://platform.openai.com/api-keys)
2. Create a new API key
3. Add to `.env.local`:
   ```env
   OPENAI_API_KEY=sk-...
   ```

**Required for:**
- Generating profile embeddings (`src/lib/ai/embeddings.ts`)
- Generating project embeddings
- Semantic similarity matching

### 2. Google AI API Key (for match explanations)

1. Go to [Google AI Studio](https://aistudio.google.com/app/apikey)
2. Create a new API key
3. Add to `.env.local`:
   ```env
   GOOGLE_AI_API_KEY=AIza...
   ```

**Required for:**
- Generating match explanations (`src/lib/matching/explanation.ts`)
- Explaining why profiles match projects

## Migration Files

The matching engine requires 4 migrations in order:

1. **`20260131130000_enable_pgvector.sql`**
   - Enables pgvector extension
   - Adds `embedding` column to `profiles` table
   - Creates vector similarity index

2. **`20260131140000_create_projects.sql`**
   - Creates `projects` table
   - Sets up RLS policies
   - Creates indexes

3. **`20260131150000_create_matches.sql`**
   - Creates `matches` table
   - Sets up RLS policies
   - Creates indexes

4. **`20260131160000_matching_functions.sql`**
   - Creates `match_projects_to_user()` function
   - Creates `match_users_to_project()` function
   - Creates `expire_old_projects()` function

## Verification

After applying migrations, verify:

```sql
-- Check tables exist
SELECT table_name FROM information_schema.tables 
WHERE table_schema = 'public' 
AND table_name IN ('profiles', 'projects', 'matches');

-- Check pgvector extension
SELECT * FROM pg_extension WHERE extname = 'vector';

-- Check embedding columns
SELECT column_name, data_type 
FROM information_schema.columns 
WHERE table_name = 'profiles' AND column_name = 'embedding';

-- Test matching function
SELECT * FROM match_projects_to_user(
  (SELECT embedding FROM profiles LIMIT 1),
  (SELECT user_id FROM profiles LIMIT 1),
  5
);
```

## Troubleshooting

### Error: "extension vector does not exist"
- Enable pgvector extension first: `CREATE EXTENSION IF NOT EXISTS vector;`

### Error: "relation profiles does not exist"
- Run the profiles migration first: `20260131120000_create_profiles.sql`

### Error: "permission denied"
- Ensure you're using the service role key (not anon key)
- Check RLS policies are correctly set

### Embeddings not generating
- Verify `OPENAI_API_KEY` is set correctly
- Check API key has sufficient credits
- Verify network connectivity to OpenAI API

### Match explanations not generating
- Verify `GOOGLE_AI_API_KEY` is set correctly
- Check API key permissions
- Verify network connectivity to Google AI API
