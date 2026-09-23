'use client'

import { useEffect, useState, useCallback, Suspense } from 'react'
import { useSearchParams } from 'next/navigation'
import Link from 'next/link'
import { Search, Eye, CheckCircle, XCircle, Pause } from 'lucide-react'

interface Provider {
  id: string
  name: string
  slug: string
  phone: string | null
  city: string | null
  approvalStatus: string
  createdAt: string
  user: { id: string; name: string; email: string; status: string }
  subscription: { status: string; planName: string; trialEndsAt: string | null } | null
  _count: { items: number; bookings: number }
}

const STATUS_FILTERS = ['all', 'pending', 'approved', 'rejected', 'suspended']

function ProvidersInner() {
  const searchParams = useSearchParams()
  const [providers, setProviders] = useState<Provider[]>([])
  const [total, setTotal] = useState(0)
  const [loading, setLoading] = useState(true)
  const [search, setSearch] = useState('')
  const [activeFilter, setActiveFilter] = useState(searchParams.get('approvalStatus') || 'all')
  const [page, setPage] = useState(1)
  const limit = 15

  const fetchProviders = useCallback(async () => {
    setLoading(true)
    const params = new URLSearchParams()
    if (activeFilter !== 'all') params.set('approvalStatus', activeFilter)
    if (search) params.set('search', search)
    params.set('page', String(page))
    params.set('limit', String(limit))

    const res = await fetch(`/api/admin/providers?${params}`)
    if (!res.ok) {
      setLoading(false)
      return
    }
    const data = await res.json()
    setProviders(data.businesses || [])
    setTotal(data.total || 0)
    setLoading(false)
  }, [activeFilter, search, page])

  useEffect(() => { fetchProviders() }, [fetchProviders])

  const quickAction = async (id: string, approvalStatus: string) => {
    await fetch(`/api/admin/providers/${id}`, {
      method: 'PATCH',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ approvalStatus }),
    })
    fetchProviders()
  }

  const formatDate = (d: string) => new Date(d).toLocaleDateString('en-GB', { day: '2-digit', month: 'short', year: 'numeric' })
  const totalPages = Math.ceil(total / limit)

  return (
    <>
      <div className="admin-page-header">
        <h1 className="admin-page-title">Providers</h1>
        <p className="admin-page-subtitle">Manage all rent provider accounts and approvals</p>
      </div>

      <div className="admin-table-wrapper">
        <div className="admin-table-toolbar">
          <div className="admin-search">
            <Search size={14} />
            <input
              placeholder="Search by name, email..."
              value={search}
              onChange={e => { setSearch(e.target.value); setPage(1) }}
            />
          </div>
          <div style={{ display: 'flex', gap: '6px', flexWrap: 'wrap' }}>
            {STATUS_FILTERS.map(f => (
              <button
                key={f}
                className={`admin-filter-btn ${activeFilter === f ? 'admin-filter-btn--active' : ''}`}
                onClick={() => { setActiveFilter(f); setPage(1) }}
              >
                {f.charAt(0).toUpperCase() + f.slice(1)}
              </button>
            ))}
          </div>
          <span style={{ marginLeft: 'auto', fontSize: '13px', color: '#64748b' }}>
            {total} total
          </span>
        </div>

        {loading ? (
          <div style={{ padding: '60px', textAlign: 'center', color: '#475569' }}>Loading...</div>
        ) : providers.length === 0 ? (
          <div className="admin-empty">
            <div className="admin-empty-icon">🏢</div>
            <p>No providers found</p>
          </div>
        ) : (
          <div style={{ overflowX: 'auto' }}>
            <table className="admin-table">
              <thead>
                <tr>
                  <th>Provider</th>
                  <th>Owner</th>
                  <th>Status</th>
                  <th>Subscription</th>
                  <th>Items</th>
                  <th>Bookings</th>
                  <th>Joined</th>
                  <th>Actions</th>
                </tr>
              </thead>
              <tbody>
                {providers.map(p => (
                  <tr key={p.id}>
                    <td>
                      <div className="admin-user-cell">
                        <div className="admin-avatar">{p.name?.[0]?.toUpperCase() || 'B'}</div>
                        <div>
                          <p className="admin-user-cell__name">{p.name}</p>
                          <p className="admin-user-cell__email">{p.city || p.slug}</p>
                        </div>
                      </div>
                    </td>
                    <td>
                      <p style={{ margin: 0, fontSize: '13px', color: '#cbd5e1' }}>{p.user.name}</p>
                      <p style={{ margin: 0, fontSize: '12px', color: '#64748b' }}>{p.user.email}</p>
                    </td>
                    <td>
                      <span className={`admin-badge admin-badge--${p.approvalStatus}`}>
                        {p.approvalStatus}
                      </span>
                    </td>
                    <td>
                      {p.subscription ? (
                        <span className={`admin-badge admin-badge--${p.subscription.status}`}>
                          {p.subscription.planName}
                        </span>
                      ) : (
                        <span style={{ color: '#475569', fontSize: '12px' }}>—</span>
                      )}
                    </td>
                    <td style={{ color: '#94a3b8', textAlign: 'center' }}>{p._count.items}</td>
                    <td style={{ color: '#94a3b8', textAlign: 'center' }}>{p._count.bookings}</td>
                    <td style={{ color: '#64748b', fontSize: '12px' }}>{formatDate(p.createdAt)}</td>
                    <td>
                      <div style={{ display: 'flex', gap: '6px', alignItems: 'center' }}>
                        <Link href={`/admin/providers/${p.id}`} className="admin-btn admin-btn--ghost admin-btn--sm">
                          <Eye size={13} />
                        </Link>
                        {p.approvalStatus === 'pending' && (
                          <>
                            <button
                              className="admin-btn admin-btn--success admin-btn--sm"
                              onClick={() => quickAction(p.id, 'approved')}
                              title="Approve"
                            >
                              <CheckCircle size={13} />
                            </button>
                            <button
                              className="admin-btn admin-btn--danger admin-btn--sm"
                              onClick={() => quickAction(p.id, 'rejected')}
                              title="Reject"
                            >
                              <XCircle size={13} />
                            </button>
                          </>
                        )}
                        {p.approvalStatus === 'approved' && (
                          <button
                            className="admin-btn admin-btn--danger admin-btn--sm"
                            onClick={() => quickAction(p.id, 'suspended')}
                            title="Suspend"
                          >
                            <Pause size={13} />
                          </button>
                        )}
                        {p.approvalStatus === 'suspended' && (
                          <button
                            className="admin-btn admin-btn--success admin-btn--sm"
                            onClick={() => quickAction(p.id, 'approved')}
                            title="Reinstate"
                          >
                            <CheckCircle size={13} />
                          </button>
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
              <button
                className="admin-pagination__btn"
                onClick={() => setPage(p => p - 1)}
                disabled={page === 1}
              >← Prev</button>
              <button
                className="admin-pagination__btn"
                onClick={() => setPage(p => p + 1)}
                disabled={page === totalPages}
              >Next →</button>
            </div>
          </div>
        )}
      </div>
    </>
  )
}

export default function ProvidersPage() {
  return (
    <Suspense fallback={<div style={{ padding: '60px', textAlign: 'center', color: '#475569' }}>Loading...</div>}>
      <ProvidersInner />
    </Suspense>
  )
}
