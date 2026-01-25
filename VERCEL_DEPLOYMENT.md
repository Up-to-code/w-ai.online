# Vercel Deployment Setup for W-AI

## ⚠️ Required: CONVEX_DEPLOY_KEY

**The build will fail without this environment variable.** The prebuild script will check for it and provide helpful error messages if it's missing.

### Quick Setup Steps

1. **Get your Convex Deploy Key:**
   - Go to [Convex Dashboard](https://dashboard.convex.dev)
   - Select your project: `compassionate-owl-382`
   - Navigate to: **Settings** → **Deploy Keys** → **Production Deploy Keys**
   - Click **"Generate Deploy Key"**
   - **Copy the key immediately** (you won't be able to see it again)

2. **Add to Vercel:**
   - Go to your Vercel project dashboard
   - Navigate to: **Settings** → **Environment Variables**
   - Click **"Add New"**
   - Fill in:
     - **Name**: `CONVEX_DEPLOY_KEY`
     - **Value**: (paste the deploy key from step 1)
     - **Environment**: 
       - ✅ **Production** (required)
       - ✅ **Preview** (recommended)
       - ✅ **Development** (optional)
   - Click **"Save"**

3. **Redeploy:**
   - After adding the variable, trigger a new deployment
   - The build should now succeed

### NEXT_PUBLIC_CONVEX_URL

This should already be set, but ensure it's configured:
- **Name**: `NEXT_PUBLIC_CONVEX_URL`
- **Value**: Your Convex deployment URL (e.g., `https://your-deployment.convex.cloud`)
- **Environment**: All (Production, Preview, Development)

## Build Process

The build script runs:
1. `npx convex codegen` - Generates TypeScript types from your Convex schema
2. `next build` - Builds the Next.js application

Both steps are required for a successful build.

## Troubleshooting

If you see `401 Unauthorized: MissingAccessToken`:
- Ensure `CONVEX_DEPLOY_KEY` is set in Vercel environment variables
- Make sure it's set for the correct environment (Production/Preview/Development)
- Verify the deploy key is valid and hasn't expired

If you see `Module not found: Can't resolve '@convex/_generated/api'`:
- This means `convex codegen` didn't run successfully
- Check that `CONVEX_DEPLOY_KEY` is properly configured
- Verify the build logs to see if codegen completed
