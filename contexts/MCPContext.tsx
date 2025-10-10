import createContextHook from '@nkzw/create-context-hook';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { useState, useEffect, useCallback, useMemo } from 'react';
import type { MCPServer, MCPServerStatus, MCPContextValue, MCPServerCapabilities } from '@/types/mcp';

const STORAGE_KEY = '@deepchat_mcp_servers';

export const [MCPProvider, useMCP] = createContextHook((): MCPContextValue => {
  const [servers, setServers] = useState<MCPServer[]>([]);
  const [serverStatuses, setServerStatuses] = useState<Record<string, MCPServerStatus>>({});
  const [isLoading, setIsLoading] = useState<boolean>(false);

  useEffect(() => {
    const loadServers = async () => {
      try {
        const stored = await AsyncStorage.getItem(STORAGE_KEY);
        if (stored) {
          const parsed = JSON.parse(stored);
          setServers(parsed);
          console.log('Loaded MCP servers:', parsed.length);
        }
      } catch (error) {
        console.error('Failed to load MCP servers:', error);
      }
    };

    loadServers();
  }, []);

  useEffect(() => {
    const save = async () => {
      try {
        await AsyncStorage.setItem(STORAGE_KEY, JSON.stringify(servers));
      } catch (error) {
        console.error('Failed to save MCP servers:', error);
      }
    };
    if (servers.length > 0) {
      save();
    }
  }, [servers]);

  const addServer = useCallback((server: Omit<MCPServer, 'id' | 'createdAt' | 'updatedAt'>) => {
    const id = Date.now().toString();
    const newServer: MCPServer = {
      ...server,
      id,
      createdAt: Date.now(),
      updatedAt: Date.now(),
    };
    
    setServers(prev => [...prev, newServer]);
    console.log('Added MCP server:', newServer.name);
  }, []);

  const removeServer = useCallback((id: string) => {
    setServers(prev => prev.filter(s => s.id !== id));
    setServerStatuses(prev => {
      const updated = { ...prev };
      delete updated[id];
      return updated;
    });
    console.log('Removed MCP server:', id);
  }, []);

  const updateServer = useCallback((id: string, updates: Partial<MCPServer>) => {
    setServers(prev =>
      prev.map(s => (s.id === id ? { ...s, ...updates, updatedAt: Date.now() } : s))
    );
    console.log('Updated MCP server:', id);
  }, []);

  const toggleServer = useCallback((id: string) => {
    setServers(prev =>
      prev.map(s => (s.id === id ? { ...s, enabled: !s.enabled, updatedAt: Date.now() } : s))
    );
  }, []);

  const connectServer = useCallback(async (id: string) => {
    const server = servers.find(s => s.id === id);
    if (!server) {
      console.error('Server not found:', id);
      return;
    }

    setIsLoading(true);
    setServerStatuses(prev => ({
      ...prev,
      [id]: {
        serverId: id,
        connected: false,
        error: undefined,
      },
    }));

    try {
      console.log('Connecting to MCP server:', server.name);
      
      await new Promise(resolve => setTimeout(resolve, 1000));

      const mockCapabilities: MCPServerCapabilities = {
        resources: [
          {
            uri: 'file://example',
            name: 'Example Resource',
            description: 'An example resource',
          },
        ],
        tools: [
          {
            name: 'example_tool',
            description: 'An example tool',
            inputSchema: {},
          },
        ],
        prompts: [
          {
            name: 'example_prompt',
            description: 'An example prompt',
          },
        ],
      };

      setServerStatuses(prev => ({
        ...prev,
        [id]: {
          serverId: id,
          connected: true,
          lastConnected: Date.now(),
          capabilities: mockCapabilities,
        },
      }));

      console.log('Connected to MCP server:', server.name);
    } catch (error) {
      console.error('Failed to connect to MCP server:', error);
      setServerStatuses(prev => ({
        ...prev,
        [id]: {
          serverId: id,
          connected: false,
          error: error instanceof Error ? error.message : 'Connection failed',
        },
      }));
    } finally {
      setIsLoading(false);
    }
  }, [servers]);

  const disconnectServer = useCallback(async (id: string) => {
    console.log('Disconnecting from MCP server:', id);
    setServerStatuses(prev => ({
      ...prev,
      [id]: {
        serverId: id,
        connected: false,
      },
    }));
  }, []);

  const getServerCapabilities = useCallback((id: string): MCPServerCapabilities | undefined => {
    return serverStatuses[id]?.capabilities;
  }, [serverStatuses]);

  return useMemo(() => ({
    servers,
    serverStatuses,
    addServer,
    removeServer,
    updateServer,
    toggleServer,
    connectServer,
    disconnectServer,
    getServerCapabilities,
    isLoading,
  }), [servers, serverStatuses, addServer, removeServer, updateServer, toggleServer, connectServer, disconnectServer, getServerCapabilities, isLoading]);
});
