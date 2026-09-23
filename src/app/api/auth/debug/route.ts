import { NextResponse } from 'next/server'
import prisma from '@/lib/prisma'
import bcrypt from 'bcryptjs'

export async function GET() {
  try {
    const results: any = {}

    // 1. Check if admin user exists
    const admin = await prisma.user.findUnique({
      where: { email: 'admin@renthelper.lk' },
      select: { id: true, email: true, role: true, status: true, password: true }
    })

    if (!admin) {
      results.adminExists = false
      results.message = 'Admin user does not exist. Go to /setup first.'
      return NextResponse.json(results)
    }

    results.adminExists = true
    results.adminId = admin.id
    results.adminRole = admin.role
    results.adminStatus = admin.status
    results.hasPassword = !!admin.password
    results.passwordLength = admin.password?.length || 0

    // 2. Test bcrypt comparison
    const testPassword = 'Admin@1234'
    const isMatch = await bcrypt.compare(testPassword, admin.password || '')
    results.passwordMatch = isMatch

    // 3. Check env vars
    results.hasNextAuthSecret = !!process.env.NEXTAUTH_SECRET
    results.nextAuthUrl = process.env.NEXTAUTH_URL || 'NOT SET'
    results.hasDatabaseUrl = !!process.env.DATABASE_URL
    results.databaseUrlHost = process.env.DATABASE_URL?.split('@')[1]?.split('/')[0] || 'unknown'

    // 4. Summary
    if (isMatch) {
      results.summary = 'Password is CORRECT. Login should work. If not, check NEXTAUTH_URL and NEXTAUTH_SECRET.'
    } else {
      results.summary = 'Password does NOT match. Run /setup seed again.'
    }

    return NextResponse.json(results, { status: 200 })
  } catch (error) {
    return NextResponse.json({ error: String(error) }, { status: 500 })
  }
}
