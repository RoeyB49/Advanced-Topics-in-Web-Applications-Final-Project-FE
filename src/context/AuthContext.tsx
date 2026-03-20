import {
  createContext,
  useCallback,
  useContext,
  useEffect,
  useMemo,
  useState,
  type ReactNode,
} from "react";
import { api } from "../services/api";
import type { AuthResponse, User } from "../types";

type AuthContextType = {
  user: User | null;
  loading: boolean;
  login: (email: string, password: string) => Promise<void>;
  register: (
    username: string,
    email: string,
    password: string,
  ) => Promise<void>;
  socialLogin: (
    provider: "google" | "facebook",
    payload: {
      token: string;
    },
  ) => Promise<void>;
  logout: () => Promise<void>;
  refreshProfile: () => Promise<void>;
};

const AuthContext = createContext<AuthContextType | undefined>(undefined);

const setTokens = (accessToken: string, refreshToken: string) => {
  localStorage.setItem("accessToken", accessToken);
  localStorage.setItem("refreshToken", refreshToken);
};

const clearTokens = () => {
  localStorage.removeItem("accessToken");
  localStorage.removeItem("refreshToken");
};

export const AuthProvider = ({ children }: { children: ReactNode }) => {
  const [user, setUser] = useState<User | null>(null);
  const [loading, setLoading] = useState(true);

  const refreshProfile = useCallback(async () => {
    try {
      const response = await api.get("/users/profile");
      setUser(response.data.user);
    } catch {
      setUser(null);
    }
  }, []);

  useEffect(() => {
    const token = localStorage.getItem("accessToken");
    if (!token) {
      setLoading(false);
      return;
    }

    refreshProfile().finally(() => setLoading(false));
  }, [refreshProfile]);

  const applyAuth = (data: AuthResponse) => {
    setTokens(data.accessToken, data.refreshToken);
    setUser(data.user);
  };

  const login = async (email: string, password: string) => {
    const response = await api.post<AuthResponse>("/auth/login", {
      email,
      password,
    });
    applyAuth(response.data);
  };

  const register = async (
    username: string,
    email: string,
    password: string,
  ) => {
    const response = await api.post<AuthResponse>("/auth/register", {
      username,
      email,
      password,
    });
    applyAuth(response.data);
  };

  const socialLogin = async (
    provider: "google" | "facebook",
    payload: {
      token: string;
    },
  ) => {
    const response = await api.post<AuthResponse>("/auth/social", {
      provider,
      ...payload,
    });
    applyAuth(response.data);
  };

  const logout = async () => {
    const refreshToken = localStorage.getItem("refreshToken");
    if (refreshToken) {
      try {
        await api.post("/auth/logout", { refreshToken });
      } catch {
        // Ignore remote logout failures and clear local session.
      }
    }

    clearTokens();
    setUser(null);
  };

  const value = useMemo(
    () => ({
      user,
      loading,
      login,
      register,
      socialLogin,
      logout,
      refreshProfile,
    }),
    [user, loading, refreshProfile],
  );

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
};

export const useAuth = () => {
  const context = useContext(AuthContext);
  if (!context) {
    throw new Error("useAuth must be used within AuthProvider");
  }
  return context;
};
