'use client'

import { useState, useEffect, Suspense } from 'react'
import { useRouter, useSearchParams } from 'next/navigation'
import Link from 'next/link'
import { ArrowLeft, Search, Plus, X, Calendar, User, Package, CreditCard, ChevronLeft, ChevronRight, Check, AlertCircle, Loader2 } from 'lucide-react'

const STEPS = [
  { id: 1, title: 'Select Customer', desc: 'Who is renting?' },
  { id: 2, title: 'Select Items', desc: 'What are they renting?' },
  { id: 3, title: 'Dates & Pricing', desc: 'When & how much?' },
  { id: 4, title: 'Confirm', desc: 'Review & create' },
]

interface CustomerOption {
  id: string
  displayId: string
  name: string
  phone: string
  email: string
  kycStatus: string
  trustScore: number
  customerType?: string
}

interface ItemOption {
  id: string
  name: string
  sku: string | null
  dailyRate: number
  depositAmount: number
  status: string
  foreignDailyRate?: number | null
  foreignWeeklyRate?: number | null
  foreignMonthlyRate?: number | null
  foreignDepositAmount?: number | null
}

type SelectedItem = { id: string; name: string; dailyRate: number; depositAmount: number; quantity: number; foreignDailyRate?: number | null; foreignDepositAmount?: number | null; appliedRate?: number; isForeignRateApplied?: boolean; missingForeignRate?: boolean }

