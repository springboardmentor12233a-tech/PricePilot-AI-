"use client";

import React, { createContext, useContext, useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import { api } from "./api";

export type UserRole = "admin" | "analyst" | "viewer";

export interface User {
  id: number;
  email: string;
  full_name?: string;
  role: UserRole;
}

interface AuthContextType {
  user: User | null;
  token: string | null;
  role: UserRole | null;
  isLoading: boolean;
  login: (token: string, userData: User) => void;
  logout: () => void;
  hasRole: (allowedRoles: UserRole[]) => boolean;
}

const AuthContext = createContext<AuthContextType>({
  user: null,
  token: null,
  role: null,
  isLoading: true,
  login: () => {},
  logout: () => {},
  hasRole: () => false,
});

export function AuthProvider({ children }: { children: React.ReactNode }) {
  const [user, setUser] = useState<User | null>(null);
  const [token, setToken] = useState<string | null>(null);
  const [isLoading, setIsLoading] = useState<boolean>(true);
  const router = useRouter();

  useEffect(() => {
    // Restore session on initial browser mount
    try {
      const savedToken = sessionStorage.getItem("pricepilot_token") || localStorage.getItem("pricepilot_token");
      const savedUserStr = sessionStorage.getItem("pricepilot_user") || localStorage.getItem("pricepilot_user");
      
      if (savedToken && savedUserStr) {
        const parsedUser = JSON.parse(savedUserStr);
        setToken(savedToken);
        setUser(parsedUser);
      }
    } catch (e) {
      console.error("Failed to restore session from storage", e);
    } finally {
      setIsLoading(false);
    }
  }, []);

  const login = (newToken: string, userData: User) => {
    setToken(newToken);
    setUser(userData);
    sessionStorage.setItem("pricepilot_token", newToken);
    sessionStorage.setItem("pricepilot_user", JSON.stringify(userData));
    localStorage.setItem("pricepilot_token", newToken);
    localStorage.setItem("pricepilot_user", JSON.stringify(userData));
  };

  const logout = () => {
    setToken(null);
    setUser(null);
    sessionStorage.removeItem("pricepilot_token");
    sessionStorage.removeItem("pricepilot_user");
    localStorage.removeItem("pricepilot_token");
    localStorage.removeItem("pricepilot_user");
    router.push("/login");
  };

  const hasRole = (allowedRoles: UserRole[]) => {
    if (!user) return false;
    return allowedRoles.includes(user.role);
  };

  return (
    <AuthContext.Provider
      value={{
        user,
        token,
        role: user?.role || null,
        isLoading,
        login,
        logout,
        hasRole,
      }}
    >
      {children}
    </AuthContext.Provider>
  );
}

export function useAuth() {
  return useContext(AuthContext);
}
