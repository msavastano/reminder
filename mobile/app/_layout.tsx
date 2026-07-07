import { focusManager, QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { Stack } from "expo-router";
import { StatusBar } from "expo-status-bar";
import { useEffect } from "react";
import { AppState, type AppStateStatus, Platform } from "react-native";
import { SafeAreaProvider } from "react-native-safe-area-context";
import { AuthProvider } from "../src/context/AuthContext";
import { colors } from "../src/theme";

const queryClient = new QueryClient({
  defaultOptions: {
    // refetchInterval keeps screens like the patient's reminders list in sync
    // with changes a caregiver makes elsewhere, without the patient having to
    // pull-to-refresh. Pairs with the AppState wiring below, which forces an
    // immediate refetch when the app returns to the foreground rather than
    // waiting out the rest of the interval.
    queries: { retry: 1, staleTime: 30_000, refetchInterval: 20_000 },
  },
});

// react-query's focus-based refetching listens to the browser's
// visibilitychange event by default, which native RN screens never fire.
// Wiring AppState to focusManager is the documented RN integration:
// https://tanstack.com/query/latest/docs/framework/react/react-native#refetch-on-app-focus
function onAppStateChange(status: AppStateStatus) {
  if (Platform.OS !== "web") {
    focusManager.setFocused(status === "active");
  }
}

export default function RootLayout() {
  useEffect(() => {
    const subscription = AppState.addEventListener("change", onAppStateChange);
    return () => subscription.remove();
  }, []);

  return (
    <QueryClientProvider client={queryClient}>
      <AuthProvider>
        <SafeAreaProvider>
          <StatusBar style="dark" />
          <Stack
            screenOptions={{
              headerStyle: { backgroundColor: colors.surfacePage },
              headerTintColor: colors.textStrong,
              contentStyle: { backgroundColor: colors.surfacePage },
            }}
          >
            <Stack.Screen name="index" options={{ headerShown: false }} />
            <Stack.Screen name="login" options={{ headerShown: false }} />
            <Stack.Screen name="register" options={{ headerShown: false }} />
            <Stack.Screen name="patient" options={{ title: "Your reminders" }} />
            <Stack.Screen name="caregiver" options={{ title: "Your patients" }} />
            <Stack.Screen name="messages" options={{ title: "Messages" }} />
          </Stack>
        </SafeAreaProvider>
      </AuthProvider>
    </QueryClientProvider>
  );
}
