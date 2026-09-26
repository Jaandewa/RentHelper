'use client'

import React, { useState, useEffect } from 'react'
import { useRouter } from 'next/navigation'
import Link from 'next/link'
import { ArrowLeft, Upload, Plus, X, Tag, AlertCircle, CheckCircle2, Megaphone, Loader2 } from 'lucide-react'
import { CategoryFieldsRenderer } from '@/components/CategoryFieldsRenderer'
import { CustomCategoryBuilder } from '@/components/CustomCategoryBuilder'
import { CategoryConfig, CategoryFieldConfig, DEFAULT_CATEGORY_CONFIGS, validateCategoryData } from '@/lib/categoryConfig'
import { optimizeImageBeforeUpload } from '@/lib/upload/optimizeImage'

export default function NewItemPage() {
  const router = useRouter()
  const [categories, setCategories] = useState<CategoryConfig[]>([])
  const [isLoadingCategories, setIsLoadingCategories] = useState(true)
  const [isLoading, setIsLoading] = useState(false)
  const [isUploadingImages, setIsUploadingImages] = useState(false)
  const [uploadProgressText, setUploadProgressText] = useState('')

  // Form State
  const [selectedCategorySlug, setSelectedCategorySlug] = useState('')
  const [customCategoryName, setCustomCategoryName] = useState('')
  const [customFields, setCustomFields] = useState<CategoryFieldConfig[]>([])

  const [categoryData, setCategoryData] = useState<Record<string, any>>({})
  const [formErrors, setFormErrors] = useState<Record<string, string>>({})

  const [postAsAd, setPostAsAd] = useState(false)

  const [form, setForm] = useState({
    name: '',
    sku: '',
    brand: '',
    model: '',
    serialNumber: '',
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

  const [images, setImages] = useState<{ url: string; caption: string; stats?: string }[]>([])
  const [accessories, setAccessories] = useState<string[]>([])
  const [accessoryInput, setAccessoryInput] = useState('')

  // Fetch available categories from API
  useEffect(() => {
    async function loadCategories() {
      try {
        const res = await fetch('/api/categories')
        if (res.ok) {
          const data = await res.json()
          setCategories(data.categories || [])
        }
      } catch (err) {
        console.error('Failed to load categories:', err)
      } finally {
        setIsLoadingCategories(false)
      }
    }
    loadCategories()
  }, [])

  // Currently selected category configuration
  const currentCategoryObj = categories.find(c => c.slug === selectedCategorySlug)
  const categoryFieldsToRender: CategoryFieldConfig[] = selectedCategorySlug === 'other'
    ? customFields
    : (currentCategoryObj?.fields || DEFAULT_CATEGORY_CONFIGS[selectedCategorySlug]?.fields || [])

  const handleCategorySelect = (slug: string) => {
    if (selectedCategorySlug && selectedCategorySlug !== slug && Object.keys(categoryData).length > 0) {
      if (!confirm('Changing category will reset category-specific fields. Continue?')) {
        return
      }
    }
    setSelectedCategorySlug(slug)
    setCategoryData({})
    setFormErrors(prev => {
      const updated = { ...prev }
      delete updated.categorySlug
      return updated
    })
  }

  const handleFormChange = (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement | HTMLSelectElement>) => {
    const { name, value } = e.target
    setForm(prev => ({ ...prev, [name]: value }))
    if (formErrors[name]) {
      setFormErrors(prev => {
        const updated = { ...prev }
        delete updated[name]
        return updated
      })
    }
  }

  const handleCategoryDataChange = (key: string, value: any) => {
    setCategoryData(prev => ({ ...prev, [key]: value }))
    if (formErrors[key]) {
      setFormErrors(prev => {
        const updated = { ...prev }
        delete updated[key]
        return updated
      })
    }
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

  const handleImageUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const fileList = e.target.files
    if (!fileList || fileList.length === 0) return

    const rawFiles = Array.from(fileList)

    if (images.length + rawFiles.length > 10) {
      alert('You can only upload a maximum of 10 photos per item.')
      return
    }

    setIsUploadingImages(true)

    try {
      const uploadedPhotos: { url: string; caption: string; stats?: string }[] = []

      for (let i = 0; i < rawFiles.length; i++) {
        const rawFile = rawFiles[i]
        const countLabel = rawFiles.length > 1 ? ` (${i + 1}/${rawFiles.length})` : ''

        setUploadProgressText(`Optimizing image${countLabel}...`)
        const optResult = await optimizeImageBeforeUpload(rawFile, { purpose: 'item' })

        setUploadProgressText(`Uploading image${countLabel}...`)
        const formData = new FormData()
        formData.append('images[]', optResult.file)

        const res = await fetch('/api/upload', {
          method: 'POST',
          body: formData,
        })
        const data = await res.json()

        if (res.ok && (data.success || data.files)) {
          const url = data.files?.[0]?.url || data.urls?.[0] || data.url || data.fileUrl
          if (url) {
            const statsStr = optResult.wasOptimized
              ? `Original: ${optResult.formattedOriginalSize} → Optimized: ${optResult.formattedOptimizedSize}`
              : optResult.formattedOriginalSize
            uploadedPhotos.push({ url, caption: '', stats: statsStr })
          } else {
            throw new Error('Upload succeeded but no URL returned')
          }
        } else {
          alert(data.message || data.error || data.errors?.join('\n') || `Failed to upload ${rawFile.name}`)
        }
      }

      if (uploadedPhotos.length > 0) {
        setImages(prev => [...prev, ...uploadedPhotos])
      }
    } catch (err: any) {
      alert('Photo optimization or upload failed: ' + (err?.message || 'Network error'))
    } finally {
      setIsUploadingImages(false)
      setUploadProgressText('')
      if (e.target) e.target.value = ''
    }
  }

  const updateCaption = (idx: number, caption: string) => {
    setImages(prev => {
      const updated = [...prev]
      updated[idx].caption = caption
      return updated
    })
  }

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()

    // Step 1: Client Validation
    const errors: Record<string, string> = {}

    if (!selectedCategorySlug) {
      errors.categorySlug = 'Please select a category first'
    }
    if (selectedCategorySlug === 'other' && !customCategoryName.trim()) {
      errors.customCategoryName = 'Custom category name is required'
    }
    if (!form.name.trim()) {
      errors.name = 'Item name is required'
    }
    if (!form.dailyRate || Number(form.dailyRate) <= 0) {
      errors.dailyRate = 'Valid daily rate is required'
    }

    // Category data validation
    if (selectedCategorySlug) {
      const catVal = validateCategoryData(selectedCategorySlug, categoryData, categoryFieldsToRender)
      if (!catVal.isValid) {
        Object.assign(errors, catVal.errors)
      }
    }

    if (Object.keys(errors).length > 0) {
      setFormErrors(errors)
      // Scroll to first error
      window.scrollTo({ top: 0, behavior: 'smooth' })
      return
    }

    setIsLoading(true)

    try {
      const res = await fetch('/api/items', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          ...form,
          categorySlug: selectedCategorySlug,
          customCategoryName: selectedCategorySlug === 'other' ? customCategoryName : undefined,
          customFields: selectedCategorySlug === 'other' ? customFields : undefined,
          categoryData,
          accessories,
          images,
        }),
      })

      const data = await res.json()

      if (res.ok) {
        const createdItem = data

        // If provider checked "Post as Ad", trigger publish ad
        if (postAsAd && createdItem.id) {
          try {
            await fetch('/api/provider/ads', {
              method: 'POST',
              headers: { 'Content-Type': 'application/json' },
              body: JSON.stringify({
                itemId: createdItem.id,
                title: createdItem.name,
                description: createdItem.description || '',
                dailyPrice: createdItem.dailyRate,
                securityDeposit: createdItem.depositAmount,
                coverImageUrl: images[0]?.url || '',
                galleryImages: images.map(img => img.url),
                isPublished: true,
              }),
            })
          } catch (adErr) {
            console.error('Ad post failed:', adErr)
          }
        }

        router.push('/dashboard/items')
      } else {
        if (data.errors) {
          setFormErrors(data.errors)
          window.scrollTo({ top: 0, behavior: 'smooth' })
        } else {
          alert(data.message || 'Failed to create item')
        }
      }
    } catch {
      alert('Network error while saving item')
    } finally {
      setIsLoading(false)
    }
  }

  return (
    <div className="max-w-4xl mx-auto space-y-6 pb-12">
      {/* Header */}
      <div className="flex items-center gap-4">
        <Link href="/dashboard/items" className="p-2 rounded-lg text-slate-500 hover:bg-slate-100 transition">
          <ArrowLeft className="w-5 h-5" />
        </Link>
        <div>
          <h1 className="text-2xl font-bold text-slate-900">Add New Inventory Item</h1>
          <p className="text-sm text-slate-500">Configure your item details, pricing, and category specs</p>
        </div>
      </div>

      <form onSubmit={handleSubmit} className="space-y-6">
        {/* STEP 1: SELECT CATEGORY (MUST BE FIRST STEP) */}
        <div className="bg-white rounded-xl border border-slate-200 shadow-xs p-6 space-y-4">
          <div className="flex items-center justify-between border-b border-slate-100 pb-3">
            <div className="flex items-center gap-2">
              <span className="w-7 h-7 rounded-full bg-blue-600 text-white font-bold text-xs flex items-center justify-center">
                1
              </span>
              <div>
                <h2 className="text-base font-semibold text-slate-900">Select Item Category *</h2>
                <p className="text-xs text-slate-500">Choose the category first to unlock relevant attributes</p>
              </div>
            </div>
            {selectedCategorySlug && (
              <span className="text-xs font-semibold text-green-700 bg-green-50 px-2.5 py-1 rounded-full border border-green-200">
                ✓ Category Selected
              </span>
            )}
          </div>

          <div>
            <label className="block text-xs font-semibold text-slate-700 mb-1.5">
              Category *
            </label>
            <select
              value={selectedCategorySlug}
              onChange={e => handleCategorySelect(e.target.value)}
              className={`w-full border ${
                formErrors.categorySlug ? 'border-red-500 focus:ring-red-500' : 'border-slate-300 focus:ring-blue-500'
              } rounded-xl px-4 py-3 text-sm bg-white focus:outline-none focus:ring-2 font-medium text-slate-900 transition`}
            >
              <option value="">Select category</option>
              {categories.map(c => (
                <option key={c.slug} value={c.slug}>
                  {c.icon || '📦'} {c.name}
                </option>
              ))}
            </select>

            {formErrors.categorySlug && (
              <p className="text-xs text-red-600 font-medium flex items-center gap-1 mt-1.5">
                <AlertCircle className="w-3.5 h-3.5" /> {formErrors.categorySlug}
              </p>
            )}
          </div>
        </div>

        {/* STEP 2: CATEGORY-SPECIFIC FIELDS */}
        {selectedCategorySlug ? (
          <div className="bg-white rounded-xl border border-slate-200 shadow-xs p-6 space-y-4">
            <div className="flex items-center gap-2 border-b border-slate-100 pb-3">
              <span className="w-7 h-7 rounded-full bg-blue-600 text-white font-bold text-xs flex items-center justify-center">
                2
              </span>
              <div>
                <h2 className="text-base font-semibold text-slate-900">Category Specifications</h2>
                <p className="text-xs text-slate-500">Attributes specific to {currentCategoryObj?.name || selectedCategorySlug}</p>
              </div>
            </div>

            {selectedCategorySlug === 'other' ? (
              <CustomCategoryBuilder
                customCategoryName={customCategoryName}
                customFields={customFields}
                onNameChange={setCustomCategoryName}
                onFieldsChange={setCustomFields}
              />
            ) : (
              <CategoryFieldsRenderer
                fields={categoryFieldsToRender}
                values={categoryData}
                errors={formErrors}
                onChange={handleCategoryDataChange}
              />
            )}
          </div>
        ) : (
          <div className="bg-slate-50 rounded-xl border border-dashed border-slate-300 p-8 text-center text-slate-500">
            <Tag className="w-10 h-10 text-slate-300 mx-auto mb-2" />
            <p className="text-sm font-semibold text-slate-700">Please select a category above</p>
            <p className="text-xs text-slate-400 mt-0.5">Category-specific attributes will appear here automatically</p>
          </div>
        )}

        {/* STEP 3: COMMON ITEM INFORMATION */}
        <div className={`bg-white rounded-xl border border-slate-200 shadow-xs p-6 space-y-4 ${!selectedCategorySlug ? 'opacity-50 pointer-events-none' : ''}`}>
          <div className="flex items-center gap-2 border-b border-slate-100 pb-3">
            <span className="w-7 h-7 rounded-full bg-blue-600 text-white font-bold text-xs flex items-center justify-center">
              3
            </span>
            <h2 className="text-base font-semibold text-slate-900">Common Item Details</h2>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div className="md:col-span-2">
              <label className="block text-xs font-semibold text-slate-700 mb-1">
                Item Name / Title <span className="text-red-500">*</span>
              </label>
              <input
                name="name"
                required
                value={form.name}
                onChange={handleFormChange}
                placeholder="e.g. Sony A7 IV Full-Frame Camera"
                className={`w-full border ${
                  formErrors.name ? 'border-red-500 focus:ring-red-500' : 'border-slate-300 focus:ring-blue-500'
                } rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2`}
              />
              {formErrors.name && <p className="text-xs text-red-600 mt-1">{formErrors.name}</p>}
            </div>

            <div>
              <label className="block text-xs font-semibold text-slate-700 mb-1">SKU / Item Code</label>
              <input
                name="sku"
                value={form.sku}
                onChange={handleFormChange}
                placeholder="e.g. CAM-0012"
                className="w-full border border-slate-300 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
              />
            </div>

            <div>
              <label className="block text-xs font-semibold text-slate-700 mb-1">Brand</label>
              <input
                name="brand"
                value={form.brand}
                onChange={handleFormChange}
                placeholder="e.g. Sony, Toyota"
                className="w-full border border-slate-300 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
              />
            </div>

            <div>
              <label className="block text-xs font-semibold text-slate-700 mb-1">Model</label>
              <input
                name="model"
                value={form.model}
                onChange={handleFormChange}
                placeholder="e.g. ILCE-7M4"
                className="w-full border border-slate-300 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
              />
            </div>

            <div>
              <label className="block text-xs font-semibold text-slate-700 mb-1">Condition Grade</label>
              <select
                name="conditionGrade"
                value={form.conditionGrade}
                onChange={handleFormChange}
                className="w-full border border-slate-300 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500 bg-white"
              >
                <option value="excellent">Excellent</option>
                <option value="good">Good</option>
                <option value="fair">Fair</option>
                <option value="poor">Poor</option>
              </select>
            </div>

            <div className="md:col-span-2">
              <label className="block text-xs font-semibold text-slate-700 mb-1">Description</label>
              <textarea
                name="description"
                value={form.description}
                onChange={handleFormChange}
                rows={3}
                placeholder="Describe your item, key features, and rental instructions..."
                className="w-full border border-slate-300 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500 resize-none"
              />
            </div>
          </div>
        </div>

        {/* STEP 4: PHOTOS & MEDIA */}
        <div className={`bg-white rounded-xl border border-slate-200 shadow-xs p-6 space-y-4 ${!selectedCategorySlug ? 'opacity-50 pointer-events-none' : ''}`}>
          <div className="flex items-center justify-between border-b border-slate-100 pb-3">
            <div className="flex items-center gap-2">
              <span className="w-7 h-7 rounded-full bg-blue-600 text-white font-bold text-xs flex items-center justify-center">
                4
              </span>
              <h2 className="text-base font-semibold text-slate-900">Photos ({images.length}/10)</h2>
            </div>
            {images.length >= 10 && <span className="text-xs text-red-500 font-medium">Max limit reached</span>}
          </div>

          {images.length < 10 && (
            <label className="block border-2 border-dashed border-slate-300 rounded-xl p-6 text-center hover:border-blue-400 transition cursor-pointer relative bg-slate-50">
              <input
                type="file"
                multiple
                accept="image/*,application/pdf"
                onChange={handleImageUpload}
                disabled={isUploadingImages || images.length >= 10}
                className="absolute inset-0 w-full h-full opacity-0 cursor-pointer disabled:cursor-not-allowed"
              />
              {isUploadingImages ? (
                <div className="animate-pulse flex flex-col items-center">
                  <Loader2 className="w-8 h-8 text-blue-600 animate-spin mb-2" />
                  <p className="text-xs font-medium text-blue-700">{uploadProgressText || 'Processing photos...'}</p>
                </div>
              ) : (
                <>
                  <Upload className="w-8 h-8 text-slate-400 mx-auto mb-2" />
                  <p className="text-xs font-medium text-slate-700">Click to upload or drag & drop photos</p>
                  <p className="text-[11px] text-slate-400 mt-0.5">High-res camera photos up to 30 MB (Auto-optimized)</p>
                </>
              )}
            </label>
          )}

          {images.length > 0 && (
            <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 gap-4">
              {images.map((img, idx) => (
                <div key={idx} className="bg-slate-50 rounded-lg border border-slate-200 overflow-hidden flex flex-col relative group">
                  <div className="aspect-square relative">
                    {/* eslint-disable-next-line @next/next/no-img-element */}
                    <img src={img.url} alt={`Photo ${idx + 1}`} className="w-full h-full object-cover" />
                    <button
                      type="button"
                      onClick={() => setImages(prev => prev.filter((_, i) => i !== idx))}
                      className="absolute top-1.5 right-1.5 bg-red-600 text-white p-1 rounded-full hover:bg-red-700 transition"
                      title="Remove photo"
                    >
                      <X className="w-3.5 h-3.5" />
                    </button>
                    {idx === 0 && (
                      <span className="absolute bottom-1.5 left-1.5 bg-blue-600/90 text-white text-[10px] font-semibold px-1.5 py-0.5 rounded">
                        Cover Photo
                      </span>
                    )}
                  </div>
                  <div className="p-2 space-y-1.5">
                    {img.stats && (
                      <p className="text-[10px] font-medium text-slate-500 bg-slate-100 px-1.5 py-0.5 rounded truncate" title={img.stats}>
                        {img.stats}
                      </p>
                    )}
                    <input
                      type="text"
                      value={img.caption}
                      onChange={e => updateCaption(idx, e.target.value)}
                      placeholder="Caption..."
                      className="w-full border-slate-200 rounded text-xs py-1 px-2 border"
                    />
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>

        {/* STEP 5: PRICING & DEPOSIT */}
        <div className={`bg-white rounded-xl border border-slate-200 shadow-xs p-6 space-y-4 ${!selectedCategorySlug ? 'opacity-50 pointer-events-none' : ''}`}>
          <div className="flex items-center gap-2 border-b border-slate-100 pb-3">
            <span className="w-7 h-7 rounded-full bg-blue-600 text-white font-bold text-xs flex items-center justify-center">
              5
            </span>
            <h2 className="text-base font-semibold text-slate-900">Pricing & Security Deposit</h2>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div>
              <label className="block text-xs font-semibold text-slate-700 mb-1">
                Daily Rate (LKR) <span className="text-red-500">*</span>
              </label>
              <input
                name="dailyRate"
                type="number"
                required
                value={form.dailyRate}
                onChange={handleFormChange}
                placeholder="e.g. 5500"
                className={`w-full border ${
                  formErrors.dailyRate ? 'border-red-500 focus:ring-red-500' : 'border-slate-300 focus:ring-blue-500'
                } rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2`}
              />
              {formErrors.dailyRate && <p className="text-xs text-red-600 mt-1">{formErrors.dailyRate}</p>}
            </div>

            <div>
              <label className="block text-xs font-semibold text-slate-700 mb-1">Security Deposit (LKR)</label>
              <input
                name="depositAmount"
                type="number"
                value={form.depositAmount}
                onChange={handleFormChange}
                placeholder="e.g. 15000"
                className="w-full border border-slate-300 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
              />
            </div>

            <div>
              <label className="block text-xs font-semibold text-slate-700 mb-1">Weekly Rate (LKR)</label>
              <input
                name="weeklyRate"
                type="number"
                value={form.weeklyRate}
                onChange={handleFormChange}
                placeholder="Optional discount weekly price"
                className="w-full border border-slate-300 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
              />
            </div>

            <div>
              <label className="block text-xs font-semibold text-slate-700 mb-1">Monthly Rate (LKR)</label>
              <input
                name="monthlyRate"
                type="number"
                value={form.monthlyRate}
                onChange={handleFormChange}
                placeholder="Optional discount monthly price"
                className="w-full border border-slate-300 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
              />
            </div>
          </div>
        </div>

        {/* STEP 6: AVAILABILITY & PREPARATION SETTINGS */}
        <div className={`bg-white rounded-xl border border-slate-200 shadow-xs p-6 space-y-4 ${!selectedCategorySlug ? 'opacity-50 pointer-events-none' : ''}`}>
          <div className="flex items-center gap-2 border-b border-slate-100 pb-3">
            <span className="w-7 h-7 rounded-full bg-blue-600 text-white font-bold text-xs flex items-center justify-center">
              6
            </span>
            <h2 className="text-base font-semibold text-slate-900">Availability & Preparation Settings</h2>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            <div>
              <label className="block text-xs font-semibold text-slate-700 mb-1">Buffer Time Between Rentals (hours)</label>
              <input
                name="bufferHours"
                type="number"
                value={form.bufferHours}
                onChange={handleFormChange}
                min="0"
                className="w-full border border-slate-300 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
              />
            </div>
            <div>
              <label className="block text-xs font-semibold text-slate-700 mb-1">Purchase Price (LKR)</label>
              <input
                name="purchasePrice"
                type="number"
                value={form.purchasePrice}
                onChange={handleFormChange}
                placeholder="Original purchase price"
                className="w-full border border-slate-300 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
              />
            </div>
            <div>
              <label className="block text-xs font-semibold text-slate-700 mb-1">Replacement Cost (LKR)</label>
              <input
                name="replacementCost"
                type="number"
                value={form.replacementCost}
                onChange={handleFormChange}
                placeholder="Insurance replacement value"
                className="w-full border border-slate-300 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
              />
            </div>
          </div>
        </div>

        {/* STEP 7: ACCESSORIES & INCLUSIONS */}
        <div className={`bg-white rounded-xl border border-slate-200 shadow-xs p-6 space-y-4 ${!selectedCategorySlug ? 'opacity-50 pointer-events-none' : ''}`}>
          <div className="flex items-center gap-2 border-b border-slate-100 pb-3">
            <span className="w-7 h-7 rounded-full bg-blue-600 text-white font-bold text-xs flex items-center justify-center">
              7
            </span>
            <h2 className="text-base font-semibold text-slate-900">Accessories & Included Items</h2>
          </div>

          <div>
            <div className="flex gap-2 mb-3">
              <input
                type="text"
                value={accessoryInput}
                onChange={e => setAccessoryInput(e.target.value)}
                onKeyDown={e => {
                  if (e.key === 'Enter') {
                    e.preventDefault()
                    addAccessory()
                  }
                }}
                placeholder="e.g. Lens cap, Battery charger, Carrying case"
                className="flex-1 border border-slate-300 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
              />
              <button
                type="button"
                onClick={addAccessory}
                className="px-4 py-2 bg-slate-100 border border-slate-300 rounded-lg text-xs font-semibold hover:bg-slate-200 transition flex items-center gap-1"
              >
                <Plus className="w-4 h-4" /> Add Item
              </button>
            </div>

            <div className="flex flex-wrap gap-2">
              {accessories.map((acc, idx) => (
                <span key={idx} className="inline-flex items-center gap-1 bg-blue-50 text-blue-700 px-3 py-1 rounded-full text-xs font-semibold border border-blue-200">
                  {acc}
                  <button type="button" onClick={() => removeAccessory(idx)} className="hover:text-blue-900">
                    <X className="w-3.5 h-3.5" />
                  </button>
                </span>
              ))}
            </div>
          </div>
        </div>

        {/* POST AS AD OPTION */}
        <div className={`bg-gradient-to-r from-purple-50 to-indigo-50 border border-purple-200 rounded-xl p-5 ${!selectedCategorySlug ? 'opacity-50 pointer-events-none' : ''}`}>
          <label className="flex items-start gap-3 cursor-pointer">
            <input
              type="checkbox"
              checked={postAsAd}
              onChange={e => setPostAsAd(e.target.checked)}
              className="w-5 h-5 text-purple-600 rounded border-slate-300 focus:ring-purple-500 mt-0.5"
            />
            <div>
              <span className="text-sm font-bold text-purple-950 flex items-center gap-1.5">
                <Megaphone className="w-4 h-4 text-purple-600" /> Automatically post as a public ad on Marketplace
              </span>
              <p className="text-xs text-purple-800 mt-0.5">
                Public marketplace ads will show public category details only. Private attributes (e.g. chassis/engine numbers, IMEIs) are automatically hidden.
              </p>
            </div>
          </label>
        </div>

        {/* STEP 8: SAVE ITEM ACTIONS */}
        <div className="flex items-center justify-end gap-3 pt-4 border-t border-slate-200">
          <Link
            href="/dashboard/items"
            className="px-5 py-2.5 border border-slate-300 rounded-xl text-sm font-semibold text-slate-700 hover:bg-slate-50 transition"
          >
            Cancel
          </Link>
          <button
            type="submit"
            disabled={isLoading || !selectedCategorySlug}
            className="px-6 py-2.5 bg-blue-600 text-white rounded-xl text-sm font-bold hover:bg-blue-700 disabled:opacity-50 transition shadow-sm flex items-center gap-2"
          >
            {isLoading && <Loader2 className="w-4 h-4 animate-spin" />}
            {isLoading ? 'Saving Item...' : 'Save Inventory Item'}
          </button>
        </div>
      </form>
    </div>
  )
}
