"use client";

import { HeroUIProvider } from "@heroui/react";
import { ThemeProvider } from "next-themes";
import React from "react";
import { Toaster } from "sonner";
import { AuthProvider } from "@/contexts/auth-context";
import { WebSocketProvider } from "@/contexts/websocket-context";

export function Providers({ children }: { children: React.ReactNode }) {
  return (
    <ThemeProvider attribute="class" defaultTheme="light" enableSystem>
      <HeroUIProvider>
        <AuthProvider>
          <WebSocketProvider>
            {children}
            <Toaster position="top-right" richColors />
          </WebSocketProvider>
        </AuthProvider>
      </HeroUIProvider>
    </ThemeProvider>
  );
}



