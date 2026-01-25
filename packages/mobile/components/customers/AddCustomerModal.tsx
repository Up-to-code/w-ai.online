import { useState } from 'react';
import { View, StyleSheet } from 'react-native';
import { Modal, Portal, TextInput, Button, Text } from 'react-native-paper';
import { useUserMutation } from '../../hooks/useUserMutation';
import { api } from '../../../convex/_generated/api';

interface AddCustomerModalProps {
  visible: boolean;
  onDismiss: () => void;
}

export function AddCustomerModal({ visible, onDismiss }: AddCustomerModalProps) {
  const createContact = useUserMutation(api.contacts.create);
  const [name, setName] = useState('');
  const [phone, setPhone] = useState('');
  const [email, setEmail] = useState('');
  const [tags, setTags] = useState('');
  const [isSubmitting, setIsSubmitting] = useState(false);

  const handleCreate = async () => {
    if (!name || !phone) return;

    setIsSubmitting(true);
    try {
      const tagArray = tags
        .split(',')
        .map((t) => t.trim())
        .filter(Boolean);

      await createContact({
        name,
        phone,
        email: email || undefined,
        tags: tagArray,
      });

      // Reset form
      setName('');
      setPhone('');
      setEmail('');
      setTags('');
      onDismiss();
    } catch (error) {
      console.error('Error creating contact:', error);
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <Portal>
      <Modal
        visible={visible}
        onDismiss={onDismiss}
        contentContainerStyle={styles.modalContent}
      >
        <Text style={styles.title}>إضافة عميل جديد</Text>

        <TextInput
          label="الاسم"
          value={name}
          onChangeText={setName}
          mode="outlined"
          style={styles.input}
        />

        <TextInput
          label="رقم الهاتف"
          value={phone}
          onChangeText={setPhone}
          mode="outlined"
          keyboardType="phone-pad"
          style={styles.input}
        />

        <TextInput
          label="البريد الإلكتروني (اختياري)"
          value={email}
          onChangeText={setEmail}
          mode="outlined"
          keyboardType="email-address"
          style={styles.input}
        />

        <TextInput
          label="وسوم مفصولة بفواصل"
          value={tags}
          onChangeText={setTags}
          mode="outlined"
          placeholder="مثال: VIP, جديد"
          style={styles.input}
        />

        <View style={styles.buttonRow}>
          <Button onPress={onDismiss} mode="outlined" style={styles.button}>
            إلغاء
          </Button>
          <Button
            onPress={handleCreate}
            mode="contained"
            loading={isSubmitting}
            disabled={!name || !phone || isSubmitting}
            style={styles.button}
            buttonColor="#1D4F34"
          >
            حفظ
          </Button>
        </View>
      </Modal>
    </Portal>
  );
}

const styles = StyleSheet.create({
  modalContent: {
    backgroundColor: 'white',
    padding: 20,
    margin: 20,
    borderRadius: 8,
  },
  title: {
    fontSize: 20,
    fontWeight: 'bold',
    marginBottom: 20,
    textAlign: 'center',
  },
  input: {
    marginBottom: 12,
  },
  buttonRow: {
    flexDirection: 'row',
    justifyContent: 'flex-end',
    marginTop: 20,
    gap: 12,
  },
  button: {
    flex: 1,
  },
});
