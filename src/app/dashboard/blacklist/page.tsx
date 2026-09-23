'use client'

import { useState } from 'react'
import Link from 'next/link'
import { ShieldOff, Plus, Search, AlertTriangle, Clock, Ban, ChevronRight } from 'lucide-react'

const SEVERITY_STYLES: Record<string, { label: string; color: string; icon: any }> = {
  warning: { label: 'Warning', color: 'bg-amber-100 text-amber-800', icon: AlertTriangle },
  suspended: { label: 'Suspended', color: 'bg-orange-100 text-orange-800', icon: Clock },
  permanent: { label: 'Banned', color: 'bg-red-100 text-red-800', icon: Ban },
}

const mockBlacklist = [
  { id: '1', customerName: 'Alex Johnson', nic: '8X001234V', reason: 'Returned item with significant damage and refused to pay', severity: 'permanent', addedDate: '2024-09-15', suspendedUntil: null, evidence: 'Photos of damage on file' },
  { id: '2', customerName: 'Sara Lee', nic: '9X112233V', reason: 'Returned item 5 days late without communication', severity: 'warning', addedDate: '2024-10-01', suspendedUntil: null, evidence: null },
  { id: '3', customerName: 'Tom Perera', nic: '0X998877V', reason: 'Fraudulent NIC documents submitted', severity: 'suspended', addedDate: '2024-10-10', suspendedUntil: '2025-01-10', evidence: 'Document scan on file' },
]

export default function BlacklistPage() {
  const [search, setSearch] = useState('')
  const [severityFilter, setSeverityFilter] = useState('all')
  const [showAddModal, setShowAddModal] = useState(false)

  const filtered = mockBlacklist.filter(entry => {
    const matchSearch = entry.customerName.toLowerCase().includes(search.toLowerCase()) || entry.nic.includes(search)
    const matchSeverity = severityFilter === 'all' || entry.severity === severityFilter
    return matchSearch && matchSeverity
  })

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold text-gray-900">Blacklist</h1>
          <p className="text-sm text-gray-500 mt-1">{mockBlacklist.length} entries — customers flagged for issues</p>
        </div>
        <button
          onClick={() => setShowAddModal(true)}
          className="flex items-center gap-2 bg-red-600 text-white px-4 py-2.5 rounded-lg font-medium hover:bg-red-700 transition-colors shadow-sm"
        >
          <Plus className="w-4 h-4" /> Add to Blacklist
        </button>
      </div>

      {/* Warning Banner */}
      <div className="bg-red-50 border border-red-200 rounded-xl p-4 flex gap-3">
        <ShieldOff className="w-5 h-5 text-red-500 shrink-0 mt-0.5" />
        <p className="text-sm text-red-700">
          Blacklisted customers are flagged during booking creation. Permanent bans are shared across all businesses using RentHelper (with consent).
        </p>
      </div>

      {/* Filters */}
      <div className="bg-white rounded-xl border border-gray-200 shadow-sm p-4">
        <div className="flex flex-col sm:flex-row gap-4">
          <div className="relative flex-1">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400" />
            <input
              type="text"
              placeholder="Search by name or NIC..."
              className="pl-9 pr-4 py-2 w-full border border-gray-300 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
              value={search}
              onChange={e => setSearch(e.target.value)}
            />
          </div>
          <select
            className="border border-gray-300 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
            value={severityFilter}
            onChange={e => setSeverityFilter(e.target.value)}
          >
            <option value="all">All Severities</option>
            <option value="warning">Warning</option>
            <option value="suspended">Suspended</option>
            <option value="permanent">Permanent Ban</option>
          </select>
        </div>
      </div>

      {/* Blacklist Entries */}
      <div className="space-y-3">
        {filtered.map(entry => {
          const severity = SEVERITY_STYLES[entry.severity]
          const SeverityIcon = severity.icon
          return (
            <div key={entry.id} className="bg-white rounded-xl border border-gray-200 shadow-sm p-5 flex items-start gap-4">
              <div className={`p-2 rounded-lg ${severity.color}`}>
                <SeverityIcon className="w-5 h-5" />
              </div>
              <div className="flex-1 min-w-0">
                <div className="flex items-center gap-2 flex-wrap">
                  <h3 className="font-semibold text-gray-900">{entry.customerName}</h3>
                  <span className={`px-2 py-0.5 text-xs font-medium rounded-full ${severity.color}`}>
                    {severity.label}
                  </span>
                </div>
                <p className="text-xs text-gray-500 font-mono mt-0.5">NIC: {entry.nic}</p>
                <p className="text-sm text-gray-700 mt-2">{entry.reason}</p>
                {entry.evidence && (
                  <p className="text-xs text-blue-600 mt-1">Evidence: {entry.evidence}</p>
                )}
                <div className="flex flex-wrap gap-4 mt-3 text-xs text-gray-500">
                  <span>Added: {entry.addedDate}</span>
                  {entry.suspendedUntil && <span className="text-orange-600 font-medium">Suspended until: {entry.suspendedUntil}</span>}
                </div>
              </div>
              <button className="text-gray-400 hover:text-blue-600 p-1 shrink-0">
                <ChevronRight className="w-5 h-5" />
              </button>
            </div>
          )
        })}
        {filtered.length === 0 && (
          <div className="py-16 text-center text-gray-500 bg-white rounded-xl border border-gray-200">
            <ShieldOff className="w-12 h-12 mx-auto mb-4 text-gray-300" />
            <p>No blacklist entries found.</p>
          </div>
        )}
      </div>
    </div>
  )
}
