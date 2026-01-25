import { View, Text, StyleSheet } from 'react-native';
import { Card, Button } from 'react-native-paper';
import { useAuth } from '../../components/AuthProvider';
import { useUserContext } from '../../hooks/useUserContext';
import { useRouter } from 'expo-router';

export default function ProfileScreen() {
  const { logout } = useAuth();
  const { user } = useUserContext();
  const router = useRouter();

  const handleLogout = async () => {
    await logout();
    router.replace('/(auth)/login');
  };

  return (
    <View style={styles.container}>
      <Card style={styles.card}>
        <Card.Content>
          <Text style={styles.title}>الملف الشخصي</Text>
          
          {user && (
            <View style={styles.infoSection}>
              <Text style={styles.label}>الاسم:</Text>
              <Text style={styles.value}>{user.name || 'غير محدد'}</Text>
            </View>
          )}

          {user?.email && (
            <View style={styles.infoSection}>
              <Text style={styles.label}>البريد الإلكتروني:</Text>
              <Text style={styles.value}>{user.email}</Text>
            </View>
          )}

          <Button
            mode="contained"
            onPress={handleLogout}
            style={styles.logoutButton}
            buttonColor="#d32f2f"
          >
            تسجيل الخروج
          </Button>
        </Card.Content>
      </Card>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#f5f5f5',
    padding: 16,
  },
  card: {
    marginTop: 20,
  },
  title: {
    fontSize: 24,
    fontWeight: 'bold',
    marginBottom: 24,
    textAlign: 'center',
  },
  infoSection: {
    marginBottom: 16,
  },
  label: {
    fontSize: 14,
    color: '#666',
    marginBottom: 4,
  },
  value: {
    fontSize: 16,
    fontWeight: '500',
  },
  logoutButton: {
    marginTop: 24,
    paddingVertical: 8,
  },
});
