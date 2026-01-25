import { useState, useMemo } from 'react';
import { View, Text, StyleSheet, FlatList, TouchableOpacity } from 'react-native';
import { Searchbar, FAB, Card, Avatar, Button } from 'react-native-paper';
import { useUserQuery } from '../../hooks/useUserQuery';
import { api } from '../../../../convex/_generated/api';
import { useRouter } from 'expo-router';
import { avatarColorFromString, initialsFromName } from '../../lib/utils';
import { AddCustomerModal } from '../../components/customers/AddCustomerModal';

export default function CustomersScreen() {
  const router = useRouter();
  const contacts = useUserQuery(api.contacts.list, { limit: 1000 });
  const chats = useUserQuery(api.chat.listChats, {});
  const [searchQuery, setSearchQuery] = useState('');
  const [isAddModalVisible, setIsAddModalVisible] = useState(false);

  const chatByPhone = useMemo(() => {
    const map = new Map<string, string>();
    (chats || []).forEach((c: any) => {
      if (c.contactPhone) map.set(c.contactPhone, String(c._id));
    });
    return map;
  }, [chats]);

  const filteredContacts = useMemo(() => {
    const list = contacts || [];
    if (!searchQuery.trim()) return list;
    return list.filter((c: any) =>
      (c.name || '').toLowerCase().includes(searchQuery.toLowerCase()) ||
      (c.phone || '').includes(searchQuery)
    );
  }, [contacts, searchQuery]);

  const handleCustomerPress = (contactId: string) => {
    router.push(`/(tabs)/customers/${contactId}`);
  };

  const handleChatPress = (chatId: string) => {
    router.push(`/(tabs)/chat/${chatId}`);
  };

  if (contacts === undefined) {
    return (
      <View style={styles.container}>
        <Text style={styles.loadingText}>جاري التحميل...</Text>
      </View>
    );
  }

  return (
    <View style={styles.container}>
      <Searchbar
        placeholder="بحث بالاسم أو رقم الهاتف"
        onChangeText={setSearchQuery}
        value={searchQuery}
        style={styles.searchbar}
      />

      <FlatList
        data={filteredContacts}
        keyExtractor={(item) => item._id}
        renderItem={({ item }) => {
          const seed = `${item.phone}:${item.name}`;
          const avatarBg = avatarColorFromString(seed);
          const chatId = chatByPhone.get(item.phone);

          return (
            <Card style={styles.customerCard} onPress={() => handleCustomerPress(item._id)}>
              <Card.Content>
                <View style={styles.customerRow}>
                  <Avatar.Text
                    size={48}
                    label={initialsFromName(item.name)}
                    style={{ backgroundColor: avatarBg }}
                  />
                  <View style={styles.customerInfo}>
                    <Text style={styles.customerName}>{item.name}</Text>
                    <Text style={styles.customerPhone} dir="ltr">
                      {item.phone}
                    </Text>
                    {item.tags && item.tags.length > 0 && (
                      <View style={styles.tagsContainer}>
                        {item.tags.slice(0, 3).map((tag: string) => (
                          <View key={tag} style={styles.tag}>
                            <Text style={styles.tagText}>{tag}</Text>
                          </View>
                        ))}
                      </View>
                    )}
                  </View>
                  {chatId && (
                    <Button
                      mode="contained"
                      onPress={() => handleChatPress(chatId)}
                      style={styles.chatButton}
                      buttonColor="#1D4F34"
                    >
                      محادثة
                    </Button>
                  )}
                </View>
              </Card.Content>
            </Card>
          );
        }}
        ListEmptyComponent={
          <View style={styles.emptyContainer}>
            <Text style={styles.emptyText}>لا توجد عملاء</Text>
          </View>
        }
        contentContainerStyle={styles.listContent}
      />

      <FAB
        icon="plus"
        style={styles.fab}
        onPress={() => setIsAddModalVisible(true)}
        label="إضافة عميل"
      />

      <AddCustomerModal
        visible={isAddModalVisible}
        onDismiss={() => setIsAddModalVisible(false)}
      />
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#f5f5f5',
  },
  searchbar: {
    margin: 16,
    marginBottom: 8,
  },
  listContent: {
    padding: 16,
  },
  customerCard: {
    marginBottom: 12,
  },
  customerRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
  },
  customerInfo: {
    flex: 1,
  },
  customerName: {
    fontSize: 16,
    fontWeight: '600',
    marginBottom: 4,
  },
  customerPhone: {
    fontSize: 14,
    color: '#666',
    marginBottom: 4,
  },
  tagsContainer: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 4,
    marginTop: 4,
  },
  tag: {
    backgroundColor: '#e0e0e0',
    paddingHorizontal: 8,
    paddingVertical: 2,
    borderRadius: 12,
  },
  tagText: {
    fontSize: 12,
    color: '#666',
  },
  chatButton: {
    marginLeft: 'auto',
  },
  fab: {
    position: 'absolute',
    margin: 16,
    right: 0,
    bottom: 0,
    backgroundColor: '#1D4F34',
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
