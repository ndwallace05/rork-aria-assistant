import createContextHook from '@nkzw/create-context-hook';
import AsyncStorage from '@react-native-async-storage/async-storage';
import * as FileSystem from 'expo-file-system';
import { useState, useEffect, useCallback } from 'react';
import type {
  DownloadedModel,
  ModelDownloadProgress,
  LocalLLMSettings,
  InferenceOptions,
  InferenceResult,
} from '@/types/localLLM';
import { getModelById } from '@/constants/localModels';

const DOWNLOADED_MODELS_KEY = '@deepchat_downloaded_models';
const LOCAL_LLM_SETTINGS_KEY = '@deepchat_local_llm_settings';
const MODELS_DIR = `${FileSystem.documentDirectory}models/`;

const defaultSettings: LocalLLMSettings = {
  maxConcurrentDownloads: 1,
  autoDeleteUnused: false,
  maxStorageGB: 10,
  preferredQuantization: 'Q4',
};

export interface LocalLLMContextValue {
  downloadedModels: DownloadedModel[];
  downloadProgress: Record<string, ModelDownloadProgress>;
  settings: LocalLLMSettings;
  isInitialized: boolean;
  activeModelId: string | null;
  
  downloadModel: (modelId: string) => Promise<void>;
  deleteModel: (modelId: string) => Promise<void>;
  cancelDownload: (modelId: string) => void;
  setActiveModel: (modelId: string | null) => Promise<void>;
  runInference: (prompt: string, options?: InferenceOptions) => Promise<InferenceResult>;
  updateSettings: (settings: Partial<LocalLLMSettings>) => Promise<void>;
  getStorageInfo: () => Promise<{ used: number; available: number; total: number }>;
}

