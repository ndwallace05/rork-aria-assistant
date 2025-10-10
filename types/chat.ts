export interface WebSearchResult {
  title: string;
  url: string;
  snippet: string;
}

export interface Message {
  id: string;
  role: 'user' | 'assistant';
  content: string;
  timestamp: number;
  images?: string[];
  toolCalls?: ToolCall[];
  webSearchResults?: WebSearchResult[];
}

export interface ToolCall {
  id: string;
  name: string;
  input: Record<string, unknown>;
  output?: unknown;
  state: 'input-streaming' | 'input-available' | 'output-available' | 'output-error';
  errorText?: string;
}

export interface Conversation {
  id: string;
  title: string;
  modelId: string;
  messages: Message[];
  createdAt: number;
  updatedAt: number;
  pinned?: boolean;
}

export interface ChatContextValue {
  conversations: Conversation[];
  currentConversationId: string | null;
  currentConversation: Conversation | null;
  selectedModelId: string;
  isLoading: boolean;
  
  createConversation: (modelId?: string) => string;
  deleteConversation: (id: string) => void;
  selectConversation: (id: string) => void;
  updateConversationTitle: (id: string, title: string) => void;
  togglePinConversation: (id: string) => void;
  
  sendMessage: (content: string, images?: string[]) => Promise<void>;
  retryMessage: (messageId: string) => Promise<void>;
  
  setSelectedModel: (modelId: string) => void;
}
