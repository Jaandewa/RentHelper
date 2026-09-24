'use client'

import { useState, useEffect } from 'react'
import Link from 'next/link'
import { Users, Plus, Search, Phone, Mail, Star, ShieldCheck, ShieldAlert, Filter, Eye, Edit2, MoreVertical, Loader2 } from 'lucide-react'

const KYC_BADGE: Record<string, { label: string; color: string }> = {
  verified: { label: 'Verified', color: 'bg-green-100 text-green-800' },
  pending: { label: 'Pending', color: 'bg-amber-100 text-amber-800' },
  rejected: { label: 'Rejected', color: 'bg-red-100 text-red-800' },
  needs_more_info: { label: 'More Info', color: 'bg-blue-100 text-blue-800' },
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
  const [search, setSearch] = useState('')
  const [kycFilter, setKycFilter] = useState('all')
  const [customers, setCustomers] = useState<any[]>([])
  const [isLoading, setIsLoading] = useState(true)

  useEffect(() => {
    setIsLoading(true)
    fetch('/api/customers')
      .then(res => res.json())
      .then(data => {
        if (Array.isArray(data)) {
          setCustomers(data)
        }
      })
      .catch(console.error)
      .finally(() => setIsLoading(false))
  }, [])

  const filtered = customers.filter(c => {
    const matchSearch = (c.user?.name || '').toLowerCase().includes(search.toLowerCase()) ||
      (c.user?.email || '').toLowerCase().includes(search.toLowerCase())
    const matchKyc = kycFilter === 'all' || c.kycStatus === kycFilter
    return matchSearch && matchKyc
  })

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold text-gray-900">Customers</h1>
          <p className="text-sm text-gray-500 mt-1">{customers.length} registered customers</p>
        </div>
        <Link
          href="/dashboard/customers/new"
          className="flex items-center gap-2 bg-blue-600 text-white px-4 py-2.5 rounded-lg font-medium hover:bg-blue-700 transition-colors shadow-sm"
        >
          <Plus className="w-4 h-4" /> Add Customer
        </Link>
      </div>

      {/* KYC Summary */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
        {[
          { label: 'Total', value: customers.length, color: 'text-gray-900', bg: 'bg-white' },
          { label: 'Verified', value: customers.filter(c => c.kycStatus === 'verified').length, color: 'text-green-700', bg: 'bg-green-50' },
          { label: 'Pending KYC', value: customers.filter(c => c.kycStatus === 'pending').length, color: 'text-amber-700', bg: 'bg-amber-50' },
          { label: 'Needs Action', value: customers.filter(c => c.kycStatus === 'needs_more_info' || c.kycStatus === 'rejected').length, color: 'text-red-700', bg: 'bg-red-50' },
        ].map(stat => (
          <div key={stat.label} className={`${stat.bg} rounded-xl border border-gray-200 shadow-sm p-4`}>
            <p className="text-sm text-gray-500">{stat.label}</p>
            <p className={`text-2xl font-bold mt-1 ${stat.color}`}>{stat.value}</p>
          </div>
        ))}
      </div>

      {/* Filters */}
      <div className="bg-white rounded-xl border border-gray-200 shadow-sm p-4">
        <div className="flex flex-col sm:flex-row gap-4">
          <div className="relative flex-1">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400" />
            <input
              type="text"
              placeholder="Search by name, email or phone..."
              className="pl-9 pr-4 py-2 w-full border border-gray-300 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
              value={search}
              onChange={e => setSearch(e.target.value)}
            />
          </div>
          <select
            className="border border-gray-300 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
            value={kycFilter}
            onChange={e => setKycFilter(e.target.value)}
          >
            <option value="all">All KYC Status</option>
            <option value="verified">Verified</option>
            <option value="pending">Pending</option>
            <option value="needs_more_info">Needs More Info</option>
            <option value="rejected">Rejected</option>
          </select>
        </div>
      </div>

      {/* Customers Table */}
      <div className="bg-white rounded-xl border border-gray-200 shadow-sm overflow-hidden">
        <table className="w-full">
          <thead className="bg-gray-50 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
            <tr>
              <th className="px-6 py-3">Customer</th>
              <th className="px-6 py-3">Contact</th>
              <th className="px-6 py-3">NIC</th>
              <th className="px-6 py-3">KYC Status</th>
              <th className="px-6 py-3">Trust Score</th>
              <th className="px-6 py-3">Bookings</th>
              <th className="px-6 py-3 text-right">Actions</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-gray-100 text-sm">
            {filtered.map(customer => (
              <tr key={customer.id} className="hover:bg-gray-50">
                <td className="px-6 py-4">
                  <div className="flex items-center gap-3">
                    <div className="w-9 h-9 rounded-full bg-gradient-to-br from-blue-400 to-blue-600 flex items-center justify-center text-white font-semibold text-sm">
                      {(customer.user?.name || 'U').charAt(0)}
                    </div>
                    <div>
                      <p className="font-medium text-gray-900">{customer.user?.name || 'Unknown User'}</p>
                      <p className="text-xs text-gray-500">{customer.city || 'No city'}</p>
                    </div>
                  </div>
                </td>
                <td className="px-6 py-4">
                  <div className="space-y-0.5">
                    <p className="text-gray-600 flex items-center gap-1"><Phone className="w-3 h-3" /> {customer.emergencyPhone || 'No phone'}</p>
                    <p className="text-gray-500 text-xs flex items-center gap-1"><Mail className="w-3 h-3" /> {customer.user?.email}</p>
                  </div>
                </td>
                <td className="px-6 py-4 text-gray-600 font-mono text-xs">{customer.nicNumber || 'N/A'}</td>
                <td className="px-6 py-4">
                  <span className={`px-2.5 py-1 text-xs font-medium rounded-full ${KYC_BADGE[customer.kycStatus].color}`}>
                    {KYC_BADGE[customer.kycStatus].label}
                  </span>
                </td>
                <td className="px-6 py-4">
                  <TrustStars score={customer.trustScore} />
                </td>
                <td className="px-6 py-4 text-gray-600">{customer.totalBookings}</td>
                <td className="px-6 py-4 text-right">
                  <div className="flex justify-end gap-1">
                    <Link href={`/dashboard/customers/${customer.id}`} className="p-1.5 rounded-lg text-gray-400 hover:text-blue-600 hover:bg-blue-50">
                      <Eye className="w-4 h-4" />
                    </Link>
                    <Link href={`/dashboard/customers/${customer.id}/edit`} className="p-1.5 rounded-lg text-gray-400 hover:text-amber-600 hover:bg-amber-50">
                      <Edit2 className="w-4 h-4" />
                    </Link>
                  </div>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
        {filtered.length === 0 && (
          <div className="py-16 text-center text-gray-500">
            <Users className="w-12 h-12 mx-auto mb-4 text-gray-300" />
            <p>No customers found.</p>
          </div>
        )}
      </div>
    </div>
  )
}
