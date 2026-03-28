export interface AIModel {
  id: string;
  name: string;
  provider: string;
  description: string;
  icon: string;
  color: string;
  capabilities: {
    text: boolean;
    vision: boolean;
    tools: boolean;
  };
}

export const AI_MODELS: AIModel[] = [
  {
    id: 'gpt-4o',
    name: 'GPT-4o',
    provider: 'OpenAI',
    description: 'Most capable model with vision and tool support',
    icon: '🤖',
    color: '#10A37F',
    capabilities: {
      text: true,
      vision: true,
      tools: true,
    },
  },
  {
    id: 'gpt-4-turbo',
    name: 'GPT-4 Turbo',
    provider: 'OpenAI',
    description: 'Fast and powerful for complex tasks',
    icon: '⚡',
    color: '#10A37F',
    capabilities: {
      text: true,
      vision: true,
      tools: true,
    },
  },
  {
    id: 'gpt-3.5-turbo',
    name: 'GPT-3.5 Turbo',
    provider: 'OpenAI',
    description: 'Fast and efficient for everyday tasks',
    icon: '💨',
    color: '#10A37F',
    capabilities: {
      text: true,
      vision: false,
      tools: true,
    },
  },
  {
    id: 'claude-3-opus',
    name: 'Claude 3 Opus',
    provider: 'Anthropic',
    description: 'Most intelligent Claude model',
    icon: '🧠',
    color: '#D97757',
    capabilities: {
      text: true,
      vision: true,
      tools: true,
    },
  },
  {
    id: 'claude-3-sonnet',
    name: 'Claude 3 Sonnet',
    provider: 'Anthropic',
    description: 'Balanced performance and speed',
    icon: '🎵',
    color: '#D97757',
    capabilities: {
      text: true,
      vision: true,
      tools: true,
    },
  },
  {
    id: 'gemini-pro',
    name: 'Gemini Pro',
    provider: 'Google',
    description: 'Google\'s most capable AI model',
    icon: '✨',
    color: '#4285F4',
    capabilities: {
      text: true,
      vision: true,
      tools: true,
    },
  },
  {
    id: 'deepseek-chat',
    name: 'DeepSeek Chat',
    provider: 'DeepSeek',
    description: 'Powerful open-source model',
    icon: '🔍',
    color: '#6366F1',
    capabilities: {
      text: true,
      vision: false,
      tools: true,
    },
  },
];
