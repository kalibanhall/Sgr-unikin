"use client";

import { useState, useEffect } from "react";
import { X, Download, Smartphone } from "lucide-react";
import { Button } from "./button";

interface BeforeInstallPromptEvent extends Event {
  prompt: () => Promise<void>;
  userChoice: Promise<{ outcome: "accepted" | "dismissed" }>;
}

export function PWAInstallPrompt() {
  const [deferredPrompt, setDeferredPrompt] = useState<BeforeInstallPromptEvent | null>(null);
  const [showPrompt, setShowPrompt] = useState(false);
  const [isIOS, setIsIOS] = useState(false);
  const [isStandalone, setIsStandalone] = useState(false);

  useEffect(() => {
    // Vérifier si l'app est déjà installée
    const checkStandalone = () => {
      const standalone = window.matchMedia("(display-mode: standalone)").matches;
      const iosStandalone = (window.navigator as unknown as { standalone?: boolean }).standalone === true;
      setIsStandalone(standalone || iosStandalone);
    };

    // Détecter iOS
    const checkIOS = () => {
      const userAgent = window.navigator.userAgent.toLowerCase();
      const isIOSDevice = /iphone|ipad|ipod/.test(userAgent);
      const isInSafari = /safari/.test(userAgent) && !/chrome|crios|fxios/.test(userAgent);
      setIsIOS(isIOSDevice && isInSafari);
    };

    checkStandalone();
    checkIOS();

    // Écouter l'événement beforeinstallprompt
    const handleBeforeInstall = (e: Event) => {
      e.preventDefault();
      setDeferredPrompt(e as BeforeInstallPromptEvent);
      
      // Afficher le prompt après un délai (pour ne pas interrompre l'UX)
      const hasSeenPrompt = localStorage.getItem("pwa-prompt-seen");
      if (!hasSeenPrompt) {
        setTimeout(() => setShowPrompt(true), 5000);
      }
    };

    window.addEventListener("beforeinstallprompt", handleBeforeInstall);

    // Afficher le prompt iOS si applicable
    if (isIOS && !isStandalone) {
      const hasSeenIOSPrompt = localStorage.getItem("ios-pwa-prompt-seen");
      if (!hasSeenIOSPrompt) {
        setTimeout(() => setShowPrompt(true), 5000);
      }
    }

    return () => {
      window.removeEventListener("beforeinstallprompt", handleBeforeInstall);
    };
  }, [isIOS, isStandalone]);

  const handleInstall = async () => {
    if (!deferredPrompt) return;

    try {
      await deferredPrompt.prompt();
      const { outcome } = await deferredPrompt.userChoice;
      
      if (outcome === "accepted") {
        console.log("PWA installée");
      }
      
      setDeferredPrompt(null);
      setShowPrompt(false);
      localStorage.setItem("pwa-prompt-seen", "true");
    } catch (error) {
      console.error("Erreur installation PWA:", error);
    }
  };

  const handleDismiss = () => {
    setShowPrompt(false);
    localStorage.setItem("pwa-prompt-seen", "true");
    if (isIOS) {
      localStorage.setItem("ios-pwa-prompt-seen", "true");
    }
  };

  // Ne rien afficher si déjà installé ou pas de prompt
  if (isStandalone || (!showPrompt && !isIOS)) return null;
  if (!showPrompt) return null;

  return (
    <div className="fixed bottom-4 left-4 right-4 md:left-auto md:right-4 md:w-96 z-50 animate-slide-up">
      <div className="bg-white rounded-2xl shadow-2xl border border-slate-200 overflow-hidden">
        {/* Header */}
        <div className="bg-gradient-to-r from-blue-600 to-blue-700 px-4 py-3 flex items-center justify-between">
          <div className="flex items-center gap-2 text-white">
            <Smartphone className="h-5 w-5" />
            <span className="font-semibold">Installer SGR-UNIKIN</span>
          </div>
          <button
            onClick={handleDismiss}
            className="text-white/80 hover:text-white transition-colors"
            aria-label="Fermer"
          >
            <X className="h-5 w-5" />
          </button>
        </div>

        {/* Content */}
        <div className="p-4">
          {isIOS ? (
            <div className="text-sm text-slate-600">
              <p className="mb-3">
                Pour installer l'application sur votre iPhone/iPad :
              </p>
              <ol className="list-decimal pl-4 space-y-2">
                <li>
                  Appuyez sur le bouton{" "}
                  <span className="inline-flex items-center px-2 py-0.5 bg-slate-100 rounded text-xs">
                    <svg className="h-4 w-4" fill="currentColor" viewBox="0 0 24 24">
                      <path d="M18 16.08c-.76 0-1.44.3-1.96.77L8.91 12.7c.05-.23.09-.46.09-.7s-.04-.47-.09-.7l7.05-4.11c.54.5 1.25.81 2.04.81 1.66 0 3-1.34 3-3s-1.34-3-3-3-3 1.34-3 3c0 .24.04.47.09.7L8.04 9.81C7.5 9.31 6.79 9 6 9c-1.66 0-3 1.34-3 3s1.34 3 3 3c.79 0 1.5-.31 2.04-.81l7.12 4.16c-.05.21-.08.43-.08.65 0 1.61 1.31 2.92 2.92 2.92s2.92-1.31 2.92-2.92-1.31-2.92-2.92-2.92z"/>
                    </svg>
                    Partager
                  </span>
                </li>
                <li>
                  Sélectionnez{" "}
                  <span className="font-medium">"Sur l'écran d'accueil"</span>
                </li>
                <li>
                  Appuyez sur{" "}
                  <span className="font-medium">"Ajouter"</span>
                </li>
              </ol>
            </div>
          ) : (
            <>
              <p className="text-sm text-slate-600 mb-4">
                Installez l'application pour un accès rapide et une expérience optimale, même hors connexion.
              </p>
              <div className="flex gap-3">
                <Button
                  onClick={handleInstall}
                  className="flex-1 bg-blue-600 hover:bg-blue-700"
                >
                  <Download className="h-4 w-4 mr-2" />
                  Installer
                </Button>
                <Button
                  onClick={handleDismiss}
                  variant="outline"
                  className="flex-1"
                >
                  Plus tard
                </Button>
              </div>
            </>
          )}
        </div>
      </div>
    </div>
  );
}

// Hook pour vérifier si l'app est installée
export function useIsPWAInstalled() {
  const [isInstalled, setIsInstalled] = useState(false);

  useEffect(() => {
    const checkInstalled = () => {
      const standalone = window.matchMedia("(display-mode: standalone)").matches;
      const iosStandalone = (window.navigator as unknown as { standalone?: boolean }).standalone === true;
      setIsInstalled(standalone || iosStandalone);
    };

    checkInstalled();

    // Écouter les changements de mode d'affichage
    const mediaQuery = window.matchMedia("(display-mode: standalone)");
    mediaQuery.addEventListener("change", checkInstalled);

    return () => {
      mediaQuery.removeEventListener("change", checkInstalled);
    };
  }, []);

  return isInstalled;
}
