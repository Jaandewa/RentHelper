'use client'

import { useState } from 'react'
import { useRouter } from 'next/navigation'
import { Camera, Car, PartyPopper, Wrench, Scissors, Laptop, Tent, Home, Stethoscope, Package } from 'lucide-react'

const ALL_CATEGORIES = [
  { id: 'camera', name: 'Camera & Video', icon: Camera },
  { id: 'vehicles', name: 'Vehicles', icon: Car },
  { id: 'party', name: 'Party Items', icon: PartyPopper },
  { id: 'sound', name: 'Sound & Stage', icon: PartyPopper },
  { id: 'tools', name: 'Tools & Equipment', icon: Wrench },
  { id: 'clothing', name: 'Clothing & Bridal', icon: Scissors },
  { id: 'it', name: 'IT Equipment', icon: Laptop },
  { id: 'camping', name: 'Camping', icon: Tent },
  { id: 'furniture', name: 'Furniture', icon: Home },
  { id: 'medical', name: 'Medical Equipment', icon: Stethoscope },
  { id: 'other', name: 'Other', icon: Package },
]

export default function CategoriesOnboarding() {
  const router = useRouter()
  const [selected, setSelected] = useState<string[]>([])
  const [isSubmitting, setIsSubmitting] = useState(false)

  const toggleCategory = (id: string) => {
    setSelected(prev => 
      prev.includes(id) ? prev.filter(c => c !== id) : [...prev, id]
    )
  }

  const handleContinue = async () => {
    setIsSubmitting(true)
    try {
      await fetch('/api/onboarding/categories', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ categories: selected })
      })
      router.push('/onboarding/business')
    } catch (e) {
      console.error(e)
    } finally {
      setIsSubmitting(false)
    }
  }

  return (
    <div className="min-h-screen bg-gray-50 py-12 px-4 sm:px-6 lg:px-8">
      <div className="max-w-4xl mx-auto">
        <div className="mb-8">
          <div className="text-sm font-medium text-blue-600 mb-2">Step 1 of 3</div>
          <h1 className="text-3xl font-extrabold text-gray-900">What do you rent out?</h1>
          <p className="text-gray-500 mt-2">Select all categories that apply to your business</p>
        </div>

        <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-4 mb-8">
          {ALL_CATEGORIES.map(cat => {
            const Icon = cat.icon
            const isSelected = selected.includes(cat.id)
            return (
              <div 
                key={cat.id}
                onClick={() => toggleCategory(cat.id)}
                className={`p-6 border-2 rounded-xl cursor-pointer flex flex-col items-center justify-center transition-all ${
                  isSelected ? 'border-blue-600 bg-blue-50' : 'border-gray-200 bg-white hover:border-gray-300'
                }`}
              >
                <Icon className={`w-10 h-10 mb-3 ${isSelected ? 'text-blue-600' : 'text-gray-400'}`} />
                <span className={`text-center font-medium ${isSelected ? 'text-blue-700' : 'text-gray-700'}`}>
                  {cat.name}
                </span>
              </div>
            )
          })}
        </div>

        <div className="flex justify-between items-center border-t border-gray-200 pt-6">
          <button 
            onClick={() => router.push('/onboarding/business')}
            className="text-gray-500 hover:text-gray-700 font-medium"
          >
            Skip for now
          </button>
          <button 
            onClick={handleContinue}
            disabled={isSubmitting || selected.length === 0}
            className="bg-blue-600 text-white px-8 py-3 rounded-lg font-medium hover:bg-blue-700 disabled:opacity-50"
          >
            {isSubmitting ? 'Saving...' : 'Continue'}
          </button>
        </div>
      </div>
    </div>
  )
}
