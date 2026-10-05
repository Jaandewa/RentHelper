'use client'

import { useEffect, useState } from 'react'
import Link from 'next/link'
import { useRouter } from 'next/navigation'
import { useSession } from 'next-auth/react'
import {
  ArrowLeft,
  Building2,
  Lock,
  Save,
  Loader2,
  MapPin,
  Clock,
  FileText,
  ShieldCheck,
  Camera
} from 'lucide-react'
import { toast } from 'sonner'

export default function ProviderProfilePage() {
  const router = useRouter()
  const { data: session, status } = useSession()

  const [loading, setLoading] = useState(true)
  const [saving, setSaving] = useState(false)

  const [userData, setUserData] = useState<any>(null)
  const [businessData, setBusinessData] = useState<any>(null)

  // Editable fields
  const [logo, setLogo] = useState('')
  const [description, setDescription] = useState('')
  const [address, setAddress] = useState('')
  const [city, setCity] = useState('')
  const [depositPolicy, setDepositPolicy] = useState('')
  const [cancellationPolicy, setCancellationPolicy] = useState('')

  useEffect(() => {
    if (status === 'loading') return
    if (!session?.user) {
      router.replace('/auth/signin?callbackUrl=/dashboard/settings/profile')
      return
    }

    fetch('/api/provider/profile')
      .then((res) => {
        if (!res.ok) throw new Error('Failed to load provider profile')
        return res.json()
      })
      .then((data) => {
        if (data.user) setUserData(data.user)
        if (data.business) {
          setBusinessData(data.business)
          setLogo(data.business.logo || '')
          setDescription(data.business.description || '')
          setAddress(data.business.address || '')
          setCity(data.business.city || '')
          setDepositPolicy(data.business.depositPolicy || '')
          setCancellationPolicy(data.business.cancellationPolicy || '')
        }
      })
      .catch(() => {
        toast.error('Failed to load profile')
      })
      .finally(() => setLoading(false))
  }, [session, status, router])

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    if (saving) return
    setSaving(true)

    try {
      const res = await fetch('/api/provider/profile', {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          logo,
          description,
          address,
          city,
          depositPolicy,
          cancellationPolicy,
        }),
      })

      const data = await res.json()
      if (!res.ok) {
        toast.error(data.error || 'Failed to update profile')
        return
      }

      toast.success('Provider profile updated successfully!')
      if (data.business) setBusinessData(data.business)
    } catch (error) {
      toast.error('An error occurred while saving profile')
    } finally {
      setSaving(false)
    }
  }

  if (loading || status === 'loading') {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <Loader2 className="w-8 h-8 animate-spin text-blue-600" />
      </div>
    )
  }

  return (
    <div className="max-w-4xl mx-auto space-y-6 pb-12">
      <div className="flex items-center gap-4">
        <Link href="/dashboard/settings" className="p-2 rounded-xl text-gray-500 hover:bg-gray-100 transition">
          <ArrowLeft className="w-5 h-5" />
        </Link>
        <div>
          <h1 className="text-2xl font-bold text-gray-900">Provider Business Profile</h1>
          <p className="text-sm text-gray-500">Manage public business details, operating hours, and instructions.</p>
        </div>
      </div>

      {/* Business Header Card */}
      <div className="bg-white rounded-2xl border border-gray-100 shadow-sm p-6 flex flex-col sm:flex-row items-center gap-6">
        <div className="w-20 h-20 rounded-2xl bg-blue-600 flex items-center justify-center text-white text-3xl font-bold overflow-hidden shadow-inner flex-shrink-0">
          {logo ? (
            <img src={logo} alt={businessData?.name || 'Business'} className="w-full h-full object-cover" />
          ) : (
            businessData?.name?.[0]?.toUpperCase() || 'B'
          )}
        </div>
        <div className="text-center sm:text-left flex-1">
          <div className="flex flex-wrap items-center justify-center sm:justify-start gap-2">
            <h2 className="text-xl font-bold text-gray-900">{businessData?.name || 'My Rental Business'}</h2>
            <span className="px-2.5 py-0.5 rounded-full text-xs font-semibold bg-emerald-100 text-emerald-800 border border-emerald-200 capitalize">
              {businessData?.approvalStatus || 'Approved'}
            </span>
          </div>
          <p className="text-xs text-gray-500 mt-1">Owner: {userData?.name} ({userData?.email})</p>
          <div className="mt-2 flex flex-wrap items-center justify-center sm:justify-start gap-3 text-xs text-gray-500">
            <span className="flex items-center gap-1 bg-gray-50 px-2 py-1 rounded-md border border-gray-200">
              <MapPin className="w-3.5 h-3.5 text-blue-600" />
              Service City: <strong className="text-gray-700">{city || 'Sri Lanka'}</strong>
            </span>
          </div>
        </div>
      </div>

      <form onSubmit={handleSubmit} className="space-y-6">
        {/* Editable Business Details */}
        <div className="bg-white rounded-2xl border border-gray-100 shadow-sm p-6 space-y-6">
          <div className="border-b border-gray-100 pb-3">
            <h2 className="text-lg font-bold text-gray-900 flex items-center gap-2">
              <Building2 className="w-5 h-5 text-blue-600" />
              Public Business Details
            </h2>
            <p className="text-xs text-gray-500">
              These details are visible on your marketplace rental ads and store profile.
            </p>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            <div className="md:col-span-2">
              <label className="block text-xs font-semibold text-gray-700 uppercase tracking-wider mb-2">
                Business Logo URL
              </label>
              <input
                type="url"
                placeholder="https://example.com/logo.png"
                value={logo}
                onChange={(e) => setLogo(e.target.value)}
                className="w-full px-4 py-2.5 border border-gray-300 rounded-xl text-sm focus:ring-2 focus:ring-blue-500 focus:border-blue-500 outline-none transition"
              />
            </div>

            <div className="md:col-span-2">
              <label className="block text-xs font-semibold text-gray-700 uppercase tracking-wider mb-2">
                Business Description
              </label>
              <textarea
                rows={3}
                placeholder="Describe your rental business, specialty items, and service standards..."
                value={description}
                onChange={(e) => setDescription(e.target.value)}
                className="w-full px-4 py-2.5 border border-gray-300 rounded-xl text-sm focus:ring-2 focus:ring-blue-500 focus:border-blue-500 outline-none transition"
              />
            </div>

            <div>
              <label className="block text-xs font-semibold text-gray-700 uppercase tracking-wider mb-2">
                Service City / Primary District
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
                Pickup & Return Address
              </label>
              <input
                type="text"
                placeholder="Street address for item pickup and return"
                value={address}
                onChange={(e) => setAddress(e.target.value)}
                className="w-full px-4 py-2.5 border border-gray-300 rounded-xl text-sm focus:ring-2 focus:ring-blue-500 focus:border-blue-500 outline-none transition"
              />
            </div>

            <div className="md:col-span-2">
              <label className="block text-xs font-semibold text-gray-700 uppercase tracking-wider mb-2">
                Operating Hours & Pickup Instructions
              </label>
              <textarea
                rows={3}
                placeholder="e.g., Open Mon-Sat 8:00 AM - 6:00 PM. Original NIC required upon handover."
                value={depositPolicy}
                onChange={(e) => setDepositPolicy(e.target.value)}
                className="w-full px-4 py-2.5 border border-gray-300 rounded-xl text-sm focus:ring-2 focus:ring-blue-500 focus:border-blue-500 outline-none transition"
              />
            </div>

            <div className="md:col-span-2">
              <label className="block text-xs font-semibold text-gray-700 uppercase tracking-wider mb-2">
                Return & Cancellation Terms
              </label>
              <textarea
                rows={3}
                placeholder="e.g., Free cancellation up to 24 hours before pickup. Late returns incur LKR 500/hour fee."
                value={cancellationPolicy}
                onChange={(e) => setCancellationPolicy(e.target.value)}
                className="w-full px-4 py-2.5 border border-gray-300 rounded-xl text-sm focus:ring-2 focus:ring-blue-500 focus:border-blue-500 outline-none transition"
              />
            </div>
          </div>
        </div>

        {/* Read-Only Restricted Provider Fields */}
        <div className="bg-gray-50/80 rounded-2xl border border-gray-200/80 p-6 space-y-4">
          <div className="border-b border-gray-200 pb-3 flex items-center justify-between">
            <div>
              <h2 className="text-base font-bold text-gray-800 flex items-center gap-2">
                <Lock className="w-4 h-4 text-amber-600" />
                Read-Only Business & Verification Details
              </h2>
              <p className="text-xs text-gray-500 mt-0.5">
                Restricted by system policy. Contact platform support to request legal name or phone updates.
              </p>
            </div>
            <span className="text-[11px] font-bold text-amber-800 bg-amber-100 px-2.5 py-1 rounded-md border border-amber-200">
              Server Protected
            </span>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div>
              <label className="block text-xs font-semibold text-gray-500 uppercase tracking-wider mb-1">
                Registered Business Name
              </label>
              <input
                type="text"
                disabled
                value={businessData?.name || ''}
                className="w-full px-3.5 py-2 bg-gray-200/60 border border-gray-300 rounded-xl text-sm text-gray-700 cursor-not-allowed font-medium"
              />
            </div>

            <div>
              <label className="block text-xs font-semibold text-gray-500 uppercase tracking-wider mb-1">
                Registered Phone / WhatsApp
              </label>
              <input
                type="text"
                disabled
                value={businessData?.phone || 'Verified'}
                className="w-full px-3.5 py-2 bg-gray-200/60 border border-gray-300 rounded-xl text-sm text-gray-700 cursor-not-allowed font-medium"
              />
            </div>

            <div>
              <label className="block text-xs font-semibold text-gray-500 uppercase tracking-wider mb-1">
                Business Registration Number
              </label>
              <input
                type="text"
                disabled
                value={businessData?.registrationNumber || 'N/A'}
                className="w-full px-3.5 py-2 bg-gray-200/60 border border-gray-300 rounded-xl text-sm text-gray-700 cursor-not-allowed font-medium"
              />
            </div>

            <div>
              <label className="block text-xs font-semibold text-gray-500 uppercase tracking-wider mb-1">
                Platform Verification & Approval Status
              </label>
              <input
                type="text"
                disabled
                value={businessData?.approvalStatus || 'Approved'}
                className="w-full px-3.5 py-2 bg-gray-200/60 border border-gray-300 rounded-xl text-sm text-gray-700 cursor-not-allowed font-medium capitalize"
              />
            </div>
          </div>
        </div>

        <div className="flex justify-end pt-2">
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
    </div>
  )
}
