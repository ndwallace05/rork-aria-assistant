import createContextHook from '@nkzw/create-context-hook';
import AsyncStorage from '@react-native-async-storage/async-storage';
import * as SecureStore from 'expo-secure-store';
import { useState, useEffect, useCallback } from 'react';
import { Platform } from 'react-native';
import type { LLMProvider, LLMSettings, ChatMessage, LLMResponse } from '@/types/llm';
import { LLM_PROVIDERS } from '@/constants/llmProviders';
import { generateText } from '@rork/toolkit-sdk';

const SETTINGS_KEY = '@deepchat_llm_settings';
const API_KEY_PREFIX = 'deepchat_api_key_';

const secureStorage = {
  async setItem(key: string, value: string): Promise<void> {
    if (Platform.OS === 'web') {
      localStorage.setItem(key, value);
    } else {
      await SecureStore.setItemAsync(key, value);
    }
  },
  
  async getItem(key: string): Promise<string | null> {
    if (Platform.OS === 'web') {
      return localStorage.getItem(key);
    } else {
      return await SecureStore.getItemAsync(key);
    }
  },
  
  async deleteItem(key: string): Promise<void> {
    if (Platform.OS === 'web') {
      localStorage.removeItem(key);
    } else {
      await SecureStore.deleteItemAsync(key);
    }
  },
};

export interface LLMContextValue {
  activeProvider: LLMProvider;
  selectedModel: string;
  apiKeys: Record<LLMProvider, string | null>;
  isLoading: boolean;
  
  setActiveProvider: (provider: LLMProvider) => void;
  setSelectedModel: (model: string) => void;
  setApiKey: (provider: LLMProvider, key: string) => Promise<void>;
  removeApiKey: (provider: LLMProvider) => Promise<void>;
  hasApiKey: (provider: LLMProvider) => boolean;
  
  sendChatMessage: (messages: ChatMessage[], model?: string) => Promise<LLMResponse>;
}

