'use client'

import { useState } from 'react'
import { useRouter } from 'next/navigation'

export default function KYCOnboarding() {
  const router = useRouter()
  const [isSubmitting, setIsSubmitting] = useState(false)
  const [success, setSuccess] = useState(false)
  
  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setIsSubmitting(true)
    
    // Simulate upload delay
    setTimeout(async () => {
      try {
        await fetch('/api/kyc/submit', { method: 'POST', body: JSON.stringify({}) })
        setSuccess(true)
        setTimeout(() => router.push('/dashboard'), 2000)
      } catch (err) {
        console.error(err)
      } finally {
        setIsSubmitting(false)
      }
    }, 1500)
  }

  if (success) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center py-12 px-4">
        <div className="max-w-md w-full bg-white p-8 rounded-2xl shadow-sm text-center">
          <div className="w-16 h-16 bg-green-100 text-green-600 rounded-full flex items-center justify-center mx-auto mb-4 text-3xl">✓</div>
          <h2 className="text-2xl font-bold text-gray-900 mb-2">Documents Submitted!</h2>
          <p className="text-gray-600">Our team will review your submission within 24 hours.</p>
        </div>
      </div>
    )
  }

  return (
    <div className="min-h-screen bg-gray-50 py-12 px-4 sm:px-6 lg:px-8">
      <div className="max-w-2xl mx-auto bg-white p-8 rounded-2xl shadow-sm border border-gray-100">
        <div className="mb-8">
          <h1 className="text-3xl font-extrabold text-gray-900">Verify Your Identity</h1>
          <p className="text-gray-500 mt-2">KYC verification is required to make rental bookings. Your documents are encrypted and stored securely.</p>
        </div>

        <form onSubmit={handleSubmit} className="space-y-6">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            <div className="col-span-2">
              <label className="block text-sm font-medium text-gray-700">Full Name (as per ID) *</label>
              <input required type="text" className="mt-1 block w-full border border-gray-300 rounded-md py-2 px-3" />
            </div>
            
            <div>
              <label className="block text-sm font-medium text-gray-700">ID Number *</label>
              <input required type="text" className="mt-1 block w-full border border-gray-300 rounded-md py-2 px-3" />
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700">Date of Birth *</label>
              <input required type="date" className="mt-1 block w-full border border-gray-300 rounded-md py-2 px-3" />
            </div>

            <div className="col-span-2">
              <label className="block text-sm font-medium text-gray-700">Current Address *</label>
              <textarea required rows={2} className="mt-1 block w-full border border-gray-300 rounded-md py-2 px-3" />
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700">Emergency Contact Name *</label>
              <input required type="text" className="mt-1 block w-full border border-gray-300 rounded-md py-2 px-3" />
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700">Emergency Contact Phone *</label>
              <input required type="text" className="mt-1 block w-full border border-gray-300 rounded-md py-2 px-3" />
            </div>
            
            <div className="col-span-2 pt-4 border-t border-gray-200">
              <h3 className="text-lg font-medium text-gray-900 mb-4">Document Upload</h3>
            </div>

            <div className="col-span-2 md:col-span-1">
              <label className="block text-sm font-medium text-gray-700">Document Type</label>
              <select className="mt-1 block w-full border border-gray-300 rounded-md py-2 px-3">
                <option>National Identity Card (NIC)</option>
                <option>Passport</option>
                <option>Driving License</option>
              </select>
            </div>

            <div className="col-span-2">
              <label className="block text-sm font-medium text-gray-700 mb-2">Upload Front Side *</label>
              <input required type="file" className="block w-full text-sm text-gray-500 file:mr-4 file:py-2 file:px-4 file:rounded-md file:border-0 file:text-sm file:font-semibold file:bg-blue-50 file:text-blue-700 hover:file:bg-blue-100" />
            </div>
            
            <div className="col-span-2">
              <label className="block text-sm font-medium text-gray-700 mb-2">Upload Back Side *</label>
              <input required type="file" className="block w-full text-sm text-gray-500 file:mr-4 file:py-2 file:px-4 file:rounded-md file:border-0 file:text-sm file:font-semibold file:bg-blue-50 file:text-blue-700 hover:file:bg-blue-100" />
            </div>
            
            <div className="col-span-2">
              <label className="block text-sm font-medium text-gray-700 mb-2">Upload Selfie with ID (Optional)</label>
              <input type="file" className="block w-full text-sm text-gray-500 file:mr-4 file:py-2 file:px-4 file:rounded-md file:border-0 file:text-sm file:font-semibold file:bg-blue-50 file:text-blue-700 hover:file:bg-blue-100" />
            </div>
          </div>

          <div className="flex items-center mt-6">
            <input id="consent" type="checkbox" className="h-4 w-4 text-blue-600 border-gray-300 rounded" />
            <label htmlFor="consent" className="ml-2 block text-sm text-gray-900">
              Allow other rental providers to auto-fill my verified details to speed up bookings
            </label>
          </div>

          <div className="flex justify-end pt-6 border-t border-gray-200">
            <button type="submit" disabled={isSubmitting} className="bg-blue-600 text-white px-8 py-3 rounded-lg font-medium hover:bg-blue-700 disabled:opacity-50">
              {isSubmitting ? 'Submitting...' : 'Submit Verification'}
            </button>
          </div>
        </form>
      </div>
    </div>
  )
}
