'use client'

import { useEffect, useState, useCallback, Suspense } from 'react'
import { useSearchParams } from 'next/navigation'
import Link from 'next/link'
import { Search, CheckCircle, XCircle, Eye, Shield } from 'lucide-react'

interface Customer {
  id: string
  nicNumber: string | null
  kycStatus: string
  trustScore: number
  totalBookings: number
  createdAt: string
  user: { id: string; name: string; email: string; status: string }
  _count: { bookings: number }
}

const KYC_FILTERS = ['all', 'pending', 'verified', 'rejected', 'needs_more_info']

function CustomersInner() {
  const searchParams = useSearchParams()
  const [customers, setCustomers] = useState<Customer[]>([])
  const [total, setTotal] = useState(0)
  const [loading, setLoading] = useState(true)
  const [search, setSearch] = useState('')
  const [activeFilter, setActiveFilter] = useState(searchParams.get('kycStatus') || 'all')
  const [page, setPage] = useState(1)
  const limit = 15

  const fetchCustomers = useCallback(async () => {
    setLoading(true)
    const params = new URLSearchParams()
    if (activeFilter !== 'all') params.set('kycStatus', activeFilter)
    if (search) params.set('search', search)
    params.set('page', String(page))
    params.set('limit', String(limit))

    const res = await fetch(`/api/admin/customers?${params}`)
    if (!res.ok) {
      setLoading(false)
      return
    }
    const data = await res.json()
    setCustomers(data.customers || [])
    setTotal(data.total || 0)
    setLoading(false)
  }, [activeFilter, search, page])

  useEffect(() => { fetchCustomers() }, [fetchCustomers])

  const quickKyc = async (id: string, kycStatus: string) => {
    await fetch(`/api/admin/customers/${id}`, {
      method: 'PATCH',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ kycStatus }),
    })
    fetchCustomers()
  }

  const fmt = (d: string) => new Date(d).toLocaleDateString('en-GB', { day: '2-digit', month: 'short', year: 'numeric' })
  const totalPages = Math.ceil(total / limit)

  return (
    <>
      <div className="admin-page-header">
        <h1 className="admin-page-title">Customers</h1>
        <p className="admin-page-subtitle">Manage rent-seeking customers and KYC verification</p>
      </div>

      <div className="admin-table-wrapper">
        <div className="admin-table-toolbar">
          <div className="admin-search">
            <Search size={14} />
            <input
              placeholder="Search name, email, NIC..."
              value={search}
              onChange={e => { setSearch(e.target.value); setPage(1) }}
            />
          </div>
          <div style={{ display: 'flex', gap: '6px', flexWrap: 'wrap' }}>
            {KYC_FILTERS.map(f => (
              <button
                key={f}
                className={`admin-filter-btn ${activeFilter === f ? 'admin-filter-btn--active' : ''}`}
                onClick={() => { setActiveFilter(f); setPage(1) }}
              >
                {f === 'needs_more_info' ? 'Needs Info' : f.charAt(0).toUpperCase() + f.slice(1)}
              </button>
            ))}
          </div>
          <span style={{ marginLeft: 'auto', fontSize: '13px', color: '#64748b' }}>{total} total</span>
        </div>

        {loading ? (
          <div style={{ padding: '60px', textAlign: 'center', color: '#475569' }}>Loading...</div>
        ) : customers.length === 0 ? (
          <div className="admin-empty">
            <div className="admin-empty-icon">👤</div>
            <p>No customers found</p>
          </div>
        ) : (
          <div style={{ overflowX: 'auto' }}>
            <table className="admin-table">
              <thead>
                <tr>
                  <th>Customer</th>
                  <th>NIC</th>
                  <th>KYC Status</th>
                  <th>Trust Score</th>
                  <th>Bookings</th>
                  <th>Account</th>
                  <th>Joined</th>
                  <th>Actions</th>
                </tr>
              </thead>
              <tbody>
                {customers.map(c => (
                  <tr key={c.id}>
                    <td>
                      <div className="admin-user-cell">
                        <div className="admin-avatar" style={{ background: 'linear-gradient(135deg, #8B5CF6, #6366F1)' }}>
                          {c.user.name?.[0]?.toUpperCase() || 'C'}
                        </div>
                        <div>
                          <p className="admin-user-cell__name">{c.user.name}</p>
                          <p className="admin-user-cell__email">{c.user.email}</p>
                        </div>
                      </div>
                    </td>
                    <td style={{ color: '#94a3b8', fontSize: '13px' }}>{c.nicNumber || '—'}</td>
                    <td><span className={`admin-badge admin-badge--${c.kycStatus}`}>{c.kycStatus}</span></td>
                    <td>
                      <div style={{ display: 'flex', alignItems: 'center', gap: '6px' }}>
                        <Shield size={13} color={c.trustScore > 7 ? '#34d399' : c.trustScore > 4 ? '#fbbf24' : '#f87171'} />
                        <span style={{ fontSize: '13px', color: '#cbd5e1' }}>{c.trustScore.toFixed(1)}</span>
                      </div>
                    </td>
                    <td style={{ color: '#94a3b8', textAlign: 'center' }}>{c._count.bookings}</td>
                    <td><span className={`admin-badge admin-badge--${c.user.status}`}>{c.user.status}</span></td>
                    <td style={{ color: '#64748b', fontSize: '12px' }}>{fmt(c.createdAt)}</td>
                    <td>
                      <div style={{ display: 'flex', gap: '6px' }}>
                        <Link href={`/admin/customers/${c.id}`} className="admin-btn admin-btn--ghost admin-btn--sm">
                          <Eye size={13} />
                        </Link>
                        {c.kycStatus === 'pending' && (
                          <>
                            <button className="admin-btn admin-btn--success admin-btn--sm" onClick={() => quickKyc(c.id, 'verified')} title="Verify KYC">
                              <CheckCircle size={13} />
                            </button>
                            <button className="admin-btn admin-btn--danger admin-btn--sm" onClick={() => quickKyc(c.id, 'rejected')} title="Reject KYC">
                              <XCircle size={13} />
                            </button>
                          </>
                        )}
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}

        {totalPages > 1 && (
          <div className="admin-pagination">
            <span>Showing {(page - 1) * limit + 1}–{Math.min(page * limit, total)} of {total}</span>
            <div className="admin-pagination__btns">
              <button className="admin-pagination__btn" onClick={() => setPage(p => p - 1)} disabled={page === 1}>← Prev</button>
              <button className="admin-pagination__btn" onClick={() => setPage(p => p + 1)} disabled={page === totalPages}>Next →</button>
            </div>
          </div>
        )}
      </div>
    </>
  )
}

export default function CustomersPage() {
  return (
    <Suspense fallback={<div style={{ padding: '60px', textAlign: 'center', color: '#475569' }}>Loading...</div>}>
      <CustomersInner />
    </Suspense>
  )
}
