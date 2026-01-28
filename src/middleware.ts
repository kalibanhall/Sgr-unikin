import { NextResponse } from "next/server";
import type { NextRequest } from "next/server";

export function middleware(request: NextRequest) {
  const path = request.nextUrl.pathname;
  
  // Vérifier le cookie de session NextAuth
  const sessionToken = request.cookies.get("authjs.session-token") 
    || request.cookies.get("__Secure-authjs.session-token");

  // Si l'utilisateur est connecté et essaie d'accéder aux pages de connexion/inscription
  if (sessionToken) {
    // Rediriger vers le dashboard approprié si déjà connecté
    if (path === "/login" || path === "/register") {
      return NextResponse.redirect(new URL("/dashboard", request.url));
    }
    if (path === "/admin/login") {
      return NextResponse.redirect(new URL("/admin", request.url));
    }
    // Empêcher l'accès à la page d'accueil pour les utilisateurs connectés
    if (path === "/") {
      return NextResponse.redirect(new URL("/dashboard", request.url));
    }
  }

  // Pages protégées pour les étudiants
  if (path.startsWith("/dashboard")) {
    if (!sessionToken) {
      return NextResponse.redirect(new URL("/login", request.url));
    }
  }

  // Pages protégées pour les admins
  if (path.startsWith("/admin") && !path.startsWith("/admin/login")) {
    if (!sessionToken) {
      return NextResponse.redirect(new URL("/admin/login", request.url));
    }
    // La vérification du rôle se fait côté serveur dans les pages/API
  }

  return NextResponse.next();
}

export const config = {
  matcher: ["/", "/login", "/register", "/admin/login", "/dashboard/:path*", "/admin/:path*"],
};
