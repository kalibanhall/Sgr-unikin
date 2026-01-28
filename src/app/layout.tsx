import type { Metadata } from "next";
import { Inter } from "next/font/google";
import "./globals.css";
import { Providers } from "@/components/providers";
import { Navbar } from "@/components/layout/navbar";
import { Footer } from "@/components/layout/footer";
import { Toaster } from "sonner";
import Script from "next/script";

const inter = Inter({
  subsets: ["latin"],
});

export const metadata: Metadata = {
  title: "SGR-UNIKIN | Secrétariat Général à la Recherche",
  description: "Plateforme d'inscription et de gestion des étudiants du troisième cycle de l'Université de Kinshasa",
  icons: {
    icon: "/logo-unikin.png",
    shortcut: "/logo-unikin.png",
    apple: "/logo-unikin.png",
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
      </body>
    </html>
  );
}
