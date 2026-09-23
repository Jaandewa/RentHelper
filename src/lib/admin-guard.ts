import { auth } from './auth'
import { NextResponse } from 'next/server'

/**
 * Checks that the current session belongs to an admin user.
 * Returns { session } on success, or a 401/403 NextResponse on failure.
 */
export async function requireAdmin() {
  const session = await auth()
  if (!session?.user) {
    return {
      error: NextResponse.json({ message: 'Unauthorized' }, { status: 401 }),
      session: null,
    }
  }
  if (session.user.role !== 'admin') {
    return {
      error: NextResponse.json({ message: 'Forbidden — admin only' }, { status: 403 }),
      session: null,
    }
  }
  return { error: null, session }
}
