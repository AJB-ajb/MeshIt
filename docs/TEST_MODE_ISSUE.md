# Test Mode Issue - Troubleshooting Guide

## Problem
The application shows "Test Mode: Showing test/mock data only" banner even when deployed to Vercel production at `https://mesh-it.vercel.app/`.

## Root Cause
The app detects production mode by checking if the URL matches `mesh-it.vercel.app`. This requires the `NEXT_PUBLIC_VERCEL_URL` environment variable to be set to `mesh-it.vercel.app` in the Production environment.

When this variable is not set or set incorrectly, the app cannot detect that it's running on the production URL and defaults to test mode.

## Solution

### Step 1: Add Production URL Environment Variable

```bash
# Add the environment variable
pnpm vercel env add NEXT_PUBLIC_VERCEL_URL

# When prompted:
# - Value: mesh-it.vercel.app
# - Sensitive: No
# - Environments: Select ONLY "Production" (NOT Preview or Development)
```

**IMPORTANT**: Only set this variable for the Production environment. Preview and development deployments should NOT have this variable set, so they remain in test mode.

### Step 2: Redeploy

After adding the variable, redeploy to production:

```bash
pnpm vercel --prod
```

### Step 3: Verify

After redeployment, verify the fix:

1. **Visit the main site**: `https://mesh-it.vercel.app/`
   - Header should show "MeshIt" (not "MeshIt - Test")
   - Orange test mode banner should be gone

2. **Check debug endpoint**: `https://mesh-it.vercel.app/api/debug/env`
   - Should show `"isProduction": true`
   - Should show `"isTestMode": false`

## How It Works

The production detection logic checks multiple sources:

1. **NEXT_PUBLIC_VERCEL_URL** (available everywhere) - Preferred method
2. **VERCEL_URL** (server-side only) - Automatic Vercel variable
3. **window.location.hostname** (client-side only) - Browser check

If any of these match `mesh-it.vercel.app`, the app is in production mode.

## Expected Behavior

| Environment | URL Pattern | NEXT_PUBLIC_VERCEL_URL | Test Mode |
|-------------|-------------|------------------------|-----------|
| **Production** | `mesh-it.vercel.app` | `mesh-it.vercel.app` | ❌ OFF (shows real data) |
| **Preview** | `mesh-it-*.vercel.app` | Not set | ✅ ON (shows test data) |
| **Local Dev** | `localhost:3000` | Not set | ✅ ON (shows test data) |

## Debugging

### Check Current Status

Visit the debug endpoint on your deployment:
```
https://mesh-it.vercel.app/api/debug/env
```

This will show:
- **computed**: Environment detection results
- **raw**: Actual environment variable values  
- **diagnostic**: Instructions if not in production mode

### Example Output (Production - Working)

```json
{
  "computed": {
    "isProduction": true,
    "isTestMode": false,
    "environmentName": "Production"
  },
  "raw": {
    "NEXT_PUBLIC_VERCEL_URL": "mesh-it.vercel.app",
    "VERCEL_URL": "mesh-it.vercel.app",
    "VERCEL": "1",
    "NODE_ENV": "production"
  },
  "diagnostic": {
    "fix": "✅ Production mode is correctly detected"
  }
}
```

### Example Output (Production - Not Working)

```json
{
  "computed": {
    "isProduction": false,
    "isTestMode": true,
    "environmentName": "Development"
  },
  "raw": {
    "NEXT_PUBLIC_VERCEL_URL": "undefined",
    "VERCEL_URL": "mesh-it.vercel.app",
    "VERCEL": "1",
    "NODE_ENV": "production"
  },
  "diagnostic": {
    "fix": "⚠️  Not in production mode..."
  }
}
```

If you see the second output on `mesh-it.vercel.app`, the `NEXT_PUBLIC_VERCEL_URL` variable is missing.

## Common Issues

### Issue: Variable is set but still shows test mode

**Solution**: Make sure you redeployed after adding the variable. Environment variables only take effect after a new deployment.

### Issue: Preview deployments also show production mode

**Solution**: Check that `NEXT_PUBLIC_VERCEL_URL` is ONLY set for the Production environment, not for Preview or Development.

To fix:
```bash
# Remove from all environments
pnpm vercel env rm NEXT_PUBLIC_VERCEL_URL

# Re-add ONLY to production
pnpm vercel env add NEXT_PUBLIC_VERCEL_URL
# Select ONLY "Production" when prompted
```

### Issue: Local development shows production mode

**Solution**: Make sure you don't have `NEXT_PUBLIC_VERCEL_URL=mesh-it.vercel.app` in your local `.env` or `.env.local` files. Remove it if present.

## Related Files

- `src/lib/environment.ts` - Environment detection logic
- `src/components/layout/test-mode-banner.tsx` - The banner component
- `src/components/layout/logo.tsx` - Shows "MeshIt - Test" in test mode
- `src/app/api/debug/env/route.ts` - Debug endpoint
- `docs/VERCEL_DEPLOYMENT.md` - Deployment instructions

## Security Note

Once you've verified everything works, consider protecting or removing the debug endpoint (`src/app/api/debug/env/route.ts`) before going fully live, as it exposes environment information.

## Additional Resources

- [Vercel Environment Variables](https://vercel.com/docs/environment-variables)
- [Next.js Environment Variables](https://nextjs.org/docs/app/building-your-application/configuring/environment-variables)
