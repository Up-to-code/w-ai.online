import { View, Text, StyleSheet, FlatList, TouchableOpacity } from 'react-native';
import { Card, Avatar, List } from 'react-native-paper';
import { useUserQuery } from '../../hooks/useUserQuery';
import { api } from '../../../convex/_generated/api';
import { useRouter } from 'expo-router';
import { avatarColorFromString, initialsFromName } from '../../lib/utils';

export default function ChatListScreen() {
  const router = useRouter();
  const chats = useUserQuery(api.chat.listChats, {});

  const handleChatPress = (chatId: string) => {
    router.push(`/(tabs)/chat/${chatId}`);
  };

  if (chats === undefined) {
    return (
      <View style={styles.container}>
        <Text style={styles.loadingText}>جاري التحميل...</Text>
      </View>
    );
  }

  if (chats.length === 0) {
    return (
      <View style={styles.container}>
        <View style={styles.emptyContainer}>
          <Text style={styles.emptyText}>لا توجد محادثات</Text>
        </View>
      </View>
    );
  }

  return (
    <View style={styles.container}>
      <FlatList
        data={chats}
        keyExtractor={(item) => item._id}
        renderItem={({ item }) => {
          const seed = `${item.contactPhone}:${item.contactName}`;
          const avatarBg = avatarColorFromString(seed);

          return (
            <TouchableOpacity onPress={() => handleChatPress(item._id)}>
              <Card style={styles.chatCard}>
                <Card.Content>
                  <View style={styles.chatRow}>
                    <Avatar.Text
                      size={50}
                      label={initialsFromName(item.contactName || '')}
                      style={{ backgroundColor: avatarBg }}
                    />
                    <View style={styles.chatInfo}>
                      <Text style={styles.chatName}>{item.contactName}</Text>
                      <Text style={styles.chatPhone} dir="ltr">
                        {item.contactPhone}
                      </Text>
                      {item.unreadCount > 0 && (
                        <View style={styles.unreadBadge}>
                          <Text style={styles.unreadText}>{item.unreadCount}</Text>
                        </View>
                      )}
                    </View>
                    <Text style={styles.chatTime}>
                      {new Date(item.lastMessageTime).toLocaleTimeString('ar-EG', {
                        hour: '2-digit',
                        minute: '2-digit',
                      })}
                    </Text>
                  </View>
                </Card.Content>
              </Card>
            </TouchableOpacity>
          );
        }}
        contentContainerStyle={styles.listContent}
      />
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#f5f5f5',
  },
  listContent: {
    padding: 16,
  },
  chatCard: {
    marginBottom: 12,
  },
  chatRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
  },
  chatInfo: {
    flex: 1,
  },
  chatName: {
    fontSize: 16,
    fontWeight: '600',
    marginBottom: 4,
  },
  chatPhone: {
    fontSize: 14,
    color: '#666',
  },
  unreadBadge: {
    backgroundColor: '#1D4F34',
    borderRadius: 10,
    minWidth: 20,
    height: 20,
    justifyContent: 'center',
    alignItems: 'center',
    paddingHorizontal: 6,
    marginTop: 4,
  },
  unreadText: {
    color: '#fff',
    fontSize: 12,
    fontWeight: 'bold',
  },
  chatTime: {
    fontSize: 12,
    color: '#999',
  },
  loadingText: {
    textAlign: 'center',
    marginTop: 20,
    fontSize: 16,
    color: '#666',
  },
  emptyContainer: {
    padding: 40,
    alignItems: 'center',
  },
  emptyText: {
    fontSize: 16,
    color: '#999',
  },
});
