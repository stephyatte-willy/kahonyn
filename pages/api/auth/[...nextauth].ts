import NextAuth from 'next-auth'
import CredentialsProvider from 'next-auth/providers/credentials'
import { prisma } from '@/lib/prisma'
import bcrypt from 'bcryptjs'
import type { NextAuthOptions } from 'next-auth'

// Définir les types personnalisés
declare module 'next-auth' {
  interface Session {
    user: {
      id: string
      phone: string
      role: string
      name?: string | null
      email?: string | null
    }
  }

  interface User {
    id: string
    phone: string
    role: string
    name?: string | null
    email?: string | null
  }
}

declare module 'next-auth/jwt' {
  interface JWT {
    id: string
    phone: string
    role: string
  }
}

export const authOptions: NextAuthOptions = {
  providers: [
    CredentialsProvider({
      name: 'credentials',
      credentials: {
        phone: { label: 'Téléphone', type: 'tel' },
        password: { label: 'Mot de passe', type: 'password' }
      },
      async authorize(credentials) {
        if (!credentials?.phone || !credentials?.password) {
          return null
        }

        const cleanPhone = credentials.phone.replace(/[\s\-+]/g, '').slice(-10)

        try {
          const user = await prisma.users.findUnique({
            where: { phone: cleanPhone }
          })

          if (!user || !user.password) {
            return null
          }

          const isValid = await bcrypt.compare(credentials.password, user.password)
          if (!isValid) {
            return null
          }

          return {
            id: user.id,
            phone: user.phone,
            name: user.name,
            email: user.email,
            role: user.role
          }
        } catch (error) {
          console.error('Erreur authorize:', error)
          return null
        }
      }
    })
  ],
  pages: {
    signIn: '/login',
    error: '/login',
  },
  session: {
    strategy: 'jwt',
    maxAge: 30 * 24 * 60 * 60, // 30 jours
  },
  callbacks: {
    async jwt({ token, user }) {
      if (user) {
        token.id = user.id
        token.phone = user.phone
        token.role = user.role
      }
      return token
    },
    async session({ session, token }) {
      if (session.user) {
        session.user.id = token.id as string
        session.user.phone = token.phone as string
        session.user.role = token.role as string
      }
      return session
    }
  },
  secret: process.env.NEXTAUTH_SECRET,
  debug: process.env.NODE_ENV === 'development',
}

export default NextAuth(authOptions)