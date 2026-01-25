import { useQuery } from 'convex/react';
import { api } from '../../../convex/_generated/api';
import { useAuth } from './useAuth';

export function useUserContext() {
  const { isAuthenticated: authAuthenticated, isLoading: authLoading } = useAuth();
  
  // Get our app's user record based on WorkOS authId
  // The backend will extract the WorkOS user ID from the JWT token
  const appUser = useQuery(
    api.auth.getCurrentUser,
    {},
    { enabled: authAuthenticated && !authLoading }
  );

  const isLoading = authLoading || (authAuthenticated && appUser === undefined);
  const isAuthenticated = authAuthenticated && !!appUser;

  return {
    userId: appUser?._id,
    user: appUser,
    isLoading,
    isAuthenticated,
  };
}
