import React, { useState, useEffect, useCallback } from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  TouchableOpacity,
  ActivityIndicator,
  Alert,
} from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { useRouter } from 'expo-router';
import {
  ArrowLeft,
  Download,
  Trash2,
  Check,
  HardDrive,
  Cpu,
  Zap,
  X,
  AlertCircle,
} from 'lucide-react-native';
import Colors from '@/constants/colors';
import { useLocalLLM } from '@/contexts/LocalLLMContext';
import { LOCAL_LLM_MODELS } from '@/constants/localModels';
import type { LocalLLMModel } from '@/types/localLLM';

export default function LocalModelsScreen() {
  const router = useRouter();
  const insets = useSafeAreaInsets();
  const localLLM = useLocalLLM();
  const [storageInfo, setStorageInfo] = useState<{ used: number; available: number; total: number } | null>(null);
  const [selectedTab, setSelectedTab] = useState<'available' | 'downloaded'>('available');

  const loadStorageInfo = useCallback(async () => {
    const info = await localLLM.getStorageInfo();
    setStorageInfo(info);
  }, [localLLM]);

  useEffect(() => {
    loadStorageInfo();
  }, [localLLM.downloadedModels, loadStorageInfo]);

  const formatBytes = (bytes: number): string => {
    if (bytes === 0) return '0 B';
    const k = 1024;
    const sizes = ['B', 'KB', 'MB', 'GB', 'TB'];
    const i = Math.floor(Math.log(bytes) / Math.log(k));
    return `${(bytes / Math.pow(k, i)).toFixed(2)} ${sizes[i]}`;
  };

  const handleDownload = async (modelId: string) => {
    try {
      await localLLM.downloadModel(modelId);
      Alert.alert('Success', 'Model downloaded successfully');
    } catch (error) {
      Alert.alert('Error', error instanceof Error ? error.message : 'Failed to download model');
    }
  };

  const handleDelete = async (modelId: string) => {
    Alert.alert(
      'Delete Model',
      'Are you sure you want to delete this model?',
      [
        { text: 'Cancel', style: 'cancel' },
        {
          text: 'Delete',
          style: 'destructive',
          onPress: async () => {
            try {
              await localLLM.deleteModel(modelId);
              Alert.alert('Success', 'Model deleted successfully');
            } catch {
              Alert.alert('Error', 'Failed to delete model');
            }
          },
        },
      ]
    );
  };

  const handleSetActive = async (modelId: string) => {
    try {
      await localLLM.setActiveModel(modelId);
      Alert.alert('Success', 'Active model changed');
    } catch (error) {
      Alert.alert('Error', error instanceof Error ? error.message : 'Failed to set active model');
    }
  };

  const isModelDownloaded = (modelId: string): boolean => {
    return localLLM.downloadedModels.some(m => m.modelId === modelId);
  };

  const getDownloadProgress = (modelId: string) => {
    return localLLM.downloadProgress[modelId];
  };

  const renderModelCard = (model: LocalLLMModel) => {
    const downloaded = isModelDownloaded(model.id);
    const progress = getDownloadProgress(model.id);
    const isActive = localLLM.activeModelId === model.id;

    return (
      <View key={model.id} style={[styles.modelCard, isActive && styles.modelCardActive]}>
        <View style={styles.modelHeader}>
          <View style={styles.modelInfo}>
            <View style={styles.modelTitleRow}>
              <Text style={styles.modelName}>{model.name}</Text>
              {model.recommended && (
                <View style={styles.recommendedBadge}>
                  <Zap size={12} color={Colors.warning} />
                  <Text style={styles.recommendedText}>Recommended</Text>
                </View>
              )}
            </View>
            <Text style={styles.modelDescription}>{model.description}</Text>
          </View>
        </View>

        <View style={styles.modelDetails}>
          <View style={styles.detailItem}>
            <Cpu size={16} color={Colors.textSecondary} />
            <Text style={styles.detailText}>{model.parameters}</Text>
          </View>
          <View style={styles.detailItem}>
            <HardDrive size={16} color={Colors.textSecondary} />
            <Text style={styles.detailText}>{model.sizeFormatted}</Text>
          </View>
          <View style={styles.detailItem}>
            <Text style={styles.detailLabel}>RAM:</Text>
            <Text style={styles.detailText}>{model.minRAM}GB+</Text>
          </View>
        </View>

        <View style={styles.capabilitiesContainer}>
          {model.capabilities.map((cap, idx) => (
            <View key={idx} style={styles.capabilityBadge}>
              <Text style={styles.capabilityText}>{cap}</Text>
            </View>
          ))}
        </View>

        {progress && progress.status === 'downloading' && (
          <View style={styles.progressContainer}>
            <View style={styles.progressBar}>
              <View style={[styles.progressFill, { width: `${progress.progress * 100}%` }]} />
            </View>
            <View style={styles.progressInfo}>
              <Text style={styles.progressText}>
                {formatBytes(progress.bytesDownloaded)} / {formatBytes(progress.totalBytes)}
              </Text>
              <Text style={styles.progressPercent}>{(progress.progress * 100).toFixed(0)}%</Text>
            </View>
            <TouchableOpacity
              style={styles.cancelButton}
              onPress={() => localLLM.cancelDownload(model.id)}
            >
              <X size={16} color={Colors.error} />
              <Text style={styles.cancelButtonText}>Cancel</Text>
            </TouchableOpacity>
          </View>
        )}

        {progress && progress.status === 'error' && (
          <View style={styles.errorContainer}>
            <AlertCircle size={16} color={Colors.error} />
            <Text style={styles.errorText}>{progress.error || 'Download failed'}</Text>
          </View>
        )}

        <View style={styles.modelActions}>
          {downloaded ? (
            <>
              {isActive ? (
                <View style={styles.activeButton}>
                  <Check size={16} color={Colors.success} />
                  <Text style={styles.activeButtonText}>Active</Text>
                </View>
              ) : (
                <TouchableOpacity
                  style={styles.actionButton}
                  onPress={() => handleSetActive(model.id)}
                >
                  <Text style={styles.actionButtonText}>Set Active</Text>
                </TouchableOpacity>
              )}
              <TouchableOpacity
                style={[styles.actionButton, styles.deleteButton]}
                onPress={() => handleDelete(model.id)}
              >
                <Trash2 size={16} color={Colors.error} />
              </TouchableOpacity>
            </>
          ) : (
            <TouchableOpacity
              style={[styles.actionButton, styles.downloadButton]}
              onPress={() => handleDownload(model.id)}
              disabled={!!progress}
            >
              {progress ? (
                <ActivityIndicator size="small" color="#FFFFFF" />
              ) : (
                <>
                  <Download size={16} color="#FFFFFF" />
                  <Text style={styles.downloadButtonText}>Download</Text>
                </>
              )}
            </TouchableOpacity>
          )}
        </View>
      </View>
    );
  };

  const availableModels = selectedTab === 'available' 
    ? LOCAL_LLM_MODELS.filter(m => !isModelDownloaded(m.id))
    : [];
  
  const downloadedModelsList = selectedTab === 'downloaded'
    ? LOCAL_LLM_MODELS.filter(m => isModelDownloaded(m.id))
    : [];

  return (
    <View style={[styles.container, { paddingTop: insets.top }]}>
      <View style={styles.header}>
        <TouchableOpacity style={styles.backButton} onPress={() => router.back()}>
          <ArrowLeft size={24} color={Colors.text} />
        </TouchableOpacity>
        <View style={styles.headerInfo}>
          <Text style={styles.headerTitle}>Local Models</Text>
          <Text style={styles.headerSubtitle}>Download & manage on-device AI</Text>
        </View>
      </View>

      {storageInfo && (
        <View style={styles.storageCard}>
          <View style={styles.storageHeader}>
            <HardDrive size={20} color={Colors.primary} />
            <Text style={styles.storageTitle}>Storage</Text>
          </View>
          <View style={styles.storageBar}>
            <View
              style={[
                styles.storageBarFill,
                { width: `${(storageInfo.used / storageInfo.total) * 100}%` },
              ]}
            />
          </View>
          <View style={styles.storageInfo}>
            <Text style={styles.storageText}>
              {formatBytes(storageInfo.used)} used
            </Text>
            <Text style={styles.storageText}>
              {formatBytes(storageInfo.available)} free
            </Text>
          </View>
        </View>
      )}

      <View style={styles.tabs}>
        <TouchableOpacity
          style={[styles.tab, selectedTab === 'available' && styles.tabActive]}
          onPress={() => setSelectedTab('available')}
        >
          <Text style={[styles.tabText, selectedTab === 'available' && styles.tabTextActive]}>
            Available ({LOCAL_LLM_MODELS.length - localLLM.downloadedModels.length})
          </Text>
        </TouchableOpacity>
        <TouchableOpacity
          style={[styles.tab, selectedTab === 'downloaded' && styles.tabActive]}
          onPress={() => setSelectedTab('downloaded')}
        >
          <Text style={[styles.tabText, selectedTab === 'downloaded' && styles.tabTextActive]}>
            Downloaded ({localLLM.downloadedModels.length})
          </Text>
        </TouchableOpacity>
      </View>

      <ScrollView style={styles.content} showsVerticalScrollIndicator={false}>
        {selectedTab === 'available' && availableModels.length === 0 && (
          <View style={styles.emptyContainer}>
            <Check size={48} color={Colors.success} />
            <Text style={styles.emptyTitle}>All models downloaded!</Text>
            <Text style={styles.emptyDescription}>
              You have all available models. Check the Downloaded tab.
            </Text>
          </View>
        )}

        {selectedTab === 'downloaded' && downloadedModelsList.length === 0 && (
          <View style={styles.emptyContainer}>
            <Download size={48} color={Colors.textTertiary} />
            <Text style={styles.emptyTitle}>No models yet</Text>
            <Text style={styles.emptyDescription}>
              Download a model to use local AI inference
            </Text>
          </View>
        )}

        {selectedTab === 'available' && availableModels.map(renderModelCard)}
        {selectedTab === 'downloaded' && downloadedModelsList.map(renderModelCard)}

        <View style={{ height: 40 }} />
      </ScrollView>
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
  backButton: {
    padding: 8,
    marginRight: 8,
  },
  headerInfo: {
    flex: 1,
  },
  headerTitle: {
    fontSize: 20,
    fontWeight: '700' as const,
    color: Colors.text,
  },
  headerSubtitle: {
    fontSize: 13,
    color: Colors.textSecondary,
    marginTop: 2,
  },
  storageCard: {
    margin: 16,
    padding: 16,
    backgroundColor: Colors.surface,
    borderRadius: 12,
    borderWidth: 1,
    borderColor: Colors.border,
  },
  storageHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
    marginBottom: 12,
  },
  storageTitle: {
    fontSize: 16,
    fontWeight: '600' as const,
    color: Colors.text,
  },
  storageBar: {
    height: 8,
    backgroundColor: Colors.backgroundTertiary,
    borderRadius: 4,
    overflow: 'hidden',
    marginBottom: 8,
  },
  storageBarFill: {
    height: '100%',
    backgroundColor: Colors.primary,
  },
  storageInfo: {
    flexDirection: 'row',
    justifyContent: 'space-between',
  },
  storageText: {
    fontSize: 13,
    color: Colors.textSecondary,
  },
  tabs: {
    flexDirection: 'row',
    paddingHorizontal: 16,
    gap: 8,
    marginBottom: 16,
  },
  tab: {
    flex: 1,
    paddingVertical: 12,
    alignItems: 'center',
    borderRadius: 8,
    backgroundColor: Colors.backgroundSecondary,
  },
  tabActive: {
    backgroundColor: Colors.primary,
  },
  tabText: {
    fontSize: 14,
    fontWeight: '600' as const,
    color: Colors.textSecondary,
  },
  tabTextActive: {
    color: '#FFFFFF',
  },
  content: {
    flex: 1,
    paddingHorizontal: 16,
  },
  modelCard: {
    backgroundColor: Colors.surface,
    borderRadius: 12,
    padding: 16,
    marginBottom: 12,
    borderWidth: 2,
    borderColor: Colors.border,
  },
  modelCardActive: {
    borderColor: Colors.success,
    backgroundColor: Colors.backgroundSecondary,
  },
  modelHeader: {
    marginBottom: 12,
  },
  modelInfo: {
    flex: 1,
  },
  modelTitleRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
    marginBottom: 4,
  },
  modelName: {
    fontSize: 16,
    fontWeight: '700' as const,
    color: Colors.text,
  },
  recommendedBadge: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
    paddingHorizontal: 8,
    paddingVertical: 2,
    backgroundColor: Colors.backgroundTertiary,
    borderRadius: 12,
  },
  recommendedText: {
    fontSize: 11,
    fontWeight: '600' as const,
    color: Colors.warning,
  },
  modelDescription: {
    fontSize: 13,
    color: Colors.textSecondary,
    lineHeight: 18,
  },
  modelDetails: {
    flexDirection: 'row',
    gap: 16,
    marginBottom: 12,
  },
  detailItem: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
  },
  detailLabel: {
    fontSize: 12,
    fontWeight: '600' as const,
    color: Colors.textSecondary,
  },
  detailText: {
    fontSize: 12,
    color: Colors.textSecondary,
  },
  capabilitiesContainer: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 6,
    marginBottom: 12,
  },
  capabilityBadge: {
    paddingHorizontal: 8,
    paddingVertical: 4,
    backgroundColor: Colors.backgroundTertiary,
    borderRadius: 6,
  },
  capabilityText: {
    fontSize: 11,
    fontWeight: '500' as const,
    color: Colors.text,
  },
  progressContainer: {
    marginBottom: 12,
  },
  progressBar: {
    height: 6,
    backgroundColor: Colors.backgroundTertiary,
    borderRadius: 3,
    overflow: 'hidden',
    marginBottom: 6,
  },
  progressFill: {
    height: '100%',
    backgroundColor: Colors.primary,
  },
  progressInfo: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginBottom: 8,
  },
  progressText: {
    fontSize: 12,
    color: Colors.textSecondary,
  },
  progressPercent: {
    fontSize: 12,
    fontWeight: '600' as const,
    color: Colors.primary,
  },
  cancelButton: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 4,
    paddingVertical: 6,
  },
  cancelButtonText: {
    fontSize: 13,
    fontWeight: '600' as const,
    color: Colors.error,
  },
  errorContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
    padding: 8,
    backgroundColor: Colors.backgroundTertiary,
    borderRadius: 6,
    marginBottom: 12,
  },
  errorText: {
    flex: 1,
    fontSize: 12,
    color: Colors.error,
  },
  modelActions: {
    flexDirection: 'row',
    gap: 8,
  },
  actionButton: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 6,
    paddingVertical: 10,
    borderRadius: 8,
    backgroundColor: Colors.backgroundTertiary,
  },
  actionButtonText: {
    fontSize: 14,
    fontWeight: '600' as const,
    color: Colors.text,
  },
  downloadButton: {
    backgroundColor: Colors.primary,
  },
  downloadButtonText: {
    color: '#FFFFFF',
  },
  deleteButton: {
    flex: 0,
    paddingHorizontal: 16,
    backgroundColor: Colors.backgroundTertiary,
  },
  activeButton: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 6,
    paddingVertical: 10,
    borderRadius: 8,
    backgroundColor: Colors.backgroundSecondary,
    borderWidth: 1,
    borderColor: Colors.success,
  },
  activeButtonText: {
    fontSize: 14,
    fontWeight: '600' as const,
    color: Colors.success,
  },
  emptyContainer: {
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: 60,
  },
  emptyTitle: {
    fontSize: 18,
    fontWeight: '600' as const,
    color: Colors.text,
    marginTop: 16,
    marginBottom: 8,
  },
  emptyDescription: {
    fontSize: 14,
    color: Colors.textSecondary,
    textAlign: 'center',
    paddingHorizontal: 40,
  },
});
