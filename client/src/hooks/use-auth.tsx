import { createContext, ReactNode, useContext } from "react";
import {
  useQuery,
  useMutation,
  UseMutationResult,
} from "@tanstack/react-query";
import { apiRequest, queryClient } from "../lib/queryClient";
import { useToast } from "@/hooks/use-toast";
import { type UserProfile, type LoginData, type RegisterData } from "@shared/schema";

type AuthContextType = {
  user: UserProfile | null;
  isLoading: boolean;
  error: Error | null;
  loginMutation: UseMutationResult<AuthResponse, Error, LoginData>;
  logoutMutation: UseMutationResult<void, Error, void>;
  registerMutation: UseMutationResult<AuthResponse, Error, RegisterData>;
  googleAuthMutation: UseMutationResult<AuthResponse, Error, void>;
};

type AuthResponse = {
  token: string;
  user: UserProfile;
  message: string;
};

export const AuthContext = createContext<AuthContextType | null>(null);

export function AuthProvider({ children }: { children: ReactNode }) {
  const { toast } = useToast();
  
  const {
    data: user,
    error,
    isLoading,
  } = useQuery<UserProfile | null>({
    queryKey: ["/api/user"],
    queryFn: async () => {
      const token = localStorage.getItem("auth_token");
      if (!token) return null;
      
      try {
        const res = await fetch("/api/user", {
          headers: {
            Authorization: `Bearer ${token}`,
          },
        });
        
        if (!res.ok) {
          throw new Error("Failed to fetch user");
        }
        return await res.json();
      } catch (error) {
        // If token is invalid, remove it
        localStorage.removeItem("auth_token");
        return null;
      }
    },
  });

  const loginMutation = useMutation({
    mutationFn: async (credentials: LoginData): Promise<AuthResponse> => {
      const res = await apiRequest("POST", "/api/auth/login", credentials);
      return await res.json();
    },
    onSuccess: (response: AuthResponse) => {
      localStorage.setItem("auth_token", response.token);
      queryClient.setQueryData(["/api/user"], response.user);
      toast({
        title: "Welcome back!",
        description: `Good to see you again, ${response.user.firstName || response.user.username}!`,
      });
    },
    onError: (error: Error) => {
      toast({
        title: "Login failed",
        description: error.message || "Invalid credentials. Please try again.",
        variant: "destructive",
      });
    },
  });

  const registerMutation = useMutation({
    mutationFn: async (credentials: RegisterData): Promise<AuthResponse> => {
      const res = await apiRequest("POST", "/api/auth/register", credentials);
      return await res.json();
    },
    onSuccess: (response: AuthResponse) => {
      localStorage.setItem("auth_token", response.token);
      queryClient.setQueryData(["/api/user"], response.user);
      toast({
        title: "Welcome to ChatGroove!",
        description: `Hi ${response.user.firstName || response.user.username}! Your account has been created successfully.`,
      });
    },
    onError: (error: Error) => {
      toast({
        title: "Registration failed",
        description: error.message || "Failed to create account. Please try again.",
        variant: "destructive",
      });
    },
  });

  const googleAuthMutation = useMutation({
    mutationFn: async (token: string): Promise<AuthResponse> => {
      const res = await apiRequest("POST", "/api/auth/google", { token });
      return await res.json();
    },
    onSuccess: (response: AuthResponse) => {
      localStorage.setItem("auth_token", response.token);
      queryClient.setQueryData(["/api/user"], response.user);
      toast({
        title: "Welcome!",
        description: `Signed in successfully with Google!`,
      });
    },
    onError: (error: Error) => {
      toast({
        title: "Google sign-in failed",
        description: error.message || "Google authentication failed. Please try again.",
        variant: "destructive",
      });
    },
  });

  const logoutMutation = useMutation({
    mutationFn: async () => {
      await apiRequest("POST", "/api/auth/logout");
    },
    onSuccess: () => {
      localStorage.removeItem("auth_token");
      queryClient.setQueryData(["/api/user"], null);
      queryClient.clear(); // Clear all cached data
      toast({
        title: "Signed out",
        description: "You have been successfully signed out.",
      });
    },
    onError: (error: Error) => {
      // Even if logout fails on server, clear local data
      localStorage.removeItem("auth_token");
      queryClient.setQueryData(["/api/user"], null);
      queryClient.clear();
      toast({
        title: "Signed out",
        description: "You have been signed out.",
      });
    },
  });

  return (
    <AuthContext.Provider
      value={{
        user: user ?? null,
        isLoading,
        error,
        loginMutation,
        logoutMutation,
        registerMutation,
        googleAuthMutation: googleAuthMutation as any,
      }}
    >
      {children}
    </AuthContext.Provider>
  );
}

export function useAuth() {
  const context = useContext(AuthContext);
  if (!context) {
    throw new Error("useAuth must be used within an AuthProvider");
  }
  return context;
}