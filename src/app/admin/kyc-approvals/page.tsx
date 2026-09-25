'use client'

import { useEffect, useState, useCallback, Suspense } from 'react'
import Link from 'next/link'
import { Search, CheckCircle, XCircle, Eye, Shield, Clock, AlertCircle } from 'lucide-react'

interface CustomerKycItem {
  id: string
  nicNumber: string | null
  phone: string | null
  city: string | null
  kycStatus: string
  updatedAt: string
  createdAt: string
  user: { id: string; name: string; email: string; status: string }
  customerDocuments: Array<{ id: string; type: string; url: string; fileName: string }>
}

function KycApprovalsInner() {
  const [customers, setCustomers] = useState<CustomerKycItem[]>([])
  const [total, setTotal] = useState(0)
  const [loading, setLoading] = useState(true)
  const [search, setSearch] = useState('')
  const [page, setPage] = useState(1)
  const limit = 15

  const fetchPendingKyc = useCallback(async () => {
    setLoading(true)
    const params = new URLSearchParams()
    if (search) params.set('search', search)
    params.set('page', String(page))
    params.set('limit', String(limit))

    const res = await fetch(`/api/admin/kyc/pending?${params}`)
    if (res.ok) {
      const data = await res.json()
      setCustomers(data.customers || [])
      setTotal(data.total || 0)
    }
    setLoading(false)
  }, [search, page])

  useEffect(() => {
    fetchPendingKyc()
  }, [fetchPendingKyc])

  const quickApprove = async (id: string) => {
    if (!confirm('Are you sure you want to approve this customer KYC?')) return
    const res = await fetch('/api/admin/kyc/approve', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ customerId: id, adminNote: 'Quick approved from queue' }),
    })
    if (res.ok) {
      fetchPendingKyc()
    } else {
      alert('Failed to approve customer')
    }
  }

  const statusBadge = (status: string) => {
    switch (status.toLowerCase()) {
      case 'verified':
      case 'approved':
        return <span className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-xs font-medium bg-green-100 text-green-800"><CheckCircle className="w-3 h-3" /> Verified</span>
      case 'rejected':
        return <span className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-xs font-medium bg-red-100 text-red-800"><XCircle className="w-3 h-3" /> Rejected</span>
      case 'needs_more_info':
      case 'more_information_required':
        return <span className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-xs font-medium bg-blue-100 text-blue-800"><AlertCircle className="w-3 h-3" /> Needs Info</span>
      default:
        return <span className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-xs font-medium bg-amber-100 text-amber-800"><Clock className="w-3 h-3" /> Pending Review</span>
    }
  }

  return (
    <div className="space-y-6">
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold text-gray-900 flex items-center gap-2">
            <Shield className="w-7 h-7 text-blue-600" /> KYC Approvals Queue
          </h1>
          <p className="text-gray-500 text-sm mt-1">Review pending customer identity verification submissions</p>
        </div>
        <div className="bg-amber-50 border border-amber-200 rounded-lg px-4 py-2 text-amber-800 text-sm font-medium">
          {total} Pending Approval{total !== 1 ? 's' : ''}
        </div>
      </div>

      {/* Toolbar */}
      <div className="bg-white p-4 rounded-xl border border-gray-200 shadow-sm flex flex-col md:flex-row gap-4 justify-between items-center">
        <div className="relative w-full md:w-80">
          <Search className="absolute left-3 top-2.5 text-gray-400 w-4 h-4" />
          <input
            type="text"
            placeholder="Search by name, email, NIC, phone..."
            value={search}
            onChange={e => { setSearch(e.target.value); setPage(1) }}
            className="w-full pl-9 pr-4 py-2 border border-gray-300 rounded-lg text-sm focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
          />
        </div>
      </div>

      {/* Table */}
      <div className="bg-white rounded-xl border border-gray-200 shadow-sm overflow-hidden">
        {loading ? (
          <div className="p-12 text-center text-gray-500">
            <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600 mx-auto mb-2"></div>
            Loading pending KYC submissions...
          </div>
        ) : customers.length === 0 ? (
          <div className="p-12 text-center text-gray-500">
            <Shield className="w-12 h-12 text-gray-300 mx-auto mb-3" />
            <p className="text-lg font-medium text-gray-700">No pending KYC approvals</p>
            <p className="text-sm text-gray-400 mt-1">All submitted customer verifications have been processed.</p>
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-left text-sm text-gray-600">
              <thead className="bg-gray-50 text-gray-700 uppercase font-semibold text-xs border-b border-gray-200">
                <tr>
                  <th className="px-6 py-3.5">Customer Name</th>
                  <th className="px-6 py-3.5">Email</th>
                  <th className="px-6 py-3.5">Phone Number</th>
                  <th className="px-6 py-3.5">City</th>
                  <th className="px-6 py-3.5">NIC / Document</th>
                  <th className="px-6 py-3.5">Docs Uploaded</th>
                  <th className="px-6 py-3.5">Submission Time</th>
                  <th className="px-6 py-3.5">Status</th>
                  <th className="px-6 py-3.5 text-right">Actions</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-100">
                {customers.map(c => (
                  <tr key={c.id} className="hover:bg-gray-50 transition-colors">
                    <td className="px-6 py-4 font-semibold text-gray-900">{c.user?.name || 'N/A'}</td>
                    <td className="px-6 py-4 text-gray-600">{c.user?.email}</td>
                    <td className="px-6 py-4">{c.phone || 'N/A'}</td>
                    <td className="px-6 py-4">{c.city || 'N/A'}</td>
                    <td className="px-6 py-4 font-mono text-xs">{c.nicNumber || 'N/A'}</td>
                    <td className="px-6 py-4">
                      <span className="inline-flex items-center px-2 py-0.5 rounded text-xs font-medium bg-blue-50 text-blue-700">
                        {c.customerDocuments.length} files
                      </span>
                    </td>
                    <td className="px-6 py-4 text-xs text-gray-500">
                      {new Date(c.updatedAt || c.createdAt).toLocaleString()}
                    </td>
                    <td className="px-6 py-4">{statusBadge(c.kycStatus)}</td>
                    <td className="px-6 py-4 text-right space-x-2">
                      <Link
                        href={`/admin/kyc-approvals/${c.id}`}
                        className="inline-flex items-center gap-1 px-3 py-1.5 bg-blue-600 text-white rounded-lg text-xs font-medium hover:bg-blue-700 transition"
                      >
                        <Eye className="w-3.5 h-3.5" /> Review Details
                      </Link>
                      <button
                        onClick={() => quickApprove(c.id)}
                        className="inline-flex items-center gap-1 px-3 py-1.5 bg-green-600 text-white rounded-lg text-xs font-medium hover:bg-green-700 transition"
                      >
                        <CheckCircle className="w-3.5 h-3.5" /> Quick Approve
                      </button>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>
    </div>
  )
}

export default function KycApprovalsPage() {
  return (
    <Suspense fallback={<div className="p-8 text-center text-gray-500">Loading...</div>}>
      <KycApprovalsInner />
    </Suspense>
  )
}
