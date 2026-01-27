"use client";

import { SessionProvider } from "next-auth/react";
import { ReactNode } from "react";
import { ToastContextProvider } from "@/hooks/use-toast";

interface ProvidersProps {
  children: ReactNode;
}

export function Providers({ children }: ProvidersProps) {
  return (
    <SessionProvider>
      <ToastContextProvider>
        {children}
      </ToastContextProvider>
    </SessionProvider>
  );
}
