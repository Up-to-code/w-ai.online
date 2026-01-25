import { useEffect } from 'react';
import { Stack } from 'expo-router';
import { AuthProvider, useAuth } from '../components/AuthProvider';
import { ConvexProvider } from '../components/ConvexProvider';
import { PaperProvider } from 'react-native-paper';
import { SafeAreaProvider } from 'react-native-safe-area-context';
import { usePushNotificationRegistration } from '../lib/pushNotifications';
import { useUserContext } from '../hooks/useUserContext';

function AppContent() {
  const { isAuthenticated } = useAuth();
  const { userId } = useUserContext();
  const { registerToken } = usePushNotificationRegistration();

  useEffect(() => {
    if (isAuthenticated && userId) {
      registerToken(userId);
    }
  }, [isAuthenticated, userId]);

  return (
    <Stack screenOptions={{ headerShown: false }}>
      <Stack.Screen name="(auth)" />
      <Stack.Screen name="(tabs)" />
    </Stack>
  );
}

export default function RootLayout() {
  return (
    <SafeAreaProvider>
      <PaperProvider>
        <AuthProvider>
          <ConvexProvider>
            <AppContent />
          </ConvexProvider>
        </AuthProvider>
      </PaperProvider>
    </SafeAreaProvider>
  );
}
