import { useState } from 'react';
import { View, Text, StyleSheet, Linking, Alert } from 'react-native';
import { Button, TextInput, Card } from 'react-native-paper';
import { useAuth } from '../../components/AuthProvider';
import { useRouter } from 'expo-router';

const WEB_APP_URL = process.env.EXPO_PUBLIC_WEB_APP_URL || 'https://w-ai.online';

export default function LoginScreen() {
  const { login, isLoading } = useAuth();
  const router = useRouter();
  const [isLoggingIn, setIsLoggingIn] = useState(false);

  const handleLogin = async () => {
    setIsLoggingIn(true);
    try {
      const success = await login();
      if (success) {
        router.replace('/(tabs)/customers');
      } else {
        Alert.alert('Login Failed', 'Unable to log in. Please try again.');
      }
    } catch (error) {
      Alert.alert('Error', 'An error occurred during login.');
    } finally {
      setIsLoggingIn(false);
    }
  };

  const handleSignUp = () => {
    Linking.openURL(`${WEB_APP_URL}/signup`).catch(() => {
      Alert.alert('Error', 'Unable to open signup page.');
    });
  };

  return (
    <View style={styles.container}>
      <Card style={styles.card}>
        <Card.Content>
          <Text style={styles.title}>w-ai Mobile</Text>
          <Text style={styles.subtitle}>تسجيل الدخول</Text>
          
          <View style={styles.infoBox}>
            <Text style={styles.infoText}>
              لا يمكنك إنشاء حساب من التطبيق. يرجى إنشاء حساب من الموقع الإلكتروني أولاً.
            </Text>
            <Button
              mode="text"
              onPress={handleSignUp}
              style={styles.signupButton}
            >
              إنشاء حساب على الموقع
            </Button>
          </View>

          <Button
            mode="contained"
            onPress={handleLogin}
            loading={isLoggingIn || isLoading}
            disabled={isLoggingIn || isLoading}
            style={styles.loginButton}
            buttonColor="#1D4F34"
          >
            تسجيل الدخول
          </Button>
        </Card.Content>
      </Card>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    backgroundColor: '#f5f5f5',
    padding: 20,
  },
  card: {
    width: '100%',
    maxWidth: 400,
  },
  title: {
    fontSize: 28,
    fontWeight: 'bold',
    textAlign: 'center',
    marginBottom: 8,
    color: '#1D4F34',
  },
  subtitle: {
    fontSize: 18,
    textAlign: 'center',
    marginBottom: 24,
    color: '#666',
  },
  infoBox: {
    backgroundColor: '#e3f2fd',
    padding: 16,
    borderRadius: 8,
    marginBottom: 24,
  },
  infoText: {
    fontSize: 14,
    textAlign: 'center',
    marginBottom: 12,
    color: '#1976d2',
  },
  signupButton: {
    marginTop: 8,
  },
  loginButton: {
    marginTop: 16,
    paddingVertical: 8,
  },
});
