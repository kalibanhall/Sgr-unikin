"use client";

import Link from "next/link";
import Image from "next/image";
import { Button } from "@/components/ui/button";
import { Home, ArrowLeft } from "lucide-react";

export default function NotFound() {
  return (
    <div className="min-h-screen flex items-center justify-center bg-linear-to-br from-blue-50 to-blue-100 px-4">
      <div className="text-center">
        <div className="flex justify-center mb-6">
          <Image src="/logo-unikin.png" alt="Logo UNIKIN" width={80} height={80} className="h-20 w-20" />
        </div>
        
        <h1 className="text-6xl font-bold text-blue-900 mb-4">404</h1>
        <h2 className="text-2xl font-semibold text-gray-800 mb-2">Page non trouvée</h2>
        <p className="text-gray-900 mb-8 max-w-md mx-auto">
          La page que vous recherchez n&apos;existe pas ou a été déplacée.
        </p>
        
        <div className="flex flex-col sm:flex-row justify-center gap-4">
          <Link href="/">
            <Button>
              <Home className="h-4 w-4 mr-2" />
              Retour à l&apos;accueil
            </Button>
          </Link>
          <Button variant="outline" onClick={() => window.history.back()}>
            <ArrowLeft className="h-4 w-4 mr-2" />
            Page précédente
          </Button>
        </div>
      </div>
    </div>
  );
}
