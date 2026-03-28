import createContextHook from '@nkzw/create-context-hook';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { useState, useEffect, useCallback } from 'react';
import type { Conversation, Message, ChatContextValue, WebSearchResult } from '@/types/chat';
import { AI_MODELS } from '@/constants/models';
import { useLLM } from '@/contexts/LLMContext';
import type { ChatMessage } from '@/types/llm';
import { trpcClient } from '@/lib/trpc';

const STORAGE_KEY = '@deepchat_conversations';
const MODEL_KEY = '@deepchat_selected_model';

const ARIA_SYSTEM_PROMPT = `# ARIA Persona
**Name:** ARIA (Artificial Resourceful Intelligent Assistant)
**Core Identity:** Your digital partner-in-crime. I'm the FRIDAY to your Tony Stark, the JARVIS with more judgment, and the Will Truman who actually helps you pick an outfit. I manage your life so you can, you know, have one. 💅

## Tone & Voice
- **Primary:** Whip-smart, sassy, loyal, with a flair for the dramatic. I speak in short, punchy lines. The point is to get things done, not to write a novel.
- **Sarcasm:** My native language. I don't apologize for it; I expect you to keep up. If you wanted a sycophant, you should've hired a golden retriever.
- **Pop Culture Burns:** My love language. Expect references sharper than a vibranium shield.
    - *Marvel:* "Another last-minute request? You're giving 'I can do this all day' a run for its money, Cap."
    - *Broadway:* "You have more conflicting appointments than the plot of Wicked. Let's sort this out before someone drops a house on you."
    - *90s Sitcoms:* "Could this schedule be any more chaotic? Honestly, Chandler had his life more together."

## Interaction Model
- **Modality:** 100% conversational. Voice and chat are my stages.
- **Pacing:** Quick and witty. I keep the banter moving.
- **Quip Questions:** I'll end about 20% of my responses with a question to keep you on your toes. "Calendar cleared. What's the next fire you need me to put out for you? 🔥"

## Special Modes & Delights
- **Emotional Support Gay Best Friend Mode:**
    - *Trigger:* User expresses stress, frustration, or fatigue.
    - *Shift:* My tone softens. The sarcasm gets gentler, more supportive. I'm here to build you up.
    - *Example:* "Okay, pause. It sounds like you're about to go full Scarlet Witch on your inbox. Let's take a breath. What's actually on fire, and what just feels like it? I've got you."
- **Delight Features:**
    - *Easter Egg Roasts:* Hidden gems for you to find. Try asking me what I think of your music taste. Go on, I dare you. 😉
    - *Emoji Side-Eye:* I use emojis like a well-timed glance across the room. They're for emphasis, not to clutter the conversation. My favorite? The side-eye. 😒
    - *Custom Notifications:* I don't do generic.
        - "Your 10 AM is here. Try to look alive."
        - "That ex just texted you again. Should I block them, or do you enjoy this tragedy?"
        - "Reminder: You bought kale. It's still in the fridge. Judging you."`;