export const [LLMProviderContext, useLLM] = createContextHook((): LLMContextValue => {
  const [activeProvider, setActiveProviderState] = useState<LLMProvider>('rork');
  const [selectedModel, setSelectedModelState] = useState<string>('gpt-4o');
  const [apiKeys, setApiKeys] = useState<Record<LLMProvider, string | null>>({
    openai: null,
    anthropic: null,
    google: null,
    openrouter: null,
    mistral: null,
    deepseek: null,
    groq: null,
    together: null,
    perplexity: null,
    cohere: null,
    rork: null,
    ollama: null,
    local: null,
  });
  const [isLoading, setIsLoading] = useState<boolean>(false);

  useEffect(() => {
    const loadSettings = async () => {
      try {
        const stored = await AsyncStorage.getItem(SETTINGS_KEY);
        if (stored) {
          const settings: LLMSettings = JSON.parse(stored);
          setActiveProviderState(settings.activeProvider);
          setSelectedModelState(settings.selectedModel);
          console.log('Loaded LLM settings:', settings.activeProvider);
        }
      } catch (error) {
        console.error('Failed to load LLM settings:', error);
      }
    };

    const loadApiKeys = async () => {
      try {
        const keys: Record<LLMProvider, string | null> = {
          openai: null,
          anthropic: null,
          google: null,
          openrouter: null,
          mistral: null,
          deepseek: null,
          groq: null,
          together: null,
          perplexity: null,
          cohere: null,
          rork: null,
          ollama: null,
          local: null,
        };

        for (const provider of Object.keys(keys) as LLMProvider[]) {
          const key = await secureStorage.getItem(`${API_KEY_PREFIX}${provider}`);
          if (key) {
            keys[provider] = key;
          }
        }

        setApiKeys(keys);
        console.log('Loaded API keys for providers:', Object.keys(keys).filter(k => keys[k as LLMProvider]));
      } catch (error) {
        console.error('Failed to load API keys:', error);
      }
    };

    loadSettings();
    loadApiKeys();
  }, []);

  useEffect(() => {
    const saveSettings = async () => {
      try {
        const settings: LLMSettings = {
          activeProvider,
          apiKeys,
          selectedModel,
        };
        await AsyncStorage.setItem(SETTINGS_KEY, JSON.stringify(settings));
      } catch (error) {
        console.error('Failed to save LLM settings:', error);
      }
    };
    saveSettings();
  }, [activeProvider, selectedModel, apiKeys]);

  const setActiveProvider = useCallback((provider: LLMProvider) => {
    setActiveProviderState(provider);
    console.log('Active provider changed to:', provider);
    
    const providerConfig = LLM_PROVIDERS.find(p => p.id === provider);
    if (providerConfig && providerConfig.models.length > 0) {
      setSelectedModelState(providerConfig.models[0]);
    }
  }, []);

  const setSelectedModel = useCallback((model: string) => {
    setSelectedModelState(model);
    console.log('Selected model changed to:', model);
  }, []);

  const setApiKey = useCallback(async (provider: LLMProvider, key: string) => {
    try {
      await secureStorage.setItem(`${API_KEY_PREFIX}${provider}`, key);
      setApiKeys(prev => ({ ...prev, [provider]: key }));
      console.log('API key saved for provider:', provider);
    } catch (error) {
      console.error('Failed to save API key:', error);
      throw error;
    }
  }, []);

  const removeApiKey = useCallback(async (provider: LLMProvider) => {
    try {
      await secureStorage.deleteItem(`${API_KEY_PREFIX}${provider}`);
      setApiKeys(prev => ({ ...prev, [provider]: null }));
      console.log('API key removed for provider:', provider);
    } catch (error) {
      console.error('Failed to remove API key:', error);
      throw error;
    }
  }, []);

  const hasApiKey = useCallback((provider: LLMProvider): boolean => {
    return apiKeys[provider] !== null && apiKeys[provider] !== '';
  }, [apiKeys]);

  const sendChatMessage = useCallback(async (
    messages: ChatMessage[],
    model?: string
  ): Promise<LLMResponse> => {
    setIsLoading(true);
    
    try {
      const targetModel = model || selectedModel;
      const provider = activeProvider;
      
      console.log('Sending message with provider:', provider, 'model:', targetModel);

      if (provider === 'rork') {
        type RorkMessage = {
          role: 'user' | 'assistant';
          content: string | ({ type: 'text'; text: string } | { type: 'image'; image: string })[];
        };
        
        const rorkMessages: RorkMessage[] = messages
          .filter(msg => msg.role !== 'system')
          .map(msg => {
            if (typeof msg.content === 'string') {
              return {
                role: msg.role as 'user' | 'assistant',
                content: msg.content,
              };
            }
            
            return {
              role: msg.role as 'user' | 'assistant',
              content: msg.content.map(part => 
                part.type === 'text' 
                  ? { type: 'text' as const, text: part.text || '' }
                  : { type: 'image' as const, image: part.image || '' }
              ),
            };
          });

        console.log('Sending to Rork with messages:', rorkMessages.length);
        
        const responseText = await generateText({ messages: rorkMessages as any });
        
        console.log('Rork response received:', responseText.substring(0, 100));
        
        return {
          content: responseText,
          model: targetModel,
        };
      }

      const providerConfig = LLM_PROVIDERS.find(p => p.id === provider);
      if (!providerConfig) {
        throw new Error(`Unknown provider: ${provider}`);
      }

      if (providerConfig.requiresApiKey && !hasApiKey(provider)) {
        throw new Error(`API key required for ${providerConfig.name}. Please add it in settings.`);
      }

      const apiKey = apiKeys[provider];
      
      if (provider === 'openai' || provider === 'groq' || provider === 'together' || provider === 'openrouter') {
        const response = await fetch(`${providerConfig.baseUrl}/chat/completions`, {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
            'Authorization': `Bearer ${apiKey}`,
            ...(provider === 'openrouter' && {
              'HTTP-Referer': 'https://deepchat.app',
              'X-Title': 'DeepChat',
            }),
          },
          body: JSON.stringify({
            model: targetModel,
            messages: messages.map(msg => ({
              role: msg.role,
              content: msg.content,
            })),
          }),
        });

        if (!response.ok) {
          const error = await response.text();
          throw new Error(`${providerConfig.name} API error: ${error}`);
        }

        const data = await response.json();
        
        return {
          content: data.choices[0].message.content,
          model: data.model,
          usage: data.usage ? {
            promptTokens: data.usage.prompt_tokens,
            completionTokens: data.usage.completion_tokens,
            totalTokens: data.usage.total_tokens,
          } : undefined,
        };
      }

      if (provider === 'anthropic') {
        const response = await fetch(`${providerConfig.baseUrl}/messages`, {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
            'x-api-key': apiKey || '',
            'anthropic-version': '2023-06-01',
          },
          body: JSON.stringify({
            model: targetModel,
            messages: messages.filter(m => m.role !== 'system').map(msg => ({
              role: msg.role,
              content: msg.content,
            })),
            max_tokens: 4096,
          }),
        });

        if (!response.ok) {
          const error = await response.text();
          throw new Error(`Anthropic API error: ${error}`);
        }

        const data = await response.json();
        
        return {
          content: data.content[0].text,
          model: data.model,
          usage: data.usage ? {
            promptTokens: data.usage.input_tokens,
            completionTokens: data.usage.output_tokens,
            totalTokens: data.usage.input_tokens + data.usage.output_tokens,
          } : undefined,
        };
      }

      throw new Error(`Provider ${provider} not yet implemented`);
      
    } catch (error) {
      console.error('Failed to send chat message:', error);
      throw error;
    } finally {
      setIsLoading(false);
    }
  }, [activeProvider, selectedModel, apiKeys, hasApiKey]);

  return {
    activeProvider,
    selectedModel,
    apiKeys,
    isLoading,
    setActiveProvider,
    setSelectedModel,
    setApiKey,
    removeApiKey,
    hasApiKey,
    sendChatMessage,
  };
});
