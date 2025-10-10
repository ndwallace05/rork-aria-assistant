import React, { useState } from 'react';
import {
  View,
  Text,
  StyleSheet,
  FlatList,
  TouchableOpacity,
  TextInput,
} from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { useRouter } from 'expo-router';
import { Plus, Search, MessageSquare, Pin, Trash2 } from 'lucide-react-native';
import Colors from '@/constants/colors';
import { useChat } from '@/contexts/ChatContext';
import type { Conversation } from '@/types/chat';
import { AI_MODELS } from '@/constants/models';

export default function ChatsScreen() {
  const router = useRouter();
  const insets = useSafeAreaInsets();
  const { conversations, createConversation, selectConversation, deleteConversation, togglePinConversation } = useChat();
  const [searchQuery, setSearchQuery] = useState('');

  const filteredConversations = conversations.filter((conv) =>
    conv.title.toLowerCase().includes(searchQuery.toLowerCase())
  );

  const sortedConversations = [...filteredConversations].sort((a, b) => {
    if (a.pinned && !b.pinned) return -1;
    if (!a.pinned && b.pinned) return 1;
    return b.updatedAt - a.updatedAt;
  });

  const handleNewChat = () => {
    const id = createConversation();
    selectConversation(id);
    router.push('/chat' as any);
  };

  const handleSelectChat = (conversation: Conversation) => {
    selectConversation(conversation.id);
    router.push('/chat' as any);
  };

  const getModelInfo = (modelId: string) => {
    return AI_MODELS.find((m) => m.id === modelId) || AI_MODELS[0];
  };

  const formatTime = (timestamp: number) => {
    const now = Date.now();
    const diff = now - timestamp;
    const minutes = Math.floor(diff / 60000);
    const hours = Math.floor(diff / 3600000);
    const days = Math.floor(diff / 86400000);

    if (minutes < 1) return 'Just now';
    if (minutes < 60) return `${minutes}m ago`;
    if (hours < 24) return `${hours}h ago`;
    if (days < 7) return `${days}d ago`;
    return new Date(timestamp).toLocaleDateString();
  };

  const renderConversation = ({ item }: { item: Conversation }) => {
    const model = getModelInfo(item.modelId);
    const lastMessage = item.messages[item.messages.length - 1];

    return (
      <TouchableOpacity
        style={styles.conversationCard}
        onPress={() => handleSelectChat(item)}
        activeOpacity={0.7}
      >
        <View style={styles.conversationHeader}>
          <View style={styles.conversationIcon}>
            <Text style={styles.conversationIconText}>{model.icon}</Text>
          </View>
          <View style={styles.conversationInfo}>
            <View style={styles.conversationTitleRow}>
              <Text style={styles.conversationTitle} numberOfLines={1}>
                {item.title}
              </Text>
              {item.pinned && (
                <Pin size={14} color={Colors.primary} fill={Colors.primary} />
              )}
            </View>
            <Text style={styles.conversationModel}>{model.name}</Text>
          </View>
          <Text style={styles.conversationTime}>{formatTime(item.updatedAt)}</Text>
        </View>

        {lastMessage && (
          <Text style={styles.conversationPreview} numberOfLines={2}>
            {lastMessage.content}
          </Text>
        )}

        <View style={styles.conversationActions}>
          <TouchableOpacity
            style={styles.actionButton}
            onPress={(e) => {
              e.stopPropagation();
              togglePinConversation(item.id);
            }}
          >
            <Pin
              size={16}
              color={item.pinned ? Colors.primary : Colors.textTertiary}
              fill={item.pinned ? Colors.primary : 'transparent'}
            />
          </TouchableOpacity>
          <TouchableOpacity
            style={styles.actionButton}
            onPress={(e) => {
              e.stopPropagation();
              deleteConversation(item.id);
            }}
          >
            <Trash2 size={16} color={Colors.error} />
          </TouchableOpacity>
        </View>
      </TouchableOpacity>
    );
  };

  const renderEmpty = () => (
    <View style={styles.emptyContainer}>
      <MessageSquare size={64} color={Colors.textTertiary} strokeWidth={1.5} />
      <Text style={styles.emptyTitle}>It&apos;s giving... empty 😒</Text>
      <Text style={styles.emptyDescription}>
        No chats yet? Bold choice. Let&apos;s fix that.
      </Text>
      <TouchableOpacity style={styles.emptyButton} onPress={handleNewChat}>
        <Plus size={20} color="#FFFFFF" />
        <Text style={styles.emptyButtonText}>New Chat</Text>
      </TouchableOpacity>
    </View>
  );

  return (
    <View style={[styles.container, { paddingTop: insets.top }]}>
      <View style={styles.header}>
        <Text style={styles.headerTitle}>Chats</Text>
        <TouchableOpacity style={styles.newChatButton} onPress={handleNewChat}>
          <Plus size={24} color="#FFFFFF" />
        </TouchableOpacity>
      </View>

      <View style={styles.searchContainer}>
        <Search size={20} color={Colors.textTertiary} />
        <TextInput
          style={styles.searchInput}
          placeholder="Search conversations..."
          placeholderTextColor={Colors.textTertiary}
          value={searchQuery}
          onChangeText={setSearchQuery}
        />
      </View>

      <FlatList
        data={sortedConversations}
        renderItem={renderConversation}
        keyExtractor={(item) => item.id}
        contentContainerStyle={styles.listContent}
        ListEmptyComponent={renderEmpty}
        showsVerticalScrollIndicator={false}
      />
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: Colors.background,
  },
  header: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingHorizontal: 20,
    paddingVertical: 16,
    borderBottomWidth: 1,
    borderBottomColor: Colors.border,
  },
  headerTitle: {
    fontSize: 32,
    fontWeight: '700' as const,
    color: Colors.text,
  },
  newChatButton: {
    width: 48,
    height: 48,
    borderRadius: 24,
    backgroundColor: Colors.primary,
    alignItems: 'center',
    justifyContent: 'center',
    shadowColor: Colors.shadow,
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.3,
    shadowRadius: 8,
    elevation: 4,
  },
  searchContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: Colors.backgroundSecondary,
    marginHorizontal: 20,
    marginVertical: 16,
    paddingHorizontal: 16,
    paddingVertical: 12,
    borderRadius: 12,
    gap: 12,
  },
  searchInput: {
    flex: 1,
    fontSize: 16,
    color: Colors.text,
  },
  listContent: {
    paddingHorizontal: 20,
    paddingBottom: 20,
  },
  conversationCard: {
    backgroundColor: Colors.surface,
    borderRadius: 16,
    padding: 16,
    marginBottom: 12,
    borderWidth: 1,
    borderColor: Colors.border,
    shadowColor: Colors.shadow,
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
    elevation: 2,
  },
  conversationHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 8,
  },
  conversationIcon: {
    width: 48,
    height: 48,
    borderRadius: 24,
    backgroundColor: Colors.backgroundSecondary,
    alignItems: 'center',
    justifyContent: 'center',
    marginRight: 12,
  },
  conversationIconText: {
    fontSize: 24,
  },
  conversationInfo: {
    flex: 1,
  },
  conversationTitleRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
  },
  conversationTitle: {
    fontSize: 16,
    fontWeight: '600' as const,
    color: Colors.text,
    flex: 1,
  },
  conversationModel: {
    fontSize: 13,
    color: Colors.textSecondary,
    marginTop: 2,
  },
  conversationTime: {
    fontSize: 12,
    color: Colors.textTertiary,
  },
  conversationPreview: {
    fontSize: 14,
    color: Colors.textSecondary,
    marginBottom: 12,
    lineHeight: 20,
  },
  conversationActions: {
    flexDirection: 'row',
    gap: 12,
  },
  actionButton: {
    padding: 8,
  },
  emptyContainer: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: 80,
  },
  emptyTitle: {
    fontSize: 24,
    fontWeight: '600' as const,
    color: Colors.text,
    marginTop: 24,
  },
  emptyDescription: {
    fontSize: 16,
    color: Colors.textSecondary,
    marginTop: 8,
    textAlign: 'center',
    paddingHorizontal: 40,
  },
  emptyButton: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
    backgroundColor: Colors.primary,
    paddingHorizontal: 24,
    paddingVertical: 14,
    borderRadius: 24,
    marginTop: 24,
    shadowColor: Colors.shadow,
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.3,
    shadowRadius: 8,
    elevation: 4,
  },
  emptyButtonText: {
    fontSize: 16,
    fontWeight: '600' as const,
    color: '#FFFFFF',
  },
});
