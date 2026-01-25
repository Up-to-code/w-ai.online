# Vercel Deployment Setup for W-AI

## Required Environment Variables

For the build to succeed on Vercel, you need to set up the following environment variable:

### CONVEX_DEPLOY_KEY

This is required for `convex codegen` to run during the build process.

**How to set it up:**

1. Go to your [Convex Dashboard](https://dashboard.convex.dev)
2. Navigate to your project settings
3. Go to "Production Deploy Keys" section
4. Generate a new Production deploy key
5. Copy the deploy key
6. In Vercel:
   - Go to your project settings
   - Navigate to "Environment Variables"
   - Add a new variable:
     - **Name**: `CONVEX_DEPLOY_KEY`
     - **Value**: (paste the deploy key you copied)
     - **Environment**: Select "Production" (and optionally Preview/Development if needed)
   - Save

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
