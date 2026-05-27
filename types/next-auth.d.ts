import { DefaultSession } from "next-auth"

declare module "next-auth" {
  interface Session {
    user?: DefaultSession["user"] & { coins?: number }
  }

  interface User {
    coins?: number
  }
}

declare module "next-auth/jwt" {
  interface JWT {
    user?: {
      coins?: number
    }
  }
}
