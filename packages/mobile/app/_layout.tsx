import { Stack } from 'expo-router';
import { AuthProvider } from '../components/AuthProvider';
import { ConvexProvider } from '../components/ConvexProvider';
import { PaperProvider } from 'react-native-paper';
import { SafeAreaProvider } from 'react-native-safe-area-context';

export default function RootLayout() {
  return (
    <SafeAreaProvider>
      <PaperProvider>
        <AuthProvider>
          <ConvexProvider>
            <Stack screenOptions={{ headerShown: false }}>
              <Stack.Screen name="(auth)" />
              <Stack.Screen name="(tabs)" />
            </Stack>
          </ConvexProvider>
        </AuthProvider>
      </PaperProvider>
    </SafeAreaProvider>
  );
}
