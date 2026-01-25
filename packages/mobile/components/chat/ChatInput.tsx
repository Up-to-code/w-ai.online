import { useState } from 'react';
import { View, StyleSheet, Keyboard } from 'react-native';
import { TextInput, Button, IconButton } from 'react-native-paper';
import { useUserMutation } from '../../hooks/useUserMutation';
import { api } from '../../../../convex/_generated/api';

interface ChatInputProps {
  chatId: string;
}

export function ChatInput({ chatId }: ChatInputProps) {
  const sendMessage = useUserMutation(api.chat.sendMessage);
  const [inputValue, setInputValue] = useState('');
  const [isSending, setIsSending] = useState(false);

  const handleSend = async () => {
    if (!inputValue.trim() || isSending) return;

    setIsSending(true);
    try {
      await sendMessage({
        chatId: chatId as any,
        content: inputValue.trim(),
        type: 'text',
      });
      setInputValue('');
      Keyboard.dismiss();
    } catch (error) {
      console.error('Failed to send message:', error);
    } finally {
      setIsSending(false);
    }
  };

  return (
    <View style={styles.container}>
      <View style={styles.inputContainer}>
        <TextInput
          mode="outlined"
          placeholder="اكتب رسالة..."
          value={inputValue}
          onChangeText={setInputValue}
          multiline
          maxLength={4096}
          style={styles.input}
          contentStyle={styles.inputContent}
          onSubmitEditing={handleSend}
        />
        <IconButton
          icon="send"
          iconColor="#fff"
          size={24}
          onPress={handleSend}
          disabled={!inputValue.trim() || isSending}
          style={styles.sendButton}
          containerColor="#1D4F34"
        />
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    backgroundColor: '#fff',
    borderTopWidth: 1,
    borderTopColor: '#e0e0e0',
    padding: 8,
  },
  inputContainer: {
    flexDirection: 'row',
    alignItems: 'flex-end',
    gap: 8,
  },
  input: {
    flex: 1,
    maxHeight: 100,
  },
  inputContent: {
    minHeight: 40,
  },
  sendButton: {
    margin: 0,
  },
});
