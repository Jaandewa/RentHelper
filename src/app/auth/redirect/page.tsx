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

    const role = session.user?.role

    if (role === 'admin') {
      window.location.href = '/admin'
      return
    }

    if (role === 'customer') {
      // Fetch fresh KYC status from DB
      fetch('/api/auth/me')
        .then(res => res.json())
        .then(data => {
          const kycStatus = data?.user?.customerProfile?.kycStatus
          if (kycStatus === 'verified') {
            window.location.href = '/customer/dashboard'
          } else if (kycStatus === 'pending') {
            window.location.href = '/customer/pending-approval'
          } else if (kycStatus === 'rejected' || kycStatus === 'more_info_required') {
            window.location.href = '/onboarding/kyc?resubmit=true'
          } else {
            window.location.href = '/onboarding/kyc'
          }
        })
        .catch(() => {
          window.location.href = '/onboarding/kyc'
        })
      return
    }

    // Provider
    window.location.href = '/dashboard'
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
