import { QueryClientProvider } from "@tanstack/react-query";
import { memo, type PropsWithChildren } from "react";
import { GestureHandlerRootView } from "react-native-gesture-handler";
import { SafeAreaProvider } from "react-native-safe-area-context";

import { queryClient } from "@/src/lib/query-client";

function AppProvidersComponent({ children }: PropsWithChildren) {
  return (
    <GestureHandlerRootView className="flex-1 bg-surface">
      <SafeAreaProvider>
        <QueryClientProvider client={queryClient}>{children}</QueryClientProvider>
      </SafeAreaProvider>
    </GestureHandlerRootView>
  );
}

export const AppProviders = memo(AppProvidersComponent);
