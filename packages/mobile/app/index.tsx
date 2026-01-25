import { useEffect } from 'react';
import { Redirect } from 'expo-router';
import { useAuth } from '../components/AuthProvider';
import { View, ActivityIndicator, StyleSheet } from 'react-native';

export default function Index() {
  const { isAuthenticated, isLoading } = useAuth();

  if (isLoading) {
    return (
      <View style={styles.container}>
        <ActivityIndicator size="large" color="#1D4F34" />
      </View>
    );
  }

  if (isAuthenticated) {
    return <Redirect href="/(tabs)/customers" />;
  }

  return <Redirect href="/(auth)/login" />;
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    backgroundColor: '#fff',
  },
});
