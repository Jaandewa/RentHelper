'use client'

import { useState } from 'react'
import { useRouter } from 'next/navigation'
import Link from 'next/link'
import { ArrowLeft, Upload, Package, Plus, X } from 'lucide-react'

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

export default function NewItemPage() {
  const router = useRouter()
  const [isLoading, setIsLoading] = useState(false)
  const [isUploadingImages, setIsUploadingImages] = useState(false)
  const [images, setImages] = useState<string[]>([])
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

  const [images, setImages] = useState<{url: string, caption: string}[]>([])

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
      // Proxy through Next.js to bypass CORS issues on the external server
      const res = await fetch('/api/upload', {
        method: 'POST',
        body: formData,
      })
      const data = await res.json()
      
      if (res.ok && data.success && data.files) {
        const newImages = data.files.map((f: any) => ({ url: f.url, caption: '' }))
        setImages(prev => [...prev, ...newImages])
      } else {
        alert(data.errors?.join('\n') || data.message || 'Failed to upload images')
      }
    } catch (err) {
      alert('Error connecting to image server')
    } finally {
      setIsUploadingImages(false)
    }
  }

  const updateCaption = (idx: number, caption: string) => {
    setImages(prev => {
      const updated = [...prev]
      updated[idx].caption = caption
      return updated
    })
  }

  // --- Skipped to render portion ---

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
