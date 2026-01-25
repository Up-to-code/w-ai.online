import { ConvexReactClient } from 'convex/react';
import { WorkOSAuth } from './auth';

const CONVEX_URL = process.env.EXPO_PUBLIC_CONVEX_URL || '';

if (!CONVEX_URL) {
  throw new Error('EXPO_PUBLIC_CONVEX_URL environment variable is not set');
}

export const convex = new ConvexReactClient(CONVEX_URL);

/**
 * Get the access token for Convex authentication
 */
export async function getConvexAuthToken(): Promise<string | null> {
  const auth = WorkOSAuth.getInstance();
  return await auth.getAccessToken();
}
