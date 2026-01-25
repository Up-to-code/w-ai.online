#!/usr/bin/env node

/**
 * Pre-build script to check for required environment variables
 * and provide helpful error messages if they're missing.
 */

const requiredEnvVars = {
  CONVEX_DEPLOY_KEY: {
    description: 'Convex deploy key for generating TypeScript types',
    helpUrl: 'https://dashboard.convex.dev/project/settings#production-deploy-keys',
    instructions: [
      '1. Go to your Convex Dashboard',
      '2. Navigate to Project Settings → Production Deploy Keys',
      '3. Generate a new Production deploy key',
      '4. Add it as CONVEX_DEPLOY_KEY in Vercel environment variables'
    ]
  }
};

function checkEnvVars() {
  const missing = [];
  
  for (const [varName, config] of Object.entries(requiredEnvVars)) {
    if (!process.env[varName]) {
      missing.push({ name: varName, ...config });
    }
  }
  
  if (missing.length > 0) {
    console.error('\n❌ Missing required environment variables for build:\n');
    
    missing.forEach(({ name, description, helpUrl, instructions }) => {
      console.error(`  ${name}`);
      console.error(`  Description: ${description}`);
      console.error(`  Help: ${helpUrl}\n`);
      console.error('  Setup instructions:');
      instructions.forEach(step => console.error(`    ${step}`));
      console.error('');
    });
    
    console.error('📖 See VERCEL_DEPLOYMENT.md for detailed setup instructions.\n');
    process.exit(1);
  }
  
  console.log('✅ All required environment variables are set.');
}

// Only check in CI/build environments (not local dev)
if (process.env.CI || process.env.VERCEL || process.env.NODE_ENV === 'production') {
  checkEnvVars();
} else {
  console.log('ℹ️  Skipping environment variable check (local development)');
}
