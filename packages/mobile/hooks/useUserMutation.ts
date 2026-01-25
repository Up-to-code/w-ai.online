import { useMutation } from 'convex/react';
import { FunctionReference } from 'convex/server';
import { useCallback } from 'react';
import { useUserContext } from './useUserContext';

/**
 * Wrapper for Convex useMutation that automatically injects userId into mutation arguments.
 */
export function useUserMutation<Mutation extends FunctionReference<'mutation', 'public', any>>(
  mutation: Mutation,
  options?: any
) {
  const { userId } = useUserContext();
  const baseMutation = useMutation(mutation as any);

  return useCallback(
    (args: any) => {
      if (!userId) {
        throw new Error('User not authenticated. Please sign in.');
      }
      return baseMutation({ ...args, userId } as any);
    },
    [userId, baseMutation]
  );
}
