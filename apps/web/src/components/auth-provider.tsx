import {
  useEffect,
  useState,
  type ReactNode,
  useCallback,
} from "react";
import { LoadingScreen } from "@/components/loading-screen";
import { LoginScreen } from "@/components/login-screen";
import axios from "axios";
import { api } from "@/utils/api";

import { AuthContext, type User } from "@/hooks/use-auth";

interface AuthProviderProps {
  children?: ReactNode;
}

export function AuthProvider({ children }: AuthProviderProps) {
  const [isLoading, setIsLoading] = useState(true);
  const [user, setUser] = useState<User | null>(null);
  const [isLoginOpen, setIsLoginOpen] = useState(false);

  const fetchProfile = useCallback(async () => {
    try {
      const response = await api.get<User>("/auth/profile");
      setUser(response.data);
    } catch (error) {
      setUser(null);
      if (!axios.isAxiosError(error) || error.response?.status !== 401) {
        console.error("Auth check failed:", error);
      }
    }
  }, []);

  useEffect(() => {
    fetchProfile().finally(() => {
      setIsLoading(false);
    });
  }, [fetchProfile]);

  const handleLoginSuccess = async () => {
    await fetchProfile();
    setIsLoginOpen(false);
  };

  const handleLogout = async () => {
    try {
      await api.post("/auth/logout");
      // Refetch profile to automatically trigger SessionMiddleware and get a fresh guest session
      await fetchProfile();
    } catch (error) {
      console.error("Logout failed:", error);
    }
  };

  if (isLoading) {
    return <LoadingScreen />;
  }

  return (
    <AuthContext.Provider
      value={{
        user,
        onLogout: handleLogout,
        openLogin: () => setIsLoginOpen(true),
        closeLogin: () => setIsLoginOpen(false),
      }}
    >
      <main className="relative z-10 flex min-h-screen flex-col bg-background">{children}</main>

      {isLoginOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-background/80 backdrop-blur-md">
          <div className="relative w-full max-w-md p-4">
            <LoginScreen
              onLoginSuccess={handleLoginSuccess}
              onClose={() => setIsLoginOpen(false)}
            />
          </div>
        </div>
      )}
    </AuthContext.Provider>
  );
}
