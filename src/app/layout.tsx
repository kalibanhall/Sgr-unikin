import type { Metadata, Viewport } from "next";
import { Inter } from "next/font/google";
import "./globals.css";
import { Providers } from "@/components/providers";
import { Navbar } from "@/components/layout/navbar";
import { Footer } from "@/components/layout/footer";
import { Toaster } from "sonner";
import Script from "next/script";

const inter = Inter({
  subsets: ["latin"],
  display: "swap", // Optimisation du chargement des fonts
});

// Viewport configuration pour mobile
export const viewport: Viewport = {
  width: "device-width",
  initialScale: 1,
  maximumScale: 5,
  userScalable: true,
  themeColor: [
    { media: "(prefers-color-scheme: light)", color: "#1e3a8a" },
    { media: "(prefers-color-scheme: dark)", color: "#1e3a8a" },
  ],
};

export const metadata: Metadata = {
  title: "SGR-UNIKIN | Secrétariat Général à la Recherche",
  description: "Plateforme d'inscription et de gestion des étudiants du troisième cycle de l'Université de Kinshasa",
  manifest: "/manifest.json",
  appleWebApp: {
    capable: true,
    statusBarStyle: "black-translucent",
    title: "SGR-UNIKIN",
    startupImage: [
      {
        url: "/icons/icon-512x512.png",
        media: "(device-width: 320px) and (device-height: 568px)",
      },
    ],
  },
  formatDetection: {
    telephone: true,
    email: true,
    address: false,
  },
  icons: {
    icon: [
      { url: "/icons/icon-32x32.png", sizes: "32x32", type: "image/png" },
      { url: "/icons/icon-192x192.png", sizes: "192x192", type: "image/png" },
    ],
    shortcut: "/logo-unikin.png",
    apple: [
      { url: "/icons/icon-180x180.png", sizes: "180x180", type: "image/png" },
    ],
  },
  openGraph: {
    type: "website",
    locale: "fr_CD",
    url: "https://sgr-unikin.onrender.com",
    siteName: "SGR-UNIKIN",
    title: "SGR-UNIKIN | Secrétariat Général à la Recherche",
    description: "Plateforme d'inscription et de gestion des étudiants du troisième cycle de l'Université de Kinshasa",
    images: [
      {
        url: "/logo-unikin.png",
        width: 512,
        height: 512,
        alt: "Logo SGR-UNIKIN",
      },
    ],
  },
  twitter: {
    card: "summary_large_image",
    title: "SGR-UNIKIN | Secrétariat Général à la Recherche",
    description: "Plateforme d'inscription et de gestion des étudiants du troisième cycle de l'Université de Kinshasa",
    images: ["/logo-unikin.png"],
  },
  other: {
    "mobile-web-app-capable": "yes",
    "apple-mobile-web-app-capable": "yes",
    "application-name": "SGR-UNIKIN",
    "apple-mobile-web-app-title": "SGR-UNIKIN",
    "msapplication-TileColor": "#1e3a8a",
    "msapplication-config": "/browserconfig.xml",
  },
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="fr">
      <body className={`${inter.className} antialiased bg-gray-50`}>
        <Providers>
          <div className="flex flex-col min-h-screen">
            <Navbar />
            <main className="grow">{children}</main>
            <Footer />
          </div>
          <Toaster position="top-right" richColors />
        </Providers>
        {/* Script de protection anti-copie */}
        <Script id="anti-copy-protection" strategy="afterInteractive">
          {`
            // Désactiver le clic droit
            document.addEventListener('contextmenu', function(e) {
              e.preventDefault();
              return false;
            });
            
            // Désactiver les raccourcis clavier de copie
            document.addEventListener('keydown', function(e) {
              // Ctrl+C, Ctrl+X, Ctrl+U, Ctrl+S, Ctrl+A
              if (e.ctrlKey && (e.key === 'c' || e.key === 'x' || e.key === 'u' || e.key === 's' || e.key === 'a')) {
                // Permettre dans les champs de formulaire
                if (e.target.tagName === 'INPUT' || e.target.tagName === 'TEXTAREA') {
                  return true;
                }
                e.preventDefault();
                return false;
              }
              // F12 (DevTools)
              if (e.key === 'F12') {
                e.preventDefault();
                return false;
              }
              // Ctrl+Shift+I (DevTools)
              if (e.ctrlKey && e.shiftKey && e.key === 'I') {
                e.preventDefault();
                return false;
              }
              // Ctrl+Shift+J (Console)
              if (e.ctrlKey && e.shiftKey && e.key === 'J') {
                e.preventDefault();
                return false;
              }
              // Ctrl+Shift+C (Inspect)
              if (e.ctrlKey && e.shiftKey && e.key === 'C') {
                e.preventDefault();
                return false;
              }
            });
            
            // Désactiver le copier
            document.addEventListener('copy', function(e) {
              if (e.target.tagName === 'INPUT' || e.target.tagName === 'TEXTAREA') {
                return true;
              }
              e.preventDefault();
              return false;
            });
            
            // Désactiver le coller dans les zones non-input
            document.addEventListener('cut', function(e) {
              if (e.target.tagName === 'INPUT' || e.target.tagName === 'TEXTAREA') {
                return true;
              }
              e.preventDefault();
              return false;
            });
          `}
        </Script>
        {/* Service Worker Registration */}
        <Script id="sw-registration" strategy="afterInteractive">
          {`
            if ('serviceWorker' in navigator) {
              window.addEventListener('load', function() {
                navigator.serviceWorker.register('/sw.js')
                  .then(function(registration) {
                    console.log('SW registered: ', registration.scope);
                    
                    // Vérifier les mises à jour
                    registration.addEventListener('updatefound', () => {
                      const newWorker = registration.installing;
                      if (newWorker) {
                        newWorker.addEventListener('statechange', () => {
                          if (newWorker.state === 'installed' && navigator.serviceWorker.controller) {
                            // Nouvelle version disponible
                            if (confirm('Une nouvelle version est disponible. Actualiser?')) {
                              newWorker.postMessage({ type: 'SKIP_WAITING' });
                              window.location.reload();
                            }
                          }
                        });
                      }
                    });
                  })
                  .catch(function(error) {
                    console.log('SW registration failed: ', error);
                  });
              });
            }
          `}
        </Script>
      </body>
    </html>
  );
}
