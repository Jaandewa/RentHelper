'use client'

import { useEffect, useState, use } from 'react'
import Link from 'next/link'
import { Building2, MapPin, Phone, Star, ShieldCheck, ArrowLeft, Package, MessageCircle } from 'lucide-react'

interface ProviderDetail {
  id: string
  name: string
  slug: string
  description: string | null
  logo: string | null
  city: string | null
  address: string | null
  phone: string | null
  currency: string
  createdAt: string
  rentalAds: Array<{
    id: string
    title: string
    description: string | null
    coverImageUrl: string | null
    dailyPrice: number | null
    hourlyPrice: number | null
    securityDeposit: number | null
    city: string | null
    isAvailable: boolean
    item: {
      name: string
      conditionGrade: string
      itemImages: Array<{ url: string }>
      category: { name: string; slug: string }
    }
  }>
  providerRatings: Array<{
    id: string
    rating: number
    review: string | null
    createdAt: string
    customer: { user: { name: string } }
  }>
}

export default function ProviderStorePage({ params }: { params: Promise<{ providerId: string }> }) {
  const { providerId } = use(params)
  const [provider, setProvider] = useState<ProviderDetail | null>(null)
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    fetch(`/api/marketplace/providers/${providerId}`)
      .then(res => res.json())
      .then(data => {
        setProvider(data.provider || null)
        setLoading(false)
      })
      .catch(() => setLoading(false))
  }, [providerId])

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gray-50">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600"></div>
      </div>
    )
  }

  if (!provider) {
    return (
      <div className="min-h-screen flex flex-col items-center justify-center bg-gray-50 p-4">
        <h2 className="text-2xl font-bold text-gray-800">Store Not Found</h2>
        <p className="text-gray-500 mt-2">The requested rental provider store could not be found.</p>
        <Link href="/marketplace" className="mt-4 px-4 py-2 bg-blue-600 text-white rounded-lg text-sm font-medium hover:bg-blue-700">
          Back to Marketplace
        </Link>
      </div>
    )
  }

  const avgRating = provider.providerRatings.length > 0
    ? (provider.providerRatings.reduce((acc, r) => acc + r.rating, 0) / provider.providerRatings.length).toFixed(1)
    : null

  return (
    <div className="min-h-screen bg-gray-50 py-8 px-4 sm:px-6 lg:px-8">
      <div className="max-w-7xl mx-auto space-y-8">
        {/* Back link */}
        <Link href="/marketplace" className="inline-flex items-center gap-1.5 text-sm font-medium text-gray-600 hover:text-blue-600 transition">
          <ArrowLeft className="w-4 h-4" /> Back to Marketplace
        </Link>

        {/* Store Header Banner */}
        <div className="bg-white rounded-2xl shadow-sm border border-gray-100 p-6 md:p-8 flex flex-col md:flex-row items-start md:items-center justify-between gap-6">
          <div className="flex items-center gap-5">
            <div className="w-20 h-20 rounded-2xl bg-gradient-to-br from-blue-500 to-indigo-600 flex items-center justify-center text-white text-3xl font-extrabold shadow-md flex-shrink-0">
              {provider.logo ? (
                <img src={provider.logo} alt={provider.name} className="w-full h-full object-cover rounded-2xl" />
              ) : (
                provider.name.substring(0, 2).toUpperCase()
              )}
            </div>
            <div>
              <div className="flex items-center gap-2">
                <h1 className="text-2xl md:text-3xl font-bold text-gray-900">{provider.name}</h1>
                <span className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-xs font-semibold bg-blue-50 text-blue-700 border border-blue-100">
                  <ShieldCheck className="w-3.5 h-3.5 text-blue-600" /> Verified Store
                </span>
              </div>
              <div className="flex flex-wrap items-center gap-4 text-sm text-gray-500 mt-2">
                {provider.city && (
                  <span className="flex items-center gap-1">
                    <MapPin className="w-4 h-4 text-gray-400" /> {provider.city}
                  </span>
                )}
                {provider.phone && (
                  <span className="flex items-center gap-1">
                    <Phone className="w-4 h-4 text-gray-400" /> {provider.phone}
                  </span>
                )}
                {avgRating && (
                  <span className="flex items-center gap-1 text-amber-600 font-semibold">
                    <Star className="w-4 h-4 fill-amber-400 text-amber-400" /> {avgRating} ({provider.providerRatings.length} reviews)
                  </span>
                )}
              </div>
              {provider.description && (
                <p className="text-gray-600 text-sm mt-3 max-w-2xl">{provider.description}</p>
              )}
            </div>
          </div>

          <div className="flex flex-col sm:flex-row gap-3 w-full md:w-auto">
            {provider.phone && (
              <a
                href={`https://wa.me/${provider.phone.replace(/[^0-9]/g, '')}`}
                target="_blank"
                rel="noopener noreferrer"
                className="px-5 py-2.5 bg-green-600 text-white rounded-xl font-medium text-sm hover:bg-green-700 transition flex items-center justify-center gap-2 shadow-sm"
              >
                <MessageCircle className="w-4 h-4" /> WhatsApp Store
              </a>
            )}
          </div>
        </div>

        {/* Store Ads Grid */}
        <div className="space-y-4">
          <h2 className="text-xl font-bold text-gray-900 flex items-center gap-2">
            <Package className="w-5 h-5 text-blue-600" /> Rental Listings ({provider.rentalAds.length})
          </h2>

          {provider.rentalAds.length === 0 ? (
            <div className="bg-white rounded-2xl border border-gray-100 p-12 text-center text-gray-500">
              <Package className="w-12 h-12 text-gray-300 mx-auto mb-3" />
              <p className="text-lg font-medium text-gray-700">No active rental ads</p>
              <p className="text-sm text-gray-400">This provider has not published any public rental ads yet.</p>
            </div>
          ) : (
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6">
              {provider.rentalAds.map(ad => {
                const cover = ad.coverImageUrl || ad.item?.itemImages?.[0]?.url || 'https://images.unsplash.com/photo-1516035069371-29a1b244cc32?auto=format&fit=crop&q=80'
                return (
                  <div key={ad.id} className="bg-white rounded-2xl shadow-sm border border-gray-100 overflow-hidden hover:shadow-md transition flex flex-col">
                    <div className="h-48 bg-gray-100 relative overflow-hidden">
                      <img src={cover} alt={ad.title} className="w-full h-full object-cover" />
                      {ad.item?.category && (
                        <span className="absolute top-3 left-3 bg-white/90 backdrop-blur-sm text-gray-800 text-xs font-semibold px-2.5 py-1 rounded-full shadow-sm">
                          {ad.item.category.name}
                        </span>
                      )}
                    </div>
                    <div className="p-5 flex-1 flex flex-col justify-between">
                      <div>
                        <h3 className="font-bold text-gray-900 text-base line-clamp-1">{ad.title}</h3>
                        <p className="text-gray-500 text-xs line-clamp-2 mt-1">{ad.description || ad.item?.name}</p>
                      </div>
                      <div className="mt-4 pt-4 border-t border-gray-100 flex items-center justify-between">
                        <div>
                          <p className="text-xs text-gray-400">Daily Rate</p>
                          <p className="text-lg font-extrabold text-blue-600">Rs. {ad.dailyPrice?.toLocaleString() || 0} <span className="text-xs text-gray-500 font-normal">/day</span></p>
                        </div>
                        <Link
                          href={`/marketplace/${ad.id}`}
                          className="px-4 py-2 bg-blue-50 text-blue-600 hover:bg-blue-100 rounded-lg text-xs font-semibold transition"
                        >
                          View Listing
                        </Link>
                      </div>
                    </div>
                  </div>
                )
              })}
            </div>
          )}
        </div>
      </div>
    </div>
  )
}
