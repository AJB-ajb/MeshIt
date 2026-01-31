# Deploying MeshIt to Vercel

## Prerequisites

```bash
# Install Vercel CLI
pnpm add -g vercel

# Login to Vercel
pnpm vercel login
```

## Deployment Steps

### 1. Add Environment Variables

Add all required environment variables from your `.env` file to Vercel:

```bash
# Supabase (Required - Critical for auth & middleware)
pnpm vercel env add NEXT_PUBLIC_SUPABASE_URL
pnpm vercel env add NEXT_PUBLIC_SUPABASE_ANON_KEY
pnpm vercel env add SUPABASE_SERVICE_ROLE_KEY

# GitHub (Required for OAuth)
pnpm vercel env add GITHUB_PERSONAL_ACCESS_TOKEN

# AI Services (Required for matching)
pnpm vercel env add GOOGLE_AI_API_KEY
pnpm vercel env add OPENAI_API_KEY
pnpm vercel env add ELEVENLABS_API_KEY

# Email (Required for notifications)
pnpm vercel env add RESEND_API_KEY

# Analytics & Monitoring (Optional)
pnpm vercel env add NEXT_PUBLIC_POSTHOG_KEY
pnpm vercel env add NEXT_PUBLIC_POSTHOG_HOST
pnpm vercel env add SENTRY_DSN
pnpm vercel env add SENTRY_AUTH_TOKEN
pnpm vercel env add SENTRY_ORG
pnpm vercel env add SENTRY_PROJECT
```

**For each variable:**
- Mark secrets as sensitive (y)
- Paste the value from your `.env` file
- Select **Production** and **Preview** environments

### 2. Verify Variables Are Set

```bash
pnpm vercel env ls
```

### 3. Deploy

```bash
# Deploy to preview
pnpm vercel

# Deploy to production
pnpm vercel --prod
```

## Environment Variables Reference

Copy values from your `.env` file for these variables:

### Required

| Variable | Description | Get From |
|----------|-------------|----------|
| `NEXT_PUBLIC_SUPABASE_URL` | Supabase project URL | [Supabase Dashboard](https://supabase.com/dashboard) → Settings → API |
| `NEXT_PUBLIC_SUPABASE_ANON_KEY` | Supabase anon/public key | [Supabase Dashboard](https://supabase.com/dashboard) → Settings → API |
| `SUPABASE_SERVICE_ROLE_KEY` | Supabase service role key (⚠️ sensitive) | [Supabase Dashboard](https://supabase.com/dashboard) → Settings → API |
| `GITHUB_PERSONAL_ACCESS_TOKEN` | GitHub PAT (scopes: repo, read:org, read:user) | [GitHub Settings → Tokens](https://github.com/settings/tokens) |
| `GOOGLE_AI_API_KEY` | Google AI / Gemini API key | [Google AI Studio](https://aistudio.google.com/app/apikey) |
| `OPENAI_API_KEY` | OpenAI API key | [OpenAI Platform](https://platform.openai.com/api-keys) |
| `ELEVENLABS_API_KEY` | ElevenLabs API key | [ElevenLabs Settings](https://elevenlabs.io/app/settings/api-keys) |
| `RESEND_API_KEY` | Resend email API key | [Resend Dashboard](https://resend.com/api-keys) |

### Optional

| Variable | Description |
|----------|-------------|
| `NEXT_PUBLIC_POSTHOG_KEY` | PostHog analytics key |
| `NEXT_PUBLIC_POSTHOG_HOST` | PostHog host (e.g., https://app.posthog.com) |
| `SENTRY_DSN` | Sentry error tracking DSN |
| `SENTRY_AUTH_TOKEN` | Sentry auth token |
| `SENTRY_ORG` | Sentry organization slug |
| `SENTRY_PROJECT` | Sentry project slug |

## Troubleshooting

### MIDDLEWARE_INVOCATION_FAILED Error

This means Supabase environment variables are missing:

```bash
# Check which variables are set
pnpm vercel env ls | grep SUPABASE

# Add missing SUPABASE_SERVICE_ROLE_KEY
pnpm vercel env add SUPABASE_SERVICE_ROLE_KEY

# Redeploy
pnpm vercel --prod
```

### Update an Environment Variable

```bash
# Remove old value
pnpm vercel env rm VARIABLE_NAME

# Add new value
pnpm vercel env add VARIABLE_NAME

# Redeploy to apply changes
pnpm vercel --prod
```

### Pull Environment Variables Locally

```bash
# Download all Vercel env vars to .env.local
pnpm vercel env pull .env.local
```

## Useful Commands

```bash
# List all environment variables
pnpm vercel env ls

# Add a new variable
pnpm vercel env add VARIABLE_NAME

# Remove a variable
pnpm vercel env rm VARIABLE_NAME

# Pull variables to local file
pnpm vercel env pull .env.local

# Deploy to preview
pnpm vercel

# Deploy to production
pnpm vercel --prod

# View live logs
pnpm vercel logs --follow

# List deployments
pnpm vercel ls
```

## Supabase Configuration

After deployment, add your Vercel domain to Supabase auth redirects:

1. Go to Supabase Dashboard → Authentication → URL Configuration
2. Add redirect URLs:
   ```
   https://your-project.vercel.app/callback
   https://*.vercel.app/callback
   ```

## Additional Resources

- [Vercel CLI Reference](https://vercel.com/docs/cli)
- [Next.js Deployment](https://nextjs.org/docs/deployment)
- [Environment Variables in Vercel](https://vercel.com/docs/environment-variables)
