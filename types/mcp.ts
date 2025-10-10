export type MCPTransportType = 'stdio' | 'sse' | 'streamable-http';

export interface MCPServer {
  id: string;
  name: string;
  description?: string;
  command?: string;
  args?: string[];
  url?: string;
  transportType: MCPTransportType;
  enabled: boolean;
  createdAt: number;
  updatedAt: number;
  source?: 'mcp.so' | 'manual';
  icon?: string;
  category?: string;
}

export interface MCPResource {
  uri: string;
  name: string;
  description?: string;
  mimeType?: string;
}

export interface MCPTool {
  name: string;
  description?: string;
  inputSchema: Record<string, unknown>;
}

export interface MCPPrompt {
  name: string;
  description?: string;
  arguments?: {
    name: string;
    description?: string;
    required?: boolean;
  }[];
}

export interface MCPServerCapabilities {
  resources?: MCPResource[];
  tools?: MCPTool[];
  prompts?: MCPPrompt[];
}

export interface MCPServerStatus {
  serverId: string;
  connected: boolean;
  lastConnected?: number;
  error?: string;
  capabilities?: MCPServerCapabilities;
}

export interface MCPContextValue {
  servers: MCPServer[];
  serverStatuses: Record<string, MCPServerStatus>;
  addServer: (server: Omit<MCPServer, 'id' | 'createdAt' | 'updatedAt'>) => void;
  removeServer: (id: string) => void;
  updateServer: (id: string, updates: Partial<MCPServer>) => void;
  toggleServer: (id: string) => void;
  connectServer: (id: string) => Promise<void>;
  disconnectServer: (id: string) => Promise<void>;
  getServerCapabilities: (id: string) => MCPServerCapabilities | undefined;
  isLoading: boolean;
}

export interface MCPSoServer {
  name: string;
  description: string;
  command: string;
  args?: string[];
  icon?: string;
  category?: string;
  vendor?: string;
  sourceUrl?: string;
}
