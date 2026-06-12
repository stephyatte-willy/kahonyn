import { NextAuthOptions } from 'next-auth'
import CredentialsProvider from 'next-auth/providers/credentials'
import { prisma } from './prisma'
import bcrypt from 'bcryptjs'

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

        const user = await prisma.user.findUnique({
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
      }
    })
  ],
  pages: {
    signIn: '/login',
  },
  session: {
    strategy: 'jwt',
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
  debug: process.env.NODE_ENV === 'development',
}