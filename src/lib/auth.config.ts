import type { NextAuthConfig } from 'next-auth'
import Google from 'next-auth/providers/google'
import Credentials from 'next-auth/providers/credentials'

export const authConfig = {
  secret: process.env.AUTH_SECRET || process.env.NEXTAUTH_SECRET,
  session: { strategy: 'jwt' },
  pages: { signIn: '/auth/signin' },
  providers: [], // We'll add them in auth.ts to avoid Edge runtime issues with Prisma/Bcrypt
  callbacks: {
    async signIn({ user, account, profile }) {
      return true
    },
    async jwt({ token, user, account }) {
      if (account?.provider === 'google') {
        token.access_token = account.access_token
        token.refresh_token = account.refresh_token
      }
      if (user) {
        token.id = user.id
        token.role = (user as any).role || 'customer'
      }
      return token
    },
    async session({ session, token }) {
      if (session.user) {
        session.user.id = token.id as string
        session.user.role = (token.role as string) || 'customer'
      }
      return session
    }
  }
} satisfies NextAuthConfig
