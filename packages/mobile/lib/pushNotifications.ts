import * as Notifications from 'expo-notifications';
import * as Device from 'expo-device';
import { Platform } from 'react-native';
import { useUserMutation } from '../hooks/useUserMutation';
import { api } from '../../../convex/_generated/api';

// Configure notification handler
Notifications.setNotificationHandler({
  handleNotification: async () => ({
    shouldShowAlert: true,
    shouldPlaySound: true,
    shouldSetBadge: true,
  }),
});

export async function registerForPushNotifications() {
  let token;

  if (Platform.OS === 'android') {
    await Notifications.setNotificationChannelAsync('default', {
      name: 'default',
      importance: Notifications.AndroidImportance.MAX,
      vibrationPattern: [0, 250, 250, 250],
      lightColor: '#1D4F34',
    });
  }

  if (Device.isDevice) {
    const { status: existingStatus } = await Notifications.getPermissionsAsync();
    let finalStatus = existingStatus;
    if (existingStatus !== 'granted') {
      const { status } = await Notifications.requestPermissionsAsync();
      finalStatus = status;
    }
    if (finalStatus !== 'granted') {
      console.log('Failed to get push token for push notification!');
      return null;
    }
    token = (await Notifications.getExpoPushTokenAsync()).data;
  } else {
    console.log('Must use physical device for Push Notifications');
  }

  return token;
}

export function usePushNotificationRegistration() {
  const recordToken = useUserMutation(api.auth.recordPushNotificationToken);

  const registerToken = async (userId: string) => {
    try {
      const token = await registerForPushNotifications();
      if (token && userId) {
        await recordToken({ token, userId: userId as any });
      }
    } catch (error) {
      console.error('Failed to register push token:', error);
    }
  };

  return { registerToken };
}

// Handle notification received while app is foregrounded
export function setupNotificationHandlers(navigation: any) {
  // Handle notification received while app is foregrounded
  Notifications.addNotificationReceivedListener((notification) => {
    console.log('Notification received:', notification);
  });

  // Handle notification tapped
  Notifications.addNotificationResponseReceivedListener((response) => {
    const data = response.notification.request.content.data;
    
    // Navigate based on notification data
    if (data?.chatId) {
      navigation.navigate('/(tabs)/chat', { chatId: data.chatId });
    } else if (data?.customerId) {
      navigation.navigate('/(tabs)/customers', { id: data.customerId });
    }
  });
}
