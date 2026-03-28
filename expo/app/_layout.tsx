// template
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import React, { useEffect } from "react";
import { GestureHandlerRootView } from "react-native-gesture-handler";
import SplashScreen from "react-native-splash-screen";
import { ChatProvider } from "@/contexts/ChatContext";
import { LLMProviderContext } from "@/contexts/LLMContext";
import { MCPProvider } from "@/contexts/MCPContext";
import { LocalLLMContext } from "@/contexts/LocalLLMContext";
import { trpc, trpcClient } from "@/lib/trpc";

const queryClient = new QueryClient();

export default function RootLayout() {
  useEffect(() => {
    SplashScreen.hide();
  }, []);

  return (
    <trpc.Provider client={trpcClient} queryClient={queryClient}>
      <QueryClientProvider client={queryClient}>
        <LocalLLMContext>
          <LLMProviderContext>
            <MCPProvider>
              <ChatProvider>
                <GestureHandlerRootView>
                  <RootNavigator />
                </GestureHandlerRootView>
              </ChatProvider>
            </MCPProvider>
          </LLMProviderContext>
        </LocalLLMContext>
      </QueryClientProvider>
    </trpc.Provider>
  );
}
