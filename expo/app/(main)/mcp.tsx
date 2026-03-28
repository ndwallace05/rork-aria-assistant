import React, { useState, useEffect } from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  TouchableOpacity,
  TextInput,
  Alert,
  ActivityIndicator,
} from 'react-native';
import { useNavigation } from '@react-navigation/native';
import { Plus, Server, Power, Trash2, Settings as SettingsIcon, Search, Zap } from 'lucide-react-native';
import { useMCP } from '@/contexts/MCPContext';
import Colors from '@/constants/colors';
import { POPULAR_MCP_SERVERS } from '@/constants/mcpServers';

export default function MCPScreen() {
  const navigation = useNavigation();
  const mcp = useMCP();
  const [searchQuery, setSearchQuery] = useState<string>('');
  const [showPopular, setShowPopular] = useState<boolean>(true);

  const filteredServers = mcp.servers.filter(server =>
    server.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
    server.description?.toLowerCase().includes(searchQuery.toLowerCase())
  );

  const filteredPopular = POPULAR_MCP_SERVERS.filter(server =>
    server.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
    server.description.toLowerCase().includes(searchQuery.toLowerCase())
  );

  const handleAddPopularServer = (popularServer: typeof POPULAR_MCP_SERVERS[0]) => {
    const exists = mcp.servers.some(s => s.name === popularServer.name);
    if (exists) {
      Alert.alert('Already Added', 'This server is already in your list.');
      return;
    }

    mcp.addServer({
      name: popularServer.name,
      description: popularServer.description,
      command: popularServer.command,
      args: popularServer.args,
      transportType: 'stdio',
      enabled: false,
      source: 'mcp.so',
      icon: popularServer.icon,
      category: popularServer.category,
    });

    Alert.alert('Success', `${popularServer.name} has been added to your servers.`);
  };

  const handleToggleServer = async (id: string) => {
    const server = mcp.servers.find(s => s.id === id);
    if (!server) return;

    if (!server.enabled) {
      mcp.toggleServer(id);
      await mcp.connectServer(id);
    } else {
      await mcp.disconnectServer(id);
      mcp.toggleServer(id);
    }
  };

  const handleDeleteServer = (id: string) => {
    const server = mcp.servers.find(s => s.id === id);
    if (!server) return;

    Alert.alert(
      'Delete Server',
      `Are you sure you want to delete ${server.name}?`,
      [
        { text: 'Cancel', style: 'cancel' },
        {
          text: 'Delete',
          style: 'destructive',
          onPress: () => mcp.removeServer(id),
        },
      ]
    );
  };

  const renderServerCard = (server: typeof mcp.servers[0]) => {
    const status = mcp.serverStatuses[server.id];
    const isConnected = status?.connected || false;
    const isConnecting = mcp.isLoading && server.enabled && !isConnected;

    return (
      <View key={server.id} style={styles.serverCard}>
        <View style={styles.serverHeader}>
          <View style={styles.serverInfo}>
            {server.icon && <Text style={styles.serverIcon}>{server.icon}</Text>}
            <View style={styles.serverText}>
              <Text style={styles.serverName}>{server.name}</Text>
              {server.description && (
                <Text style={styles.serverDescription} numberOfLines={2}>
                  {server.description}
                </Text>
              )}
              {server.category && (
                <Text style={styles.serverCategory}>{server.category}</Text>
              )}
            </View>
          </View>
          <View style={styles.serverActions}>
            <TouchableOpacity
              style={[
                styles.toggleButton,
                server.enabled && styles.toggleButtonActive,
              ]}
              onPress={() => handleToggleServer(server.id)}
              disabled={isConnecting}
            >
              {isConnecting ? (
                <ActivityIndicator size="small" color={Colors.background} />
              ) : (
                <Power
                  size={18}
                  color={server.enabled ? Colors.background : Colors.textSecondary}
                />
              )}
            </TouchableOpacity>
            <TouchableOpacity
              style={styles.deleteButton}
              onPress={() => handleDeleteServer(server.id)}
            >
              <Trash2 size={18} color={Colors.error} />
            </TouchableOpacity>
          </View>
        </View>

        {isConnected && status.capabilities && (
          <View style={styles.capabilities}>
            <Text style={styles.capabilitiesTitle}>Capabilities:</Text>
            <View style={styles.capabilityTags}>
              {status.capabilities.resources && status.capabilities.resources.length > 0 && (
                <View style={styles.capabilityTag}>
                  <Text style={styles.capabilityText}>
                    {status.capabilities.resources.length} Resources
                  </Text>
                </View>
              )}
              {status.capabilities.tools && status.capabilities.tools.length > 0 && (
                <View style={styles.capabilityTag}>
                  <Text style={styles.capabilityText}>
                    {status.capabilities.tools.length} Tools
                  </Text>
                </View>
              )}
              {status.capabilities.prompts && status.capabilities.prompts.length > 0 && (
                <View style={styles.capabilityTag}>
                  <Text style={styles.capabilityText}>
                    {status.capabilities.prompts.length} Prompts
                  </Text>
                </View>
              )}
            </View>
          </View>
        )}

        {status?.error && (
          <View style={styles.errorContainer}>
            <Text style={styles.errorText}>{status.error}</Text>
          </View>
        )}
      </View>
    );
  };

  const renderPopularServerCard = (server: typeof POPULAR_MCP_SERVERS[0], index: number) => {
    return (
      <TouchableOpacity
        key={index}
        style={styles.popularCard}
        onPress={() => handleAddPopularServer(server)}
      >
        <View style={styles.popularHeader}>
          {server.icon && <Text style={styles.popularIcon}>{server.icon}</Text>}
          <View style={styles.popularInfo}>
            <Text style={styles.popularName}>{server.name}</Text>
            {server.vendor && (
              <Text style={styles.popularVendor}>by {server.vendor}</Text>
            )}
          </View>
          <Plus size={20} color={Colors.primary} />
        </View>
        <Text style={styles.popularDescription} numberOfLines={2}>
          {server.description}
        </Text>
        {server.category && (
          <Text style={styles.popularCategory}>{server.category}</Text>
        )}
      </TouchableOpacity>
    );
  };

  useEffect(() => {
    navigation.setOptions({
      title: 'MCP Servers',
      headerStyle: { backgroundColor: Colors.surface },
      headerTintColor: Colors.text,
      headerRight: () => (
        <TouchableOpacity
          onPress={() => navigation.navigate('add-mcp-server')}
          style={styles.headerButton}
        >
          <Plus size={24} color={Colors.primary} />
        </TouchableOpacity>
      ),
    });
  }, [navigation]);

  return (
    <View style={styles.container}>
      <View style={styles.searchContainer}>
        <Search size={20} color={Colors.textSecondary} style={styles.searchIcon} />
        <TextInput
          style={styles.searchInput}
          placeholder="Search servers..."
          placeholderTextColor={Colors.textSecondary}
          value={searchQuery}
          onChangeText={setSearchQuery}
        />
      </View>

      <ScrollView style={styles.content} showsVerticalScrollIndicator={false}>
        <TouchableOpacity
          style={styles.addCustomCard}
          onPress={() => navigation.navigate('add-mcp-server' as any)}
        >
          <View style={styles.addCustomHeader}>
            <View style={styles.addCustomIcon}>
              <Zap size={24} color={Colors.primary} />
            </View>
            <View style={styles.addCustomText}>
              <Text style={styles.addCustomTitle}>Add Custom MCP Server</Text>
              <Text style={styles.addCustomDescription}>
                Connect to your own MCP server using stdio, SSE, or HTTP
              </Text>
            </View>
            <Plus size={24} color={Colors.primary} />
          </View>
        </TouchableOpacity>

        <View style={styles.section}>
          <View style={styles.sectionHeader}>
            <Server size={20} color={Colors.text} />
            <Text style={styles.sectionTitle}>My Servers</Text>
            <Text style={styles.sectionCount}>({mcp.servers.length})</Text>
          </View>

          {filteredServers.length === 0 ? (
            <View style={styles.emptyState}>
              <Server size={48} color={Colors.textSecondary} />
              <Text style={styles.emptyText}>
                {searchQuery ? 'No servers found' : 'No servers added yet'}
              </Text>
              <Text style={styles.emptySubtext}>
                {searchQuery
                  ? 'Try a different search term'
                  : 'Add servers from the popular list below or create a custom one'}
              </Text>
            </View>
          ) : (
            filteredServers.map(renderServerCard)
          )}
        </View>

        <View style={styles.section}>
          <TouchableOpacity
            style={styles.sectionHeader}
            onPress={() => setShowPopular(!showPopular)}
          >
            <SettingsIcon size={20} color={Colors.text} />
            <Text style={styles.sectionTitle}>Popular from mcp.so</Text>
            <Text style={styles.sectionCount}>({POPULAR_MCP_SERVERS.length})</Text>
          </TouchableOpacity>

          {showPopular && (
            <View style={styles.popularGrid}>
              {filteredPopular.map(renderPopularServerCard)}
            </View>
          )}
        </View>
      </ScrollView>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: Colors.background,
  },
  headerButton: {
    marginRight: 16,
  },
  searchContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: Colors.surface,
    margin: 16,
    marginBottom: 8,
    paddingHorizontal: 16,
    paddingVertical: 12,
    borderRadius: 12,
    borderWidth: 1,
    borderColor: Colors.border,
  },
  searchIcon: {
    marginRight: 8,
  },
  searchInput: {
    flex: 1,
    fontSize: 16,
    color: Colors.text,
  },
  content: {
    flex: 1,
  },
  section: {
    marginBottom: 24,
  },
  sectionHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 16,
    paddingVertical: 12,
    gap: 8,
  },
  sectionTitle: {
    fontSize: 18,
    fontWeight: '600' as const,
    color: Colors.text,
  },
  sectionCount: {
    fontSize: 16,
    color: Colors.textSecondary,
  },
  serverCard: {
    backgroundColor: Colors.surface,
    marginHorizontal: 16,
    marginBottom: 12,
    padding: 16,
    borderRadius: 12,
    borderWidth: 1,
    borderColor: Colors.border,
  },
  serverHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'flex-start',
  },
  serverInfo: {
    flex: 1,
    flexDirection: 'row',
    gap: 12,
  },
  serverIcon: {
    fontSize: 32,
  },
  serverText: {
    flex: 1,
  },
  serverName: {
    fontSize: 16,
    fontWeight: '600' as const,
    color: Colors.text,
    marginBottom: 4,
  },
  serverDescription: {
    fontSize: 14,
    color: Colors.textSecondary,
    marginBottom: 4,
  },
  serverCategory: {
    fontSize: 12,
    color: Colors.primary,
    fontWeight: '500' as const,
  },
  serverActions: {
    flexDirection: 'row',
    gap: 8,
  },
  toggleButton: {
    width: 36,
    height: 36,
    borderRadius: 18,
    backgroundColor: Colors.border,
    justifyContent: 'center',
    alignItems: 'center',
  },
  toggleButtonActive: {
    backgroundColor: Colors.primary,
  },
  deleteButton: {
    width: 36,
    height: 36,
    borderRadius: 18,
    backgroundColor: Colors.surface,
    borderWidth: 1,
    borderColor: Colors.border,
    justifyContent: 'center',
    alignItems: 'center',
  },
  capabilities: {
    marginTop: 12,
    paddingTop: 12,
    borderTopWidth: 1,
    borderTopColor: Colors.border,
  },
  capabilitiesTitle: {
    fontSize: 14,
    fontWeight: '600' as const,
    color: Colors.text,
    marginBottom: 8,
  },
  capabilityTags: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 8,
  },
  capabilityTag: {
    backgroundColor: Colors.background,
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: 8,
  },
  capabilityText: {
    fontSize: 12,
    color: Colors.text,
    fontWeight: '500' as const,
  },
  errorContainer: {
    marginTop: 12,
    padding: 12,
    backgroundColor: Colors.background,
    borderRadius: 8,
    borderWidth: 1,
    borderColor: Colors.error,
  },
  errorText: {
    fontSize: 12,
    color: Colors.error,
  },
  emptyState: {
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: 48,
    paddingHorizontal: 32,
  },
  emptyText: {
    fontSize: 18,
    fontWeight: '600' as const,
    color: Colors.text,
    marginTop: 16,
    marginBottom: 8,
  },
  emptySubtext: {
    fontSize: 14,
    color: Colors.textSecondary,
    textAlign: 'center',
  },
  popularGrid: {
    paddingHorizontal: 16,
  },
  popularCard: {
    backgroundColor: Colors.surface,
    padding: 16,
    borderRadius: 12,
    borderWidth: 1,
    borderColor: Colors.border,
    marginBottom: 12,
  },
  popularHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 8,
    gap: 12,
  },
  popularIcon: {
    fontSize: 28,
  },
  popularInfo: {
    flex: 1,
  },
  popularName: {
    fontSize: 16,
    fontWeight: '600' as const,
    color: Colors.text,
  },
  popularVendor: {
    fontSize: 12,
    color: Colors.textSecondary,
    marginTop: 2,
  },
  popularDescription: {
    fontSize: 14,
    color: Colors.textSecondary,
    marginBottom: 8,
  },
  popularCategory: {
    fontSize: 12,
    color: Colors.primary,
    fontWeight: '500' as const,
  },
  addCustomCard: {
    backgroundColor: Colors.surface,
    marginHorizontal: 16,
    marginTop: 8,
    marginBottom: 16,
    padding: 20,
    borderRadius: 16,
    borderWidth: 2,
    borderColor: Colors.primary,
    borderStyle: 'dashed' as const,
  },
  addCustomHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 16,
  },
  addCustomIcon: {
    width: 48,
    height: 48,
    borderRadius: 24,
    backgroundColor: Colors.background,
    justifyContent: 'center',
    alignItems: 'center',
  },
  addCustomText: {
    flex: 1,
  },
  addCustomTitle: {
    fontSize: 18,
    fontWeight: '700' as const,
    color: Colors.text,
    marginBottom: 4,
  },
  addCustomDescription: {
    fontSize: 14,
    color: Colors.textSecondary,
    lineHeight: 20,
  },
});
