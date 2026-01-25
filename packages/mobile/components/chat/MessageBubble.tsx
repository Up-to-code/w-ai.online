import { View, Text, StyleSheet, Image, Linking } from 'react-native';
import { Card } from 'react-native-paper';

interface MessageBubbleProps {
  message: {
    _id: string;
    direction: 'inbound' | 'outbound';
    type: 'text' | 'image' | 'video' | 'audio' | 'document' | 'template';
    content?: string;
    mediaUrl?: string;
    timestamp: number;
    status?: 'sent' | 'delivered' | 'read' | 'failed';
  };
}

export function MessageBubble({ message }: MessageBubbleProps) {
  const isOutbound = message.direction === 'outbound';
  const caption = message.type === 'text' ? message.content || '' : message.content || '';

  const formatTime = (timestamp: number) => {
    return new Date(timestamp).toLocaleTimeString('ar-EG', {
      hour: '2-digit',
      minute: '2-digit',
      hour12: false,
    });
  };

  const getStatusIcon = () => {
    if (!isOutbound) return null;
    if (message.status === 'read' || message.status === 'delivered') {
      return '✓✓';
    }
    return '✓';
  };

  return (
    <View style={[styles.container, isOutbound ? styles.outbound : styles.inbound]}>
      <Card
        style={[
          styles.bubble,
          isOutbound ? styles.outboundBubble : styles.inboundBubble,
        ]}
      >
        <Card.Content style={styles.content}>
          {message.type === 'image' && message.mediaUrl && (
            <Image
              source={{ uri: message.mediaUrl }}
              style={styles.image}
              resizeMode="cover"
            />
          )}

          {message.type === 'document' && (
            <View style={styles.documentContainer}>
              <Text style={styles.documentText}>📄 مستند</Text>
              {message.mediaUrl && (
                <Text
                  style={styles.documentLink}
                  onPress={() => Linking.openURL(message.mediaUrl!)}
                >
                  فتح المستند
                </Text>
              )}
            </View>
          )}

          {message.type === 'template' && (
            <Text style={styles.templateText}>📋 قالب: {message.content || 'Template'}</Text>
          )}

          {caption && (
            <Text style={styles.text}>{caption}</Text>
          )}

          <View style={styles.footer}>
            <Text style={styles.time}>{formatTime(message.timestamp)}</Text>
            {isOutbound && (
              <Text style={styles.status}>{getStatusIcon()}</Text>
            )}
          </View>
        </Card.Content>
      </Card>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    marginVertical: 2,
    paddingHorizontal: 8,
  },
  outbound: {
    alignItems: 'flex-end',
  },
  inbound: {
    alignItems: 'flex-start',
  },
  bubble: {
    maxWidth: '75%',
    borderRadius: 8,
  },
  outboundBubble: {
    backgroundColor: '#d9fdd3',
  },
  inboundBubble: {
    backgroundColor: '#fff',
  },
  content: {
    padding: 8,
  },
  image: {
    width: '100%',
    minHeight: 100,
    maxHeight: 300,
    borderRadius: 4,
    marginBottom: 4,
  },
  documentContainer: {
    padding: 8,
  },
  documentText: {
    fontSize: 14,
    marginBottom: 4,
  },
  documentLink: {
    fontSize: 14,
    color: '#027eb5',
    textDecorationLine: 'underline',
  },
  templateText: {
    fontSize: 12,
    fontStyle: 'italic',
    opacity: 0.7,
    marginBottom: 4,
  },
  text: {
    fontSize: 14.5,
    lineHeight: 20,
  },
  footer: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'flex-end',
    marginTop: 4,
    gap: 4,
  },
  time: {
    fontSize: 11,
    color: '#667781',
  },
  status: {
    fontSize: 12,
    color: '#667781',
  },
});
