import React from "react";
import { AuthProvider } from "@/components/auth-provider";
import { Header } from "@/components/header";

interface MainLayoutProps {
  children: React.ReactNode;
}

export function MainLayout({ children }: MainLayoutProps) {
  return (
    <AuthProvider>
      <div className="relative flex min-h-screen flex-1 flex-col overflow-hidden bg-background">
        <Header />
        <div className="flex min-h-0 flex-1 flex-col overflow-auto">{children}</div>
      </div>
    </AuthProvider>
  );
}
