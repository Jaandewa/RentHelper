'use client'

import { useState } from 'react'
import { useRouter } from 'next/navigation'
import { Phone, User, MapPin, Shield, Upload, FileText } from 'lucide-react'

export default function KYCOnboarding() {
  const router = useRouter()
  const [isSubmitting, setIsSubmitting] = useState(false)
  const [success, setSuccess] = useState(false)
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

  const handleChange = (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement | HTMLSelectElement>) => {
    const { name, value } = e.target
    setFormData(prev => ({ ...prev, [name]: value }))
  }

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setIsSubmitting(true)

    try {
      const res = await fetch('/api/kyc/submit', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(formData),
      })

      if (res.ok) {
        setSuccess(true)
        setTimeout(() => router.push('/dashboard'), 2000)
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

  if (success) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center py-12 px-4">
        <div className="max-w-md w-full bg-white p-8 rounded-2xl shadow-sm text-center">
          <div className="w-16 h-16 bg-green-100 text-green-600 rounded-full flex items-center justify-center mx-auto mb-4 text-3xl">✓</div>
          <h2 className="text-2xl font-bold text-gray-900 mb-2">Documents Submitted!</h2>
          <p className="text-gray-600">Our team will review your submission within 24 hours. You&apos;ll receive a notification once verified.</p>
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

              <div className="col-span-2">
                <label className="block text-sm font-medium text-gray-700 mb-2">Upload Front Side *</label>
                <input required type="file" accept="image/*"
                  className="block w-full text-sm text-gray-500 file:mr-4 file:py-2 file:px-4 file:rounded-md file:border-0 file:text-sm file:font-semibold file:bg-blue-50 file:text-blue-700 hover:file:bg-blue-100" />
              </div>

              <div className="col-span-2">
                <label className="block text-sm font-medium text-gray-700 mb-2">Upload Back Side *</label>
                <input required type="file" accept="image/*"
                  className="block w-full text-sm text-gray-500 file:mr-4 file:py-2 file:px-4 file:rounded-md file:border-0 file:text-sm file:font-semibold file:bg-blue-50 file:text-blue-700 hover:file:bg-blue-100" />
              </div>

              <div className="col-span-2">
                <label className="block text-sm font-medium text-gray-700 mb-2">Selfie with ID <span className="text-gray-400">(Optional)</span></label>
                <input type="file" accept="image/*"
                  className="block w-full text-sm text-gray-500 file:mr-4 file:py-2 file:px-4 file:rounded-md file:border-0 file:text-sm file:font-semibold file:bg-blue-50 file:text-blue-700 hover:file:bg-blue-100" />
              </div>
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
            <button type="submit" disabled={isSubmitting}
              className="bg-blue-600 text-white px-8 py-3 rounded-lg font-medium hover:bg-blue-700 disabled:opacity-50 transition-colors">
              {isSubmitting ? 'Submitting...' : 'Submit Verification'}
            </button>
          </div>
        </form>
      </div>
    </div>
  )
}
