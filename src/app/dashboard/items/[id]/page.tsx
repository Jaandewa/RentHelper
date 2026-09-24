'use client'

import { useState, useEffect } from 'react'
import { useParams, useRouter } from 'next/navigation'
import Link from 'next/link'
import { ArrowLeft, Edit2, Package, Tag, Clock, FileText, CheckCircle2 } from 'lucide-react'

export default function ItemViewPage() {
  const params = useParams()
  const id = params.id as string
  const [item, setItem] = useState<any>(null)
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    if (!id) return
    fetch(`/api/items/${id}`)
      .then(res => res.json())
      .then(data => {
        if (!data.message) {
          setItem(data)
        }
      })
      .finally(() => setLoading(false))
  }, [id])

  if (loading) return <div className="p-8 text-center text-gray-500">Loading item details...</div>
  if (!item) return <div className="p-8 text-center text-red-500">Item not found.</div>

  const accessories = item.accessories ? JSON.parse(item.accessories) : []

  return (
    <div className="max-w-5xl mx-auto space-y-6">
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-4">
          <Link href="/dashboard/items" className="p-2 rounded-lg text-gray-500 hover:bg-gray-100">
            <ArrowLeft className="w-5 h-5" />
          </Link>
          <div>
            <h1 className="text-2xl font-bold text-gray-900">{item.name}</h1>
            <p className="text-sm text-gray-500">SKU: {item.sku || 'N/A'}</p>
          </div>
        </div>
        <Link href={`/dashboard/items/${id}/edit`} className="flex items-center gap-2 bg-blue-600 text-white px-4 py-2 rounded-lg text-sm font-medium hover:bg-blue-700">
          <Edit2 className="w-4 h-4" /> Edit Item
        </Link>
      </div>

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

          {/* Details */}
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
