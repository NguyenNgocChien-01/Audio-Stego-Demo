"use client";
/**
 * app/auth/authContext.tsx
 * ─────────────────────────────────────────────────────────────
 * Wrap <AuthProvider> vào layout.tsx bọc ngoài <AlgorithmProvider>
 * Dùng: const { user, login, logout, loading } = useAuth();
 */

import {
  createContext, useContext, useState,
  useEffect, useCallback, ReactNode,
} from "react";
import { useRouter } from "next/navigation";

// ─── Types ────────────────────────────────────────────────────
export interface User {
  user_id: number;
  username: string;
  email: string;
  role: "admin" | "user";
  is_active: boolean;
}

interface AuthTokens {
  access_token: string;
  refresh_token: string;
  token_type: string;
}

interface AuthContextValue {
  user: User | null;
  loading: boolean;
  error: string | null;
  isAdmin: boolean;
  hydrated: boolean;
  login: (username: string, password: string) => Promise<void>;
  logout: () => void;
  clearError: () => void;
  getAccessToken: () => Promise<string | null>;
}

// ─── Storage keys ─────────────────────────────────────────────
const KEY_ACCESS  = "sa_access";
const KEY_REFRESH = "sa_refresh";
const KEY_USER    = "sa_user";
const API         = "http://localhost:8000";

// ─── JWT helpers ──────────────────────────────────────────────
function parseJwt(token: string): Record<string, unknown> | null {
  try {
    const b64 = token.split(".")[1].replace(/-/g, "+").replace(/_/g, "/");
    return JSON.parse(atob(b64));
  } catch { return null; }
}

function isExpired(token: string): boolean {
  const p = parseJwt(token);
  if (!p || typeof p.exp !== "number") return true;
  return Date.now() / 1000 > p.exp - 60; // 60s buffer
}

// ─── Context ──────────────────────────────────────────────────
const AuthContext = createContext<AuthContextValue | null>(null);

export function useAuth(): AuthContextValue {
  const ctx = useContext(AuthContext);
  if (!ctx) throw new Error("useAuth must be inside <AuthProvider>");
  return ctx;
}

// ─── Provider ─────────────────────────────────────────────────
export function AuthProvider({ children }: { children: ReactNode }) {
  const router = useRouter();
  const [user, setUser]       = useState<User | null>(null);
  const [loading, setLoading] = useState(false);
  const [error, setError]     = useState<string | null>(null);
  const [hydrated, setHydrated] = useState(false);

  // ── Helpers ───────────────────────────────────────────────
  function clearStorage() {
    localStorage.removeItem(KEY_ACCESS);
    localStorage.removeItem(KEY_REFRESH);
    localStorage.removeItem(KEY_USER);
    setUser(null);
  }

  function saveTokens(tokens: AuthTokens, userData: User) {
    localStorage.setItem(KEY_ACCESS,  tokens.access_token);
    localStorage.setItem(KEY_REFRESH, tokens.refresh_token);
    localStorage.setItem(KEY_USER,    JSON.stringify(userData));
    setUser(userData);
  }

  // ── Fetch user info ───────────────────────────────────────
  async function fetchMe(accessToken: string): Promise<User> {
    const res = await fetch(`${API}/auth/me`, {
      headers: { Authorization: `Bearer ${accessToken}` },
    });
    if (!res.ok) throw new Error("Không thể lấy thông tin người dùng");
    return res.json();
  }

  // ── Silent refresh ────────────────────────────────────────
  const silentRefresh = useCallback(async (): Promise<string | null> => {
    const refresh = localStorage.getItem(KEY_REFRESH);
    if (!refresh) return null;
    try {
      const res = await fetch(`${API}/auth/refresh`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ refresh_token: refresh }),
      });
      if (!res.ok) { clearStorage(); return null; }
      const tokens: AuthTokens = await res.json();
      const userData = await fetchMe(tokens.access_token);
      saveTokens(tokens, userData);
      return tokens.access_token;
    } catch {
      clearStorage();
      return null;
    }
  }, []);

  // ── Hydrate từ localStorage (runs once on mount) ──────────
  useEffect(() => {
    try {
      const raw = localStorage.getItem(KEY_USER);
      const acc = localStorage.getItem(KEY_ACCESS);
      if (raw && acc) {
        setUser(JSON.parse(raw));
      } else {
        clearStorage();
      }
    } catch { 
      clearStorage(); 
    } finally { 
      setHydrated(true); 
    }
  }, []);

  // ── getAccessToken (dùng trong API calls) ─────────────────
  const getAccessToken = useCallback(async (): Promise<string | null> => {
    return localStorage.getItem(KEY_ACCESS);
  }, []);

  // ── Login ─────────────────────────────────────────────────
  const login = useCallback(async (username: string, password: string) => {
    setError(null);
    setLoading(true);
    try {
      // FastAPI OAuth2 dùng form-data
      const fd = new URLSearchParams();
      fd.append("username", username);
      fd.append("password", password);

      const res = await fetch(`${API}/auth/login`, {
        method: "POST",
        headers: { "Content-Type": "application/x-www-form-urlencoded" },
        body: fd,
      });

      if (res.status === 401) throw new Error("Tên đăng nhập hoặc mật khẩu không đúng");
      if (res.status === 403) throw new Error("Tài khoản đã bị vô hiệu hóa");
      if (!res.ok)            throw new Error("Lỗi máy chủ, vui lòng thử lại");

      const tokens: AuthTokens = await res.json();
      const userData = await fetchMe(tokens.access_token);
      saveTokens(tokens, userData);

      // Redirect theo role
      if (userData.role === "admin") router.push("/admin");
      else router.push("/encode");

    } catch (err) {
      setError(err instanceof Error ? err.message : "Đăng nhập thất bại");
    } finally {
      setLoading(false);
    }
  }, [router]);

  // ── Logout ────────────────────────────────────────────────
  const logout = useCallback(() => {
    // Gọi backend revoke (best-effort, không chặn UI)
    const acc = localStorage.getItem(KEY_ACCESS);
    if (acc) {
      fetch(`${API}/auth/logout`, {
        method: "POST",
        headers: { Authorization: `Bearer ${acc}` },
      }).catch(() => {});
    }
    clearStorage();
    router.push("/login");
  }, [router]);

  const clearError = useCallback(() => setError(null), []);

  const value: AuthContextValue = {
    user,
    loading,
    error,
    isAdmin: user?.role === "admin",
    hydrated,
    login,
    logout,
    clearError,
    getAccessToken,
  };

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
}