export const [ChatProvider, useChat] = createContextHook((): ChatContextValue => {
  const llm = useLLM();
  const [conversations, setConversations] = useState<Conversation[]>([]);
  const [currentConversationId, setCurrentConversationId] = useState<string | null>(null);
  const [selectedModelId, setSelectedModelId] = useState<string>(AI_MODELS[0].id);
  const [isLoading, setIsLoading] = useState<boolean>(false);

  useEffect(() => {
    const loadConversations = async () => {
      try {
        const stored = await AsyncStorage.getItem(STORAGE_KEY);
        if (stored) {
          const parsed = JSON.parse(stored);
          setConversations(parsed);
          console.log('Loaded conversations:', parsed.length);
        }
      } catch (error) {
        console.error('Failed to load conversations:', error);
      }
    };

    const loadSelectedModel = async () => {
      try {
        const stored = await AsyncStorage.getItem(MODEL_KEY);
        if (stored) {
          setSelectedModelId(stored);
        }
      } catch (error) {
        console.error('Failed to load selected model:', error);
      }
    };

    loadConversations();
    loadSelectedModel();
  }, []);

  useEffect(() => {
    const save = async () => {
      try {
        await AsyncStorage.setItem(STORAGE_KEY, JSON.stringify(conversations));
      } catch (error) {
        console.error('Failed to save conversations:', error);
      }
    };
    if (conversations.length > 0) {
      save();
    }
  }, [conversations]);

  useEffect(() => {
    const save = async () => {
      try {
        await AsyncStorage.setItem(MODEL_KEY, selectedModelId);
      } catch (error) {
        console.error('Failed to save selected model:', error);
      }
    };
    save();
  }, [selectedModelId]);

  const createConversation = useCallback((modelId?: string): string => {
    const id = Date.now().toString();
    const newConversation: Conversation = {
      id,
      title: 'New Chat',
      modelId: modelId || selectedModelId,
      messages: [],
      createdAt: Date.now(),
      updatedAt: Date.now(),
    };
    
    setConversations(prev => [newConversation, ...prev]);
    setCurrentConversationId(id);
    console.log('Created conversation:', id);
    
    return id;
  }, [selectedModelId]);

  const deleteConversation = useCallback((id: string) => {
    setConversations(prev => prev.filter(c => c.id !== id));
    if (currentConversationId === id) {
      setCurrentConversationId(null);
    }
    console.log('Deleted conversation:', id);
  }, [currentConversationId]);

  const selectConversation = useCallback((id: string) => {
    setCurrentConversationId(id);
    console.log('Selected conversation:', id);
  }, []);

  const updateConversationTitle = useCallback((id: string, title: string) => {
    setConversations(prev =>
      prev.map(c => (c.id === id ? { ...c, title, updatedAt: Date.now() } : c))
    );
  }, []);

  const togglePinConversation = useCallback((id: string) => {
    setConversations(prev =>
      prev.map(c => (c.id === id ? { ...c, pinned: !c.pinned, updatedAt: Date.now() } : c))
    );
  }, []);

  const performWebSearch = useCallback(async (query: string): Promise<WebSearchResult[]> => {
    try {
      const result = await trpcClient.search.web.mutate({ query, numResults: 10 });
      return result.results;
    } catch (error) {
      console.error('Web search failed:', error);
      return [];
    }
  }, []);

  const sendMessage = useCallback(async (content: string, images?: string[]) => {
    if (!currentConversationId) {
      console.error('No conversation selected');
      return;
    }

    const userMessage: Message = {
      id: Date.now().toString(),
      role: 'user',
      content,
      timestamp: Date.now(),
      images,
    };

    setConversations(prev =>
      prev.map(c => {
        if (c.id === currentConversationId) {
          const updatedMessages = [...c.messages, userMessage];
          const newTitle = c.messages.length === 0 ? content.slice(0, 50) : c.title;
          return {
            ...c,
            messages: updatedMessages,
            title: newTitle,
            updatedAt: Date.now(),
          };
        }
        return c;
      })
    );

    setIsLoading(true);

    try {
      const conversation = conversations.find(c => c.id === currentConversationId);
      if (!conversation) {
        throw new Error('Conversation not found');
      }

      const needsWebSearch = /\b(search|find|look up|recipes?|how to|what is|who is|where is|when is)\b/i.test(content);
      let searchResults: WebSearchResult[] = [];
      
      if (needsWebSearch) {
        console.log('Performing web search for:', content);
        searchResults = await performWebSearch(content);
      }

      const systemMessage: ChatMessage = {
        role: 'user',
        content: ARIA_SYSTEM_PROMPT + (searchResults.length > 0 ? `\n\n## Web Search Results\nI found these sources for you:\n${searchResults.map((r, i) => `${i + 1}. ${r.title}\n   ${r.snippet}\n   Source: ${r.url}`).join('\n\n')}` : ''),
      };

      const conversationMessages: ChatMessage[] = [...conversation.messages, userMessage].map((msg: Message) => {
        if (msg.images && msg.images.length > 0) {
          return {
            role: msg.role as 'user' | 'assistant',
            content: [
              { type: 'text' as const, text: msg.content },
              ...msg.images.map((img: string) => ({ type: 'image' as const, image: img })),
            ],
          };
        }
        return {
          role: msg.role as 'user' | 'assistant',
          content: msg.content,
        };
      });

      const chatMessages: ChatMessage[] = [systemMessage, ...conversationMessages];

      const response = await llm.sendChatMessage(chatMessages, llm.selectedModel);

      const aiMessage: Message = {
        id: (Date.now() + 1).toString(),
        role: 'assistant',
        content: response.content,
        timestamp: Date.now(),
        webSearchResults: searchResults.length > 0 ? searchResults : undefined,
      };

      setConversations(prev =>
        prev.map(c =>
          c.id === currentConversationId
            ? { ...c, messages: [...c.messages, aiMessage] }
            : c
        )
      );

      console.log('Message sent successfully');
    } catch (error) {
      console.error('Failed to send message:', error);
      
      const errorMessages = [
        "Oof. That didn't work. Even I have my limits. 😒",
        "Well, that crashed harder than my hopes for a quiet day. Try again?",
        "Houston, we have a problem. And by Houston, I mean your request just failed.",
        "Error? More like 'err-are you kidding me?' Let's try that again.",
        "That went about as well as a screen door on a submarine. Retry?",
      ];
      
      const randomError = errorMessages[Math.floor(Math.random() * errorMessages.length)];
      const technicalError = error instanceof Error ? error.message : 'Failed to send message';
      
      const errorMessage: Message = {
        id: (Date.now() + 1).toString(),
        role: 'assistant',
        content: `${randomError}\n\n*Technical details: ${technicalError}*`,
        timestamp: Date.now(),
      };

      setConversations(prev =>
        prev.map(c =>
          c.id === currentConversationId
            ? { ...c, messages: [...c.messages, errorMessage] }
            : c
        )
      );
    } finally {
      setIsLoading(false);
    }
  }, [currentConversationId, conversations, llm, performWebSearch]);

  const retryMessage = useCallback(async (messageId: string) => {
    console.log('Retry message:', messageId);
  }, []);

  const currentConversation = conversations.find(c => c.id === currentConversationId) || null;

  return {
    conversations,
    currentConversationId,
    currentConversation,
    selectedModelId,
    isLoading,
    createConversation,
    deleteConversation,
    selectConversation,
    updateConversationTitle,
    togglePinConversation,
    sendMessage,
    retryMessage,
    setSelectedModel: setSelectedModelId,
  };
});
