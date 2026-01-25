import { handleAuth } from '@workos-inc/authkit-nextjs';
import { NextRequest } from 'next/server';

// handleAuth automatically parses the state parameter to extract returnPathname
// If state contains returnPathname, it will use that; otherwise defaults to '/dashboard'
const authHandler = handleAuth({ returnPathname: '/dashboard' });

export async function GET(request: NextRequest): Promise<Response> {
  return authHandler(request);
}
