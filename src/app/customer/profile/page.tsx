'use client'

import { useEffect, useState } from 'react'
import { useRouter } from 'next/navigation'
import { useSession } from 'next-auth/react'
import Header from '@/components/layout/Header'
import {
  User,
  ShieldCheck,
  Lock,
  Save,
  Loader2,
  CheckCircle2,
  AlertCircle,
  Camera,
  MapPin,
  PhoneCall,
  UserCheck,
  Share2
} from 'lucide-react'
import { toast } from 'sonner'

export default function CustomerProfilePage() {
  const router = useRouter()
  const { data: session, status } = useSession()

  const [loading, setLoading] = useState(true)
  const [saving, setSaving] = useState(false)
  const [userData, setUserData] = useState<any>(null)

  // Editable state
  const [image, setImage] = useState('')
  const [address, setAddress] = useState('')
  const [city, setCity] = useState('')
  const [emergencyContact, setEmergencyContact] = useState('')
  const [emergencyPhone, setEmergencyPhone] = useState('')
  const [allowCrossProviderShare, setAllowCrossProviderShare] = useState(true)

  useEffect(() => {
    if (status === 'loading') return
    if (!session?.user) {
      router.replace('/auth/signin?callbackUrl=/customer/profile')
      return
    }

    fetch('/api/customer/profile')
      .then((res) => {
        if (!res.ok) throw new Error('Failed to load profile')
        return res.json()
      })
      .then((data) => {
        if (data.user) {
          setUserData(data.user)
          setImage(data.user.image || '')
          const cp = data.user.customerProfile || {}
          setAddress(cp.address || '')
          setCity(cp.city || '')
          setEmergencyContact(cp.emergencyContact || '')
          setEmergencyPhone(cp.emergencyPhone || '')
          setAllowCrossProviderShare(cp.allowCrossProviderShare !== false)
        }
      })
      .catch((err) => {
        toast.error('Could not load profile details')
      })
      .finally(() => setLoading(false))
  }, [session, status, router])

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    if (saving) return
    setSaving(true)

    try {
      const res = await fetch('/api/customer/profile', {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          image,
          address,
          city,
          emergencyContact,
          emergencyPhone,
          allowCrossProviderShare,
        }),
      })

      const data = await res.json()
      if (!res.ok) {
        toast.error(data.error || 'Failed to update profile')
        return
      }

      toast.success('Profile updated successfully!')
      if (data.user) setUserData(data.user)
    } catch (error) {
      toast.error('An error occurred while saving profile')
    } finally {
      setSaving(false)
    }
  }

  if (loading || status === 'loading') {
    return (
      <div className="min-h-screen bg-gray-50 flex flex-col">
        <Header />
        <div className="flex-1 flex items-center justify-center">
          <Loader2 className="w-8 h-8 animate-spin text-blue-600" />
        </div>
      </div>
    )
  }

  const cp = userData?.customerProfile || {}

  return (
    <div className="min-h-screen bg-gray-50 flex flex-col">
      <Header />

      <main className="flex-1 py-10 px-4 sm:px-6 lg:px-8 max-w-4xl mx-auto w-full">
        <div className="mb-8">
          <h1 className="text-3xl font-extrabold text-gray-900 tracking-tight">Customer Profile Settings</h1>
          <p className="text-sm text-gray-500 mt-1">
            Manage your address, emergency contacts, and preferences. Restricted security fields are read-only.
          </p>
        </div>

        {/* Profile Header Card */}
        <div className="bg-white rounded-2xl p-6 shadow-sm border border-gray-100 mb-8 flex flex-col sm:flex-row items-center gap-6">
          <div className="relative group">
            <div className="w-20 h-20 rounded-full bg-blue-600 flex items-center justify-center text-white text-3xl font-bold overflow-hidden shadow-inner">
              {image ? (
                <img src={image} alt={userData?.name || 'User'} className="w-full h-full object-cover" />
              ) : (
                userData?.name?.[0]?.toUpperCase() || 'C'
              )}
            </div>
          </div>
          <div className="text-center sm:text-left flex-1">
            <div className="flex flex-wrap items-center justify-center sm:justify-start gap-2">
              <h2 className="text-xl font-bold text-gray-900">{userData?.name || 'Customer Account'}</h2>
              <span className="px-2.5 py-0.5 rounded-full text-xs font-semibold bg-blue-100 text-blue-800 border border-blue-200">
                Verified Customer
              </span>
            </div>
            <p className="text-xs text-gray-500 mt-1">{userData?.email}</p>
            <div className="mt-2 flex flex-wrap items-center justify-center sm:justify-start gap-3 text-xs text-gray-500">
              <span className="flex items-center gap-1 bg-gray-50 px-2 py-1 rounded-md border border-gray-200">
                <ShieldCheck className="w-3.5 h-3.5 text-emerald-600" />
                KYC: <strong className="capitalize text-gray-700">{cp.kycStatus || 'Not Submitted'}</strong>
              </span>
              <span className="flex items-center gap-1 bg-gray-50 px-2 py-1 rounded-md border border-gray-200">
                <UserCheck className="w-3.5 h-3.5 text-blue-600" />
                Status: <strong className="capitalize text-gray-700">{cp.accountStatus || 'Active'}</strong>
              </span>
            </div>
          </div>
        </div>

        <form onSubmit={handleSubmit} className="space-y-8">
          {/* Section 1: Editable Self Profile Fields */}
          <div className="bg-white rounded-2xl p-6 shadow-sm border border-gray-100 space-y-6">
            <div className="border-b border-gray-100 pb-4">
              <h2 className="text-lg font-bold text-gray-900 flex items-center gap-2">
                <MapPin className="w-5 h-5 text-blue-600" />
                Editable Contact & Address Details
              </h2>
              <p className="text-xs text-gray-500 mt-0.5">
                You can freely update these fields at any time.
              </p>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              <div className="md:col-span-2">
                <label className="block text-xs font-semibold text-gray-700 uppercase tracking-wider mb-2">
                  Profile Picture / Image URL
                </label>
                <input
                  type="url"
                  placeholder="https://example.com/my-photo.jpg"
                  value={image}
                  onChange={(e) => setImage(e.target.value)}
                  className="w-full px-4 py-2.5 border border-gray-300 rounded-xl text-sm focus:ring-2 focus:ring-blue-500 focus:border-blue-500 outline-none transition"
                />
              </div>

              <div>
                <label className="block text-xs font-semibold text-gray-700 uppercase tracking-wider mb-2">
                  City / District
                </label>
                <input
                  type="text"
                  placeholder="e.g. Colombo, Kandy, Galle"
                  value={city}
                  onChange={(e) => setCity(e.target.value)}
                  className="w-full px-4 py-2.5 border border-gray-300 rounded-xl text-sm focus:ring-2 focus:ring-blue-500 focus:border-blue-500 outline-none transition"
                />
              </div>

              <div>
                <label className="block text-xs font-semibold text-gray-700 uppercase tracking-wider mb-2">
                  Residential / Business Address
                </label>
                <input
                  type="text"
                  placeholder="Street address, house/flat number"
                  value={address}
                  onChange={(e) => setAddress(e.target.value)}
                  className="w-full px-4 py-2.5 border border-gray-300 rounded-xl text-sm focus:ring-2 focus:ring-blue-500 focus:border-blue-500 outline-none transition"
                />
              </div>

              <div>
                <label className="block text-xs font-semibold text-gray-700 uppercase tracking-wider mb-2">
                  Emergency Contact Person
                </label>
                <input
                  type="text"
                  placeholder="Relative or next of kin name"
                  value={emergencyContact}
                  onChange={(e) => setEmergencyContact(e.target.value)}
                  className="w-full px-4 py-2.5 border border-gray-300 rounded-xl text-sm focus:ring-2 focus:ring-blue-500 focus:border-blue-500 outline-none transition"
                />
              </div>

              <div>
                <label className="block text-xs font-semibold text-gray-700 uppercase tracking-wider mb-2">
                  Emergency Contact Phone
                </label>
                <input
                  type="text"
                  placeholder="07XXXXXXXX"
                  value={emergencyPhone}
                  onChange={(e) => setEmergencyPhone(e.target.value)}
                  className="w-full px-4 py-2.5 border border-gray-300 rounded-xl text-sm focus:ring-2 focus:ring-blue-500 focus:border-blue-500 outline-none transition"
                />
              </div>

              <div className="md:col-span-2 pt-2">
                <label className="flex items-center gap-3 cursor-pointer p-4 bg-gray-50 rounded-xl border border-gray-200 hover:bg-gray-100/80 transition">
                  <input
                    type="checkbox"
                    checked={allowCrossProviderShare}
                    onChange={(e) => setAllowCrossProviderShare(e.target.checked)}
                    className="w-4 h-4 text-blue-600 rounded focus:ring-blue-500 border-gray-300"
                  />
                  <div className="text-xs">
                    <p className="font-semibold text-gray-900">Communication & Trust Sharing</p>
                    <p className="text-gray-500">Allow verified rental providers on RentHelper to view rental history & trust score</p>
                  </div>
                </label>
              </div>
            </div>
          </div>

          {/* Section 2: Read-Only Restricted Identity Fields */}
          <div className="bg-gray-50/80 rounded-2xl p-6 border border-gray-200/80 space-y-6">
            <div className="border-b border-gray-200 pb-3 flex items-center justify-between">
              <div>
                <h2 className="text-base font-bold text-gray-800 flex items-center gap-2">
                  <Lock className="w-4 h-4 text-amber-600" />
                  Read-Only Identity & Verification Details
                </h2>
                <p className="text-xs text-gray-500 mt-0.5">
                  Governed by security rules. Contact support to request official corrections.
                </p>
              </div>
              <span className="text-[11px] font-bold text-amber-800 bg-amber-100 px-2.5 py-1 rounded-md border border-amber-200">
                Server Protected
              </span>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div>
                <label className="block text-xs font-semibold text-gray-500 uppercase tracking-wider mb-1">
                  Full Legal Name
                </label>
                <input
                  type="text"
                  disabled
                  value={userData?.name || ''}
                  className="w-full px-3.5 py-2 bg-gray-200/60 border border-gray-300 rounded-xl text-sm text-gray-700 cursor-not-allowed font-medium"
                />
              </div>

              <div>
                <label className="block text-xs font-semibold text-gray-500 uppercase tracking-wider mb-1">
                  Email Address
                </label>
                <input
                  type="email"
                  disabled
                  value={userData?.email || ''}
                  className="w-full px-3.5 py-2 bg-gray-200/60 border border-gray-300 rounded-xl text-sm text-gray-700 cursor-not-allowed font-medium"
                />
              </div>

              <div>
                <label className="block text-xs font-semibold text-gray-500 uppercase tracking-wider mb-1">
                  Primary Phone Number
                </label>
                <input
                  type="text"
                  disabled
                  value={cp.phone || 'Not provided'}
                  className="w-full px-3.5 py-2 bg-gray-200/60 border border-gray-300 rounded-xl text-sm text-gray-700 cursor-not-allowed font-medium"
                />
              </div>

              <div>
                <label className="block text-xs font-semibold text-gray-500 uppercase tracking-wider mb-1">
                  Identity Document Number (NIC / Passport)
                </label>
                <input
                  type="text"
                  disabled
                  value={cp.nicNumber || 'Verified in KYC'}
                  className="w-full px-3.5 py-2 bg-gray-200/60 border border-gray-300 rounded-xl text-sm text-gray-700 cursor-not-allowed font-medium"
                />
              </div>
            </div>
          </div>

          <div className="flex items-center justify-end gap-4 pt-4">
            <button
              type="submit"
              disabled={saving}
              className="flex items-center gap-2 bg-blue-600 hover:bg-blue-700 text-white px-8 py-3 rounded-xl font-bold shadow-md hover:shadow-lg disabled:opacity-50 transition-all text-sm"
            >
              {saving ? (
                <><Loader2 className="w-4 h-4 animate-spin" /> Saving Changes...</>
              ) : (
                <><Save className="w-4 h-4" /> Save Profile</>
              )}
            </button>
          </div>
        </form>
      </main>
    </div>
  )
}
