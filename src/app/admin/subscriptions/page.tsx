'use client'

import { useEffect, useState, useCallback } from 'react'
import { CreditCard, Edit2, Save, X, TrendingUp } from 'lucide-react'

interface Subscription {
  id: string
  status: string
  planName: string
  pricePerMonth: number
  maxItems: number
  trialEndsAt: string | null
  currentPeriodEnd: string | null
  notes: string | null
  createdAt: string
  business: {
    id: string
    name: string
    user: { name: string; email: string }
  }
}

const STATUS_FILTERS = ['all', 'trial', 'active', 'expired', 'suspended', 'cancelled']

export default function SubscriptionsPage() {
  const [subs, setSubs] = useState<Subscription[]>([])
  const [total, setTotal] = useState(0)
  const [mrr, setMrr] = useState(0)
  const [loading, setLoading] = useState(true)
  const [activeFilter, setActiveFilter] = useState('all')
  const [page, setPage] = useState(1)
  const [editSub, setEditSub] = useState<Subscription | null>(null)
  const [form, setForm] = useState({ status: '', planName: '', pricePerMonth: 0, maxItems: 0, trialEndsAt: '', currentPeriodEnd: '', notes: '' })
  const [submitting, setSubmitting] = useState(false)
  const limit = 15

  const fetchSubs = useCallback(async () => {
    setLoading(true)
    const params = new URLSearchParams()
    if (activeFilter !== 'all') params.set('status', activeFilter)
    params.set('page', String(page))
    params.set('limit', String(limit))
    const res = await fetch(`/api/admin/subscriptions?${params}`)
    const data = await res.json()
    setSubs(data.subscriptions || [])
    setTotal(data.total || 0)
    setMrr(data.mrr || 0)
    setLoading(false)
  }, [activeFilter, page])

  useEffect(() => { fetchSubs() }, [fetchSubs])

  const openEdit = (sub: Subscription) => {
    setEditSub(sub)
    setForm({
      status: sub.status, planName: sub.planName, pricePerMonth: sub.pricePerMonth,
      maxItems: sub.maxItems,
      trialEndsAt: sub.trialEndsAt ? sub.trialEndsAt.slice(0, 10) : '',
      currentPeriodEnd: sub.currentPeriodEnd ? sub.currentPeriodEnd.slice(0, 10) : '',
      notes: sub.notes || '',
    })
  }

  const saveSub = async () => {
    if (!editSub) return
    setSubmitting(true)
    await fetch('/api/admin/subscriptions', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ businessId: editSub.business.id, ...form }),
    })
    setEditSub(null)
    await fetchSubs()
    setSubmitting(false)
  }

  const fmt = (d: string) => new Date(d).toLocaleDateString('en-GB', { day: '2-digit', month: 'short', year: 'numeric' })
  const totalPages = Math.ceil(total / limit)

  // Days until trial ends
  const daysLeft = (date: string | null) => {
    if (!date) return null
    const diff = Math.ceil((new Date(date).getTime() - Date.now()) / 86400000)
    return diff
  }

  return (
    <>
      <div className="admin-page-header">
        <h1 className="admin-page-title">Subscriptions</h1>
        <p className="admin-page-subtitle">Manage provider subscriptions and billing</p>
      </div>

      {/* MRR Card */}
      <div className="admin-stat-grid" style={{ gridTemplateColumns: 'repeat(auto-fit, minmax(180px, 1fr))' }}>
        {[
          { label: 'Total Subscriptions', value: total, color: '#3B82F6', bg: 'rgba(59,130,246,0.12)' },
          { label: 'Monthly Revenue (MRR)', value: `LKR ${mrr.toLocaleString()}`, color: '#10B981', bg: 'rgba(16,185,129,0.12)' },
        ].map(c => (
          <div key={c.label} className="admin-stat-card">
            <div className="admin-stat-card__icon" style={{ background: c.bg }}>
              <TrendingUp size={20} color={c.color} />
            </div>
            <p className="admin-stat-card__value">{c.value}</p>
            <p className="admin-stat-card__label">{c.label}</p>
          </div>
        ))}
      </div>

      <div className="admin-table-wrapper">
        <div className="admin-table-toolbar">
          <p className="admin-table-toolbar__title">All Subscriptions</p>
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
        </div>

        {loading ? (
          <div style={{ padding: '60px', textAlign: 'center', color: '#475569' }}>Loading...</div>
        ) : subs.length === 0 ? (
          <div className="admin-empty">
            <div className="admin-empty-icon">💳</div>
            <p>No subscriptions found</p>
          </div>
        ) : (
          <div style={{ overflowX: 'auto' }}>
            <table className="admin-table">
              <thead>
                <tr>
                  <th>Provider</th>
                  <th>Plan</th>
                  <th>Status</th>
                  <th>Price/mo</th>
                  <th>Max Items</th>
                  <th>Trial / Period End</th>
                  <th>Actions</th>
                </tr>
              </thead>
              <tbody>
                {subs.map(s => {
                  const days = daysLeft(s.trialEndsAt)
                  const urgent = days !== null && days <= 7 && days >= 0
                  return (
                    <tr key={s.id}>
                      <td>
                        <div className="admin-user-cell">
                          <div className="admin-avatar">{s.business.name?.[0]?.toUpperCase()}</div>
                          <div>
                            <p className="admin-user-cell__name">{s.business.name}</p>
                            <p className="admin-user-cell__email">{s.business.user?.email}</p>
                          </div>
                        </div>
                      </td>
                      <td style={{ color: '#cbd5e1', fontSize: '13px' }}>{s.planName}</td>
                      <td><span className={`admin-badge admin-badge--${s.status}`}>{s.status}</span></td>
                      <td style={{ color: '#94a3b8', fontSize: '13px' }}>
                        {s.pricePerMonth === 0 ? <span style={{ color: '#34d399' }}>Free</span> : `LKR ${s.pricePerMonth.toLocaleString()}`}
                      </td>
                      <td style={{ color: '#94a3b8', textAlign: 'center' }}>{s.maxItems}</td>
                      <td>
                        {s.trialEndsAt && (
                          <span style={{ fontSize: '12px', color: urgent ? '#fbbf24' : '#64748b' }}>
                            Trial: {fmt(s.trialEndsAt)}
                            {days !== null && ` (${days}d left)`}
                          </span>
                        )}
                        {s.currentPeriodEnd && !s.trialEndsAt && (
                          <span style={{ fontSize: '12px', color: '#64748b' }}>
                            Ends: {fmt(s.currentPeriodEnd)}
                          </span>
                        )}
                        {!s.trialEndsAt && !s.currentPeriodEnd && <span style={{ color: '#475569' }}>—</span>}
                      </td>
                      <td>
                        <button className="admin-btn admin-btn--ghost admin-btn--sm" onClick={() => openEdit(s)}>
                          <Edit2 size={13} /> Edit
                        </button>
                      </td>
                    </tr>
                  )
                })}
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

      {/* Edit Modal */}
      {editSub && (
        <div className="admin-modal-overlay" onClick={() => setEditSub(null)}>
          <div className="admin-modal" style={{ maxWidth: '520px' }} onClick={e => e.stopPropagation()}>
            <h3 className="admin-modal__title">Edit Subscription</h3>
            <p className="admin-modal__subtitle">{editSub.business.name}</p>
            <div className="admin-form-row">
              <div className="admin-form-group">
                <label className="admin-form-label">Status</label>
                <select className="admin-form-select" value={form.status} onChange={e => setForm(f => ({ ...f, status: e.target.value }))}>
                  <option value="trial">Trial</option>
                  <option value="active">Active</option>
                  <option value="expired">Expired</option>
                  <option value="suspended">Suspended</option>
                  <option value="cancelled">Cancelled</option>
                </select>
              </div>
              <div className="admin-form-group">
                <label className="admin-form-label">Plan Name</label>
                <input className="admin-form-input" value={form.planName} onChange={e => setForm(f => ({ ...f, planName: e.target.value }))} />
              </div>
            </div>
            <div className="admin-form-row">
              <div className="admin-form-group">
                <label className="admin-form-label">Price/Month (LKR)</label>
                <input className="admin-form-input" type="number" value={form.pricePerMonth} onChange={e => setForm(f => ({ ...f, pricePerMonth: Number(e.target.value) }))} />
              </div>
              <div className="admin-form-group">
                <label className="admin-form-label">Max Items</label>
                <input className="admin-form-input" type="number" value={form.maxItems} onChange={e => setForm(f => ({ ...f, maxItems: Number(e.target.value) }))} />
              </div>
            </div>
            <div className="admin-form-row">
              <div className="admin-form-group">
                <label className="admin-form-label">Trial Ends</label>
                <input className="admin-form-input" type="date" value={form.trialEndsAt} onChange={e => setForm(f => ({ ...f, trialEndsAt: e.target.value }))} />
              </div>
              <div className="admin-form-group">
                <label className="admin-form-label">Period End</label>
                <input className="admin-form-input" type="date" value={form.currentPeriodEnd} onChange={e => setForm(f => ({ ...f, currentPeriodEnd: e.target.value }))} />
              </div>
            </div>
            <div className="admin-form-group">
              <label className="admin-form-label">Notes</label>
              <textarea className="admin-form-textarea" value={form.notes} onChange={e => setForm(f => ({ ...f, notes: e.target.value }))} />
            </div>
            <div className="admin-modal__actions">
              <button className="admin-btn admin-btn--ghost" onClick={() => setEditSub(null)}><X size={14} /> Cancel</button>
              <button className="admin-btn admin-btn--primary" onClick={saveSub} disabled={submitting}>
                <Save size={14} /> {submitting ? 'Saving...' : 'Save'}
              </button>
            </div>
          </div>
        </div>
      )}
    </>
  )
}
