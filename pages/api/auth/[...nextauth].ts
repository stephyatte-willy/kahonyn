// pages/api/auth/[...nextauth].ts
import NextAuth, { NextAuthOptions } from 'next-auth'
import CredentialsProvider from 'next-auth/providers/credentials'
import GoogleProvider from 'next-auth/providers/google'
import { PrismaAdapter } from '@auth/prisma-adapter'
import { prisma } from '../../../lib/prisma'
import bcrypt from 'bcryptjs'

// ==================== DÉCLARATION DES TYPES ====================

declare module 'next-auth' {
  interface Session {
    user: {
      id: string
      phone: string
      role: string
      name?: string | null
      email?: string | null
      image?: string | null
    }
  }

  interface User {
    id: string
    phone: string
    role: string
  }
}

declare module 'next-auth/jwt' {
  interface JWT {
    id: string
    phone: string
    role: string
  }
}

// ==================== CONFIGURATION ====================

export const authOptions: NextAuthOptions = {
  adapter: PrismaAdapter(prisma as any) as any,
  
  providers: [
    GoogleProvider({
      clientId: process.env.GOOGLE_CLIENT_ID || '',
      clientSecret: process.env.GOOGLE_CLIENT_SECRET || '',
    }),
    
    CredentialsProvider({
      name: 'credentials',
      credentials: {
        phone: { label: 'Téléphone', type: 'tel' },
        password: { label: 'Mot de passe', type: 'password' }
      },
      async authorize(credentials) {
        if (!credentials?.phone || !credentials?.password) {
          throw new Error('Téléphone et mot de passe requis')
        }

        try {
          const cleanPhone = credentials.phone.replace(/\D/g, '')
          
          console.log('🔍 Recherche utilisateur avec téléphone:', cleanPhone)

          const user = await (prisma as any).user.findUnique({
            where: { phone: cleanPhone }
          })

          console.log('👤 Utilisateur trouvé:', user ? 'Oui' : 'Non')

          if (!user) {
            throw new Error('Aucun compte trouvé avec ce numéro')
          }

          if (!user.password) {
            throw new Error('Ce compte utilise la connexion Google. Veuillez vous connecter avec Google.')
          }

          const isPasswordValid = await bcrypt.compare(credentials.password, user.password)

          console.log('🔑 Mot de passe valide:', isPasswordValid)

          if (!isPasswordValid) {
            throw new Error('Mot de passe incorrect')
          }

          return {
            id: user.id,
            phone: user.phone,
            name: user.name,
            email: user.email,
            role: user.role || 'client',
            image: user.avatar,
          }
        } catch (error) {
          console.error('❌ Erreur authorize:', error)
          if (error instanceof Error) throw error
          throw new Error('Erreur lors de la connexion')
        }
      }
    })
  ],

  session: {
    strategy: 'jwt',
    maxAge: 30 * 24 * 60 * 60,
  },

  // ✅ Correction : typer explicitement les paramètres des callbacks
  callbacks: {
    async jwt({ token, user, account, trigger }: { 
      token: any
      user: any
      account: any
      trigger?: any
    }) {
      if (user) {
        token.id = user.id
        token.phone = user.phone || ''
        token.role = user.role || 'client'
      }

      if (account?.provider === 'google' && token.email) {
        try {
          const existingUser = await (prisma as any).user.findUnique({
            where: { email: token.email }
          })
          if (existingUser) {
            token.id = existingUser.id
            token.role = existingUser.role || 'client'
            token.phone = existingUser.phone || ''
          }
        } catch (error) {
          console.error('Erreur sync Google:', error)
        }
      }

      if (trigger === 'update' && token.id) {
        try {
          const freshUser = await (prisma as any).user.findUnique({
            where: { id: token.id }
          })
          if (freshUser) {
            token.role = freshUser.role
            token.phone = freshUser.phone
            token.name = freshUser.name
            token.email = freshUser.email
            token.picture = freshUser.avatar
          }
        } catch (error) {
          console.error('Erreur refresh:', error)
        }
      }

      return token
    },

    async session({ session, token }: { 
      session: any
      token: any
    }) {
      if (session.user) {
        session.user.id = token.id as string
        session.user.phone = token.phone as string
        session.user.role = token.role as string
      }
      return session
    },

    async redirect({ url, baseUrl }: { 
      url: string
      baseUrl: string
    }) {
      if (url.startsWith('/')) return `${baseUrl}${url}`
      if (new URL(url).origin === baseUrl) return url
      return baseUrl
    }
  },

  pages: {
    signIn: '/',
    error: '/',
  },

  secret: process.env.NEXTAUTH_SECRET,
  debug: process.env.NODE_ENV === 'development',
}

// ✅ Correction : exporter avec le type correct
export default NextAuth(authOptions)