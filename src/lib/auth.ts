import NextAuth from 'next-auth'
import Google from 'next-auth/providers/google'
import Credentials from 'next-auth/providers/credentials'
import { PrismaAdapter } from '@auth/prisma-adapter'
import bcrypt from 'bcryptjs'
import prisma from './prisma'
import { cookies } from 'next/headers'
import { authConfig } from './auth.config'

export const { handlers, signIn, signOut, auth } = NextAuth({
  ...authConfig,
  adapter: PrismaAdapter(prisma),
  providers: [
    Google({
      clientId: process.env.GOOGLE_CLIENT_ID,
      clientSecret: process.env.GOOGLE_CLIENT_SECRET,
      authorization: {
        params: {
          prompt: "consent",
          access_type: "offline",
          response_type: "code",
          scope: "openid email profile https://www.googleapis.com/auth/calendar.events"
        }
      },
      allowDangerousEmailAccountLinking: true,
    }),
    Credentials({
      name: 'Credentials',
      credentials: {
        email: { label: "Email", type: "email" },
        password: { label: "Password", type: "password" }
      },
      async authorize(credentials) {
        if (!credentials?.email || !credentials?.password) return null
        const user = await prisma.user.findUnique({
          where: { email: credentials.email as string }
        })
        if (!user || !user.password) return null
        const isValid = await bcrypt.compare(credentials.password as string, user.password)
        if (!isValid) return null
        return user
      }
    })
  ],
  callbacks: {
    async jwt({ token, user, account, trigger }) {
      if (account?.provider === 'google') {
        token.access_token = account.access_token
        token.refresh_token = account.refresh_token
      }
      if (user) {
        token.id = user.id
        token.role = (user as any).role || 'customer'
      }
      // Refetch role + KYC status from DB on signIn/signUp to get fresh data
      if ((trigger === 'signIn' || trigger === 'signUp') && token.id) {
        try {
          const dbUser = await prisma.user.findUnique({
            where: { id: token.id as string },
            include: { businessProfile: true, customerProfile: true },
          })
          if (dbUser) {
            token.role = dbUser.role
            token.businessCompleted = Boolean(dbUser.businessProfile)
            token.kycStatus = dbUser.customerProfile?.kycStatus || 'not_submitted'
          }
        } catch {}
      }
      return token
    },
    async session({ session, token }: any) {
      if (session.user) {
        session.user.id = token.id as string
        session.user.role = (token.role as string) || 'customer'
        session.user.kycStatus = token.kycStatus || null
        session.user.businessCompleted = Boolean(token.businessCompleted)
      }
      return session
    },
    async signIn({ user, account }) {
      if (account?.provider === 'google') {
        const existingUser = await prisma.user.findUnique({
          where: { email: user.email! },
          include: { businessProfile: true, customerProfile: true }
        })

        if (existingUser) {
          // Existing user — ensure they have role-specific profile
          if (existingUser.role === 'provider' && !existingUser.businessProfile) {
            const siteSettings = await prisma.siteSettings.findUnique({ where: { id: '1' } })
            const trialDays = siteSettings?.defaultTrialDays ?? 30
            const trialEndsAt = new Date()
            trialEndsAt.setDate(trialEndsAt.getDate() + trialDays)
            const slug = `${(existingUser.name || 'business').toLowerCase().replace(/\s+/g, '-')}-${Date.now()}`
            const business = await prisma.business.create({
              data: { userId: existingUser.id, name: existingUser.name || 'My Business', slug, approvalStatus: 'approved' },
            })
            await prisma.subscription.create({
              data: { businessId: business.id, status: 'trial', planName: 'Free Trial', pricePerMonth: 0, maxItems: 5, trialEndsAt },
            })
          } else if (existingUser.role === 'customer' && !existingUser.customerProfile) {
            await prisma.customerProfile.create({ data: { userId: existingUser.id } })
          }
        }
      }
      return true
    },
  },
  events: {
    async createUser({ user }) {
      // Fires when PrismaAdapter creates a NEW user via Google OAuth
      const cookieStore = await cookies()
      const pendingRole = cookieStore.get('pendingRole')?.value || 'customer'

      await prisma.user.update({
        where: { id: user.id! },
        data: { role: pendingRole },
      })

      if (pendingRole === 'provider') {
        const siteSettings = await prisma.siteSettings.findUnique({ where: { id: '1' } })
        const trialDays = siteSettings?.defaultTrialDays ?? 30
        const trialEndsAt = new Date()
        trialEndsAt.setDate(trialEndsAt.getDate() + trialDays)
        const slug = `${(user.name || 'business').toLowerCase().replace(/\s+/g, '-')}-${Date.now()}`
        const business = await prisma.business.create({
          data: { userId: user.id!, name: user.name || 'My Business', slug, approvalStatus: 'approved' },
        })
        await prisma.subscription.create({
          data: { businessId: business.id, status: 'trial', planName: 'Free Trial', pricePerMonth: 0, maxItems: 5, trialEndsAt },
        })
      } else {
        await prisma.customerProfile.create({ data: { userId: user.id! } })
      }
    },
  },
})