export const [LocalLLMContext, useLocalLLM] = createContextHook((): LocalLLMContextValue => {
  const [downloadedModels, setDownloadedModels] = useState<DownloadedModel[]>([]);
  const [downloadProgress, setDownloadProgress] = useState<Record<string, ModelDownloadProgress>>({});
  const [settings, setSettings] = useState<LocalLLMSettings>(defaultSettings);
  const [isInitialized, setIsInitialized] = useState<boolean>(false);
  const [activeModelId, setActiveModelIdState] = useState<string | null>(null);
  const [downloadTasks, setDownloadTasks] = useState<Record<string, FileSystem.DownloadResumable>>({});

  useEffect(() => {
    const initialize = async () => {
      try {
        const dirInfo = await FileSystem.getInfoAsync(MODELS_DIR);
        if (!dirInfo.exists) {
          await FileSystem.makeDirectoryAsync(MODELS_DIR, { intermediates: true });
          console.log('Created models directory:', MODELS_DIR);
        }

        const storedModels = await AsyncStorage.getItem(DOWNLOADED_MODELS_KEY);
        if (storedModels) {
          const models: DownloadedModel[] = JSON.parse(storedModels);
          const validModels: DownloadedModel[] = [];
          
          for (const model of models) {
            const fileInfo = await FileSystem.getInfoAsync(model.localPath);
            if (fileInfo.exists) {
              validModels.push(model);
            } else {
              console.log('Model file not found, removing from list:', model.name);
            }
          }
          
          setDownloadedModels(validModels);
          if (validModels.length !== models.length) {
            await AsyncStorage.setItem(DOWNLOADED_MODELS_KEY, JSON.stringify(validModels));
          }
        }

        const storedSettings = await AsyncStorage.getItem(LOCAL_LLM_SETTINGS_KEY);
        if (storedSettings) {
          setSettings(JSON.parse(storedSettings));
        }

        setIsInitialized(true);
        console.log('Local LLM context initialized');
      } catch (error) {
        console.error('Failed to initialize Local LLM context:', error);
        setIsInitialized(true);
      }
    };

    initialize();
  }, []);

  const saveDownloadedModels = useCallback(async (models: DownloadedModel[]) => {
    try {
      await AsyncStorage.setItem(DOWNLOADED_MODELS_KEY, JSON.stringify(models));
    } catch (error) {
      console.error('Failed to save downloaded models:', error);
    }
  }, []);

  const downloadModel = useCallback(async (modelId: string) => {
    const model = getModelById(modelId);
    if (!model) {
      throw new Error(`Model ${modelId} not found`);
    }

    const existingModel = downloadedModels.find(m => m.modelId === modelId);
    if (existingModel) {
      console.log('Model already downloaded:', model.name);
      return;
    }

    const localPath = `${MODELS_DIR}${modelId}.gguf`;

    setDownloadProgress(prev => ({
      ...prev,
      [modelId]: {
        modelId,
        progress: 0,
        bytesDownloaded: 0,
        totalBytes: model.size,
        status: 'downloading',
      },
    }));

    try {
      const callback = (downloadProgressEvent: FileSystem.DownloadProgressData) => {
        const progress = downloadProgressEvent.totalBytesWritten / downloadProgressEvent.totalBytesExpectedToWrite;
        setDownloadProgress(prev => ({
          ...prev,
          [modelId]: {
            modelId,
            progress,
            bytesDownloaded: downloadProgressEvent.totalBytesWritten,
            totalBytes: downloadProgressEvent.totalBytesExpectedToWrite,
            status: 'downloading',
          },
        }));
      };

      const downloadResumable = FileSystem.createDownloadResumable(
        model.downloadUrl,
        localPath,
        {},
        callback
      );

      setDownloadTasks(prev => ({ ...prev, [modelId]: downloadResumable }));

      const result = await downloadResumable.downloadAsync();
      
      if (!result) {
        throw new Error('Download failed');
      }

      setDownloadProgress(prev => ({
        ...prev,
        [modelId]: {
          modelId,
          progress: 1,
          bytesDownloaded: model.size,
          totalBytes: model.size,
          status: 'completed',
        },
      }));

      const downloadedModel: DownloadedModel = {
        id: `${modelId}-${Date.now()}`,
        modelId,
        name: model.name,
        size: model.size,
        downloadedAt: Date.now(),
        localPath: result.uri,
        status: 'ready',
      };

      const updatedModels = [...downloadedModels, downloadedModel];
      setDownloadedModels(updatedModels);
      await saveDownloadedModels(updatedModels);

      setDownloadTasks(prev => {
        const { [modelId]: _, ...rest } = prev;
        return rest;
      });

      setTimeout(() => {
        setDownloadProgress(prev => {
          const { [modelId]: _, ...rest } = prev;
          return rest;
        });
      }, 3000);

      console.log('Model downloaded successfully:', model.name);
    } catch (error) {
      console.error('Failed to download model:', error);
      
      setDownloadProgress(prev => ({
        ...prev,
        [modelId]: {
          modelId,
          progress: 0,
          bytesDownloaded: 0,
          totalBytes: model.size,
          status: 'error',
          error: error instanceof Error ? error.message : 'Download failed',
        },
      }));

      setDownloadTasks(prev => {
        const { [modelId]: _, ...rest } = prev;
        return rest;
      });

      try {
        const fileInfo = await FileSystem.getInfoAsync(localPath);
        if (fileInfo.exists) {
          await FileSystem.deleteAsync(localPath);
        }
      } catch (cleanupError) {
        console.error('Failed to cleanup failed download:', cleanupError);
      }

      throw error;
    }
  }, [downloadedModels, saveDownloadedModels]);

  const cancelDownload = useCallback((modelId: string) => {
    const task = downloadTasks[modelId];
    if (task) {
      task.pauseAsync().then(() => {
        console.log('Download cancelled:', modelId);
      }).catch(error => {
        console.error('Failed to cancel download:', error);
      });

      setDownloadTasks(prev => {
        const { [modelId]: _, ...rest } = prev;
        return rest;
      });

      setDownloadProgress(prev => {
        const { [modelId]: _, ...rest } = prev;
        return rest;
      });
    }
  }, [downloadTasks]);

  const deleteModel = useCallback(async (modelId: string) => {
    const model = downloadedModels.find(m => m.modelId === modelId);
    if (!model) {
      console.log('Model not found:', modelId);
      return;
    }

    try {
      const fileInfo = await FileSystem.getInfoAsync(model.localPath);
      if (fileInfo.exists) {
        await FileSystem.deleteAsync(model.localPath);
      }

      const updatedModels = downloadedModels.filter(m => m.modelId !== modelId);
      setDownloadedModels(updatedModels);
      await saveDownloadedModels(updatedModels);

      if (activeModelId === modelId) {
        setActiveModelIdState(null);
      }

      console.log('Model deleted successfully:', model.name);
    } catch (error) {
      console.error('Failed to delete model:', error);
      throw error;
    }
  }, [downloadedModels, activeModelId, saveDownloadedModels]);

  const setActiveModel = useCallback(async (modelId: string | null) => {
    if (modelId) {
      const model = downloadedModels.find(m => m.modelId === modelId);
      if (!model) {
        throw new Error(`Model ${modelId} not downloaded`);
      }
      
      const fileInfo = await FileSystem.getInfoAsync(model.localPath);
      if (!fileInfo.exists) {
        throw new Error(`Model file not found: ${model.localPath}`);
      }
    }

    setActiveModelIdState(modelId);
    console.log('Active model set to:', modelId);
  }, [downloadedModels]);

  const runInference = useCallback(async (
    prompt: string,
    options?: InferenceOptions
  ): Promise<InferenceResult> => {
    if (!activeModelId) {
      throw new Error('No active model selected');
    }

    const model = downloadedModels.find(m => m.modelId === activeModelId);
    if (!model) {
      throw new Error('Active model not found');
    }

    console.log('Running inference with model:', model.name);
    console.log('Prompt:', prompt);
    console.log('Options:', options);

    const startTime = Date.now();
    
    const simulatedResponse = `This is a simulated response from ${model.name}. In a production app, this would use a native module or WebAssembly to run the actual GGUF model inference. The prompt was: "${prompt.substring(0, 50)}..."`;
    
    const inferenceTime = Date.now() - startTime;
    const tokensGenerated = Math.floor(simulatedResponse.split(' ').length * 1.3);
    
    return {
      text: simulatedResponse,
      tokensGenerated,
      inferenceTime,
      tokensPerSecond: tokensGenerated / (inferenceTime / 1000),
    };
  }, [activeModelId, downloadedModels]);

  const updateSettings = useCallback(async (newSettings: Partial<LocalLLMSettings>) => {
    const updated = { ...settings, ...newSettings };
    setSettings(updated);
    try {
      await AsyncStorage.setItem(LOCAL_LLM_SETTINGS_KEY, JSON.stringify(updated));
      console.log('Settings updated:', updated);
    } catch (error) {
      console.error('Failed to save settings:', error);
    }
  }, [settings]);

  const getStorageInfo = useCallback(async () => {
    try {
      const dirInfo = await FileSystem.getInfoAsync(MODELS_DIR);
      let used = 0;
      
      if (dirInfo.exists) {
        for (const model of downloadedModels) {
          used += model.size;
        }
      }

      const freeDiskStorage = await FileSystem.getFreeDiskStorageAsync();
      const totalDiskCapacity = await FileSystem.getTotalDiskCapacityAsync();
      
      return {
        used,
        available: freeDiskStorage,
        total: totalDiskCapacity,
      };
    } catch (error) {
      console.error('Failed to get storage info:', error);
      return { used: 0, available: 0, total: 0 };
    }
  }, [downloadedModels]);

  return {
    downloadedModels,
    downloadProgress,
    settings,
    isInitialized,
    activeModelId,
    downloadModel,
    deleteModel,
    cancelDownload,
    setActiveModel,
    runInference,
    updateSettings,
    getStorageInfo,
  };
});
