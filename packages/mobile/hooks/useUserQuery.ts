import { useQuery } from 'convex/react';
import { FunctionReference } from 'convex/server';
import { useUserContext } from './useUserContext';

/**
 * Wrapper for Convex useQuery that automatically injects userId into query arguments.
 */
export function useUserQuery<Query extends FunctionReference<'query', 'public', any>>(
  query: Query,
  args: any,
  options?: any
) {
  const { userId, isLoading: userLoading } = useUserContext();

  if (!userId || userLoading) {
    return useQuery(query as any, 'skip' as any);
  }
  return useQuery(query as any, { ...args, userId } as any);
}
