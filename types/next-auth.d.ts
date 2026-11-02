import type { DefaultSession } from "next-auth";
import type { JWT as DefaultJWT } from "next-auth/jwt";

declare module "next-auth" {
  interface Session {
    user: {
      id: string;
      role: string;
      firstName: string;
      lastName: string;
      dob: string;
      nickname: string;
      phoneNumber: string;
      avatarUrl: string;
      referralCode: string;
      status: string;
    } & DefaultSession["user"];
  }

  // Extend the User type so the jwt callback can safely access user.id
  interface User {
    id: string;
    role: string;
    firstName: string;
    lastName: string;
    dob: string;
    nickname: string;
    phoneNumber: string;
    avatarUrl: string;
    referralCode: string;
    status: string;
  }
}

declare module "next-auth/jwt" {
  interface JWT extends DefaultJWT {
    id: string;
    role: string;
    firstName: string;
    lastName: string;
    dob: string;
    nickname: string;
    phoneNumber: string;
    avatarUrl: string;
    referralCode: string;
    status: string;
  }
}
