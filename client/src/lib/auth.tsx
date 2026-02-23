import { createContext, useContext, useCallback } from "react";
import { useQuery, useMutation } from "@tanstack/react-query";
import { queryClient, apiRequest, getQueryFn } from "./queryClient";
import type { User } from "@shared/schema";
import { useLocation } from "wouter";

type AuthContextType = {
  user: User | null;
  isLoading: boolean;
  login: (identifier: string, password: string) => Promise<void>;
  signup: (email: string, password: string, fullName: string) => Promise<void>;
  logout: () => Promise<void>;
  setUsername: (username: string) => Promise<void>;
};

const AuthContext = createContext<AuthContextType | null>(null);

export function AuthProvider({ children }: { children: React.ReactNode }) {
  const [, setLocation] = useLocation();

  const { data: user, isLoading } = useQuery<User | null>({
    queryKey: ["/api/auth/me"],
    queryFn: getQueryFn({ on401: "returnNull" }),
    staleTime: 30000,
    retry: false,
  });

  const loginMutation = useMutation({
    mutationFn: async ({ identifier, password }: { identifier: string; password: string }) => {
      const res = await apiRequest("POST", "/api/auth/login", { identifier, password });
      return res.json();
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/auth/me"] });
    },
  });

  const signupMutation = useMutation({
    mutationFn: async ({ email, password, fullName }: { email: string; password: string; fullName: string }) => {
      const res = await apiRequest("POST", "/api/auth/signup", { email, password, fullName });
      return res.json();
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/auth/me"] });
    },
  });

  const logoutMutation = useMutation({
    mutationFn: async () => {
      await apiRequest("POST", "/api/auth/logout");
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/auth/me"] });
      setLocation("/login");
    },
  });

  const usernameMutation = useMutation({
    mutationFn: async (username: string) => {
      const res = await apiRequest("POST", "/api/auth/set-username", { username });
      return res.json();
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/auth/me"] });
    },
  });

  const login = useCallback(async (identifier: string, password: string) => {
    await loginMutation.mutateAsync({ identifier, password });
  }, [loginMutation]);

  const signup = useCallback(async (email: string, password: string, fullName: string) => {
    await signupMutation.mutateAsync({ email, password, fullName });
  }, [signupMutation]);

  const logout = useCallback(async () => {
    await logoutMutation.mutateAsync();
  }, [logoutMutation]);

  const setUsername = useCallback(async (username: string) => {
    await usernameMutation.mutateAsync(username);
  }, [usernameMutation]);

  return (
    <AuthContext.Provider value={{ user: user ?? null, isLoading, login, signup, logout, setUsername }}>
      {children}
    </AuthContext.Provider>
  );
}

export function useAuth() {
  const ctx = useContext(AuthContext);
  if (!ctx) throw new Error("useAuth must be used within AuthProvider");
  return ctx;
}
