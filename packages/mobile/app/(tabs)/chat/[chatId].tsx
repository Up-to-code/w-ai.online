import { useLocalSearchParams } from 'expo-router';
import { View, Text, StyleSheet, FlatList, KeyboardAvoidingView, Platform } from 'react-native';
import { useUserQuery } from '../../../hooks/useUserQuery';
import { api } from '../../../../convex/_generated/api';
import { ChatInput } from '../../../components/chat/ChatInput';
import { MessageBubble } from '../../../components/chat/MessageBubble';
import { useUserContext } from '../../../hooks/useUserContext';

export default function ChatScreen() {
  const { chatId } = useLocalSearchParams<{ chatId: string }>();
  const chat = useUserQuery(api.chat.getChat, chatId ? { chatId: chatId as any } : 'skip');
  const messages = useUserQuery(
    api.chat.getMessages,
    chatId ? { chatId: chatId as any, limit: 100 } : 'skip'
  );

  if (!chatId || !chat) {
    return (
      <View style={styles.container}>
        <Text style={styles.loadingText}>جاري التحميل...</Text>
      </View>
    );
  }

  return (
    <KeyboardAvoidingView
      style={styles.container}
      behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
      keyboardVerticalOffset={90}
    >
      <View style={styles.header}>
        <Text style={styles.headerTitle}>{chat.contactName}</Text>
        <Text style={styles.headerPhone} dir="ltr">
          {chat.contactPhone}
        </Text>
      </View>

      <FlatList
        data={messages || []}
        keyExtractor={(item) => item._id}
        renderItem={({ item }) => <MessageBubble message={item} />}
        inverted
        contentContainerStyle={styles.messagesList}
        ListEmptyComponent={
          <View style={styles.emptyContainer}>
            <Text style={styles.emptyText}>لا توجد رسائل</Text>
          </View>
        }
      />

      <ChatInput chatId={chatId} />
    </KeyboardAvoidingView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#f5f5f5',
  },
  header: {
    backgroundColor: '#1D4F34',
    padding: 16,
    paddingTop: 50,
  },
  headerTitle: {
    fontSize: 18,
    fontWeight: 'bold',
    color: '#fff',
    marginBottom: 4,
  },
  headerPhone: {
    fontSize: 14,
    color: '#fff',
    opacity: 0.9,
  },
  messagesList: {
    padding: 16,
  },
  emptyContainer: {
    padding: 40,
    alignItems: 'center',
  },
  emptyText: {
    fontSize: 16,
    color: '#999',
  },
  loadingText: {
    textAlign: 'center',
    marginTop: 20,
    fontSize: 16,
    color: '#666',
  },
});
