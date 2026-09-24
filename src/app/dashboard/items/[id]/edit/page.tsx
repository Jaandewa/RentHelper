'use client'

import { useState, useEffect } from 'react'
import { useRouter } from 'next/navigation'
import Link from 'next/link'
import { ArrowLeft, Upload, Plus, X } from 'lucide-react'

const CATEGORIES = [
  { slug: 'camera-video', name: 'Camera & Video' },
  { slug: 'vehicles', name: 'Vehicles' },
  { slug: 'party-events', name: 'Party & Events' },
  { slug: 'tools-equipment', name: 'Tools & Equipment' },
  { slug: 'clothing-bridal', name: 'Clothing & Bridal' },
  { slug: 'it-equipment', name: 'IT Equipment' },
  { slug: 'sports-outdoors', name: 'Sports & Outdoors' },
  { slug: 'medical', name: 'Medical Equipment' },
  { slug: 'other', name: 'Other' },
]

export default function EditItemPage({ params }: { params: { id: string } }) {
  const router = useRouter()
  const [isLoading, setIsLoading] = useState(false)
  const [isUploadingImages, setIsUploadingImages] = useState(false)
  const [images, setImages] = useState<{url: string, caption: string}[]>([])
  const [accessories, setAccessories] = useState<string[]>([])
  const [accessoryInput, setAccessoryInput] = useState('')
  const [form, setForm] = useState({
    name: '',
    sku: '',
    brand: '',
    model: '',
    serialNumber: '',
    categorySlug: '',
    description: '',
    conditionGrade: 'good',
    dailyRate: '',
    weeklyRate: '',
    monthlyRate: '',
    depositAmount: '',
    bufferHours: '2',
    purchasePrice: '',
    replacementCost: '',
    notes: '',
  })

  useEffect(() => {
    fetch(`/api/items/${params.id}`)
      .then(res => res.json())
      .then(data => {
        if (data && !data.message) {
          setForm({
            name: data.name || '',
            sku: data.sku || '',
            brand: data.brand || '',
            model: data.model || '',
            serialNumber: data.serialNumber || '',
            categorySlug: data.category?.slug || data.categoryId || '',
            description: data.description || '',
            conditionGrade: data.conditionGrade || 'good',
            dailyRate: data.dailyRate?.toString() || '',
            weeklyRate: data.weeklyRate?.toString() || '',
            monthlyRate: data.monthlyRate?.toString() || '',
            depositAmount: data.depositAmount?.toString() || '',
            bufferHours: data.bufferHours?.toString() || '2',
            purchasePrice: data.purchasePrice?.toString() || '',
            replacementCost: data.replacementCost?.toString() || '',
            notes: data.notes || '',
          })
          if (data.accessories) {
            try { setAccessories(JSON.parse(data.accessories)) } catch (e) {}
          }
          if (data.itemImages) {
            setImages(data.itemImages.map((img: any) => ({ url: img.url, caption: img.caption || '' })))
          }
        }
      })
  }, [params.id])

  const handleChange = (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement | HTMLSelectElement>) => {
    setForm(prev => ({ ...prev, [e.target.name]: e.target.value }))
  }

  const addAccessory = () => {
    if (accessoryInput.trim()) {
      setAccessories(prev => [...prev, accessoryInput.trim()])
      setAccessoryInput('')
    }
  }

  const removeAccessory = (idx: number) => {
    setAccessories(prev => prev.filter((_, i) => i !== idx))
  }

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setIsLoading(true)
    try {
      const res = await fetch('/api/items', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ ...form, accessories, images }),
      })
      if (res.ok) {
        router.push('/dashboard/items')
      } else {
        const data = await res.json()
        alert(data.message || 'Failed to create item')
      }
    } catch {
      alert('Network error')
    } finally {
      setIsLoading(false)
    }
  }

  const handleImageUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const files = e.target.files
    if (!files || files.length === 0) return
    
    if (images.length + files.length > 10) {
      alert('You can only upload a maximum of 10 photos per item.')
      return
    }

    setIsUploadingImages(true)
    const formData = new FormData()
    for (let i = 0; i < files.length; i++) {
      formData.append('images[]', files[i])
    }

    try {
      const res = await fetch(`/api/items/${params.id}`, {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          ...form,
          accessories,
          images
        }),
      })

      if (res.ok) {
        router.push('/dashboard/items')
        router.refresh()
      } else {
        const errorData = await res.json()
        alert(errorData.message || 'Failed to update item')
      }
    } catch (error) {
      alert('An error occurred. Please try again.')
    } finally {
      setIsLoading(false)
    }
  }

  const updateCaption = (idx: number, caption: string) => {
    setImages(prev => {
      const updated = [...prev]
      updated[idx].caption = caption
      return updated
    })
  }

  return (
    <div className="max-w-4xl mx-auto space-y-6">
      {/* Header */}
      <div className="flex items-center gap-4">
        <Link href="/dashboard/items" className="p-2 rounded-lg text-gray-500 hover:bg-gray-100">
          <ArrowLeft className="w-5 h-5" />
        </Link>
        <div>
          <h1 className="text-2xl font-bold text-gray-900">Edit Item</h1>
          <p className="text-sm text-gray-500">Update the details of your rental inventory item</p>
        </div>
      </div>

      <form onSubmit={handleSubmit} className="space-y-6">
        {/* Basic Info */}
        <div className="bg-white rounded-xl border border-gray-200 shadow-sm p-6">
          <h2 className="text-lg font-semibold text-gray-900 mb-4">Basic Information</h2>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div className="md:col-span-2">
              <label className="block text-sm font-medium text-gray-700 mb-1">Item Name *</label>
              <input name="name" required value={form.name} onChange={handleChange}
                className="w-full border border-gray-300 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
                placeholder="e.g. Sony A7III Camera Body" />
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Category *</label>
              <select name="categorySlug" required value={form.categorySlug} onChange={handleChange}
                className="w-full border border-gray-300 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500">
                <option value="">Select category</option>
                {CATEGORIES.map(c => <option key={c.slug} value={c.slug}>{c.name}</option>)}
              </select>
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">SKU / Item Code</label>
              <input name="sku" value={form.sku} onChange={handleChange}
                className="w-full border border-gray-300 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
                placeholder="e.g. CAM-001" />
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Brand</label>
              <input name="brand" value={form.brand} onChange={handleChange}
                className="w-full border border-gray-300 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
                placeholder="e.g. Sony" />
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Model</label>
              <input name="model" value={form.model} onChange={handleChange}
                className="w-full border border-gray-300 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
                placeholder="e.g. ILCE-7M3" />
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Serial Number</label>
              <input name="serialNumber" value={form.serialNumber} onChange={handleChange}
                className="w-full border border-gray-300 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
                placeholder="Optional" />
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Condition</label>
              <select name="conditionGrade" value={form.conditionGrade} onChange={handleChange}
                className="w-full border border-gray-300 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500">
                <option value="excellent">Excellent</option>
                <option value="good">Good</option>
                <option value="fair">Fair</option>
                <option value="poor">Poor</option>
              </select>
            </div>
            <div className="md:col-span-2">
              <label className="block text-sm font-medium text-gray-700 mb-1">Description</label>
              <textarea name="description" value={form.description} onChange={handleChange} rows={3}
                className="w-full border border-gray-300 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500 resize-none"
                placeholder="Describe the item, its features and what's included..." />
            </div>
          </div>

          {/* Accessories */}
          <div className="mt-4">
            <label className="block text-sm font-medium text-gray-700 mb-1">Accessories / Inclusions</label>
            <div className="flex gap-2 mb-2">
              <input
                value={accessoryInput}
                onChange={e => setAccessoryInput(e.target.value)}
                onKeyDown={e => { if (e.key === 'Enter') { e.preventDefault(); addAccessory() } }}
                className="flex-1 border border-gray-300 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
                placeholder="e.g. Camera strap, Battery charger..." />
              <button type="button" onClick={addAccessory}
                className="px-3 py-2 bg-gray-100 border border-gray-300 rounded-lg text-sm hover:bg-gray-200 flex items-center gap-1">
                <Plus className="w-4 h-4" /> Add
              </button>
            </div>
            <div className="flex flex-wrap gap-2">
              {accessories.map((acc, i) => (
                <span key={i} className="flex items-center gap-1 bg-blue-50 text-blue-700 px-3 py-1 rounded-full text-sm">
                  {acc}
                  <button type="button" onClick={() => removeAccessory(i)} className="hover:text-blue-900">
                    <X className="w-3 h-3" />
                  </button>
                </span>
              ))}
            </div>
          </div>
        </div>

        {/* Pricing */}
        <div className="bg-white rounded-xl border border-gray-200 shadow-sm p-6">
          <h2 className="text-lg font-semibold text-gray-900 mb-4">Pricing & Deposit</h2>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Daily Rate (LKR) *</label>
              <input name="dailyRate" type="number" required value={form.dailyRate} onChange={handleChange}
                className="w-full border border-gray-300 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
                placeholder="0.00" />
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Security Deposit (LKR)</label>
              <input name="depositAmount" type="number" value={form.depositAmount} onChange={handleChange}
                className="w-full border border-gray-300 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
                placeholder="0.00" />
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Weekly Rate (LKR)</label>
              <input name="weeklyRate" type="number" value={form.weeklyRate} onChange={handleChange}
                className="w-full border border-gray-300 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
                placeholder="Optional discount rate" />
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Monthly Rate (LKR)</label>
              <input name="monthlyRate" type="number" value={form.monthlyRate} onChange={handleChange}
                className="w-full border border-gray-300 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
                placeholder="Optional discount rate" />
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Buffer Time Between Rentals (hours)</label>
              <input name="bufferHours" type="number" value={form.bufferHours} onChange={handleChange}
                className="w-full border border-gray-300 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
                min="0" />
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Purchase Price (LKR)</label>
              <input name="purchasePrice" type="number" value={form.purchasePrice} onChange={handleChange}
                className="w-full border border-gray-300 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
                placeholder="For insurance/records" />
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Replacement Cost (LKR)</label>
              <input name="replacementCost" type="number" value={form.replacementCost} onChange={handleChange}
                className="w-full border border-gray-300 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
                placeholder="Cost if item is lost/damaged" />
            </div>
          </div>
        </div>

        {/* Photo Upload */}
        <div className="bg-white rounded-xl border border-gray-200 shadow-sm p-6">
          <div className="flex justify-between items-center mb-4">
            <h2 className="text-lg font-semibold text-gray-900">Photos ({images.length}/10)</h2>
            {images.length >= 10 && <span className="text-sm text-red-500 font-medium">Maximum reached</span>}
          </div>
          
          {images.length < 10 && (
            <label className="block border-2 border-dashed border-gray-300 rounded-xl p-8 text-center hover:border-blue-400 transition-colors cursor-pointer relative mb-6">
              <input 
                type="file" 
                multiple 
                accept="image/jpeg, image/png, image/webp" 
                onChange={handleImageUpload} 
                className="absolute inset-0 w-full h-full opacity-0 cursor-pointer disabled:cursor-not-allowed"
                disabled={isUploadingImages || images.length >= 10}
              />
              {isUploadingImages ? (
                <div className="animate-pulse">
                  <Upload className="w-10 h-10 text-blue-400 mx-auto mb-3" />
                  <p className="text-sm font-medium text-blue-700">Uploading to server...</p>
                </div>
              ) : (
                <>
                  <Upload className="w-10 h-10 text-gray-400 mx-auto mb-3" />
                  <p className="text-sm font-medium text-gray-700">Click to upload or drag & drop</p>
                  <p className="text-xs text-gray-500 mt-1">PNG, JPG up to 10MB each (max 10 photos)</p>
                </>
              )}
            </label>
          )}

          {images.length > 0 && (
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6">
              {images.map((img, idx) => (
                <div key={idx} className="bg-gray-50 rounded-xl border border-gray-200 overflow-hidden flex flex-col group relative">
                  <div className="aspect-square relative">
                    {/* eslint-disable-next-line @next/next/no-img-element */}
                    <img src={img.url} alt={`Upload ${idx+1}`} className="w-full h-full object-cover" />
                    <button 
                      type="button" 
                      onClick={() => setImages(prev => prev.filter((_, i) => i !== idx))}
                      className="absolute top-2 right-2 bg-red-500 text-white p-1.5 rounded-full hover:bg-red-600 transition-colors shadow-sm"
                      title="Remove image"
                    >
                      <X className="w-4 h-4" />
                    </button>
                  </div>
                  <div className="p-3">
                    <label className="block text-xs font-medium text-gray-600 mb-1">Caption</label>
                    <input 
                      type="text" 
                      value={img.caption} 
                      onChange={(e) => updateCaption(idx, e.target.value)}
                      placeholder="e.g. Front, Back, Accessories..." 
                      className="w-full border-gray-300 rounded-md shadow-sm focus:border-blue-500 focus:ring-blue-500 text-sm py-1.5"
                    />
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>

        {/* Notes */}
        <div className="bg-white rounded-xl border border-gray-200 shadow-sm p-6">
          <h2 className="text-lg font-semibold text-gray-900 mb-4">Internal Notes</h2>
          <textarea name="notes" value={form.notes} onChange={handleChange} rows={3}
            className="w-full border border-gray-300 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500 resize-none"
            placeholder="Any internal notes for your team..." />
        </div>

        {/* Actions */}
        <div className="flex justify-end gap-3">
          <Link href="/dashboard/items" className="px-6 py-2.5 border border-gray-300 rounded-lg text-sm font-medium text-gray-700 hover:bg-gray-50">
            Cancel
          </Link>
          <button type="submit" disabled={isLoading}
            className="px-6 py-2.5 bg-blue-600 text-white rounded-lg text-sm font-medium hover:bg-blue-700 disabled:opacity-50 transition-colors">
            {isLoading ? 'Saving...' : 'Save Item'}
          </button>
        </div>
      </form>
    </div>
  )
}
