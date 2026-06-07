import { createContext, useContext } from "react";

export interface User {
  id: string;
  email: string;
  username?: string;
  isGuest?: boolean;
}

export interface AuthContextType {
  user: User | null;
  onLogout: () => Promise<void>;
  openLogin: () => void;
  closeLogin: () => void;
}

export const AuthContext = createContext<AuthContextType | undefined>(undefined);

export const useAuth = () => {
  const context = useContext(AuthContext);
  if (!context) {
    throw new Error("useAuth must be used within an AuthProvider");
  }
  return context;
};
