import React from 'react';
import { NavigationContainer } from '@react-navigation/native';
import { createStackNavigator } from '@react-navigation/stack';
import TabLayout from '../(main)/_layout';
import ChatScreen from '../chat';
import AddMCPServerScreen from '../add-mcp-server';
import LocalModelsScreen from '../local-models';
import NotFoundScreen from '../+not-found';

const Stack = createStackNavigator();

export default function RootNavigator() {
  return (
    <NavigationContainer>
      <Stack.Navigator>
        <Stack.Screen name="(main)" component={TabLayout} options={{ headerShown: false }} />
        <Stack.Screen name="chat" component={ChatScreen} options={{ headerShown: false }} />
        <Stack.Screen name="add-mcp-server" component={AddMCPServerScreen} />
        <Stack.Screen name="local-models" component={LocalModelsScreen} />
        <Stack.Screen name="+not-found" component={NotFoundScreen} options={{ title: 'Oops!' }} />
      </Stack.Navigator>
    </NavigationContainer>
  );
}
