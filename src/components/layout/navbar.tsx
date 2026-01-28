"use client";

import Link from "next/link";
import Image from "next/image";
import { usePathname } from "next/navigation";
import { useSession } from "next-auth/react";
import { 
  Menu, 
  X, 
  User,
  LayoutDashboard,
  FileText,
  Calendar,
  Settings,
  Users
} from "lucide-react";
import { useState } from "react";
import { LogoutButton } from "@/components/ui/logout-dialog";

export function Navbar() {
  const pathname = usePathname();
  const { data: session } = useSession();
  const [isMenuOpen, setIsMenuOpen] = useState(false);

  const isAdmin = session?.user?.role === "ADMIN" || session?.user?.role === "SUPER_ADMIN";
  const isAdminPage = pathname.startsWith("/admin");

  // Déterminer l'URL du logo en fonction de l'état de connexion
  const logoHref = session ? (isAdmin ? "/admin" : "/dashboard") : "/";

  const publicLinks = [
    { href: "/", label: "Accueil" },
    { href: "/guide-inscription", label: "Guide d'inscription" },
    { href: "/guide-soutenance", label: "Guide soutenance" },
    { href: "/contact", label: "Contact" },
  ];

  const studentLinks = [
    { href: "/dashboard", label: "Tableau de bord", icon: LayoutDashboard },
    { href: "/dashboard/documents", label: "Mes documents", icon: FileText },
    { href: "/dashboard/rendez-vous", label: "Rendez-vous", icon: Calendar },
    { href: "/dashboard/profil", label: "Mon profil", icon: User },
  ];

  const adminLinks = [
    { href: "/admin", label: "Dashboard", icon: LayoutDashboard },
    { href: "/admin/etudiants", label: "Candidats", icon: Users },
    { href: "/admin/documents", label: "Documents", icon: FileText },
    { href: "/admin/rendez-vous", label: "Rendez-vous", icon: Calendar },
    { href: "/admin/parametres", label: "Paramètres", icon: Settings },
  ];

  return (
    <nav className="bg-blue-900 text-white shadow-lg sticky top-0 z-50">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex justify-between h-16">
          {/* Logo */}
          <div className="flex items-center">
            <Link href={logoHref} className="flex items-center space-x-2">
              <Image src="/logo-unikin.png" alt="Logo UNIKIN" width={40} height={40} className="h-10 w-10" />
              <div className="hidden sm:block">
                <div className="font-bold text-lg">SGR-UNIKIN</div>
                <div className="text-xs text-blue-200">Secrétariat Général à la Recherche</div>
              </div>
            </Link>
          </div>

          {/* Desktop Navigation */}
          <div className="hidden md:flex items-center space-x-4">
            {!session ? (
              <>
                {/* Ne pas afficher les liens publics sur les pages admin */}
                {!isAdminPage && publicLinks.map((link) => (
                  <Link
                    key={link.href}
                    href={link.href}
                    className={`px-3 py-2 rounded-md text-sm font-medium transition-colors ${
                      pathname === link.href
                        ? "bg-blue-800 text-white"
                        : "text-blue-100 hover:bg-blue-800 hover:text-white"
                    }`}
                  >
                    {link.label}
                  </Link>
                ))}
                {!isAdminPage && (
                  <>
                    <Link 
                      href="/login"
                      className="inline-flex items-center justify-center h-9 px-3 rounded-md text-sm font-medium border border-white text-white hover:bg-white hover:text-blue-900 transition-all duration-200 cursor-pointer"
                    >
                      Connexion
                    </Link>
                    <Link 
                      href="/register"
                      className="inline-flex items-center justify-center h-9 px-3 rounded-md text-sm font-medium bg-green-600 text-white hover:bg-green-500 transition-all duration-200 cursor-pointer"
                    >
                      S&apos;inscrire
                    </Link>
                  </>
                )}
              </>
            ) : (
              <>
                {(isAdmin ? adminLinks : studentLinks).map((link) => (
                  <Link
                    key={link.href}
                    href={link.href}
                    className={`flex items-center space-x-1 px-3 py-2 rounded-md text-sm font-medium transition-colors ${
                      pathname === link.href
                        ? "bg-blue-800 text-white"
                        : "text-blue-100 hover:bg-blue-800 hover:text-white"
                    }`}
                  >
                    <link.icon className="h-4 w-4" />
                    <span>{link.label}</span>
                  </Link>
                ))}
                <LogoutButton 
                  variant="ghost"
                  className="text-blue-100 hover:bg-blue-800 hover:text-white"
                />
              </>
            )}
          </div>

          {/* Mobile menu button */}
          <div className="md:hidden flex items-center">
            <button
              onClick={() => setIsMenuOpen(!isMenuOpen)}
              className="text-blue-100 hover:text-white focus:outline-none"
            >
              {isMenuOpen ? <X className="h-6 w-6" /> : <Menu className="h-6 w-6" />}
            </button>
          </div>
        </div>
      </div>

      {/* Mobile menu */}
      {isMenuOpen && (
        <div className="md:hidden bg-blue-800">
          <div className="px-2 pt-2 pb-3 space-y-1">
            {!session ? (
              <>
                {/* Ne pas afficher les liens publics sur les pages admin */}
                {!isAdminPage && publicLinks.map((link) => (
                  <Link
                    key={link.href}
                    href={link.href}
                    className="block px-3 py-2 rounded-md text-base font-medium text-blue-100 hover:bg-blue-700 hover:text-white"
                    onClick={() => setIsMenuOpen(false)}
                  >
                    {link.label}
                  </Link>
                ))}
                {!isAdminPage && (
                  <>
                    <Link
                      href="/login"
                      className="block px-3 py-2 rounded-md text-base font-medium text-blue-100 hover:bg-blue-700 hover:text-white"
                      onClick={() => setIsMenuOpen(false)}
                    >
                      Connexion
                    </Link>
                    <Link
                      href="/register"
                      className="block px-3 py-2 rounded-md text-base font-medium bg-green-600 text-white hover:bg-green-700"
                      onClick={() => setIsMenuOpen(false)}
                    >
                      S&apos;inscrire
                    </Link>
                  </>
                )}
              </>
            ) : (
              <>
                {(isAdmin ? adminLinks : studentLinks).map((link) => (
                  <Link
                    key={link.href}
                    href={link.href}
                    className="flex items-center space-x-2 px-3 py-2 rounded-md text-base font-medium text-blue-100 hover:bg-blue-700 hover:text-white"
                    onClick={() => setIsMenuOpen(false)}
                  >
                    <link.icon className="h-5 w-5" />
                    <span>{link.label}</span>
                  </Link>
                ))}
                <div className="px-3 py-2">
                  <LogoutButton 
                    variant="ghost"
                    className="flex items-center space-x-2 w-full text-blue-100 hover:bg-blue-700 hover:text-white justify-start"
                  />
                </div>
              </>
            )}
          </div>
        </div>
      )}
    </nav>
  );
}
