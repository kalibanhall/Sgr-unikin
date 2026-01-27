"use client";

import { Button } from "@/components/ui/button";
import { AlertCircle, RefreshCcw } from "lucide-react";

export default function Error({
  error,
  reset,
}: {
  error: Error & { digest?: string };
  reset: () => void;
}) {
  return (
    <div className="min-h-screen flex items-center justify-center bg-linear-to-br from-red-50 to-red-100 px-4">
      <div className="text-center">
        <div className="flex justify-center mb-6">
          <div className="bg-red-500 p-4 rounded-full">
            <AlertCircle className="h-12 w-12 text-white" />
          </div>
        </div>
        
        <h1 className="text-3xl font-bold text-gray-800 mb-2">Oups ! Une erreur s&apos;est produite</h1>
        <p className="text-gray-900 mb-8 max-w-md mx-auto">
          Nous sommes désolés, quelque chose s&apos;est mal passé. Veuillez réessayer.
        </p>
        
        {process.env.NODE_ENV === "development" && (
          <div className="mb-6 p-4 bg-red-100 rounded-lg text-left max-w-lg mx-auto">
            <p className="text-sm text-red-800 font-mono break-all">
              {error.message}
            </p>
          </div>
        )}
        
        <Button onClick={reset}>
          <RefreshCcw className="h-4 w-4 mr-2" />
          Réessayer
        </Button>
      </div>
    </div>
  );
}
