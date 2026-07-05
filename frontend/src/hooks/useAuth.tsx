import { createContext, useContext, useEffect, useState, type ReactNode } from "react";
import { api, ApiError } from "../lib/api";
import type { User } from "../types/user";

type AuthState = {
  user: User | null;
  isLoading: boolean;
  signup: (email: string, password: string, displayName: string) => Promise<void>;
  login: (email: string, password: string) => Promise<void>;
  logout: () => Promise<void>;
  updateAvatar: (avatarUrl: string) => Promise<void>;
  updateShareLocation: (shareLocation: boolean) => Promise<void>;
};

const AuthContext = createContext<AuthState | null>(null);

export function AuthProvider({ children }: { children: ReactNode }) {
  const [user, setUser] = useState<User | null>(null);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    api
      .get<User>("/auth/me")
      .then(setUser)
      .catch(() => setUser(null))
      .finally(() => setIsLoading(false));
  }, []);

  async function signup(email: string, password: string, displayName: string) {
    const created = await api.post<User>("/auth/signup", { email, password, displayName });
    setUser(created);
  }

  async function login(email: string, password: string) {
    const loggedIn = await api.post<User>("/auth/login", { email, password });
    setUser(loggedIn);
  }

  async function logout() {
    await api.post("/auth/logout");
    setUser(null);
  }

  async function updateAvatar(avatarUrl: string) {
    const updated = await api.patch<User>("/users/me", { avatarUrl });
    setUser(updated);
  }

  async function updateShareLocation(shareLocation: boolean) {
    const updated = await api.patch<User>("/users/me", { shareLocation });
    setUser(updated);
  }

  return (
    <AuthContext.Provider value={{ user, isLoading, signup, login, logout, updateAvatar, updateShareLocation }}>
      {children}
    </AuthContext.Provider>
  );
}

export function useAuth() {
  const ctx = useContext(AuthContext);
  if (!ctx) throw new Error("useAuth must be used within AuthProvider");
  return ctx;
}

export { ApiError };
