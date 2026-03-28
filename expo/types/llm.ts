export type LLMProvider = 
  | 'openai'
  | 'anthropic'
  | 'google'
  | 'openrouter'
  | 'mistral'
  | 'deepseek'
  | 'groq'
  | 'together'
  | 'perplexity'
  | 'cohere'
  | 'rork'
  | 'ollama'
  | 'local';

export interface LLMProviderConfig {
  id: LLMProvider;
  name: string;
  description: string;
  icon: string;
  color: string;
  requiresApiKey: boolean;
  apiKeyLabel: string;
  apiKeyPlaceholder: string;
  baseUrl?: string;
  docsUrl: string;
  models: string[];
}

export interface LLMApiKey {
  provider: LLMProvider;
  key: string;
  createdAt: number;
  lastUsed?: number;
}

export interface LLMSettings {
  activeProvider: LLMProvider;
  apiKeys: Record<LLMProvider, string | null>;
  selectedModel: string;
}

export interface ChatMessage {
  role: 'user' | 'assistant' | 'system';
  content: string | { type: 'text' | 'image'; text?: string; image?: string }[];
}

export interface LLMResponse {
  content: string;
  model: string;
  usage?: {
    promptTokens: number;
    completionTokens: number;
    totalTokens: number;
  };
}

export interface OllamaModel {
  name: string;
  model: string;
  size: number;
  digest: string;
  modified_at: string;
  details?: {
    format: string;
    family: string;
    families: string[];
    parameter_size: string;
    quantization_level: string;
  };
}

export interface OllamaModelInfo {
  name: string;
  size: string;
  parameterSize: string;
  quantization: string;
  family: string;
  modifiedAt: string;
}
