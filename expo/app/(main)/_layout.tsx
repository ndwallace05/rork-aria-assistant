// template
import { createBottomTabNavigator } from "@react-navigation/bottom-tabs";
import { MessageSquare, Settings, Server } from "lucide-react-native";
import React from "react";

import Colors from "@/constants/colors";
import ChatsScreen from "./chats";
import MCPScreen from "./mcp";
import SettingsScreen from "./settings";

const Tab = createBottomTabNavigator();

export default function TabLayout() {
  return (
    <Tab.Navigator
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
      <Tab.Screen
        name="chats"
        component={ChatsScreen}
        options={{
          title: "Chats",
          tabBarIcon: ({ color }) => <MessageSquare size={24} color={color} />,
        }}
      />
      <Tab.Screen
        name="mcp"
        component={MCPScreen}
        options={{
          title: "MCP",
          tabBarIcon: ({ color }) => <Server size={24} color={color} />,
        }}
      />
      <Tab.Screen
        name="settings"
        component={SettingsScreen}
        options={{
          title: "Settings",
          tabBarIcon: ({ color }) => <Settings size={24} color={color} />,
        }}
      />
    </Tab.Navigator>
  );
}
