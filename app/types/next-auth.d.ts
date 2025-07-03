// types/next-auth.d.ts

import { DefaultSession, DefaultUser, JWT as DefaultJWT } from "next-auth";

declare module "next-auth" {
  interface Session {
    user: DefaultSession["user"] & {
      id: string;
    };
  }

  interface User extends DefaultUser {
    id: string;
  }

  interface JWT extends DefaultJWT {
    sub: string;
  }
}
