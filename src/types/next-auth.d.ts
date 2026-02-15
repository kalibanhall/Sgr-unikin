import "next-auth";

declare module "next-auth" {
  interface User {
    id: string;
    role: string;
    adminLevel?: number | null;
    studentId?: string;
  }

  interface Session {
    user: User & {
      id: string;
      role: string;
      adminLevel?: number | null;
      studentId?: string;
    };
  }
}

declare module "next-auth/jwt" {
  interface JWT {
    id: string;
    role: string;
    adminLevel?: number | null;
    studentId?: string;
  }
}
