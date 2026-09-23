'use client'

import { useEffect, useState, useCallback } from 'react'
import { Search, Edit2, Save, X, Users } from 'lucide-react'

interface UserRow {
  id: string
  name: string
  email: string
  role: string
  status: string
  createdAt: string
  suspendReason: string | null
  businessProfile: { id: string; name: string; approvalStatus: string } | null
}

const ROLE_FILTERS = ['all', 'admin', 'provider', 'customer']
const STATUS_FILTERS = ['all', 'active', 'suspended', 'banned']

export default function UsersPage() {
  const [users, setUsers] = useState<UserRow[]>([])
  const [total, setTotal] = useState(0)
  const [loading, setLoading] = useState(true)
  const [search, setSearch] = useState('')
  const [roleFilter, setRoleFilter] = useState('all')
  const [statusFilter, setStatusFilter] = useState('all')
  const [page, setPage] = useState(1)
  const [editUser, setEditUser] = useState<UserRow | null>(null)
  const [form, setForm] = useState({ name: '', email: '', role: '', status: '', suspendReason: '' })
  const [submitting, setSubmitting] = useState(false)
  const limit = 20

  const fetchUsers = useCallback(async () => {
    setLoading(true)
    const params = new URLSearchParams()
    if (roleFilter !== 'all') params.set('role', roleFilter)
    if (statusFilter !== 'all') params.set('status', statusFilter)
    if (search) params.set('search', search)
    params.set('page', String(page))
    params.set('limit', String(limit))

    const res = await fetch(`/api/admin/users?${params}`)
    const data = await res.json()
    setUsers(data.users || [])
    setTotal(data.total || 0)
    setLoading(false)
  }, [roleFilter, statusFilter, search, page])

  useEffect(() => { fetchUsers() }, [fetchUsers])

  const openEdit = (u: UserRow) => {
    setEditUser(u)
    setForm({ name: u.name, email: u.email, role: u.role, status: u.status, suspendReason: u.suspendReason || '' })
  }

  const saveUser = async () => {
    if (!editUser) return
    setSubmitting(true)
    await fetch('/api/admin/users', {
      method: 'PATCH',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ id: editUser.id, ...form }),
    })
    setEditUser(null)
    await fetchUsers()
    setSubmitting(false)
  }

  const fmt = (d: string) => new Date(d).toLocaleDateString('en-GB', { day: '2-digit', month: 'short', year: 'numeric' })
  const totalPages = Math.ceil(total / limit)

  const roleColor: Record<string, string> = {
    admin: '#f87171',
    provider: '#60a5fa',
    customer: '#a78bfa',
  }

  return (
    <>
      <div className="admin-page-header">
        <h1 className="admin-page-title">All Users</h1>
        <p className="admin-page-subtitle">View and manage all user accounts</p>
      </div>

      <div className="admin-table-wrapper">
        <div className="admin-table-toolbar">
          <div className="admin-search">
            <Search size={14} />
            <input
              placeholder="Search name, email..."
              value={search}
              onChange={e => { setSearch(e.target.value); setPage(1) }}
            />
          </div>
          <div style={{ display: 'flex', gap: '4px', flexWrap: 'wrap' }}>
            {ROLE_FILTERS.map(f => (
              <button
                key={f}
                className={`admin-filter-btn ${roleFilter === f ? 'admin-filter-btn--active' : ''}`}
                onClick={() => { setRoleFilter(f); setPage(1) }}
              >
                {f.charAt(0).toUpperCase() + f.slice(1)}
              </button>
            ))}
          </div>
          <div style={{ display: 'flex', gap: '4px', flexWrap: 'wrap' }}>
            {STATUS_FILTERS.map(f => (
              <button
                key={f}
                className={`admin-filter-btn ${statusFilter === f ? 'admin-filter-btn--active' : ''}`}
                onClick={() => { setStatusFilter(f); setPage(1) }}
              >
                {f.charAt(0).toUpperCase() + f.slice(1)}
              </button>
            ))}
          </div>
          <span style={{ marginLeft: 'auto', fontSize: '13px', color: '#64748b' }}>{total} users</span>
        </div>

        {loading ? (
          <div style={{ padding: '60px', textAlign: 'center', color: '#475569' }}>Loading...</div>
        ) : users.length === 0 ? (
          <div className="admin-empty">
            <div className="admin-empty-icon">👥</div>
            <p>No users found</p>
          </div>
        ) : (
          <div style={{ overflowX: 'auto' }}>
            <table className="admin-table">
              <thead>
                <tr>
                  <th>User</th>
                  <th>Role</th>
                  <th>Status</th>
                  <th>Business</th>
                  <th>Joined</th>
                  <th>Actions</th>
                </tr>
              </thead>
              <tbody>
                {users.map(u => (
                  <tr key={u.id}>
                    <td>
                      <div className="admin-user-cell">
                        <div
                          className="admin-avatar"
                          style={{ background: `linear-gradient(135deg, ${roleColor[u.role] || '#3B82F6'}, #6366F1)` }}
                        >
                          {u.name?.[0]?.toUpperCase() || 'U'}
                        </div>
                        <div>
                          <p className="admin-user-cell__name">{u.name}</p>
                          <p className="admin-user-cell__email">{u.email}</p>
                        </div>
                      </div>
                    </td>
                    <td>
                      <span style={{
                        display: 'inline-flex', alignItems: 'center', gap: '5px',
                        padding: '3px 10px', borderRadius: '20px', fontSize: '11px', fontWeight: 600,
                        background: `${roleColor[u.role] || '#3B82F6'}20`,
                        color: roleColor[u.role] || '#3B82F6',
                        border: `1px solid ${roleColor[u.role] || '#3B82F6'}30`,
                      }}>
                        {u.role}
                      </span>
                    </td>
                    <td><span className={`admin-badge admin-badge--${u.status}`}>{u.status}</span></td>
                    <td style={{ fontSize: '12px', color: '#64748b' }}>
                      {u.businessProfile ? (
                        <div>
                          <p style={{ margin: 0, color: '#cbd5e1' }}>{u.businessProfile.name}</p>
                          <span className={`admin-badge admin-badge--${u.businessProfile.approvalStatus}`} style={{ fontSize: '10px', padding: '2px 6px' }}>
                            {u.businessProfile.approvalStatus}
                          </span>
                        </div>
                      ) : '—'}
                    </td>
                    <td style={{ color: '#64748b', fontSize: '12px' }}>{fmt(u.createdAt)}</td>
                    <td>
                      <button className="admin-btn admin-btn--ghost admin-btn--sm" onClick={() => openEdit(u)}>
                        <Edit2 size={13} /> Edit
                      </button>
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

      {/* Edit Modal */}
      {editUser && (
        <div className="admin-modal-overlay" onClick={() => setEditUser(null)}>
          <div className="admin-modal" onClick={e => e.stopPropagation()}>
            <h3 className="admin-modal__title">Edit User</h3>
            <p className="admin-modal__subtitle">{editUser.email}</p>
            <div className="admin-form-group">
              <label className="admin-form-label">Full Name</label>
              <input className="admin-form-input" value={form.name} onChange={e => setForm(f => ({ ...f, name: e.target.value }))} />
            </div>
            <div className="admin-form-group">
              <label className="admin-form-label">Email</label>
              <input className="admin-form-input" type="email" value={form.email} onChange={e => setForm(f => ({ ...f, email: e.target.value }))} />
            </div>
            <div className="admin-form-row">
              <div className="admin-form-group">
                <label className="admin-form-label">Role</label>
                <select className="admin-form-select" value={form.role} onChange={e => setForm(f => ({ ...f, role: e.target.value }))}>
                  <option value="admin">Admin</option>
                  <option value="provider">Provider</option>
                  <option value="customer">Customer</option>
                </select>
              </div>
              <div className="admin-form-group">
                <label className="admin-form-label">Status</label>
                <select className="admin-form-select" value={form.status} onChange={e => setForm(f => ({ ...f, status: e.target.value }))}>
                  <option value="active">Active</option>
                  <option value="suspended">Suspended</option>
                  <option value="banned">Banned</option>
                </select>
              </div>
            </div>
            {(form.status === 'suspended' || form.status === 'banned') && (
              <div className="admin-form-group">
                <label className="admin-form-label">Reason</label>
                <textarea className="admin-form-textarea" value={form.suspendReason} onChange={e => setForm(f => ({ ...f, suspendReason: e.target.value }))} placeholder="Reason for suspension/ban..." />
              </div>
            )}
            <div className="admin-modal__actions">
              <button className="admin-btn admin-btn--ghost" onClick={() => setEditUser(null)}><X size={14} /> Cancel</button>
              <button className="admin-btn admin-btn--primary" onClick={saveUser} disabled={submitting}>
                <Save size={14} /> {submitting ? 'Saving...' : 'Save Changes'}
              </button>
            </div>
          </div>
        </div>
      )}
    </>
  )
}