function NewBookingInner() {
  const router = useRouter()
  const searchParams = useSearchParams()
  const preselectedCustomerId = searchParams.get('customerId')

  const [step, setStep] = useState(1)
  const [isLoading, setIsLoading] = useState(false)
  const [fetchingData, setFetchingData] = useState(true)

  const [customers, setCustomers] = useState<CustomerOption[]>([])
  const [items, setItems] = useState<ItemOption[]>([])

  const [customerSearch, setCustomerSearch] = useState('')
  const [itemSearch, setItemSearch] = useState('')

  const [selectedCustomer, setSelectedCustomer] = useState<CustomerOption | null>(null)
  const [selectedItems, setSelectedItems] = useState<SelectedItem[]>([])
  const [dates, setDates] = useState({ pickupDate: '', returnDate: '', pickupTime: '09:00', returnTime: '18:00' })
  const [pricing, setPricing] = useState({ discountAmount: 0, deliveryCharge: 0, advancePercent: 30 })
  const [notes, setNotes] = useState('')

  useEffect(() => {
    async function loadData() {
      setFetchingData(true)
      try {
        const [custRes, itemRes] = await Promise.all([
          fetch('/api/provider/customers'),
          fetch('/api/items'),
        ])

        if (custRes.ok) {
          const custData = await custRes.json()
          const rawList = custData.customers || (Array.isArray(custData) ? custData : [])
          const formatted = rawList.map((c: any) => ({
            id: c.id,
            displayId: c.displayId || `CUS-${c.id.slice(-6).toUpperCase()}`,
            name: c.fullName || c.user?.name || 'Customer',
            phone: c.primaryContactNumber || c.phone || 'N/A',
            email: c.email || c.user?.email || '',
            kycStatus: c.kycStatus || 'not_submitted',
            trustScore: c.trustScore || 0,
            customerType: c.customerType || 'LOCAL',
          }))
          setCustomers(formatted)

          if (preselectedCustomerId) {
            const found = formatted.find((c: any) => c.id === preselectedCustomerId || c.displayId === preselectedCustomerId)
            if (found) {
              setSelectedCustomer(found)
            }
          }
        }

        if (itemRes.ok) {
          const itemData = await itemRes.json()
          const rawItems = Array.isArray(itemData) ? itemData : itemData.items || []
          const availableOnly = rawItems.filter((i: any) => i.status === 'available' || i.status === 'booked')
          setItems(availableOnly)
        }
      } catch (err) {
        console.error('Failed to load booking resources:', err)
      } finally {
        setFetchingData(false)
      }
    }


    loadData()
  }, [preselectedCustomerId])

  // Server-side search for all registered customers (Section 1)
  const [searchResults, setSearchResults] = useState<CustomerOption[]>([])
  const [isSearchingCustomers, setIsSearchingCustomers] = useState(false)

  // Existing customers who booked with this provider (Section 2)
  const [existingCustomers, setExistingCustomers] = useState<any[]>([])
  const [loadingExisting, setLoadingExisting] = useState(true)

  useEffect(() => {
    async function loadExisting() {
      setLoadingExisting(true)
      try {
        const res = await fetch('/api/provider/booking-customers/existing')
        if (res.ok) {
          const data = await res.json()
          setExistingCustomers(data.customers || [])
        }
      } catch (err) {
        console.error('Failed to load existing customers:', err)
      } finally {
        setLoadingExisting(false)
      }
    }
    loadExisting()
  }, [])

  // Debounced server-side search
  useEffect(() => {
    if (!customerSearch.trim()) {
      setSearchResults([])
      return
    }
    const timer = setTimeout(async () => {
      setIsSearchingCustomers(true)
      try {
        const res = await fetch(`/api/provider/booking-customers/search?q=${encodeURIComponent(customerSearch.trim())}`)
        if (res.ok) {
          const data = await res.json()
          const formatted = (data.customers || []).map((c: any) => ({
            id: c.id,
            displayId: c.displayId,
            name: c.fullName || 'Customer',
            phone: c.maskedPhone || 'N/A',
            email: c.maskedEmail || '',
            kycStatus: c.kycStatus || 'not_submitted',
            trustScore: c.trustScore || 0,
            customerType: c.customerType || 'LOCAL',
          }))
          setSearchResults(formatted)
        }
      } catch (err) {
        console.error('Customer search error:', err)
      } finally {
        setIsSearchingCustomers(false)
      }
    }, 300)
    return () => clearTimeout(timer)
  }, [customerSearch])


  const filteredItems = items.filter(i =>
    (i.name.toLowerCase().includes(itemSearch.toLowerCase()) || (i.sku && i.sku.toLowerCase().includes(itemSearch.toLowerCase()))) &&
    !selectedItems.find(s => s.id === i.id)
  )

  const addItem = (item: ItemOption) => {
    const isForeign = selectedCustomer?.customerType === 'FOREIGN'
    const hasForeignRate = item.foreignDailyRate != null && item.foreignDailyRate > 0
    const appliedRate = isForeign && hasForeignRate ? item.foreignDailyRate! : (item.dailyRate || 0)
    
    setSelectedItems(prev => [...prev, { 
      ...item, 
      dailyRate: item.dailyRate || 0, 
      depositAmount: item.depositAmount || 0, 
      quantity: 1,
      appliedRate,
      isForeignRateApplied: isForeign && hasForeignRate,
      missingForeignRate: isForeign && !hasForeignRate
    }])
  }

  const removeItem = (id: string) => {
    setSelectedItems(prev => prev.filter(i => i.id !== id))
  }

  const days = dates.pickupDate && dates.returnDate
    ? Math.max(1, Math.ceil((new Date(dates.returnDate).getTime() - new Date(dates.pickupDate).getTime()) / (1000 * 60 * 60 * 24)))
    : 0

  const subtotal = selectedItems.reduce((sum, item) => sum + (item.appliedRate || item.dailyRate) * item.quantity * (days || 1), 0)
  const totalDeposit = selectedItems.reduce((sum, item) => sum + (item.isForeignRateApplied && item.foreignDepositAmount != null ? item.foreignDepositAmount : item.depositAmount) * item.quantity, 0)
  const totalAmount = subtotal + pricing.deliveryCharge - pricing.discountAmount
  const advanceAmount = Math.round(totalAmount * pricing.advancePercent / 100)

  const handleSubmit = async () => {
    if (!selectedCustomer) {
      alert('Please select a customer')
      return
    }
    setIsLoading(true)
    try {
      const res = await fetch('/api/orders', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          customerId: selectedCustomer.id,
          items: selectedItems,
          ...dates,
          days,
          subtotal,
          totalAmount,
          totalDeposit,
          advanceAmount,
          ...pricing,
          notes,
        }),
      })
      if (res.ok) {
        router.push('/dashboard/bookings')
      } else {
        const data = await res.json()
        alert(data.message || 'Failed to create booking')
      }
    } catch {
      alert('Network error')
    } finally {
      setIsLoading(false)
    }
  }

  if (fetchingData) {
    return (
      <div className="p-12 text-center text-gray-500">
        <Loader2 className="w-8 h-8 text-blue-600 animate-spin mx-auto mb-2" />
        Loading booking resources...
      </div>
    )
  }

  return (
    <div className="max-w-3xl mx-auto space-y-6">
      {/* Header */}
      <div className="flex items-center gap-4">
        <Link href="/dashboard/bookings" className="p-2 rounded-lg text-gray-500 hover:bg-gray-100">
          <ArrowLeft className="w-5 h-5" />
        </Link>
        <div>
          <h1 className="text-2xl font-bold text-gray-900">New Booking</h1>
          <p className="text-sm text-gray-500">Create a new rental order</p>
        </div>
      </div>

      {/* Step Progress */}
      <div className="flex items-center gap-2">
        {STEPS.map((s, idx) => (
          <div key={s.id} className="flex items-center gap-2 flex-1">
            <div className={`flex items-center justify-center w-8 h-8 rounded-full text-sm font-bold shrink-0 transition-colors ${
              step > s.id ? 'bg-green-500 text-white' : step === s.id ? 'bg-blue-600 text-white' : 'bg-gray-200 text-gray-500'
            }`}>
              {step > s.id ? <Check className="w-4 h-4" /> : s.id}
            </div>
            <div className="hidden md:block min-w-0">
              <p className="text-xs font-medium text-gray-900 truncate">{s.title}</p>
              <p className="text-xs text-gray-500 truncate">{s.desc}</p>
            </div>
            {idx < STEPS.length - 1 && (
              <div className={`flex-1 h-0.5 mx-1 ${step > s.id ? 'bg-green-400' : 'bg-gray-200'}`} />
            )}
          </div>
        ))}
      </div>

      {/* Step 1: Select Customer */}
      {step === 1 && (
        <div className="space-y-6">
          {/* Selected Customer Summary */}
          {selectedCustomer && (
            <div className="bg-blue-50 border-2 border-blue-500 rounded-xl p-4 flex items-center justify-between">
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 rounded-full bg-gradient-to-br from-blue-400 to-blue-600 flex items-center justify-center text-white font-bold">
                  {selectedCustomer.name.charAt(0)}
                </div>
                <div>
                  <p className="font-semibold text-gray-900 flex items-center gap-2">
                    Selected Customer
                    <span className="font-mono text-xs text-blue-600 bg-white px-2 py-0.5 rounded-full">{selectedCustomer.displayId}</span>
                  </p>
                  <p className="text-sm text-gray-700">{selectedCustomer.name} • {selectedCustomer.phone}</p>
                </div>
              </div>
              <button
                onClick={() => setSelectedCustomer(null)}
                className="text-gray-400 hover:text-red-500 transition-colors"
              >
                <X className="w-5 h-5" />
              </button>
            </div>
          )}

          {/* Section 1: Search All Registered Customers */}
          <div className="bg-white rounded-xl border border-gray-200 shadow-sm p-6 space-y-4">
            <h2 className="text-lg font-semibold text-gray-900 flex items-center gap-2">
              <Search className="w-5 h-5 text-blue-600" /> Search All Registered Customers
            </h2>
            <p className="text-sm text-gray-500">Find any registered customer by name, phone, ID number, or email</p>
            <div className="relative">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400" />
              <input
                type="text"
                placeholder="Search by name, phone, customer ID, NIC, passport, or email..."
                className="pl-9 pr-10 py-2.5 w-full border border-gray-300 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
                value={customerSearch}
                onChange={e => setCustomerSearch(e.target.value)}
              />
              {isSearchingCustomers && (
                <Loader2 className="absolute right-3 top-1/2 -translate-y-1/2 w-4 h-4 text-blue-600 animate-spin" />
              )}
            </div>

            {/* Search Results */}
            {customerSearch.trim() && (
              <div className="space-y-2 max-h-72 overflow-y-auto">
                {isSearchingCustomers ? (
                  <div className="py-6 text-center text-gray-500 text-sm">
                    <Loader2 className="w-5 h-5 text-blue-600 animate-spin mx-auto mb-1" />
                    Searching customers...
                  </div>
                ) : searchResults.length > 0 ? (
                  searchResults.map(c => (
                    <button
                      key={c.id}
                      onClick={() => { setSelectedCustomer(c); setCustomerSearch('') }}
                      className={`w-full flex items-center justify-between p-4 rounded-xl border-2 transition-colors text-left ${
                        selectedCustomer?.id === c.id ? 'border-blue-500 bg-blue-50' : 'border-gray-200 hover:border-gray-300'
                      }`}
                    >
                      <div className="flex items-center gap-3">
                        <div className="w-10 h-10 rounded-full bg-gradient-to-br from-blue-400 to-blue-600 flex items-center justify-center text-white font-bold">
                          {c.name.charAt(0)}
                        </div>
                        <div>
                          <p className="font-medium text-gray-900 flex items-center gap-2">
                            {c.name} <span className="font-mono text-xs text-blue-600 bg-blue-50 px-2 py-0.5 rounded-full">{c.displayId}</span>
                          </p>
                          <p className="text-sm text-gray-500">{c.phone} • {c.email}</p>
                        </div>
                      </div>
                      <div className="text-right">
                        <span className={`px-2 py-0.5 text-xs font-medium rounded-full ${c.kycStatus === 'verified' || c.kycStatus === 'approved' ? 'bg-green-100 text-green-800' : 'bg-amber-100 text-amber-800'}`}>
                          {c.kycStatus === 'verified' || c.kycStatus === 'approved' ? 'Verified' : c.kycStatus}
                        </span>
                      </div>
                    </button>
                  ))
                ) : (
                  <div className="py-6 text-center text-gray-500 text-sm">
                    No customers found matching &quot;{customerSearch}&quot;
                  </div>
                )}
              </div>
            )}

            <div className="pt-2 border-t border-gray-100">
              <Link href="/dashboard/customers/new" className="flex items-center gap-2 text-sm text-blue-600 hover:underline font-medium">
                <Plus className="w-4 h-4" /> Add new customer
              </Link>
            </div>
          </div>

          {/* Divider */}
          <div className="relative">
            <div className="absolute inset-0 flex items-center">
              <div className="w-full border-t border-gray-300" />
            </div>
            <div className="relative flex justify-center">
              <span className="bg-gray-50 px-3 text-sm text-gray-500">or select from</span>
            </div>
          </div>

          {/* Section 2: Existing Customers */}
          <div className="bg-white rounded-xl border border-gray-200 shadow-sm p-6 space-y-4">
            <h2 className="text-lg font-semibold text-gray-900 flex items-center gap-2">
              <User className="w-5 h-5 text-blue-600" /> Existing Customers
            </h2>
            <p className="text-sm text-gray-500">Customers who previously booked from your business</p>

            {loadingExisting ? (
              <div className="py-6 text-center text-gray-500 text-sm">
                <Loader2 className="w-5 h-5 text-blue-600 animate-spin mx-auto mb-1" />
                Loading your customers...
              </div>
            ) : existingCustomers.length > 0 ? (
              <div className="space-y-2 max-h-72 overflow-y-auto">
                {existingCustomers.map((c: any) => (
                  <button
                    key={c.id}
                    onClick={() => setSelectedCustomer({
                      id: c.id,
                      displayId: c.displayId,
                      name: c.fullName,
                      phone: c.maskedPhone || 'N/A',
                      email: c.maskedEmail || '',
                      kycStatus: c.kycStatus || 'not_submitted',
                      trustScore: c.trustScore || 0,
                      customerType: c.customerType || 'LOCAL',
                    })}
                    className={`w-full flex items-center justify-between p-4 rounded-xl border-2 transition-colors text-left ${
                      selectedCustomer?.id === c.id ? 'border-blue-500 bg-blue-50' : 'border-gray-200 hover:border-gray-300'
                    }`}
                  >
                    <div className="flex items-center gap-3">
                      <div className="w-10 h-10 rounded-full bg-gradient-to-br from-emerald-400 to-emerald-600 flex items-center justify-center text-white font-bold">
                        {(c.fullName || 'C').charAt(0)}
                      </div>
                      <div>
                        <p className="font-medium text-gray-900 flex items-center gap-2">
                          {c.fullName} <span className="font-mono text-xs text-blue-600 bg-blue-50 px-2 py-0.5 rounded-full">{c.displayId}</span>
                        </p>
                        <p className="text-sm text-gray-500">{c.maskedPhone} • {c.maskedEmail}</p>
                        {c.lastBooking && (
                          <p className="text-xs text-gray-400 mt-0.5">
                            Last: {c.lastBooking.itemName || 'Booking'} — {new Date(c.lastBooking.date).toLocaleDateString()} — <span className="font-medium">{c.lastBooking.status}</span>
                          </p>
                        )}
                      </div>
                    </div>
                    <div className="text-right">
                      <span className={`px-2 py-0.5 text-xs font-medium rounded-full ${c.kycStatus === 'verified' || c.kycStatus === 'approved' ? 'bg-green-100 text-green-800' : 'bg-amber-100 text-amber-800'}`}>
                        {c.kycStatus === 'verified' || c.kycStatus === 'approved' ? 'Verified' : c.kycStatus || 'Not verified'}
                      </span>
                    </div>
                  </button>
                ))}
              </div>
            ) : (
              <div className="py-8 text-center text-gray-400 text-sm">
                <User className="w-10 h-10 mx-auto mb-2 text-gray-300" />
                <p className="font-medium text-gray-500">No customers have booked from your business yet.</p>
                <p className="text-xs mt-1">Use the search above to find and select a registered customer.</p>
              </div>
            )}
          </div>
        </div>
      )}

      {/* Step 2: Select Items */}
      {step === 2 && (
        <div className="bg-white rounded-xl border border-gray-200 shadow-sm p-6 space-y-4">
          <h2 className="text-lg font-semibold text-gray-900 flex items-center gap-2">
            <Package className="w-5 h-5 text-blue-600" /> Select Items
          </h2>
          
          {selectedItems.length > 0 && (
            <div className="space-y-2">
              <p className="text-sm font-medium text-gray-700">Selected ({selectedItems.length})</p>
              {selectedItems.map(item => (
                <div key={item.id} className="flex items-center justify-between bg-blue-50 border border-blue-200 rounded-lg p-3">
                  <div>
                    <p className="text-sm font-medium text-gray-900">{item.name}</p>
                    <p className="text-xs text-gray-500">
                      Rate: Rs. {(item.appliedRate || item.dailyRate).toLocaleString()}/day 
                      {item.isForeignRateApplied ? ' (Foreign rate)' : ' (Local rate)'}
                    </p>
                    {item.missingForeignRate && (
                      <p className="text-[10px] text-amber-600 flex items-center gap-1 mt-0.5">
                        <AlertCircle className="w-3 h-3" /> ℹ️ Foreign price not configured for this item. Local price applied.
                      </p>
                    )}
                  </div>
                  <button onClick={() => removeItem(item.id)} className="text-gray-400 hover:text-red-500">
                    <X className="w-4 h-4" />
                  </button>
                </div>
              ))}
            </div>
          )}

          <div className="relative">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400" />
            <input
              type="text"
              placeholder="Search available items..."
              className="pl-9 pr-4 py-2 w-full border border-gray-300 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
              value={itemSearch}
              onChange={e => setItemSearch(e.target.value)}
            />
          </div>

          <div className="space-y-2 max-h-72 overflow-y-auto">
            {filteredItems.map(item => (
              <button key={item.id} onClick={() => addItem(item)}
                className="w-full flex items-center justify-between p-4 rounded-xl border border-gray-200 hover:border-blue-300 hover:bg-blue-50/30 transition-colors text-left">
                <div>
                  <p className="font-medium text-gray-900">{item.name}</p>
                  <p className="text-xs text-gray-500">{item.sku || 'No SKU'}</p>
                </div>
                <div className="text-right">
                  {selectedCustomer?.customerType === 'FOREIGN' && item.foreignDailyRate ? (
                    <>
                      <p className="text-sm font-bold text-gray-900">Rs. {item.foreignDailyRate.toLocaleString()}/day</p>
                      <p className="text-[10px] text-blue-600 font-medium">Foreign Rate</p>
                      <p className="text-xs text-gray-500">Deposit: Rs. {(item.foreignDepositAmount || item.depositAmount).toLocaleString()}</p>
                    </>
                  ) : (
                    <>
                      <p className="text-sm font-bold text-gray-900">Rs. {item.dailyRate.toLocaleString()}/day</p>
                      {selectedCustomer?.customerType === 'FOREIGN' && (
                        <p className="text-[10px] text-amber-600 font-medium">Local Rate (Fallback)</p>
                      )}
                      <p className="text-xs text-gray-500">Deposit: Rs. {item.depositAmount.toLocaleString()}</p>
                    </>
                  )}
                </div>
              </button>
            ))}
          </div>
        </div>
      )}

      {/* Step 3: Dates & Pricing */}
      {step === 3 && (
        <div className="bg-white rounded-xl border border-gray-200 shadow-sm p-6 space-y-4">
          <h2 className="text-lg font-semibold text-gray-900 flex items-center gap-2">
            <Calendar className="w-5 h-5 text-blue-600" /> Rental Dates & Pricing
          </h2>
          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Pickup Date *</label>
              <input type="date" value={dates.pickupDate} onChange={e => setDates(d => ({...d, pickupDate: e.target.value}))}
                className="w-full border border-gray-300 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500" />
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Return Date *</label>
              <input type="date" value={dates.returnDate} onChange={e => setDates(d => ({...d, returnDate: e.target.value}))}
                className="w-full border border-gray-300 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500" />
            </div>
          </div>

          {days > 0 && (
            <div className="bg-gray-50 rounded-lg p-4">
              <p className="text-sm text-gray-600"><span className="font-bold text-gray-900">{days} day{days > 1 ? 's' : ''}</span> rental period</p>
            </div>
          )}

          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Discount (LKR)</label>
              <input type="number" value={pricing.discountAmount} onChange={e => setPricing(p => ({...p, discountAmount: +e.target.value}))}
                className="w-full border border-gray-300 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500" />
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Delivery Charge (LKR)</label>
              <input type="number" value={pricing.deliveryCharge} onChange={e => setPricing(p => ({...p, deliveryCharge: +e.target.value}))}
                className="w-full border border-gray-300 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500" />
            </div>
          </div>

          <div className="border-t border-gray-200 pt-4 space-y-2">
            <div className="flex justify-between text-sm text-gray-600"><span>Subtotal</span><span>Rs. {subtotal.toLocaleString()}</span></div>
            {pricing.deliveryCharge > 0 && <div className="flex justify-between text-sm text-gray-600"><span>Delivery</span><span>Rs. {pricing.deliveryCharge.toLocaleString()}</span></div>}
            {pricing.discountAmount > 0 && <div className="flex justify-between text-sm text-green-600"><span>Discount</span><span>- Rs. {pricing.discountAmount.toLocaleString()}</span></div>}
            <div className="flex justify-between text-base font-bold text-gray-900 pt-2 border-t"><span>Total</span><span>Rs. {totalAmount.toLocaleString()}</span></div>
            <div className="flex justify-between text-sm text-amber-700 font-medium"><span>Advance ({pricing.advancePercent}%)</span><span>Rs. {advanceAmount.toLocaleString()}</span></div>
            <div className="flex justify-between text-sm text-gray-500"><span>Security Deposit</span><span>Rs. {totalDeposit.toLocaleString()}</span></div>
          </div>
        </div>
      )}

      {/* Step 4: Confirm */}
      {step === 4 && (
        <div className="bg-white rounded-xl border border-gray-200 shadow-sm p-6 space-y-4">
          <h2 className="text-lg font-semibold text-gray-900 flex items-center gap-2">
            <Check className="w-5 h-5 text-blue-600" /> Confirm Booking
          </h2>

          {selectedCustomer?.kycStatus !== 'verified' && selectedCustomer?.kycStatus !== 'approved' && (
            <div className="bg-amber-50 border border-amber-200 rounded-lg p-3 flex gap-2 text-sm text-amber-700">
              <AlertCircle className="w-4 h-4 shrink-0 mt-0.5" />
              Customer KYC is not verified. The booking will be saved as "Pending Confirmation" until KYC is complete.
            </div>
          )}

          <div className="space-y-3">
            <div className="flex justify-between py-2 border-b border-gray-100">
              <span className="text-sm text-gray-500">Customer</span>
              <span className="text-sm font-medium">{selectedCustomer?.name} ({selectedCustomer?.displayId})</span>
            </div>
            <div className="flex justify-between py-2 border-b border-gray-100">
              <span className="text-sm text-gray-500">Items</span>
              <span className="text-sm font-medium">{selectedItems.length} item{selectedItems.length !== 1 ? 's' : ''}</span>
            </div>
            <div className="flex justify-between py-2 border-b border-gray-100">
              <span className="text-sm text-gray-500">Period</span>
              <span className="text-sm font-medium">{dates.pickupDate} → {dates.returnDate} ({days} days)</span>
            </div>
            <div className="flex justify-between py-2 border-b border-gray-100">
              <span className="text-sm text-gray-500">Total Amount</span>
              <span className="text-sm font-bold">Rs. {totalAmount.toLocaleString()}</span>
            </div>
          </div>
        </div>
      )}

      {/* Navigation */}
      <div className="flex justify-between">
        <button
          onClick={() => step > 1 ? setStep(s => s - 1) : router.push('/dashboard/bookings')}
          className="flex items-center gap-2 px-4 py-2 border border-gray-300 rounded-lg text-sm font-medium text-gray-700 hover:bg-gray-50"
        >
          <ChevronLeft className="w-4 h-4" /> {step === 1 ? 'Cancel' : 'Back'}
        </button>
        {step < STEPS.length ? (
          <button
            onClick={() => setStep(s => s + 1)}
            disabled={
              (step === 1 && !selectedCustomer) ||
              (step === 2 && selectedItems.length === 0) ||
              (step === 3 && (!dates.pickupDate || !dates.returnDate))
            }
            className="flex items-center gap-2 px-6 py-2 bg-blue-600 text-white rounded-lg text-sm font-medium hover:bg-blue-700 disabled:opacity-50"
          >
            Next <ChevronRight className="w-4 h-4" />
          </button>
        ) : (
          <button
            onClick={handleSubmit}
            disabled={isLoading}
            className="flex items-center gap-2 px-6 py-2 bg-green-600 text-white rounded-lg text-sm font-medium hover:bg-green-700 disabled:opacity-50"
          >
            {isLoading ? 'Creating...' : <><Check className="w-4 h-4" /> Create Booking</>}
          </button>
        )}
      </div>
    </div>
  )
}

export default function NewBookingPage() {
  return (
    <Suspense fallback={<div className="p-8 text-center text-gray-500">Loading...</div>}>
      <NewBookingInner />
    </Suspense>
  )
}
