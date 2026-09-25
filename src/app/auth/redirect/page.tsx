'use client'

import { useEffect } from 'react'
import { useSession } from 'next-auth/react'

export default function AuthRedirectPage() {
  const { data: session, status } = useSession()

  useEffect(() => {
    if (status === 'loading') return

    if (!session) {
      window.location.href = '/auth/signin'
      return
    }

    fetch('/api/auth/destination')
      .then(res => res.json())
      .then(data => {
        if (data?.destination) {
          window.location.href = data.destination
        } else {
          window.location.href = '/dashboard'
        }
      })
      .catch(() => {
        window.location.href = '/dashboard'
      })
  }, [session, status])

  return (
    <div className="min-h-screen flex items-center justify-center bg-gray-50">
      <div className="text-center">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600 mx-auto mb-4"></div>
        <p className="text-gray-600">Redirecting to your dashboard...</p>
      </div>
    </div>
  )
}
