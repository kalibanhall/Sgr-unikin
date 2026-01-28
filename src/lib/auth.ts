import NextAuth from "next-auth";
import Credentials from "next-auth/providers/credentials";
import bcrypt from "bcryptjs";
import { userRepository, studentRepository } from "@/lib/repositories";

export const { handlers, signIn, signOut, auth } = NextAuth({
  providers: [
    Credentials({
      name: "credentials",
      credentials: {
        email: { label: "Email", type: "email" },
        password: { label: "Mot de passe", type: "password" },
      },
      async authorize(credentials) {
        console.log("=== AUTH DEBUG ===");
        console.log("Email reçu:", credentials?.email);
        
        if (!credentials?.email || !credentials?.password) {
          console.log("Credentials manquants");
          return null;
        }

        const user = await userRepository.findByEmail(credentials.email as string);
        console.log("Utilisateur trouvé:", user ? { id: user.id, email: user.email, role: user.role } : "null");

        if (!user) {
          console.log("Utilisateur non trouvé dans la DB");
          return null;
        }

        console.log("Hash stocké:", user.password?.substring(0, 20) + "...");
        const isPasswordValid = await bcrypt.compare(
          credentials.password as string,
          user.password
        );
        console.log("Mot de passe valide:", isPasswordValid);

        if (!isPasswordValid) {
          console.log("Mot de passe incorrect");
          return null;
        }

        // Vérifier si l'email est vérifié (sauf pour les admins)
        // TEMPORAIREMENT DÉSACTIVÉ - à réactiver quand SMTP configuré
        // if (!user.email_verified && user.role === "STUDENT") {
        //   throw new Error("EMAIL_NOT_VERIFIED");
        // }

        // Récupérer l'ID étudiant si applicable
        let studentId: string | undefined;
        if (user.role === "STUDENT") {
          const student = await studentRepository.findByUserId(user.id);
          studentId = student?.id;
        }

        return {
          id: user.id,
          email: user.email,
          name: user.name,
          role: user.role,
          studentId: studentId,
        };
      },
    }),
  ],
  callbacks: {
    async jwt({ token, user }) {
      if (user) {
        token.id = user.id;
        token.role = user.role;
        token.studentId = user.studentId;
      }
      return token;
    },
    async session({ session, token }) {
      if (session.user) {
        session.user.id = token.id as string;
        session.user.role = token.role as string;
        session.user.studentId = token.studentId as string | undefined;
      }
      return session;
    },
  },
  pages: {
    signIn: "/login",
  },
  session: {
    strategy: "jwt",
    maxAge: 24 * 60 * 60, // 24 heures en secondes
  },
  trustHost: true,
});
