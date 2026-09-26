'use client'

import { useState, useRef } from 'react'
import { useRouter } from 'next/navigation'
import { Phone, User, Shield, FileText, Upload, X, CheckCircle, Loader2 } from 'lucide-react'

import { optimizeImageBeforeUpload, OptimizeImageResult } from '@/lib/upload/optimizeImage'

export default function KYCOnboarding() {
  const router = useRouter()
  const [isSubmitting, setIsSubmitting] = useState(false)
  const [formData, setFormData] = useState({
    fullName: '',
    nicNumber: '',
    dateOfBirth: '',
    address: '',
    city: '',
    phone: '',
    phone2: '',
    emergencyContact: '',
    emergencyPhone: '',
    documentType: 'NIC',
    consent: false,
  })

  // Photo upload state
  const [nicFrontUrl, setNicFrontUrl] = useState<string | null>(null)
  const [nicBackUrl, setNicBackUrl] = useState<string | null>(null)
  const [selfieUrl, setSelfieUrl] = useState<string | null>(null)
  const [nicFrontName, setNicFrontName] = useState<string | null>(null)
  const [nicBackName, setNicBackName] = useState<string | null>(null)
  const [selfieName, setSelfieName] = useState<string | null>(null)

  // Per-field upload & optimization state
  type DocState = {
    status: 'idle' | 'optimizing' | 'uploading' | 'success' | 'error'
    errorMsg?: string
    stats?: { original: string; optimized: string; wasOptimized: boolean }
  }

  const [docStates, setDocStates] = useState<Record<'front' | 'back' | 'selfie', DocState>>({
    front: { status: 'idle' },
    back: { status: 'idle' },
    selfie: { status: 'idle' },
  })

  const frontRef = useRef<HTMLInputElement>(null)
  const backRef = useRef<HTMLInputElement>(null)
  const selfieRef = useRef<HTMLInputElement>(null)

  const handleChange = (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement | HTMLSelectElement>) => {
    const { name, value } = e.target
    setFormData(prev => ({ ...prev, [name]: value }))
  }

  const uploadFile = async (rawFile: File, type: 'front' | 'back' | 'selfie') => {
    // 1. Optimization Phase
    setDocStates(prev => ({
      ...prev,
      [type]: { status: 'optimizing' },
    }))

    let optResult: OptimizeImageResult
    try {
      optResult = await optimizeImageBeforeUpload(rawFile, { purpose: 'kyc' })
    } catch (err: any) {
      setDocStates(prev => ({
        ...prev,
        [type]: {
          status: 'error',
          errorMsg: err?.message || 'Image optimization failed. Please try another photo.',
        },
      }))
      return
    }

    // 2. Upload Phase
    setDocStates(prev => ({
      ...prev,
      [type]: {
        status: 'uploading',
        stats: {
          original: optResult.formattedOriginalSize,
          optimized: optResult.formattedOptimizedSize,
          wasOptimized: optResult.wasOptimized,
        },
      },
    }))

    try {
      const fd = new FormData()
      fd.append('images[]', optResult.file)

      const res = await fetch('/api/upload', {
        method: 'POST',
        body: fd,
      })

      const data = await res.json()

      if (!res.ok) {
        throw new Error(data.message || data.error || `Upload failed (${res.status})`)
      }

      const url = data.files?.[0]?.url || data.urls?.[0] || data.url || data.fileUrl
      if (!url) throw new Error('Upload succeeded but no URL returned')

      if (type === 'front') {
        setNicFrontUrl(url)
        setNicFrontName(optResult.outputName)
      } else if (type === 'back') {
        setNicBackUrl(url)
        setNicBackName(optResult.outputName)
      } else {
        setSelfieUrl(url)
        setSelfieName(optResult.outputName)
      }

      setDocStates(prev => ({
        ...prev,
        [type]: {
          status: 'success',
          stats: {
            original: optResult.formattedOriginalSize,
            optimized: optResult.formattedOptimizedSize,
            wasOptimized: optResult.wasOptimized,
          },
        },
      }))
    } catch (err: any) {
      setDocStates(prev => ({
        ...prev,
        [type]: {
          status: 'error',
          errorMsg: err?.message || `Failed to upload ${type} photo. Please try again.`,
        },
      }))
    }
  }

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>, type: 'front' | 'back' | 'selfie') => {
    const file = e.target.files?.[0]
    if (file) uploadFile(file, type)
  }

  const removeFile = (type: 'front' | 'back' | 'selfie') => {
    if (type === 'front') { setNicFrontUrl(null); setNicFrontName(null); if (frontRef.current) frontRef.current.value = '' }
    if (type === 'back') { setNicBackUrl(null); setNicBackName(null); if (backRef.current) backRef.current.value = '' }
    if (type === 'selfie') { setSelfieUrl(null); setSelfieName(null); if (selfieRef.current) selfieRef.current.value = '' }

    setDocStates(prev => ({
      ...prev,
      [type]: { status: 'idle' },
    }))
  }

  const isAnyProcessing = Object.values(docStates).some(s => s.status === 'optimizing' || s.status === 'uploading')

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()

    if (!nicFrontUrl || !nicBackUrl) {
      alert('Please upload both front and back photos of your ID document.')
      return
    }

    if (isAnyProcessing) {
      alert('Please wait for document processing and upload to finish.')
      return
    }

    setIsSubmitting(true)

    try {
      const res = await fetch('/api/kyc/submit', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          ...formData,
          nicFrontUrl,
          nicBackUrl,
          selfieUrl,
          nicFrontName,
          nicBackName,
          selfieName,
        }),
      })

      if (res.ok) {
        const data = await res.json()
        router.replace(data.redirectTo || '/customer/pending-approval')
        router.refresh()
      } else {
        const data = await res.json()
        alert(data.message || 'Failed to submit KYC')
      }
    } catch (err) {
      alert('Network error. Please try again.')
    } finally {
      setIsSubmitting(false)
    }
  }

  const FileUploadBox = ({ label, required, type, url, name, docState, inputRef }: {
    label: string; required?: boolean; type: 'front' | 'back' | 'selfie';
    url: string | null; name: string | null; docState: DocState; inputRef: React.RefObject<HTMLInputElement | null>
  }) => (
    <div className="col-span-2">
      <label className="block text-sm font-medium text-gray-700 mb-2">
        {label} {required && '*'} {!required && <span className="text-gray-400">(Optional)</span>}
      </label>

      {url && docState.status === 'success' ? (
        <div className="flex items-center gap-3 p-3 bg-green-50 border border-green-200 rounded-lg">
          <CheckCircle className="w-5 h-5 text-green-600 flex-shrink-0" />
          <div className="flex-1 min-w-0">
            <p className="text-sm font-medium text-green-800 truncate">{name}</p>
            <p className="text-xs text-green-600 flex items-center gap-1">
              <span>Uploaded successfully</span>
              {docState.stats && (
                <span className="font-semibold text-green-700 ml-1">
                  ({docState.stats.wasOptimized ? `Original: ${docState.stats.original} → Optimized: ${docState.stats.optimized}` : docState.stats.original})
                </span>
              )}
            </p>
          </div>
          <button type="button" onClick={() => removeFile(type)} className="text-xs text-slate-500 hover:text-red-600 underline ml-2">
            Replace image
          </button>
        </div>
      ) : docState.status === 'optimizing' ? (
        <div className="flex items-center gap-3 p-3.5 bg-indigo-50 border border-indigo-200 rounded-lg animate-pulse">
          <Loader2 className="w-5 h-5 text-indigo-600 animate-spin flex-shrink-0" />
          <div>
            <p className="text-sm font-medium text-indigo-900">Optimizing image...</p>
            <p className="text-xs text-indigo-600">Compressing for clear & fast upload</p>
          </div>
        </div>
      ) : docState.status === 'uploading' ? (
        <div className="flex items-center gap-3 p-3.5 bg-blue-50 border border-blue-200 rounded-lg animate-pulse">
          <Loader2 className="w-5 h-5 text-blue-600 animate-spin flex-shrink-0" />
          <div>
            <p className="text-sm font-medium text-blue-900">Uploading document...</p>
            {docState.stats && (
              <p className="text-xs text-blue-700 font-medium">
                {docState.stats.wasOptimized
                  ? `Original: ${docState.stats.original} → Optimized: ${docState.stats.optimized}`
                  : `Uploading (${docState.stats.original})`}
              </p>
            )}
          </div>
        </div>
      ) : docState.status === 'error' ? (
        <div className="p-3.5 bg-rose-50 border border-rose-200 rounded-lg">
          <div className="flex items-start justify-between gap-2">
            <div>
              <p className="text-sm font-medium text-rose-800">Upload Failed</p>
              <p className="text-xs text-rose-600 mt-0.5">{docState.errorMsg}</p>
            </div>
            <button
              type="button"
              onClick={() => {
                setDocStates(prev => ({ ...prev, [type]: { status: 'idle' } }))
                if (inputRef.current) inputRef.current.click()
              }}
              className="px-2.5 py-1 text-xs font-medium bg-rose-600 text-white rounded hover:bg-rose-700 transition"
            >
              Try Again
            </button>
          </div>
        </div>
      ) : (
        <div 
          onClick={() => inputRef.current?.click()}
          className="border-2 border-dashed border-gray-300 rounded-lg p-4 text-center cursor-pointer hover:border-blue-400 hover:bg-blue-50/50 transition-colors"
        >
          <Upload className="w-6 h-6 text-gray-400 mx-auto mb-2" />
          <p className="text-sm text-gray-600 font-medium">Click to upload photo</p>
          <p className="text-xs text-gray-400 mt-1">Accepts high-res camera photos up to 30 MB (Auto-optimized)</p>
          <input ref={inputRef} type="file" accept="image/*,application/pdf" className="hidden"
            onChange={(e) => handleFileChange(e, type)} />
        </div>
      )}
    </div>
  )

  return (
    <div className="min-h-screen bg-gray-50 py-12 px-4 sm:px-6 lg:px-8">
      <div className="max-w-2xl mx-auto bg-white p-8 rounded-2xl shadow-sm border border-gray-100">
        <div className="mb-8">
          <h1 className="text-3xl font-extrabold text-gray-900">Verify Your Identity</h1>
          <p className="text-gray-500 mt-2">KYC verification is required to make rental bookings. Your documents are encrypted and stored securely.</p>
        </div>

        <form onSubmit={handleSubmit} className="space-y-6">
          {/* Personal Information */}
          <div>
            <h3 className="text-lg font-semibold text-gray-900 mb-4 flex items-center gap-2">
              <User className="w-5 h-5 text-blue-600" /> Personal Information
            </h3>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div className="col-span-2">
                <label className="block text-sm font-medium text-gray-700 mb-1">Full Name (as per ID) *</label>
                <input required type="text" name="fullName" value={formData.fullName} onChange={handleChange}
                  className="block w-full border border-gray-300 rounded-lg py-2.5 px-3 text-sm focus:ring-blue-500 focus:border-blue-500" />
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">ID Number (NIC/Passport) *</label>
                <input required type="text" name="nicNumber" value={formData.nicNumber} onChange={handleChange}
                  className="block w-full border border-gray-300 rounded-lg py-2.5 px-3 text-sm focus:ring-blue-500 focus:border-blue-500" />
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Date of Birth *</label>
                <input required type="date" name="dateOfBirth" value={formData.dateOfBirth} onChange={handleChange}
                  className="block w-full border border-gray-300 rounded-lg py-2.5 px-3 text-sm focus:ring-blue-500 focus:border-blue-500" />
              </div>

              <div className="col-span-2">
                <label className="block text-sm font-medium text-gray-700 mb-1">Current Address *</label>
                <textarea required name="address" value={formData.address} onChange={handleChange} rows={2}
                  className="block w-full border border-gray-300 rounded-lg py-2.5 px-3 text-sm focus:ring-blue-500 focus:border-blue-500 resize-none" />
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">City *</label>
                <input required type="text" name="city" value={formData.city} onChange={handleChange}
                  className="block w-full border border-gray-300 rounded-lg py-2.5 px-3 text-sm focus:ring-blue-500 focus:border-blue-500" />
              </div>
            </div>
          </div>

          {/* Contact Numbers */}
          <div className="pt-4 border-t border-gray-200">
            <h3 className="text-lg font-semibold text-gray-900 mb-4 flex items-center gap-2">
              <Phone className="w-5 h-5 text-green-600" /> Contact Numbers
            </h3>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Primary Contact Number *</label>
                <input required type="tel" name="phone" value={formData.phone} onChange={handleChange}
                  placeholder="e.g. 0771234567"
                  className="block w-full border border-gray-300 rounded-lg py-2.5 px-3 text-sm focus:ring-blue-500 focus:border-blue-500" />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Secondary Contact Number <span className="text-gray-400">(Optional)</span></label>
                <input type="tel" name="phone2" value={formData.phone2} onChange={handleChange}
                  placeholder="e.g. 0112345678"
                  className="block w-full border border-gray-300 rounded-lg py-2.5 px-3 text-sm focus:ring-blue-500 focus:border-blue-500" />
              </div>
            </div>
          </div>

          {/* Emergency Contact */}
          <div className="pt-4 border-t border-gray-200">
            <h3 className="text-lg font-semibold text-gray-900 mb-4 flex items-center gap-2">
              <Shield className="w-5 h-5 text-red-500" /> Emergency Contact
            </h3>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Emergency Contact Name *</label>
                <input required type="text" name="emergencyContact" value={formData.emergencyContact} onChange={handleChange}
                  className="block w-full border border-gray-300 rounded-lg py-2.5 px-3 text-sm focus:ring-blue-500 focus:border-blue-500" />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Emergency Contact Phone *</label>
                <input required type="tel" name="emergencyPhone" value={formData.emergencyPhone} onChange={handleChange}
                  placeholder="e.g. 0771234567"
                  className="block w-full border border-gray-300 rounded-lg py-2.5 px-3 text-sm focus:ring-blue-500 focus:border-blue-500" />
              </div>
            </div>
          </div>

          {/* Document Upload */}
          <div className="pt-4 border-t border-gray-200">
            <h3 className="text-lg font-semibold text-gray-900 mb-4 flex items-center gap-2">
              <FileText className="w-5 h-5 text-purple-600" /> Document Upload
            </h3>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div className="col-span-2 md:col-span-1">
                <label className="block text-sm font-medium text-gray-700 mb-1">Document Type</label>
                <select name="documentType" value={formData.documentType} onChange={handleChange}
                  className="block w-full border border-gray-300 rounded-lg py-2.5 px-3 text-sm focus:ring-blue-500 focus:border-blue-500">
                  <option value="NIC">National Identity Card (NIC)</option>
                  <option value="Passport">Passport</option>
                  <option value="DrivingLicense">Driving License</option>
                </select>
              </div>

              <FileUploadBox label="Upload Front Side" required type="front"
                url={nicFrontUrl} name={nicFrontName}
                docState={docStates.front} inputRef={frontRef} />

              <FileUploadBox label="Upload Back Side" required type="back"
                url={nicBackUrl} name={nicBackName}
                docState={docStates.back} inputRef={backRef} />

              <FileUploadBox label="Selfie with ID" type="selfie"
                url={selfieUrl} name={selfieName}
                docState={docStates.selfie} inputRef={selfieRef} />
            </div>
          </div>

          {/* Consent */}
          <div className="flex items-center mt-6">
            <input id="consent" type="checkbox" name="consent"
              checked={formData.consent}
              onChange={(e) => setFormData(prev => ({ ...prev, consent: e.target.checked }))}
              className="h-4 w-4 text-blue-600 border-gray-300 rounded" />
            <label htmlFor="consent" className="ml-2 block text-sm text-gray-900">
              Allow other rental providers to auto-fill my verified details to speed up bookings
            </label>
          </div>

          <div className="flex justify-end pt-6 border-t border-gray-200">
            <button type="submit" disabled={isSubmitting || isAnyProcessing}
              className="bg-blue-600 text-white px-8 py-3 rounded-lg font-medium hover:bg-blue-700 disabled:opacity-50 transition-colors">
              {isSubmitting ? 'Submitting...' : isAnyProcessing ? 'Processing files...' : 'Submit Verification'}
            </button>
          </div>
        </form>
      </div>
    </div>
  )
}
