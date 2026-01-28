import { Loader2 } from "lucide-react";
import Image from "next/image";

export default function Loading() {
  return (
    <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-slate-50 to-blue-50">
      <div className="text-center">
        {/* Logo animé */}
        <div className="relative mb-6">
          <div className="absolute inset-0 animate-ping rounded-full bg-blue-400 opacity-20" />
          <Image 
            src="/logo-unikin.png" 
            alt="SGR-UNIKIN" 
            width={80} 
            height={80} 
            className="relative z-10 mx-auto rounded-full shadow-lg"
            priority
          />
        </div>
        
        {/* Spinner */}
        <div className="flex items-center justify-center gap-2 mb-3">
          <Loader2 className="h-5 w-5 animate-spin text-blue-600" />
          <span className="text-gray-700 font-medium">Chargement...</span>
        </div>
        
        {/* Barre de progression animée */}
        <div className="w-48 h-1.5 bg-gray-200 rounded-full overflow-hidden mx-auto">
          <div className="h-full bg-gradient-to-r from-blue-500 to-blue-600 rounded-full animate-loading-bar" />
        </div>
      </div>
    </div>
  );
}
