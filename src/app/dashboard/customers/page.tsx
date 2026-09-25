'use client'

import { useState, useEffect, useRef, useCallback } from 'react'
import Link from 'next/link'
import { useRouter } from 'next/navigation'
import { Users, Plus, Search, Phone, Mail, Star, Eye, Calendar, Loader2, AlertTriangle, CheckCircle, Clock, XCircle, ChevronRight } from 'lucide-react'

interface CustomerItem {
  id: string
  displayId: string
  fullName: string
  email: string
  primaryContactNumber: string
  city: string
  kycStatus: string
  accountStatus: string
  trustScore: number
  totalBookings: number
  blacklistStatus: string
  blacklistReason?: string | null
  createdAt: string
}

const KYC_BADGE: Record<string, { label: string; color: string }> = {
  verified: { label: 'Verified ✓', color: 'bg-green-100 text-green-800' },
  approved: { label: 'Verified ✓', color: 'bg-green-100 text-green-800' },
  pending: { label: 'Pending Review', color: 'bg-amber-100 text-amber-800' },
  rejected: { label: 'Rejected', color: 'bg-red-100 text-red-800' },
  needs_more_info: { label: 'Needs Info', color: 'bg-blue-100 text-blue-800' },
  not_submitted: { label: 'Not Submitted', color: 'bg-gray-100 text-gray-700' },
}

function TrustStars({ score }: { score: number }) {
  if (!score || score === 0) return <span className="text-xs text-gray-400">No ratings</span>
  return (
    <div className="flex items-center gap-1">
      <Star className="w-3.5 h-3.5 fill-amber-400 text-amber-400" />
      <span className="text-sm font-medium">{score.toFixed(1)}</span>
    </div>
  )
}

