import Constants from "expo-constants";
import { getToken } from "./tokenStore";

/**
 * Ported from frontend/src/lib/apiClient.ts. Two intentional changes for RN:
 *  1. Base URL comes from config (expo-constants `extra.apiUrl`) instead of the
 *     hardcoded "/api" relative path — RN has no page origin.
 *  2. Auth is a Bearer header read from SecureStore instead of `credentials:
 *     "include"` — RN has no ambient cookie jar.
 *
 * Paths are backend-relative and carry no "/api" prefix (e.g. "/auth/login").
 * In dev, apiUrl is the Express origin (http://<lan-ip>:4000). In prod, apiUrl
 * is the Vercel origin's "/api" mount, which strips the prefix before Express.
 */

// app.config.ts populates extra.apiUrl from EXPO_PUBLIC_API_URL at build time.
const BASE_URL: string =
  (Constants.expoConfig?.extra as { apiUrl?: string } | undefined)?.apiUrl ?? "http://localhost:4000";

export class ApiError extends Error {
  status: number;
  constructor(status: number, message: string) {
    super(message);
    this.status = status;
  }
}

async function request<T>(path: string, options: RequestInit = {}): Promise<T> {
  const token = await getToken();

  const res = await fetch(`${BASE_URL}${path}`, {
    ...options,
    headers: {
      "Content-Type": "application/json",
      ...(token ? { Authorization: `Bearer ${token}` } : {}),
      ...(options.headers ?? {}),
    },
  });

  const isJson = res.headers.get("content-type")?.includes("application/json");
  const body = isJson ? await res.json() : null;

  if (!res.ok) {
    const message = (body && (body.error as string)) || res.statusText || "Request failed";
    throw new ApiError(res.status, message);
  }

  return body as T;
}

export const api = {
  get: <T>(path: string) => request<T>(path, { method: "GET" }),
  post: <T>(path: string, data?: unknown) =>
    request<T>(path, { method: "POST", body: data !== undefined ? JSON.stringify(data) : undefined }),
  patch: <T>(path: string, data?: unknown) =>
    request<T>(path, { method: "PATCH", body: data !== undefined ? JSON.stringify(data) : undefined }),
  delete: <T>(path: string) => request<T>(path, { method: "DELETE" }),
};

export const apiBaseUrl = BASE_URL;
