import { DefaultSession } from "next-auth";

declare module "next-auth" {
  interface User {
    id: string;
    role: string;
    name?: string | null;
    email?: string | null;
    companyId: number;
  }
  interface Session {
    user: {
      id: string;
      name?: string | null;
      email?: string | null;
      role: string;
      companyId: number;
    };
  }
}

declare module "next-auth/jwt" {
  interface JWT {
    id: string;
    role: string;
    name?: string | null;
    email?: string | null;
    companyId: number;
  }
}
