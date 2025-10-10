export interface LocalLLMModel {
  id: string;
  name: string;
  description: string;
  size: number;
  sizeFormatted: string;
  quantization: 'Q4' | 'Q8' | 'FP16';
  parameters: string;
  contextLength: number;
  downloadUrl: string;
  family: 'llama' | 'phi' | 'gemma' | 'mistral' | 'qwen' | 'granite' | 'cogito' | 'deepscaler' | 'deepseek';
  capabilities: string[];
  recommended: boolean;
  minRAM: number;
}

export interface DownloadedModel {
  id: string;
  modelId: string;
  name: string;
  size: number;
  downloadedAt: number;
  lastUsed?: number;
  localPath: string;
  status: 'ready' | 'error';
}

export interface ModelDownloadProgress {
  modelId: string;
  progress: number;
  bytesDownloaded: number;
  totalBytes: number;
  status: 'downloading' | 'processing' | 'completed' | 'error';
  error?: string;
}

export interface LocalLLMSettings {
  maxConcurrentDownloads: number;
  autoDeleteUnused: boolean;
  maxStorageGB: number;
  preferredQuantization: 'Q4' | 'Q8' | 'FP16';
}

export interface InferenceOptions {
  temperature?: number;
  topP?: number;
  topK?: number;
  maxTokens?: number;
  repeatPenalty?: number;
  stopSequences?: string[];
}

export interface InferenceResult {
  text: string;
  tokensGenerated: number;
  inferenceTime: number;
  tokensPerSecond: number;
}
