import * as SecureStore from "expo-secure-store";

/**
 * Auth-token persistence backed by expo-secure-store (iOS Keychain / Android
 * Keystore). Tokens are never placed in AsyncStorage. The JWT the backend
 * returns in the login/register response body is stored here and attached as a
 * Bearer header by the API client.
 *
 * UNVERIFIED-NEEDS-DEVICE: Keychain read/write and persistence across app
 * launches can only be confirmed on a physical device.
 */

const TOKEN_KEY = "reminder_auth_token";

export async function getToken(): Promise<string | null> {
  return SecureStore.getItemAsync(TOKEN_KEY);
}

export async function setToken(token: string): Promise<void> {
  await SecureStore.setItemAsync(TOKEN_KEY, token);
}

export async function clearToken(): Promise<void> {
  await SecureStore.deleteItemAsync(TOKEN_KEY);
}
