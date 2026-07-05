import { createContext, useCallback, useContext, useEffect, useState, type ReactNode } from "react";
import { api, ApiError } from "../lib/apiClient";
import { clearToken, getToken, setToken } from "../lib/tokenStore";
import type { Role, User } from "../lib/types";

/**
 * Ported from frontend/src/context/AuthContext.tsx. The web version relied on
 * the browser sending the httpOnly cookie automatically; here the token is
 * persisted in SecureStore and login/register capture the `token` the backend
 * now returns in the response body.
 */

interface AuthContextValue {
  user: User | null;
  loading: boolean;
  login: (email: string, password: string) => Promise<void>;
  register: (email: string, password: string, name: string, role: Role) => Promise<void>;
  logout: () => Promise<void>;
}

const AuthContext = createContext<AuthContextValue | null>(null);

export function AuthProvider({ children }: { children: ReactNode }) {
  const [user, setUser] = useState<User | null>(null);
  const [loading, setLoading] = useState(true);

  // On launch, restore the session if a token is present in secure storage.
  useEffect(() => {
    (async () => {
      try {
        const token = await getToken();
        if (!token) return;
        const res = await api.get<{ user: User }>("/auth/me");
        setUser(res.user);
      } catch (err) {
        // A 401 means the stored token is stale/invalid — drop it silently.
        if (err instanceof ApiError && err.status === 401) {
          await clearToken();
        } else {
          console.error(err);
        }
      } finally {
        setLoading(false);
      }
    })();
  }, []);

  const login = useCallback(async (email: string, password: string) => {
    const res = await api.post<{ user: User; token: string }>("/auth/login", { email, password });
    await setToken(res.token);
    setUser(res.user);
  }, []);

  const register = useCallback(async (email: string, password: string, name: string, role: Role) => {
    const res = await api.post<{ user: User; token: string }>("/auth/register", { email, password, name, role });
    await setToken(res.token);
    setUser(res.user);
  }, []);

  const logout = useCallback(async () => {
    try {
      await api.post("/auth/logout");
    } catch {
      // Logout is best-effort; clear local state regardless of the network call.
    }
    await clearToken();
    setUser(null);
  }, []);

  return (
    <AuthContext.Provider value={{ user, loading, login, register, logout }}>{children}</AuthContext.Provider>
  );
}

export function useAuth(): AuthContextValue {
  const ctx = useContext(AuthContext);
  if (!ctx) throw new Error("useAuth must be used within an AuthProvider");
  return ctx;
}
