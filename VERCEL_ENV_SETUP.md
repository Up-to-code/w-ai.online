# How to Add CONVEX_DEPLOY_KEY to Vercel

## Step-by-Step Guide

### Step 1: Get Your Convex Deploy Key

1. **Go to Convex Dashboard:**
   - Visit: https://dashboard.convex.dev
   - Log in to your account

2. **Select Your Project:**
   - Click on your project: `compassionate-owl-382`
   - (Or whatever your project name is)

3. **Navigate to Deploy Keys:**
   - Click on **"Settings"** in the left sidebar
   - Scroll down to find **"Deploy Keys"** section
   - Click on **"Production Deploy Keys"** tab

4. **Generate New Key:**
   - Click the **"Generate Deploy Key"** button
   - **IMPORTANT:** Copy the key immediately - you won't be able to see it again!
   - The key will look something like: `prod_xxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxx`

### Step 2: Add to Vercel

1. **Go to Vercel Dashboard:**
   - Visit: https://vercel.com/dashboard
   - Log in to your account

2. **Select Your Project:**
   - Click on your project: `w-ai.online` (or your project name)

3. **Go to Settings:**
   - Click on **"Settings"** tab at the top
   - Click on **"Environment Variables"** in the left sidebar

4. **Add New Variable:**
   - Click the **"Add New"** button (or **"Add"** button)
   - Fill in the form:
     - **Key/Name:** `CONVEX_DEPLOY_KEY`
     - **Value:** Paste the deploy key you copied from Convex
     - **Environment:** 
       - ✅ Check **"Production"** (required)
       - ✅ Check **"Preview"** (recommended)
       - ⬜ **"Development"** (optional)
   - Click **"Save"**

5. **Verify It's Added:**
   - You should now see `CONVEX_DEPLOY_KEY` in the list
   - It will show as `••••••••` (hidden for security)

### Step 3: Redeploy

1. **Trigger New Deployment:**
   - Go to **"Deployments"** tab
   - Click the **"..."** menu on the latest deployment
   - Click **"Redeploy"**
   - OR push a new commit to trigger a new build

2. **Check Build Logs:**
   - Watch the build logs
   - You should see: `✅ All required environment variables are set.`
   - Then `convex codegen` should run successfully

## Troubleshooting

### Can't Find Deploy Keys in Convex?
- Make sure you're in the correct project
- Deploy Keys are in: **Settings** → **Deploy Keys** → **Production Deploy Keys**
- If you don't see it, you might need to check your project permissions

### Can't Find Environment Variables in Vercel?
- Make sure you're in the correct project
- Environment Variables are in: **Settings** → **Environment Variables**
- You need to be a project owner or have admin permissions

### Key Not Working?
- Make sure you copied the entire key (it's long)
- Make sure there are no extra spaces before/after
- Make sure you selected the correct environment (Production/Preview)
- Try generating a new key if the old one doesn't work

### Still Getting Errors?
- Check the build logs to see the exact error
- Make sure the variable name is exactly: `CONVEX_DEPLOY_KEY` (case-sensitive)
- Verify the key is set for the environment you're deploying to

## Visual Guide

```
Convex Dashboard:
Settings → Deploy Keys → Production Deploy Keys → Generate Deploy Key

Vercel Dashboard:
Project → Settings → Environment Variables → Add New
Key: CONVEX_DEPLOY_KEY
Value: [paste key here]
Environment: Production ✅ Preview ✅
```
