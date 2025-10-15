import React, { useState, useEffect } from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  TextInput,
  TouchableOpacity,
  Alert,
} from 'react-native';
import { useNavigation } from '@react-navigation/native';
import { useMCP } from '@/contexts/MCPContext';
import Colors from '@/constants/colors';
import type { MCPTransportType } from '@/types/mcp';

export default function AddMCPServerScreen() {
  const navigation = useNavigation();
  const mcp = useMCP();
  const [name, setName] = useState<string>('');
  const [description, setDescription] = useState<string>('');
  const [transportType, setTransportType] = useState<MCPTransportType>('stdio');
  const [command, setCommand] = useState<string>('');
  const [args, setArgs] = useState<string>('');
  const [url, setUrl] = useState<string>('');

  const handleSave = () => {
    if (!name.trim()) {
      Alert.alert('Error', 'Please enter a server name');
      return;
    }

    if (transportType === 'stdio' && !command.trim()) {
      Alert.alert('Error', 'Please enter a command for stdio transport');
      return;
    }

    if ((transportType === 'sse' || transportType === 'streamable-http') && !url.trim()) {
      Alert.alert('Error', 'Please enter a URL for HTTP-based transport');
      return;
    }

    const serverData = {
      name: name.trim(),
      description: description.trim() || undefined,
      transportType,
      enabled: false,
      source: 'manual' as const,
      ...(transportType === 'stdio' && {
        command: command.trim(),
        args: args.trim() ? args.trim().split(' ').filter(Boolean) : undefined,
      }),
      ...(transportType !== 'stdio' && {
        url: url.trim(),
      }),
    };

    mcp.addServer(serverData);
    Alert.alert('Success', 'Server added successfully', [
      { text: 'OK', onPress: () => navigation.goBack() },
    ]);
  };

  useEffect(() => {
    navigation.setOptions({
      title: 'Add MCP Server',
      headerStyle: { backgroundColor: Colors.surface },
      headerTintColor: Colors.text,
    });
  }, [navigation]);

  return (
    <View style={styles.container}>
      <ScrollView style={styles.content} showsVerticalScrollIndicator={false}>
        <View style={styles.section}>
          <Text style={styles.label}>Server Name *</Text>
          <TextInput
            style={styles.input}
            placeholder="e.g., My Custom Server"
            placeholderTextColor={Colors.textSecondary}
            value={name}
            onChangeText={setName}
          />
        </View>

        <View style={styles.section}>
          <Text style={styles.label}>Description</Text>
          <TextInput
            style={[styles.input, styles.textArea]}
            placeholder="What does this server do?"
            placeholderTextColor={Colors.textSecondary}
            value={description}
            onChangeText={setDescription}
            multiline
            numberOfLines={3}
          />
        </View>

        <View style={styles.section}>
          <Text style={styles.label}>Transport Type *</Text>
          <View style={styles.transportButtons}>
            <TouchableOpacity
              style={[
                styles.transportButton,
                transportType === 'stdio' && styles.transportButtonActive,
              ]}
              onPress={() => setTransportType('stdio')}
            >
              <Text
                style={[
                  styles.transportButtonText,
                  transportType === 'stdio' && styles.transportButtonTextActive,
                ]}
              >
                Stdio
              </Text>
            </TouchableOpacity>
            <TouchableOpacity
              style={[
                styles.transportButton,
                transportType === 'sse' && styles.transportButtonActive,
              ]}
              onPress={() => setTransportType('sse')}
            >
              <Text
                style={[
                  styles.transportButtonText,
                  transportType === 'sse' && styles.transportButtonTextActive,
                ]}
              >
                SSE
              </Text>
            </TouchableOpacity>
            <TouchableOpacity
              style={[
                styles.transportButton,
                transportType === 'streamable-http' && styles.transportButtonActive,
              ]}
              onPress={() => setTransportType('streamable-http')}
            >
              <Text
                style={[
                  styles.transportButtonText,
                  transportType === 'streamable-http' && styles.transportButtonTextActive,
                ]}
              >
                HTTP
              </Text>
            </TouchableOpacity>
          </View>
        </View>

        {transportType === 'stdio' ? (
          <>
            <View style={styles.section}>
              <Text style={styles.label}>Command *</Text>
              <TextInput
                style={styles.input}
                placeholder="e.g., npx"
                placeholderTextColor={Colors.textSecondary}
                value={command}
                onChangeText={setCommand}
              />
              <Text style={styles.hint}>
                The command to execute (e.g., npx, node, python)
              </Text>
            </View>

            <View style={styles.section}>
              <Text style={styles.label}>Arguments</Text>
              <TextInput
                style={styles.input}
                placeholder="e.g., -y @modelcontextprotocol/server-fetch"
                placeholderTextColor={Colors.textSecondary}
                value={args}
                onChangeText={setArgs}
              />
              <Text style={styles.hint}>
                Space-separated arguments for the command
              </Text>
            </View>
          </>
        ) : (
          <View style={styles.section}>
            <Text style={styles.label}>Server URL *</Text>
            <TextInput
              style={styles.input}
              placeholder="e.g., https://example.com/mcp"
              placeholderTextColor={Colors.textSecondary}
              value={url}
              onChangeText={setUrl}
              autoCapitalize="none"
              autoCorrect={false}
            />
            <Text style={styles.hint}>
              The URL endpoint for the MCP server
            </Text>
          </View>
        )}

        <View style={styles.infoBox}>
          <Text style={styles.infoTitle}>About MCP Servers</Text>
          <Text style={styles.infoText}>
            MCP (Model Context Protocol) servers provide additional capabilities to AI models
            through Resources, Tools, and Prompts. You can connect to servers using different
            transport protocols:
          </Text>
          <Text style={styles.infoText}>
            • <Text style={styles.infoBold}>Stdio</Text>: Local command-line servers (npx, node, python)
          </Text>
          <Text style={styles.infoText}>
            • <Text style={styles.infoBold}>SSE</Text>: Server-Sent Events over HTTP
          </Text>
          <Text style={styles.infoText}>
            • <Text style={styles.infoBold}>HTTP</Text>: Standard HTTP streaming
          </Text>
        </View>

        <TouchableOpacity style={styles.saveButton} onPress={handleSave}>
          <Text style={styles.saveButtonText}>Add Server</Text>
        </TouchableOpacity>
      </ScrollView>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: Colors.background,
  },
  content: {
    flex: 1,
    padding: 16,
  },
  section: {
    marginBottom: 24,
  },
  label: {
    fontSize: 16,
    fontWeight: '600' as const,
    color: Colors.text,
    marginBottom: 8,
  },
  input: {
    backgroundColor: Colors.surface,
    borderWidth: 1,
    borderColor: Colors.border,
    borderRadius: 12,
    paddingHorizontal: 16,
    paddingVertical: 12,
    fontSize: 16,
    color: Colors.text,
  },
  textArea: {
    minHeight: 80,
    textAlignVertical: 'top',
  },
  hint: {
    fontSize: 12,
    color: Colors.textSecondary,
    marginTop: 4,
  },
  transportButtons: {
    flexDirection: 'row',
    gap: 8,
  },
  transportButton: {
    flex: 1,
    paddingVertical: 12,
    paddingHorizontal: 16,
    borderRadius: 12,
    backgroundColor: Colors.surface,
    borderWidth: 1,
    borderColor: Colors.border,
    alignItems: 'center',
  },
  transportButtonActive: {
    backgroundColor: Colors.primary,
    borderColor: Colors.primary,
  },
  transportButtonText: {
    fontSize: 14,
    fontWeight: '600' as const,
    color: Colors.text,
  },
  transportButtonTextActive: {
    color: Colors.background,
  },
  infoBox: {
    backgroundColor: Colors.surface,
    padding: 16,
    borderRadius: 12,
    borderWidth: 1,
    borderColor: Colors.border,
    marginBottom: 24,
  },
  infoTitle: {
    fontSize: 16,
    fontWeight: '600' as const,
    color: Colors.text,
    marginBottom: 8,
  },
  infoText: {
    fontSize: 14,
    color: Colors.textSecondary,
    marginBottom: 4,
    lineHeight: 20,
  },
  infoBold: {
    fontWeight: '600' as const,
    color: Colors.text,
  },
  saveButton: {
    backgroundColor: Colors.primary,
    paddingVertical: 16,
    borderRadius: 12,
    alignItems: 'center',
    marginBottom: 32,
  },
  saveButtonText: {
    fontSize: 16,
    fontWeight: '600' as const,
    color: Colors.background,
  },
});
