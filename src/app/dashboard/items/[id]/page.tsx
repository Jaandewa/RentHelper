'use client'

import { useState, useEffect } from 'react'
import { useParams } from 'next/navigation'
import Link from 'next/link'
import { ArrowLeft, Edit2, Package, Tag, FileText, CheckCircle2, Megaphone, Loader2, ExternalLink, EyeOff, Lock, Layers } from 'lucide-react'

type AdPostState = 'idle' | 'posting' | 'posted' | 'error'

export default function ItemViewPage() {
  const params = useParams()
  const id = params.id as string
  const [item, setItem] = useState<any>(null)
  const [loading, setLoading] = useState(true)
  const [adState, setAdState] = useState<AdPostState>('idle')
  const [adErrorMessage, setAdErrorMessage] = useState<string | null>(null)

  const fetchItemDetails = async () => {
    try {
      const res = await fetch(`/api/items/${id}`)
      if (res.ok) {
        const data = await res.json()
        if (!data.message) {
          setItem(data)
          if (data.rentalAd?.isPublished) {
            setAdState('posted')
          }
        }
      }
    } finally {
      setLoading(false)
    }
  }

  useEffect(() => {
    if (!id) return
    fetchItemDetails()
  }, [id])

  const handlePostAd = async () => {
    if (adState === 'posting') return // Prevent duplicate clicks
    setAdState('posting')
    setAdErrorMessage(null)

    try {
      const res = await fetch('/api/provider/ads', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          itemId: item.id,
          title: item.name,
          description: item.description || '',
          city: '',
          dailyPrice: item.dailyRate,
          hourlyPrice: item.hourlyRate,
          weeklyPrice: item.weeklyRate,
          monthlyPrice: item.monthlyRate,
          securityDeposit: item.depositAmount,
          coverImageUrl: item.itemImages?.[0]?.url || '',
          galleryImages: item.itemImages?.map((img: any) => img.url) || [],
          isPublished: true,
        }),
      })

      if (res.ok) {
        setAdState('posted')
        await fetchItemDetails()
      } else {
        const err = await res.json()
        setAdState('error')
        setAdErrorMessage(err.error || err.message || 'Failed to post ad. Please try again.')
      }
    } catch {
      setAdState('error')
      setAdErrorMessage('Failed to post ad. Please try again.')
    }
  }

  const handleUnpublishAd = async () => {
    if (!item.rentalAd?.id) return
    try {
      const res = await fetch(`/api/provider/ads/${item.rentalAd.id}/unpublish`, { method: 'POST' })
      if (res.ok) {
        setAdState('idle')
        await fetchItemDetails()
      } else {
        alert('Failed to unpublish ad')
      }
    } catch {
      alert('Failed to unpublish ad')
    }
  }

  if (loading) return <div className="p-8 text-center text-gray-500">Loading item details...</div>
  if (!item) return <div className="p-8 text-center text-red-500">Item not found.</div>

  const accessories = item.accessories ? JSON.parse(item.accessories) : []
  const categoryData = item.categoryData && typeof item.categoryData === 'object' ? item.categoryData : {}
  const isPosting = adState === 'posting'
  const isPosted = adState === 'posted' || item.rentalAd?.isPublished

  // Private fields list
  const privateFields = [
    'chassisNumber', 'engineNumber', 'insurancePolicyNumber', 'imei1', 'imei2',
    'serialNumberPrivate', 'assetTag', 'medicalCertNumber', 'damageNotesPrivate', 'internalNotes'
  ]

  return (
    <div className="max-w-5xl mx-auto space-y-6">
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-4">
          <Link href="/dashboard/items" className="p-2 rounded-lg text-gray-500 hover:bg-gray-100">
            <ArrowLeft className="w-5 h-5" />
          </Link>
          <div>
            <div className="flex items-center gap-2">
              <h1 className="text-2xl font-bold text-gray-900">{item.name}</h1>
              {item.category && (
                <span className="bg-blue-50 text-blue-700 font-semibold px-2.5 py-0.5 rounded-full text-xs border border-blue-200">
                  {item.category.icon || '📦'} {item.category.name}
                </span>
              )}
            </div>
            <p className="text-sm text-gray-500">SKU: {item.sku || 'N/A'}</p>
          </div>
        </div>
        <div className="flex items-center gap-3">
          <button
            type="button"
            onClick={handlePostAd}
            disabled={isPosting || isPosted}
            className={`flex items-center gap-2 px-4 py-2 rounded-lg text-sm font-medium transition-colors ${
              isPosting
                ? 'bg-purple-100 text-purple-700 cursor-not-allowed'
                : isPosted
                ? 'bg-green-100 text-green-800 cursor-default'
                : adState === 'error'
                ? 'bg-red-600 text-white hover:bg-red-700'
                : 'bg-purple-600 text-white hover:bg-purple-700 shadow-sm'
            }`}
          >
            {isPosting ? (
              <>
                <Loader2 className="w-4 h-4 animate-spin" />
                <span>Posting Ad...</span>
              </>
            ) : isPosted ? (
              <>
                <Megaphone className="w-4 h-4" />
                <span>Ad Posted</span>
              </>
            ) : (
              <>
                <Megaphone className="w-4 h-4" />
                <span>📢 Post Ad</span>
              </>
            )}
          </button>

          {isPosted && item.rentalAd && (
            <>
              <Link
                href={`/marketplace/${item.rentalAd.id}`}
                target="_blank"
                className="flex items-center gap-1.5 bg-white border border-gray-300 text-gray-700 px-3 py-2 rounded-lg text-sm font-medium hover:bg-gray-50"
              >
                <ExternalLink className="w-4 h-4" /> View Public Ad
              </Link>
              <button
                type="button"
                onClick={handleUnpublishAd}
                className="p-2 text-gray-500 hover:text-red-600 hover:bg-red-50 rounded-lg border border-gray-200"
                title="Unpublish Ad"
              >
                <EyeOff className="w-4 h-4" />
              </button>
            </>
          )}

          <Link href={`/dashboard/items/${id}/edit`} className="flex items-center gap-2 bg-blue-600 text-white px-4 py-2 rounded-lg text-sm font-medium hover:bg-blue-700">
            <Edit2 className="w-4 h-4" /> Edit Item
          </Link>
        </div>
      </div>

      {adErrorMessage && (
        <div className="bg-red-50 border border-red-200 text-red-700 px-4 py-3 rounded-lg text-sm flex items-center justify-between">
          <span>{adErrorMessage}</span>
          <button type="button" onClick={handlePostAd} className="font-semibold underline hover:text-red-900">
            Retry
          </button>
        </div>
      )}

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        <div className="lg:col-span-2 space-y-6">
          {/* Images */}
          <div className="bg-white rounded-xl border border-gray-200 p-6">
            <h2 className="text-lg font-semibold text-gray-900 mb-4 flex items-center gap-2">
              <Package className="w-5 h-5 text-blue-600" /> Images
            </h2>
            {item.itemImages?.length > 0 ? (
              <div className="grid grid-cols-2 md:grid-cols-3 gap-4">
                {item.itemImages.map((img: any, i: number) => (
                  <div key={i} className="space-y-2">
                    <img src={img.url} alt={`Image ${i+1}`} className="w-full aspect-square object-cover rounded-lg border border-gray-200" />
                    {img.caption && <p className="text-xs text-gray-500 text-center">{img.caption}</p>}
                  </div>
                ))}
              </div>
            ) : (
              <p className="text-sm text-gray-500">No images uploaded for this item.</p>
            )}
          </div>

          {/* Category-Specific Attributes Card */}
          {Object.keys(categoryData).length > 0 && (
            <div className="bg-white rounded-xl border border-gray-200 p-6 space-y-4">
              <h2 className="text-lg font-semibold text-gray-900 flex items-center gap-2 border-b border-gray-100 pb-3">
                <Layers className="w-5 h-5 text-blue-600" /> {item.category?.name || 'Category'} Specifications
              </h2>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 text-sm">
                {Object.entries(categoryData).map(([key, value]) => {
                  if (value === undefined || value === null || value === '') return null
                  const isPrivate = privateFields.includes(key)
                  const label = key.replace(/([A-Z])/g, ' $1').replace(/^./, str => str.toUpperCase())

                  return (
                    <div key={key} className="bg-slate-50 p-3 rounded-lg border border-slate-100 flex flex-col justify-between">
                      <div className="flex items-center justify-between mb-1">
                        <span className="text-xs font-semibold text-slate-500">{label}</span>
                        {isPrivate && (
                          <span className="inline-flex items-center gap-1 text-[10px] font-medium text-amber-700 bg-amber-50 px-1.5 py-0.5 rounded border border-amber-200" title="Hidden on public marketplace ads">
                            <Lock className="w-2.5 h-2.5" /> Private
                          </span>
                        )}
                      </div>
                      <p className="font-semibold text-slate-900">
                        {typeof value === 'boolean' ? (value ? 'Yes ✓' : 'No ✗') : Array.isArray(value) ? value.join(', ') : String(value)}
                      </p>
                    </div>
                  )
                })}
              </div>
            </div>
          )}

          {/* Description & Specs */}
          <div className="bg-white rounded-xl border border-gray-200 p-6">
            <h2 className="text-lg font-semibold text-gray-900 mb-4 flex items-center gap-2">
              <FileText className="w-5 h-5 text-purple-600" /> Description & Specs
            </h2>
            <div className="space-y-4 text-sm">
              <div>
                <span className="text-gray-500 block mb-1">Description</span>
                <p className="text-gray-900 whitespace-pre-wrap">{item.description || 'No description provided.'}</p>
              </div>
              <div className="grid grid-cols-2 gap-4 pt-4 border-t border-gray-100">
                <div>
                  <span className="text-gray-500 block mb-1">Brand</span>
                  <p className="font-medium">{item.brand || 'N/A'}</p>
                </div>
                <div>
                  <span className="text-gray-500 block mb-1">Model</span>
                  <p className="font-medium">{item.model || 'N/A'}</p>
                </div>
                <div>
                  <span className="text-gray-500 block mb-1">Serial Number</span>
                  <p className="font-medium font-mono">{item.serialNumber || 'N/A'}</p>
                </div>
                <div>
                  <span className="text-gray-500 block mb-1">Condition</span>
                  <p className="font-medium capitalize">{item.conditionGrade || 'Good'}</p>
                </div>
              </div>
            </div>
          </div>
        </div>

        <div className="space-y-6">
          {/* Pricing */}
          <div className="bg-white rounded-xl border border-gray-200 p-6">
            <h2 className="text-lg font-semibold text-gray-900 mb-4 flex items-center gap-2">
              <Tag className="w-5 h-5 text-green-600" /> Pricing
            </h2>
            <div className="space-y-4">
              <div className="flex justify-between items-center pb-3 border-b border-gray-100">
                <span className="text-gray-600 text-sm">Daily Rate</span>
                <span className="font-semibold">Rs. {item.dailyRate?.toLocaleString()}</span>
              </div>
              <div className="flex justify-between items-center pb-3 border-b border-gray-100">
                <span className="text-gray-600 text-sm">Weekly Rate</span>
                <span className="font-semibold text-gray-900">{item.weeklyRate ? `Rs. ${item.weeklyRate.toLocaleString()}` : '-'}</span>
              </div>
              <div className="flex justify-between items-center pb-3 border-b border-gray-100">
                <span className="text-gray-600 text-sm">Monthly Rate</span>
                <span className="font-semibold text-gray-900">{item.monthlyRate ? `Rs. ${item.monthlyRate.toLocaleString()}` : '-'}</span>
              </div>
              <div className="flex justify-between items-center bg-gray-50 p-3 rounded-lg">
                <span className="text-gray-600 text-sm font-medium">Security Deposit</span>
                <span className="font-bold text-gray-900">Rs. {item.depositAmount?.toLocaleString() || '0'}</span>
              </div>
            </div>
          </div>

          {/* Accessories */}
          <div className="bg-white rounded-xl border border-gray-200 p-6">
            <h2 className="text-lg font-semibold text-gray-900 mb-4 flex items-center gap-2">
              <CheckCircle2 className="w-5 h-5 text-amber-600" /> Included Accessories
            </h2>
            {accessories.length > 0 ? (
              <ul className="space-y-2">
                {accessories.map((acc: string, i: number) => (
                  <li key={i} className="flex items-center gap-2 text-sm text-gray-700 bg-gray-50 p-2 rounded-md">
                    <CheckCircle2 className="w-4 h-4 text-green-500 shrink-0" /> {acc}
                  </li>
                ))}
              </ul>
            ) : (
              <p className="text-sm text-gray-500">No accessories listed.</p>
            )}
          </div>
        </div>
      </div>
    </div>
  )
}