export default function CustomersPage() {
  const router = useRouter()
  const [customers, setCustomers] = useState<CustomerItem[]>([])
  const [totalCount, setTotalCount] = useState(0)
  const [isLoading, setIsLoading] = useState(true)
  const [kycFilter, setKycFilter] = useState('all')

  // Search & Autocomplete State
  const [search, setSearch] = useState('')
  const [suggestions, setSuggestions] = useState<CustomerItem[]>([])
  const [isSearching, setIsSearching] = useState(false)
  const [dropdownOpen, setDropdownOpen] = useState(false)
  const [selectedIndex, setSelectedIndex] = useState(-1)
  const searchContainerRef = useRef<HTMLDivElement>(null)

  const fetchCustomers = useCallback(async () => {
    setIsLoading(true)
    try {
      const params = new URLSearchParams()
      if (search) params.set('q', search)
      if (kycFilter !== 'all') params.set('kycStatus', kycFilter)

      const res = await fetch(`/api/provider/customers?${params}`)
      if (res.ok) {
        const data = await res.json()
        setCustomers(data.customers || [])
        setTotalCount(data.total || data.customers?.length || 0)
      }
    } catch (error) {
      console.error('Failed to fetch customers:', error)
    } finally {
      setIsLoading(false)
    }
  }, [search, kycFilter])

  useEffect(() => {
    fetchCustomers()
  }, [fetchCustomers])

  // Autocomplete debounced search
  useEffect(() => {
    if (!search.trim()) {
      setSuggestions([])
      setDropdownOpen(false)
      return
    }

    const timer = setTimeout(async () => {
      setIsSearching(true)
      try {
        const res = await fetch(`/api/provider/customers/search?q=${encodeURIComponent(search.trim())}`)
        if (res.ok) {
          const data = await res.json()
          setSuggestions(data.customers || [])
          setDropdownOpen(true)
          setSelectedIndex(-1)
        }
      } catch (err) {
        console.error(err)
      } finally {
        setIsSearching(false)
      }
    }, 300)

    return () => clearTimeout(timer)
  }, [search])

  // Outside click handler to close autocomplete dropdown
  useEffect(() => {
    const handleClickOutside = (e: MouseEvent) => {
      if (searchContainerRef.current && !searchContainerRef.current.contains(e.target as Node)) {
        setDropdownOpen(false)
      }
    }
    document.addEventListener('mousedown', handleClickOutside)
    return () => document.removeEventListener('mousedown', handleClickOutside)
  }, [])

  // Keyboard navigation for dropdown
  const handleKeyDown = (e: React.KeyboardEvent<HTMLInputElement>) => {
    if (!dropdownOpen || suggestions.length === 0) return

    if (e.key === 'ArrowDown') {
      e.preventDefault()
      setSelectedIndex(prev => (prev < suggestions.length - 1 ? prev + 1 : 0))
    } else if (e.key === 'ArrowUp') {
      e.preventDefault()
      setSelectedIndex(prev => (prev > 0 ? prev - 1 : suggestions.length - 1))
    } else if (e.key === 'Enter') {
      e.preventDefault()
      if (selectedIndex >= 0 && selectedIndex < suggestions.length) {
        const selected = suggestions[selectedIndex]
        router.push(`/dashboard/customers/${selected.id}`)
        setDropdownOpen(false)
      }
    } else if (e.key === 'Escape') {
      setDropdownOpen(false)
    }
  }

  // Summary Card Statistics
  const verifiedCount = customers.filter(c => c.kycStatus === 'verified' || c.kycStatus === 'approved').length
  const pendingCount = customers.filter(c => c.kycStatus === 'pending').length
  const needsActionCount = customers.filter(c => 
    c.kycStatus === 'rejected' || c.kycStatus === 'needs_more_info' || c.kycStatus === 'not_submitted' || c.accountStatus === 'suspended'
  ).length

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold text-gray-900">Customers Directory</h1>
          <p className="text-sm text-gray-500 mt-1">{totalCount} registered customers discoverable</p>
        </div>
        <Link
          href="/dashboard/customers/new"
          className="flex items-center gap-2 bg-blue-600 text-white px-4 py-2.5 rounded-lg font-medium hover:bg-blue-700 transition-colors shadow-sm"
        >
          <Plus className="w-4 h-4" /> Add Customer
        </Link>
      </div>

      {/* Summary Cards */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
        {[
          { label: 'Total', value: totalCount, color: 'text-gray-900', bg: 'bg-white' },
          { label: 'Verified', value: verifiedCount, color: 'text-green-700', bg: 'bg-green-50' },
          { label: 'Pending KYC', value: pendingCount, color: 'text-amber-700', bg: 'bg-amber-50' },
          { label: 'Needs Action', value: needsActionCount, color: 'text-red-700', bg: 'bg-red-50' },
        ].map(stat => (
          <div key={stat.label} className={`${stat.bg} rounded-xl border border-gray-200 shadow-sm p-4`}>
            <p className="text-sm text-gray-500">{stat.label}</p>
            <p className={`text-2xl font-bold mt-1 ${stat.color}`}>{stat.value}</p>
          </div>
        ))}
      </div>

      {/* Search Bar & Autocomplete */}
      <div className="bg-white rounded-xl border border-gray-200 shadow-sm p-4">
        <div className="flex flex-col sm:flex-row gap-4">
          <div className="relative flex-1" ref={searchContainerRef}>
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400" />
            <input
              type="text"
              placeholder="Search by ID, name, email, or phone..."
              className="pl-9 pr-9 py-2.5 w-full border border-gray-300 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
              value={search}
              onChange={e => setSearch(e.target.value)}
              onKeyDown={handleKeyDown}
              onFocus={() => { if (suggestions.length > 0) setDropdownOpen(true) }}
            />
            {isSearching && (
              <Loader2 className="absolute right-3 top-1/2 -translate-y-1/2 w-4 h-4 text-blue-600 animate-spin" />
            )}

            {/* Autocomplete Dropdown */}
            {dropdownOpen && suggestions.length > 0 && (
              <div className="absolute left-0 right-0 top-full mt-1 bg-white rounded-xl shadow-xl border border-gray-200 z-50 overflow-hidden max-h-80 overflow-y-auto">
                <div className="p-2 text-xs font-semibold text-gray-400 uppercase border-b border-gray-100">
                  Search Suggestions ({suggestions.length})
                </div>
                {suggestions.map((item, idx) => (
                  <button
                    key={item.id}
                    onClick={() => {
                      router.push(`/dashboard/customers/${item.id}`)
                      setDropdownOpen(false)
                    }}
                    onMouseEnter={() => setSelectedIndex(idx)}
                    className={`w-full text-left px-4 py-3 flex items-center justify-between transition ${
                      selectedIndex === idx ? 'bg-blue-50' : 'hover:bg-gray-50'
                    }`}
                  >
                    <div className="flex items-center gap-3">
                      <div className="w-8 h-8 rounded-full bg-blue-100 text-blue-700 font-bold flex items-center justify-center text-xs">
                        {item.fullName.charAt(0)}
                      </div>
                      <div>
                        <p className="font-semibold text-gray-900 text-sm flex items-center gap-2">
                          {item.fullName}
                          <span className="font-mono text-xs text-blue-600 bg-blue-50 px-2 py-0.5 rounded-full">{item.displayId}</span>
                        </p>
                        <p className="text-xs text-gray-500">{item.email} • {item.primaryContactNumber}</p>
                      </div>
                    </div>
                    <ChevronRight className="w-4 h-4 text-gray-400" />
                  </button>
                ))}
              </div>
            )}
          </div>

          <select
            className="border border-gray-300 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
            value={kycFilter}
            onChange={e => setKycFilter(e.target.value)}
          >
            <option value="all">All KYC Status</option>
            <option value="verified">Verified</option>
            <option value="pending">Pending Review</option>
            <option value="needs_more_info">Needs More Info</option>
            <option value="rejected">Rejected</option>
            <option value="not_submitted">Not Submitted</option>
          </select>
        </div>
      </div>

      {/* Customers Table */}
      <div className="bg-white rounded-xl border border-gray-200 shadow-sm overflow-hidden">
        {isLoading ? (
          <div className="p-12 text-center text-gray-500">
            <Loader2 className="w-8 h-8 text-blue-600 animate-spin mx-auto mb-2" />
            Loading discoverable customer directory...
          </div>
        ) : (
          <table className="w-full">
            <thead className="bg-gray-50 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
              <tr>
                <th className="px-6 py-3">Customer</th>
                <th className="px-6 py-3">Contact</th>
                <th className="px-6 py-3">Customer ID</th>
                <th className="px-6 py-3">KYC Status</th>
                <th className="px-6 py-3">Trust Score</th>
                <th className="px-6 py-3">Bookings</th>
                <th className="px-6 py-3 text-right">Actions</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-100 text-sm">
              {customers.map(customer => {
                const badge = KYC_BADGE[customer.kycStatus] || KYC_BADGE.not_submitted
                const isBlacklisted = customer.blacklistStatus !== 'NONE'

                return (
                  <tr key={customer.id} className="hover:bg-gray-50">
                    <td className="px-6 py-4">
                      <div className="flex items-center gap-3">
                        <div className="w-9 h-9 rounded-full bg-gradient-to-br from-blue-500 to-indigo-600 flex items-center justify-center text-white font-semibold text-sm shadow-sm">
                          {(customer.fullName || 'C').charAt(0)}
                        </div>
                        <div>
                          <p className="font-semibold text-gray-900 flex items-center gap-1.5">
                            {customer.fullName}
                            {isBlacklisted && (
                              <span className="text-[10px] font-bold px-1.5 py-0.5 rounded bg-red-100 text-red-700" title={customer.blacklistReason || 'Warning'}>
                                {customer.blacklistStatus}
                              </span>
                            )}
                          </p>
                          <p className="text-xs text-gray-500">{customer.email}</p>
                        </div>
                      </div>
                    </td>
                    <td className="px-6 py-4">
                      <div className="space-y-0.5">
                        <p className="text-gray-700 font-medium flex items-center gap-1"><Phone className="w-3 h-3 text-gray-400" /> {customer.primaryContactNumber}</p>
                        <p className="text-gray-500 text-xs">{customer.city}</p>
                      </div>
                    </td>
                    <td className="px-6 py-4 font-mono text-xs font-semibold text-blue-700">{customer.displayId}</td>
                    <td className="px-6 py-4">
                      <span className={`px-2.5 py-1 text-xs font-medium rounded-full ${badge.color}`}>
                        {badge.label}
                      </span>
                    </td>
                    <td className="px-6 py-4">
                      <TrustStars score={customer.trustScore} />
                    </td>
                    <td className="px-6 py-4 text-gray-600 font-medium">{customer.totalBookings}</td>
                    <td className="px-6 py-4 text-right">
                      <div className="flex justify-end items-center gap-2">
                        <Link
                          href={`/dashboard/customers/${customer.id}`}
                          className="px-2.5 py-1.5 rounded-lg text-gray-600 hover:text-blue-600 hover:bg-blue-50 text-xs font-medium transition flex items-center gap-1"
                        >
                          <Eye className="w-3.5 h-3.5" /> View
                        </Link>
                        <Link
                          href={`/dashboard/bookings/new?customerId=${customer.id}`}
                          className="px-3 py-1.5 rounded-lg bg-blue-600 text-white hover:bg-blue-700 text-xs font-semibold transition flex items-center gap-1 shadow-sm"
                        >
                          <Calendar className="w-3.5 h-3.5" /> Create Booking
                        </Link>
                      </div>
                    </td>
                  </tr>
                )
              })}
            </tbody>
          </table>
        )}

        {!isLoading && customers.length === 0 && (
          <div className="py-16 text-center text-gray-500">
            <Users className="w-12 h-12 mx-auto mb-4 text-gray-300" />
            <p className="text-base font-semibold text-gray-700">No customers found</p>
            <p className="text-xs text-gray-400 mt-1">Try broadening your search query or KYC status filter.</p>
          </div>
        )}
      </div>
    </div>
  )
}
