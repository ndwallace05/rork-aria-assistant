import React, { useState, useRef, useEffect } from 'react';
import {
  View,
  Text,
  StyleSheet,
  FlatList,
  TextInput,
  TouchableOpacity,
  KeyboardAvoidingView,
  Platform,
  ActivityIndicator,
  Image,
  Linking,
} from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { useRouter } from 'expo-router';
import { ArrowLeft, Send, Mic, Camera, Image as ImageIcon, X, MicOff, Search, ChevronDown, ChevronUp, ExternalLink } from 'lucide-react-native';
import Colors from '@/constants/colors';
import { useChat } from '@/contexts/ChatContext';
import { useLLM } from '@/contexts/LLMContext';
import { LLM_PROVIDERS } from '@/constants/llmProviders';
import type { Message, WebSearchResult } from '@/types/chat';
import { useVoiceInput } from '@/hooks/useVoiceInput';
import { useImagePicker } from '@/hooks/useImagePicker';
import { useWebSearch } from '@/hooks/useWebSearch';

export default function ChatScreen() {
  const router = useRouter();
  const insets = useSafeAreaInsets();
  const { currentConversation, sendMessage, isLoading } = useChat();
  const llm = useLLM();
  const activeProviderConfig = LLM_PROVIDERS.find(p => p.id === llm.activeProvider);
  const [inputText, setInputText] = useState('');
  const [selectedImages, setSelectedImages] = useState<string[]>([]);
  const [expandedSearchResults, setExpandedSearchResults] = useState<Record<string, boolean>>({});
  const flatListRef = useRef<FlatList>(null);
  
  const { isRecording, isTranscribing, startRecording, stopRecording } = useVoiceInput();
  const { pickImage, takePhoto } = useImagePicker();
  const { search } = useWebSearch();

  useEffect(() => {
    if (currentConversation && currentConversation.messages.length > 0) {
      setTimeout(() => {
        flatListRef.current?.scrollToEnd({ animated: true });
      }, 100);
    }
  }, [currentConversation]);

  if (!currentConversation) {
    return (
      <View style={[styles.container, { paddingTop: insets.top }]}>
        <View style={styles.errorContainer}>
          <Text style={styles.errorText}>Uh, we need to pick a conversation first 😒</Text>
          <Text style={styles.errorSubtext}>Can&apos;t help if you don&apos;t tell me what we&apos;re doing.</Text>
          <TouchableOpacity
            style={styles.backButton}
            onPress={() => router.back()}
          >
            <Text style={styles.backButtonText}>Go Back</Text>
          </TouchableOpacity>
        </View>
      </View>
    );
  }

  const handleSend = async () => {
    if ((!inputText.trim() && selectedImages.length === 0) || isLoading) return;

    const message = inputText.trim() || 'Analyze this image';
    const images = [...selectedImages];
    
    setInputText('');
    setSelectedImages([]);
    
    await sendMessage(message, images);
  };

  const handleVoiceInput = async () => {
    if (isRecording) {
      const transcription = await stopRecording();
      if (transcription) {
        setInputText(prev => prev ? `${prev} ${transcription}` : transcription);
      }
    } else {
      await startRecording();
    }
  };

  const handlePickImage = async () => {
    const image = await pickImage();
    if (image) {
      setSelectedImages(prev => [...prev, image]);
    }
  };

  const handleTakePhoto = async () => {
    const photo = await takePhoto();
    if (photo) {
      setSelectedImages(prev => [...prev, photo]);
    }
  };

  const removeImage = (index: number) => {
    setSelectedImages(prev => prev.filter((_, i) => i !== index));
  };

  const handleWebSearch = async () => {
    if (!inputText.trim()) return;
    await search({ query: inputText.trim(), engine: 'google' });
  };

  const toggleSearchResults = (messageId: string) => {
    setExpandedSearchResults(prev => ({
      ...prev,
      [messageId]: !prev[messageId],
    }));
  };

  const openUrl = async (url: string) => {
    try {
      const canOpen = await Linking.canOpenURL(url);
      if (canOpen) {
        await Linking.openURL(url);
      }
    } catch (error) {
      console.error('Failed to open URL:', error);
    }
  };

  const renderSearchResults = (results: WebSearchResult[], messageId: string) => {
    const isExpanded = expandedSearchResults[messageId];

    return (
      <View style={styles.searchResultsContainer}>
        <TouchableOpacity
          style={styles.searchResultsHeader}
          onPress={() => toggleSearchResults(messageId)}
        >
          <View style={styles.searchResultsHeaderContent}>
            <Search size={16} color={Colors.primary} />
            <Text style={styles.searchResultsHeaderText}>
              {results.length} source{results.length !== 1 ? 's' : ''} found
            </Text>
          </View>
          {isExpanded ? (
            <ChevronUp size={16} color={Colors.textSecondary} />
          ) : (
            <ChevronDown size={16} color={Colors.textSecondary} />
          )}
        </TouchableOpacity>

        {isExpanded && (
          <View style={styles.searchResultsList}>
            {results.map((result, idx) => (
              <TouchableOpacity
                key={idx}
                style={styles.searchResultItem}
                onPress={() => openUrl(result.url)}
              >
                <View style={styles.searchResultContent}>
                  <Text style={styles.searchResultTitle} numberOfLines={2}>
                    {result.title}
                  </Text>
                  <Text style={styles.searchResultSnippet} numberOfLines={2}>
                    {result.snippet}
                  </Text>
                  <View style={styles.searchResultUrlContainer}>
                    <Text style={styles.searchResultUrl} numberOfLines={1}>
                      {result.url}
                    </Text>
                    <ExternalLink size={12} color={Colors.primary} />
                  </View>
                </View>
              </TouchableOpacity>
            ))}
          </View>
        )}
      </View>
    );
  };

  const renderMessage = ({ item }: { item: Message }) => {
    const isUser = item.role === 'user';

    return (
      <View
        style={[
          styles.messageContainer,
          isUser ? styles.userMessageContainer : styles.aiMessageContainer,
        ]}
      >
        <View
          style={[
            styles.messageBubble,
            isUser ? styles.userBubble : styles.aiBubble,
          ]}
        >
          {item.images && item.images.length > 0 && (
            <View style={styles.messageImages}>
              {item.images.map((img, idx) => (
                <Image
                  key={idx}
                  source={{ uri: img }}
                  style={styles.messageImage}
                  resizeMode="cover"
                />
              ))}
            </View>
          )}
          <Text
            style={[
              styles.messageText,
              isUser ? styles.userMessageText : styles.aiMessageText,
            ]}
          >
            {item.content}
          </Text>
          {item.webSearchResults && item.webSearchResults.length > 0 && (
            renderSearchResults(item.webSearchResults, item.id)
          )}
        </View>
      </View>
    );
  };

  const renderEmpty = () => {
    const greetings = [
      { title: "Well, hello there 💅", desc: "I'm ARIA. Your digital partner-in-crime. What chaos are we managing today?" },
      { title: "Look who finally showed up", desc: "I'm ARIA. Ready to help you adult. Or at least pretend to. What's first?" },
      { title: "ARIA at your service ✨", desc: "Think of me as your JARVIS, but with better taste. What do you need?" },
      { title: "Hey there, superstar", desc: "I'm ARIA. Here to manage your life so you can actually have one. Let's do this." },
    ];
    
    const greeting = greetings[Math.floor(Math.random() * greetings.length)];
    
    return (
      <View style={styles.emptyContainer}>
        <Text style={styles.emptyTitle}>{greeting.title}</Text>
        <Text style={styles.emptyDescription}>
          {greeting.desc}
        </Text>
      </View>
    );
  };

  return (
    <View style={[styles.container, { paddingTop: insets.top }]}>
      <View style={styles.header}>
        <TouchableOpacity
          style={styles.headerButton}
          onPress={() => router.back()}
        >
          <ArrowLeft size={24} color={Colors.text} />
        </TouchableOpacity>
        <View style={styles.headerInfo}>
          <Text style={styles.headerTitle} numberOfLines={1}>
            {currentConversation.title}
          </Text>
          <Text style={styles.headerSubtitle}>
            {activeProviderConfig?.icon} {activeProviderConfig?.name} · {llm.selectedModel}
          </Text>
        </View>
      </View>

      <KeyboardAvoidingView
        style={styles.content}
        behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
        keyboardVerticalOffset={insets.top + 60}
      >
        <FlatList
          ref={flatListRef}
          data={currentConversation.messages}
          renderItem={renderMessage}
          keyExtractor={(item) => item.id}
          contentContainerStyle={styles.messagesList}
          ListEmptyComponent={renderEmpty}
          showsVerticalScrollIndicator={false}
          onContentSizeChange={() =>
            flatListRef.current?.scrollToEnd({ animated: true })
          }
        />

        <View style={[styles.inputContainer, { paddingBottom: Math.max(insets.bottom, 12) }]}>
          {selectedImages.length > 0 && (
            <View style={styles.selectedImagesContainer}>
              {selectedImages.map((img, idx) => (
                <View key={idx} style={styles.selectedImageWrapper}>
                  <Image source={{ uri: img }} style={styles.selectedImage} />
                  <TouchableOpacity
                    style={styles.removeImageButton}
                    onPress={() => removeImage(idx)}
                  >
                    <X size={16} color="#FFFFFF" />
                  </TouchableOpacity>
                </View>
              ))}
            </View>
          )}

          <View style={styles.inputRow}>
            <View style={styles.inputActions}>
              <TouchableOpacity
                style={styles.inputActionButton}
                onPress={handleWebSearch}
                disabled={isLoading || !inputText.trim()}
              >
                <Search size={22} color={inputText.trim() ? Colors.primary : Colors.textSecondary} />
              </TouchableOpacity>
              <TouchableOpacity
                style={styles.inputActionButton}
                onPress={handleTakePhoto}
                disabled={isLoading}
              >
                <Camera size={22} color={Colors.textSecondary} />
              </TouchableOpacity>
              <TouchableOpacity
                style={styles.inputActionButton}
                onPress={handlePickImage}
                disabled={isLoading}
              >
                <ImageIcon size={22} color={Colors.textSecondary} />
              </TouchableOpacity>
            </View>

            <View style={styles.inputWrapper}>
              <TextInput
                style={styles.input}
                placeholder="What's the tea? ☕"
                placeholderTextColor={Colors.textTertiary}
                value={inputText}
                onChangeText={setInputText}
                multiline
                maxLength={4000}
                editable={!isLoading && !isRecording}
                onSubmitEditing={handleSend}
                blurOnSubmit={false}
              />
              <TouchableOpacity
                style={[
                  styles.inputActionButton,
                  isRecording && styles.recordingButton,
                ]}
                onPress={handleVoiceInput}
                disabled={isLoading || isTranscribing}
              >
                {isTranscribing ? (
                  <ActivityIndicator size="small" color={Colors.textSecondary} />
                ) : isRecording ? (
                  <MicOff size={22} color={Colors.error} />
                ) : (
                  <Mic size={22} color={Colors.textSecondary} />
                )}
              </TouchableOpacity>
            </View>

            <TouchableOpacity
              style={[
                styles.sendButton,
                ((!inputText.trim() && selectedImages.length === 0) || isLoading) &&
                  styles.sendButtonDisabled,
              ]}
              onPress={handleSend}
              disabled={(!inputText.trim() && selectedImages.length === 0) || isLoading}
            >
              {isLoading ? (
                <ActivityIndicator size="small" color="#FFFFFF" />
              ) : (
                <Send size={20} color="#FFFFFF" />
              )}
            </TouchableOpacity>
          </View>
        </View>
      </KeyboardAvoidingView>
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
    alignItems: 'center',
    paddingHorizontal: 16,
    paddingVertical: 12,
    borderBottomWidth: 1,
    borderBottomColor: Colors.border,
    backgroundColor: Colors.surface,
  },
  headerButton: {
    padding: 8,
    marginRight: 8,
  },
  headerInfo: {
    flex: 1,
  },
  headerTitle: {
    fontSize: 18,
    fontWeight: '600' as const,
    color: Colors.text,
  },
  headerSubtitle: {
    fontSize: 13,
    color: Colors.textSecondary,
    marginTop: 2,
  },
  content: {
    flex: 1,
  },
  messagesList: {
    paddingHorizontal: 16,
    paddingVertical: 20,
    flexGrow: 1,
  },
  messageContainer: {
    marginBottom: 16,
    maxWidth: '80%',
  },
  userMessageContainer: {
    alignSelf: 'flex-end',
  },
  aiMessageContainer: {
    alignSelf: 'flex-start',
  },
  messageBubble: {
    paddingHorizontal: 16,
    paddingVertical: 12,
    borderRadius: 20,
  },
  userBubble: {
    backgroundColor: Colors.userMessage,
    borderBottomRightRadius: 4,
  },
  aiBubble: {
    backgroundColor: Colors.aiMessage,
    borderBottomLeftRadius: 4,
  },
  messageText: {
    fontSize: 16,
    lineHeight: 22,
  },
  userMessageText: {
    color: '#FFFFFF',
  },
  aiMessageText: {
    color: Colors.text,
  },
  emptyContainer: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: 60,
  },
  emptyTitle: {
    fontSize: 24,
    fontWeight: '600' as const,
    color: Colors.text,
    marginBottom: 8,
  },
  emptyDescription: {
    fontSize: 16,
    color: Colors.textSecondary,
    textAlign: 'center',
  },
  inputContainer: {
    paddingHorizontal: 16,
    paddingVertical: 12,
    backgroundColor: Colors.surface,
    borderTopWidth: 1,
    borderTopColor: Colors.border,
  },
  inputRow: {
    flexDirection: 'row',
    alignItems: 'flex-end',
    gap: 8,
  },
  selectedImagesContainer: {
    flexDirection: 'row',
    gap: 8,
    marginBottom: 12,
    flexWrap: 'wrap',
  },
  selectedImageWrapper: {
    position: 'relative',
  },
  selectedImage: {
    width: 80,
    height: 80,
    borderRadius: 8,
  },
  removeImageButton: {
    position: 'absolute',
    top: -8,
    right: -8,
    width: 24,
    height: 24,
    borderRadius: 12,
    backgroundColor: Colors.error,
    alignItems: 'center',
    justifyContent: 'center',
  },
  messageImages: {
    flexDirection: 'row',
    gap: 8,
    marginBottom: 8,
    flexWrap: 'wrap',
  },
  messageImage: {
    width: 150,
    height: 150,
    borderRadius: 8,
  },
  recordingButton: {
    backgroundColor: Colors.backgroundTertiary,
  },
  inputActions: {
    flexDirection: 'row',
    gap: 4,
  },
  inputWrapper: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'flex-end',
    backgroundColor: Colors.backgroundSecondary,
    borderRadius: 24,
    paddingHorizontal: 16,
    paddingVertical: 8,
    gap: 8,
  },
  input: {
    flex: 1,
    fontSize: 16,
    color: Colors.text,
    maxHeight: 100,
    paddingVertical: 8,
  },
  inputActionButton: {
    padding: 8,
  },
  sendButton: {
    width: 44,
    height: 44,
    borderRadius: 22,
    backgroundColor: Colors.primary,
    alignItems: 'center',
    justifyContent: 'center',
    shadowColor: Colors.shadow,
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.3,
    shadowRadius: 4,
    elevation: 3,
  },
  sendButtonDisabled: {
    backgroundColor: Colors.textTertiary,
    opacity: 0.5,
  },
  errorContainer: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
    padding: 20,
  },
  errorText: {
    fontSize: 20,
    fontWeight: '600' as const,
    color: Colors.text,
    marginBottom: 8,
    textAlign: 'center',
  },
  errorSubtext: {
    fontSize: 16,
    color: Colors.textSecondary,
    marginBottom: 20,
    textAlign: 'center',
  },
  backButton: {
    paddingHorizontal: 24,
    paddingVertical: 12,
    backgroundColor: Colors.primary,
    borderRadius: 24,
  },
  backButtonText: {
    fontSize: 16,
    fontWeight: '600' as const,
    color: '#FFFFFF',
  },
  searchResultsContainer: {
    marginTop: 12,
    borderTopWidth: 1,
    borderTopColor: Colors.border,
    paddingTop: 8,
  },
  searchResultsHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingVertical: 8,
  },
  searchResultsHeaderContent: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
  },
  searchResultsHeaderText: {
    fontSize: 14,
    fontWeight: '600' as const,
    color: Colors.primary,
  },
  searchResultsList: {
    gap: 8,
    marginTop: 8,
  },
  searchResultItem: {
    backgroundColor: Colors.backgroundSecondary,
    borderRadius: 8,
    padding: 12,
    borderWidth: 1,
    borderColor: Colors.border,
  },
  searchResultContent: {
    gap: 4,
  },
  searchResultTitle: {
    fontSize: 14,
    fontWeight: '600' as const,
    color: Colors.text,
    lineHeight: 18,
  },
  searchResultSnippet: {
    fontSize: 13,
    color: Colors.textSecondary,
    lineHeight: 17,
  },
  searchResultUrlContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
    marginTop: 4,
  },
  searchResultUrl: {
    fontSize: 12,
    color: Colors.primary,
    flex: 1,
  },
});
