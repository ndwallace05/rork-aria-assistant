// template
import { Tabs } from "expo-router";
import { MessageSquare, Settings, Server } from "lucide-react-native";
import React from "react";

import Colors from "@/constants/colors";

export default function TabLayout() {
  return (
    <Tabs
      screenOptions={{
        tabBarActiveTintColor: Colors.primary,
        headerShown: false,
        tabBarStyle: {
          backgroundColor: Colors.surface,
          borderTopColor: Colors.border,
          borderTopWidth: 1,
        },
      }}
    >
      <Tabs.Screen
        name="chats"
        options={{
          title: "Chats",
          tabBarIcon: ({ color }) => <MessageSquare size={24} color={color} />,
        }}
      />
      <Tabs.Screen
        name="mcp"
        options={{
          title: "MCP",
          tabBarIcon: ({ color }) => <Server size={24} color={color} />,
        }}
      />
      <Tabs.Screen
        name="settings"
        options={{
          title: "Settings",
          tabBarIcon: ({ color }) => <Settings size={24} color={color} />,
        }}
      />
    </Tabs>
  );
}
