'use client'

import { useState, useEffect } from 'react'
import { useRouter } from 'next/navigation'

export default function BusinessOnboarding() {
  const router = useRouter()
  const [checking, setChecking] = useState(true)
  const [formData, setFormData] = useState({
    name: '',
    phone: '',
    address: '',
    city: '',
    registrationNumber: '',
    currency: 'LKR',
    advancePaymentPercent: 30,
    description: ''
  })
  const [isSubmitting, setIsSubmitting] = useState(false)

  useEffect(() => {
    fetch('/api/auth/destination')
      .then(res => res.json())
      .then(data => {
        if (data?.destination && data.destination !== '/onboarding/business') {
          router.replace(data.destination)
        } else {
          setChecking(false)
        }
      })
      .catch(() => setChecking(false))
  }, [router])

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setIsSubmitting(true)
    try {
      await fetch('/api/onboarding/business', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(formData)
      })
      router.push('/dashboard')
    } catch (e) {
      console.error(e)
    } finally {
      setIsSubmitting(false)
    }
  }

  if (checking) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gray-50">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600"></div>
      </div>
    )
  }

  return (
    <div className="min-h-screen bg-gray-50 py-12 px-4 sm:px-6 lg:px-8">
      <div className="max-w-2xl mx-auto bg-white p-8 rounded-2xl shadow-sm border border-gray-100">
        <div className="mb-8">
          <div className="text-sm font-medium text-blue-600 mb-2">Step 2 of 3</div>
          <h1 className="text-3xl font-extrabold text-gray-900">Business Details</h1>
          <p className="text-gray-500 mt-2">Tell us about your rental business</p>
        </div>

        <form onSubmit={handleSubmit} className="space-y-6">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            <div className="col-span-2">
              <label className="block text-sm font-medium text-gray-700">Business Name *</label>
              <input required type="text" className="mt-1 block w-full border border-gray-300 rounded-md py-2 px-3 focus:ring-blue-500 focus:border-blue-500"
                value={formData.name} onChange={e => setFormData({...formData, name: e.target.value})} />
            </div>
            
            <div className="col-span-2 md:col-span-1">
              <label className="block text-sm font-medium text-gray-700">Phone Number *</label>
              <input required type="text" className="mt-1 block w-full border border-gray-300 rounded-md py-2 px-3 focus:ring-blue-500 focus:border-blue-500"
                value={formData.phone} onChange={e => setFormData({...formData, phone: e.target.value})} />
            </div>

            <div className="col-span-2 md:col-span-1">
              <label className="block text-sm font-medium text-gray-700">City *</label>
              <input required type="text" className="mt-1 block w-full border border-gray-300 rounded-md py-2 px-3 focus:ring-blue-500 focus:border-blue-500"
                value={formData.city} onChange={e => setFormData({...formData, city: e.target.value})} />
            </div>

            <div className="col-span-2">
              <label className="block text-sm font-medium text-gray-700">Address</label>
              <input type="text" className="mt-1 block w-full border border-gray-300 rounded-md py-2 px-3 focus:ring-blue-500 focus:border-blue-500"
                value={formData.address} onChange={e => setFormData({...formData, address: e.target.value})} />
            </div>

            <div className="col-span-2 md:col-span-1">
              <label className="block text-sm font-medium text-gray-700">Business Reg Number (optional)</label>
              <input type="text" className="mt-1 block w-full border border-gray-300 rounded-md py-2 px-3 focus:ring-blue-500 focus:border-blue-500"
                value={formData.registrationNumber} onChange={e => setFormData({...formData, registrationNumber: e.target.value})} />
            </div>

            <div className="col-span-2 md:col-span-1">
              <label className="block text-sm font-medium text-gray-700">Currency</label>
              <select className="mt-1 block w-full border border-gray-300 rounded-md py-2 px-3 focus:ring-blue-500 focus:border-blue-500"
                value={formData.currency} onChange={e => setFormData({...formData, currency: e.target.value})}>
                <option value="LKR">LKR (Sri Lankan Rupee)</option>
                <option value="USD">USD ($)</option>
                <option value="GBP">GBP (£)</option>
                <option value="EUR">EUR (€)</option>
              </select>
            </div>

            <div className="col-span-2">
              <label className="block text-sm font-medium text-gray-700">Advance Payment % Default</label>
              <input type="number" min="0" max="100" className="mt-1 block w-full border border-gray-300 rounded-md py-2 px-3 focus:ring-blue-500 focus:border-blue-500"
                value={formData.advancePaymentPercent} onChange={e => setFormData({...formData, advancePaymentPercent: Number(e.target.value)})} />
            </div>
            
            <div className="col-span-2">
              <label className="block text-sm font-medium text-gray-700">Brief Description</label>
              <textarea rows={3} className="mt-1 block w-full border border-gray-300 rounded-md py-2 px-3 focus:ring-blue-500 focus:border-blue-500"
                value={formData.description} onChange={e => setFormData({...formData, description: e.target.value})} />
            </div>
          </div>

          <div className="flex justify-between pt-6 border-t border-gray-200">
            <button type="button" onClick={() => router.back()} className="text-gray-600 px-4 py-2 hover:bg-gray-100 rounded-lg">Back</button>
            <button type="submit" disabled={isSubmitting} className="bg-blue-600 text-white px-8 py-3 rounded-lg font-medium hover:bg-blue-700 disabled:opacity-50">
              {isSubmitting ? 'Saving...' : 'Save & Continue'}
            </button>
          </div>
        </form>
      </div>
    </div>
  )
}
