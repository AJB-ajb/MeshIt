# Deploying MeshIt to Vercel

This guide walks you through deploying MeshIt to Vercel and configuring environment variables.

## Quick Deploy

### Option 1: Deploy with Vercel CLI (Recommended)

1. **Install Vercel CLI**:
   ```bash
   pnpm add -g vercel
   ```

2. **Login to Vercel**:
   ```bash
   vercel login
   ```

3. **Deploy from your project directory**:
   ```bash
   vercel
   ```

4. **Configure environment variables** (see below)

5. **Deploy to production**:
   ```bash
   vercel --prod
   ```

### Option 2: Deploy via Vercel Dashboard

1. Go to [vercel.com/new](https://vercel.com/new)
2. Import your Git repository
3. Vercel will auto-detect Next.js
4. Configure environment variables (see below)
5. Click "Deploy"

## Environment Variables Configuration

### Setting Environment Variables in Vercel

You can set environment variables in three ways:

#### Method 1: Via Vercel Dashboard (Recommended)

1. Go to your project settings: `https://vercel.com/[your-team]/meshit/settings/environment-variables`
2. Add each variable with appropriate environment scope:
   - **Production**: Used in production deployments
   - **Preview**: Used in preview deployments (PR branches)
   - **Development**: Used with `vercel dev` command

#### Method 2: Via Vercel CLI

```bash
# Set a variable for all environments
vercel env add NEXT_PUBLIC_SUPABASE_URL

# Set for specific environment
vercel env add SUPABASE_SERVICE_ROLE_KEY production
vercel env add SUPABASE_SERVICE_ROLE_KEY preview

# Pull environment variables to local
vercel env pull .env.local
```

#### Method 3: Using `.env` file during deployment

```bash
# Deploy with specific env file
vercel --env-file=.env.production
```

### Required Environment Variables

Set these variables for **Production** and **Preview** environments:

#### Supabase (Required)

```
NEXT_PUBLIC_SUPABASE_URL=https://xxxxx.supabase.co
NEXT_PUBLIC_SUPABASE_ANON_KEY=eyJxxx...
SUPABASE_SERVICE_ROLE_KEY=eyJxxx...
```

**Where to get these:**
- Go to [Supabase Dashboard](https://supabase.com/dashboard)
- Select your project → Settings → API
- Copy URL and keys

⚠️ **Important**: 
- `NEXT_PUBLIC_*` variables are exposed to the browser
- `SUPABASE_SERVICE_ROLE_KEY` is server-only and should NEVER be prefixed with `NEXT_PUBLIC_`

#### AI Services (Required for matching)

```
GOOGLE_AI_API_KEY=AIza...
OPENAI_API_KEY=sk-...
ELEVENLABS_API_KEY=xi-...
```

**Where to get these:**
- **Google AI**: [Google AI Studio](https://aistudio.google.com/app/apikey)
- **OpenAI**: [OpenAI Platform](https://platform.openai.com/api-keys)
- **ElevenLabs**: [ElevenLabs Profile](https://elevenlabs.io/app/settings/api-keys)

#### Email Service (Required)

```
RESEND_API_KEY=re_xxx
```

**Where to get this:**
- [Resend Dashboard](https://resend.com/api-keys)

### Optional Environment Variables

These are recommended but not required for basic functionality:

#### Analytics & Monitoring

```
NEXT_PUBLIC_POSTHOG_KEY=phc_xxx
NEXT_PUBLIC_POSTHOG_HOST=https://app.posthog.com
SENTRY_DSN=https://xxx@sentry.io/xxx
```

**Where to get these:**
- **PostHog**: [PostHog Settings](https://app.posthog.com/project/settings)
- **Sentry**: [Sentry Settings](https://sentry.io/settings/)

## Vercel Project Settings

### Build & Development Settings

Vercel should auto-detect these, but verify:

| Setting | Value |
|---------|-------|
| **Framework Preset** | Next.js |
| **Build Command** | `pnpm build` |
| **Output Directory** | `.next` (default) |
| **Install Command** | `pnpm install` |
| **Development Command** | `pnpm dev` |
| **Node.js Version** | 18.x or later |

### Environment-Specific Configuration

For different environments, you might want different values:

**Production**:
- Use production Supabase project
- Use production API keys with higher rate limits
- Enable analytics and monitoring

**Preview** (for PR deployments):
- Can use same as production OR separate preview/staging project
- Useful for testing without affecting production data

**Development** (local with `vercel dev`):
- Use `.env.local` file
- Can use development/test API keys

## Vercel-Specific Features

### Automatic HTTPS

Vercel provides automatic HTTPS for all deployments. Update your Supabase auth settings:

1. Go to Supabase Dashboard → Authentication → URL Configuration
2. Add your Vercel domain to **Redirect URLs**:
   ```
   https://your-project.vercel.app/callback
   https://your-custom-domain.com/callback
   ```

### Preview Deployments

Every pull request gets a unique preview URL. To test auth on preview deployments:

1. Add wildcard domain to Supabase Redirect URLs:
   ```
   https://*.vercel.app/callback
   ```

2. Or add each preview URL individually (more secure)

### Custom Domains

1. Go to Project Settings → Domains
2. Add your custom domain
3. Update DNS records as instructed
4. Update Supabase redirect URLs with new domain

## Security Best Practices

### DO ✅

- Use environment variables for all sensitive data
- Set appropriate environment scopes (production, preview, development)
- Use `NEXT_PUBLIC_*` prefix ONLY for values safe to expose to browser
- Rotate API keys regularly
- Use different API keys for production vs preview/dev
- Enable Vercel's built-in security features

### DON'T ❌

- Never commit `.env` files to git
- Never prefix server-only secrets with `NEXT_PUBLIC_`
- Never expose `SUPABASE_SERVICE_ROLE_KEY` to the client
- Don't use production keys in preview deployments (if handling real user data)

## Verifying Deployment

After deployment, verify:

1. **Check build logs**: No errors during build
2. **Test authentication**: Try logging in with Google/GitHub
3. **Check environment variables**: 
   ```bash
   vercel env ls
   ```
4. **Monitor runtime logs**:
   ```bash
   vercel logs
   ```

## Troubleshooting

### Build Fails

```bash
# Check local build first
pnpm build

# Check Vercel logs
vercel logs --follow
```

### Environment Variables Not Working

```bash
# Pull current variables to local
vercel env pull

# Verify variables are set
vercel env ls
```

### Authentication Fails

1. Verify Supabase redirect URLs include your Vercel domain
2. Check that `NEXT_PUBLIC_SUPABASE_URL` and `NEXT_PUBLIC_SUPABASE_ANON_KEY` are set
3. Verify OAuth provider settings in Supabase

### API Rate Limits

- Upgrade API keys to higher tiers for production
- Implement caching where appropriate
- Monitor usage in respective dashboards

## Useful Commands

```bash
# Deploy to preview
vercel

# Deploy to production
vercel --prod

# List deployments
vercel ls

# View logs
vercel logs [deployment-url]

# Open project settings
vercel project

# List environment variables
vercel env ls

# Pull environment variables
vercel env pull .env.local

# Remove deployment
vercel rm [deployment-url]
```

## Monitoring & Analytics

After deployment, monitor:

1. **Vercel Analytics**: Built-in performance monitoring
2. **PostHog**: User analytics and feature flags
3. **Sentry**: Error tracking and performance
4. **Supabase**: Database performance and auth logs

## Additional Resources

- [Vercel Documentation](https://vercel.com/docs)
- [Next.js Deployment](https://nextjs.org/docs/deployment)
- [Vercel CLI Reference](https://vercel.com/docs/cli)
- [Environment Variables in Vercel](https://vercel.com/docs/environment-variables)
