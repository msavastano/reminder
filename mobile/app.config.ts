/// <reference types="node" />
import type { ExpoConfig } from "expo/config";

/**
 * The API base URL is read from EXPO_PUBLIC_API_URL and surfaced through
 * `extra.apiUrl` so the app can reach it via expo-constants at runtime.
 *
 * Dev: point at the LAN address of the local Express backend, e.g.
 *   EXPO_PUBLIC_API_URL="http://192.168.1.20:4000"   (a physical iPhone on
 *   Expo Go cannot reach "localhost" — use the dev machine's LAN IP).
 * Prod: the deployed Vercel origin (the API lives under /api there), e.g.
 *   EXPO_PUBLIC_API_URL="https://reminder.example.vercel.app/api"
 */
const apiUrl = process.env.EXPO_PUBLIC_API_URL ?? "http://localhost:4000";

const config: ExpoConfig = {
  name: "Reminder",
  // slug + owner + extra.eas.projectId must match the EAS project on expo.dev so
  // non-interactive (GitHub/dashboard-triggered) builds resolve it without `eas init`.
  slug: "reminder",
  owner: "mikesavastanos-organization",
  version: "1.0.0",
  orientation: "portrait",
  scheme: "remindermobile",
  userInterfaceStyle: "light",
  icon: "./assets/icon.png",
  ios: {
    supportsTablet: true,
    bundleIdentifier: "com.reminder.mobile",
  },
  android: {
    package: "com.reminder.mobile",
    adaptiveIcon: {
      backgroundColor: "#ECE6DA",
      foregroundImage: "./assets/android-icon-foreground.png",
    },
  },
  web: {
    bundler: "metro",
    favicon: "./assets/favicon.png",
  },
  plugins: ["expo-router", "expo-secure-store"],
  extra: {
    apiUrl,
    eas: {
      projectId: "f507d05c-784b-48ca-8f6d-2b4d4f2682af",
    },
  },
};

export default config;
