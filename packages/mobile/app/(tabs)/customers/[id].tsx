import { useLocalSearchParams, useRouter } from 'expo-router';
import { View, Text, StyleSheet, ScrollView } from 'react-native';
import { Card, Avatar, Button, Chip } from 'react-native-paper';
import { useUserQuery } from '../../../hooks/useUserQuery';
import { api } from '../../../../convex/_generated/api';
import { Id } from '../../../../convex/_generated/dataModel';
import { avatarColorFromString, initialsFromName } from '../../../lib/utils';
import { useMemo } from 'react';

export default function CustomerDetailScreen() {
  const { id } = useLocalSearchParams<{ id: string }>();
  const router = useRouter();

  const contact = useUserQuery(
    api.contacts.getById,
    id ? { id: id as Id<'contacts'> } : 'skip'
  );

  const chats = useQuery(api.chat.listChats, {});

  const chatId = useMemo(() => {
    if (!contact || !chats) return null;
    const found = chats.find((c: any) => c.contactPhone === contact.phone);
    return found ? String(found._id) : null;
  }, [contact, chats]);

  if (!contact) {
    return (
      <View style={styles.container}>
        <Text style={styles.loadingText}>جاري التحميل...</Text>
      </View>
    );
  }

  const seed = `${contact.phone}:${contact.name}`;
  const avatarBg = avatarColorFromString(seed);

  const handleChatPress = () => {
    if (chatId) {
      router.push(`/(tabs)/chat/${chatId}`);
    }
  };

  return (
    <ScrollView style={styles.container}>
      <Card style={styles.card}>
        <Card.Content style={styles.cardContent}>
          <Avatar.Text
            size={80}
            label={initialsFromName(contact.name)}
            style={{ backgroundColor: avatarBg, marginBottom: 16 }}
          />

          <Text style={styles.name}>{contact.name}</Text>

          <View style={styles.infoRow}>
            <Text style={styles.label}>رقم الهاتف:</Text>
            <Text style={styles.value} dir="ltr">
              {contact.phone}
            </Text>
          </View>

          {contact.email && (
            <View style={styles.infoRow}>
              <Text style={styles.label}>البريد الإلكتروني:</Text>
              <Text style={styles.value}>{contact.email}</Text>
            </View>
          )}

          {contact.tags && contact.tags.length > 0 && (
            <View style={styles.tagsSection}>
              <Text style={styles.label}>الوسوم:</Text>
              <View style={styles.tagsContainer}>
                {contact.tags.map((tag: string) => (
                  <Chip key={tag} style={styles.tag}>
                    {tag}
                  </Chip>
                ))}
              </View>
            </View>
          )}

          <Button
            mode="contained"
            onPress={handleChatPress}
            disabled={!chatId}
            style={styles.chatButton}
            buttonColor="#1D4F34"
          >
            {chatId ? 'فتح المحادثة' : 'لا توجد محادثة'}
          </Button>
        </Card.Content>
      </Card>
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#f5f5f5',
  },
  card: {
    margin: 16,
  },
  cardContent: {
    alignItems: 'center',
    padding: 20,
  },
  name: {
    fontSize: 24,
    fontWeight: 'bold',
    marginBottom: 20,
  },
  infoRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    width: '100%',
    marginBottom: 12,
    paddingHorizontal: 8,
  },
  label: {
    fontSize: 16,
    fontWeight: '600',
    color: '#666',
  },
  value: {
    fontSize: 16,
    color: '#000',
  },
  tagsSection: {
    width: '100%',
    marginTop: 8,
    marginBottom: 20,
  },
  tagsContainer: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 8,
    marginTop: 8,
  },
  tag: {
    marginRight: 4,
  },
  chatButton: {
    marginTop: 20,
    width: '100%',
    paddingVertical: 8,
  },
  loadingText: {
    textAlign: 'center',
    marginTop: 20,
    fontSize: 16,
    color: '#666',
  },
});
