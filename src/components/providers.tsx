"use client";

import { SessionProvider } from "next-auth/react";
import { ReactNode } from "react";
import { ToastContextProvider } from "@/hooks/use-toast";
import { PWAInstallPrompt } from "@/components/ui/pwa-install-prompt";

interface ProvidersProps {
  children: ReactNode;
}

export function Providers({ children }: ProvidersProps) {
  return (
    <SessionProvider>
      <ToastContextProvider>
        {children}
        <PWAInstallPrompt />
      </ToastContextProvider>
    </SessionProvider>
  );
}
