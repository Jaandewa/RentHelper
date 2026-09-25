'use client'

import { useEffect, useState } from 'react'
import { useRouter } from 'next/navigation'
import { Clock, CheckCircle, XCircle, RefreshCw, ArrowRight, LogOut, FileText } from 'lucide-react'
import { signOut } from 'next-auth/react'

interface UserData {
  id: string
  name: string
  email: string
  role: string
  customerProfile: {
    kycStatus: string
    kycRejectionReason: string | null
    kycSubmittedAt: string | null
  } | null
}

export default function PendingApprovalPage() {
  const router = useRouter()
  const [user, setUser] = useState<UserData | null>(null)
  const [loading, setLoading] = useState(true)

  const fetchStatus = async () => {
    try {
      // Check server destination first to enforce strict protection
      const destRes = await fetch('/api/auth/destination')
      if (destRes.ok) {
        const destData = await destRes.json()
        if (destData?.destination && destData.destination !== '/customer/pending-approval') {
          router.replace(destData.destination)
          return
        }
      }

      const res = await fetch('/api/auth/me')
      if (res.ok) {
        const data = await res.json()
        setUser(data.user)
      }
    } catch {}
    setLoading(false)
  }

  useEffect(() => {
    fetchStatus()
    // Poll every 30 seconds
    const interval = setInterval(fetchStatus, 30000)
    return () => clearInterval(interval)
  }, [])

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600"></div>
      </div>
    )
  }

  const kycStatus = user?.customerProfile?.kycStatus || 'pending'
  const rejectionReason = user?.customerProfile?.kycRejectionReason

  return (
    <div className="min-h-screen bg-gradient-to-br from-blue-50 via-white to-purple-50 flex items-center justify-center py-12 px-4">
      <div className="max-w-lg w-full">
        <div className="bg-white rounded-2xl shadow-lg border border-gray-100 p-8 text-center">
          {/* Status Icon */}
          <div className={`w-20 h-20 rounded-full flex items-center justify-center mx-auto mb-6 ${
            kycStatus === 'verified' || kycStatus === 'approved' ? 'bg-green-100' :
            kycStatus === 'rejected' ? 'bg-red-100' :
            'bg-amber-100'
          }`}>
            {kycStatus === 'verified' || kycStatus === 'approved' ? (
              <CheckCircle className="w-10 h-10 text-green-600" />
            ) : kycStatus === 'rejected' ? (
              <XCircle className="w-10 h-10 text-red-500" />
            ) : (
              <Clock className="w-10 h-10 text-amber-600" />
            )}
          </div>

          {/* Status Message */}
          {(kycStatus === 'pending' || kycStatus === 'not_submitted') && (
            <>
              <h2 className="text-2xl font-bold text-gray-900 mb-3">Documents Submitted!</h2>
              <p className="text-gray-600 mb-6 leading-relaxed">
                Our team will review your submission within 24 hours. 
                You will receive a notification once verified.
              </p>
              <div className="bg-amber-50 border border-amber-200 rounded-xl p-4 mb-6">
                <div className="flex items-center justify-center gap-2 text-amber-700 text-sm font-medium mb-1">
                  <FileText className="w-4 h-4" />
                  Status: Pending Review
                </div>
                {user?.customerProfile?.kycSubmittedAt && (
                  <p className="text-amber-600 text-xs">
                    Submitted on: {new Date(user.customerProfile.kycSubmittedAt).toLocaleString()}
                  </p>
                )}
              </div>
              <button 
                onClick={fetchStatus}
                className="inline-flex items-center gap-2 px-4 py-2 text-sm font-medium text-blue-600 bg-blue-50 rounded-lg hover:bg-blue-100 transition-colors"
              >
                <RefreshCw className="w-4 h-4" /> Check Status
              </button>
            </>
          )}

          {kycStatus === 'rejected' && (
            <>
              <h2 className="text-2xl font-bold text-gray-900 mb-3">Verification Rejected</h2>
              <p className="text-gray-600 mb-4">
                Unfortunately, your identity verification was not approved. Please review the reason below and resubmit.
              </p>
              {rejectionReason && (
                <div className="bg-red-50 border border-red-200 rounded-xl p-4 mb-6 text-left">
                  <p className="text-red-700 text-sm font-medium mb-1">Rejection Reason:</p>
                  <p className="text-red-600 text-sm">{rejectionReason}</p>
                </div>
              )}
              <button
                onClick={() => router.push('/onboarding/kyc?resubmit=true')}
                className="inline-flex items-center gap-2 px-6 py-3 text-sm font-medium text-white bg-blue-600 rounded-lg hover:bg-blue-700 transition-colors"
              >
                Resubmit Documents <ArrowRight className="w-4 h-4" />
              </button>
            </>
          )}

          {(kycStatus === 'verified' || kycStatus === 'approved') && (
            <>
              <h2 className="text-2xl font-bold text-gray-900 mb-3">You&apos;re Verified! 🎉</h2>
              <p className="text-gray-600 mb-6">
                Your identity has been verified. You can now access the platform and make rental bookings.
              </p>
              <button
                onClick={() => router.push('/customer/dashboard')}
                className="inline-flex items-center gap-2 px-6 py-3 text-sm font-medium text-white bg-green-600 rounded-lg hover:bg-green-700 transition-colors"
              >
                Continue to Customer Dashboard <ArrowRight className="w-4 h-4" />
              </button>
            </>
          )}
        </div>

        {/* User info footer */}
        <div className="mt-6 flex items-center justify-between px-4">
          <p className="text-sm text-gray-500">
            Signed in as <span className="font-medium text-gray-700">{user?.email}</span>
          </p>
          <button 
            onClick={() => signOut({ callbackUrl: '/auth/signin' })}
            className="inline-flex items-center gap-1 text-sm text-gray-500 hover:text-red-500 transition-colors"
          >
            <LogOut className="w-3.5 h-3.5" /> Sign Out
          </button>
        </div>
      </div>
    </div>
  )
}
