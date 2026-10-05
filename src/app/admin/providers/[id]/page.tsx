'use client'

import { useEffect, useState, use } from 'react'
import { useRouter } from 'next/navigation'
import Link from 'next/link'
import {
  ArrowLeft, Building2, Mail, Phone, MapPin, Calendar,
  CreditCard, Package, BookOpen, CheckCircle, XCircle,
  Pause, Play, Edit2, Save, X, ShieldCheck
} from 'lucide-react'

interface ProviderDetail {
  id: string
  name: string
  slug: string
  description: string | null
  phone: string | null
  address: string | null
  city: string | null
  registrationNumber: string | null
  approvalStatus: string
  approvalNote: string | null
  approvedAt: string | null
  createdAt: string
  user: { id: string; name: string; email: string; status: string; role: string; createdAt: string }
  subscription: {
    id: string; status: string; planName: string; pricePerMonth: number;
    maxItems: number; trialEndsAt: string | null; currentPeriodEnd: string | null; notes: string | null
  } | null
  _count: { items: number; bookings: number }
}

export default function ProviderDetailPage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = use(params)
  const router = useRouter()
  const [provider, setProvider] = useState<ProviderDetail | null>(null)
  const [loading, setLoading] = useState(true)
  const [actionModal, setActionModal] = useState<'approve' | 'reject' | 'suspend' | null>(null)
  const [actionNote, setActionNote] = useState('')
  const [submitting, setSubmitting] = useState(false)
  const [subModal, setSubModal] = useState(false)
  const [subForm, setSubForm] = useState({
    status: 'trial', planName: 'Standard Plan', pricePerMonth: 1500,
    maxItems: 50, trialEndsAt: '', currentPeriodEnd: '', notes: '',
  })

  // Edit Business Profile Modal State
  const [editModal, setEditModal] = useState(false)
  const [editForm, setEditForm] = useState({
    name: '', address: '', city: '', description: '', advancePaymentPercent: 30, auditReason: ''
  })
  const [editError, setEditError] = useState<string | null>(null)

  // Verification Exception Modal State
  const [exceptionModal, setExceptionModal] = useState(false)
  const [exceptionForm, setExceptionForm] = useState({
    targetType: 'PROVIDER_PHONE', reason: '', durationHours: '24'
  })
  const [exceptionError, setExceptionError] = useState<string | null>(null)
  const [exceptionSuccess, setExceptionSuccess] = useState<string | null>(null)

  const fetchProvider = async () => {
    const res = await fetch(`/api/admin/providers/${id}`)
    const data = await res.json()
    setProvider(data.business)
    if (data.business) {
      setEditForm({
        name: data.business.name || '',
        address: data.business.address || '',
        city: data.business.city || '',
        description: data.business.description || '',
        advancePaymentPercent: data.business.advancePaymentPercent || 30,
        auditReason: '',
      })
    }
    if (data.business?.subscription) {
      const s = data.business.subscription
      setSubForm({
        status: s.status, planName: s.planName, pricePerMonth: s.pricePerMonth,
        maxItems: s.maxItems,
        trialEndsAt: s.trialEndsAt ? s.trialEndsAt.slice(0, 10) : '',
        currentPeriodEnd: s.currentPeriodEnd ? s.currentPeriodEnd.slice(0, 10) : '',
        notes: s.notes || '',
      })
    }
    setLoading(false)
  }

  const saveEdit = async () => {
    if (!editForm.auditReason.trim()) {
      setEditError('Mandatory audit reason is required for administrative changes.')
      return
    }
    setSubmitting(true)
    setEditError(null)
    try {
      const res = await fetch(`/api/admin/providers/${id}/edit`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(editForm),
      })
      const data = await res.json()
      if (!res.ok) {
        setEditError(data.message || 'Failed to update business profile')
        return
      }
      setEditModal(false)
      fetchProvider()
    } catch {
      setEditError('Network error')
    } finally {
      setSubmitting(false)
    }
  }

  const saveException = async () => {
    if (!provider?.user?.id) return
    if (!exceptionForm.reason.trim()) {
      setExceptionError('Mandatory reason is required.')
      return
    }
    setSubmitting(true)
    setExceptionError(null)
    setExceptionSuccess(null)
    try {
      const res = await fetch('/api/admin/verification-exceptions', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          userId: provider.user.id,
          targetType: exceptionForm.targetType,
          exceptionType: 'PHONE_VERIFICATION_BYPASS',
          reason: exceptionForm.reason.trim(),
          durationHours: Number(exceptionForm.durationHours),
        }),
      })
      const data = await res.json()
      if (!res.ok) {
        setExceptionError(data.message || 'Failed to grant exception')
        return
      }
      setExceptionSuccess(data.message)
      setTimeout(() => {
        setExceptionModal(false)
        setExceptionSuccess(null)
      }, 1500)
    } catch {
      setExceptionError('Network error')
    } finally {
      setSubmitting(false)
    }
  }

  useEffect(() => { fetchProvider() }, [id])

  const doAction = async (approvalStatus: string) => {
    setSubmitting(true)
    await fetch(`/api/admin/providers/${id}`, {
      method: 'PATCH',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ approvalStatus, approvalNote: actionNote }),
    })
    setActionModal(null)
    setActionNote('')
    await fetchProvider()
    setSubmitting(false)
  }

  const saveSubscription = async () => {
    setSubmitting(true)
    await fetch(`/api/admin/providers/${id}`, {
      method: 'PATCH',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ subscription: subForm }),
    })
    setSubModal(false)
    await fetchProvider()
    setSubmitting(false)
  }

  const fmt = (d: string) => new Date(d).toLocaleDateString('en-GB', { day: '2-digit', month: 'short', year: 'numeric' })

  if (loading) return <div style={{ padding: '60px', textAlign: 'center', color: '#475569' }}>Loading...</div>
  if (!provider) return <div style={{ padding: '60px', textAlign: 'center', color: '#f87171' }}>Provider not found</div>

  return (
    <>
      {/* Back + header */}
      <div style={{ marginBottom: '24px', display: 'flex', alignItems: 'flex-start', gap: '16px' }}>
        <button onClick={() => router.back()} className="admin-btn admin-btn--ghost admin-btn--sm" style={{ marginTop: '4px' }}>
          <ArrowLeft size={14} />
        </button>
        <div style={{ flex: 1 }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: '12px', flexWrap: 'wrap' }}>
            <h1 className="admin-page-title" style={{ margin: 0 }}>{provider.name}</h1>
            <span className={`admin-badge admin-badge--${provider.approvalStatus}`}>{provider.approvalStatus}</span>
          </div>
          <p className="admin-page-subtitle">{provider.user.email} · Joined {fmt(provider.createdAt)}</p>
        </div>
        {/* Action buttons */}
        <div style={{ display: 'flex', gap: '8px', flexWrap: 'wrap' }}>
          <button className="admin-btn admin-btn--ghost" onClick={() => setEditModal(true)}>
            <Edit2 size={15} /> Edit Business
          </button>
          <button className="admin-btn admin-btn--warning" onClick={() => setExceptionModal(true)}>
            <ShieldCheck size={15} /> Grant Exception
          </button>
          {provider.approvalStatus === 'pending' && (
            <>
              <button className="admin-btn admin-btn--success" onClick={() => setActionModal('approve')}>
                <CheckCircle size={15} /> Approve
              </button>
              <button className="admin-btn admin-btn--danger" onClick={() => setActionModal('reject')}>
                <XCircle size={15} /> Reject
              </button>
            </>
          )}
          {provider.approvalStatus === 'approved' && (
            <button className="admin-btn admin-btn--danger" onClick={() => setActionModal('suspend')}>
              <Pause size={15} /> Suspend
            </button>
          )}
          {(provider.approvalStatus === 'suspended' || provider.approvalStatus === 'rejected') && (
            <button className="admin-btn admin-btn--success" onClick={() => setActionModal('approve')}>
              <Play size={15} /> Reinstate
            </button>
          )}
        </div>
      </div>

      {/* Info grid */}
      <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '20px', marginBottom: '20px' }}>
        {/* Business Info */}
        <div className="admin-card">
          <h3 style={{ margin: '0 0 18px', fontSize: '15px', fontWeight: 600, color: '#e2e8f0', display: 'flex', alignItems: 'center', gap: '8px' }}>
            <Building2 size={16} color="#3B82F6" /> Business Info
          </h3>
          <div style={{ display: 'flex', flexDirection: 'column', gap: '12px' }}>
            {[
              { icon: Building2, label: 'Business Name', value: provider.name },
              { icon: MapPin, label: 'City', value: provider.city || '—' },
              { icon: MapPin, label: 'Address', value: provider.address || '—' },
              { icon: Phone, label: 'Phone', value: provider.phone || '—' },
              { icon: Package, label: 'Items', value: `${provider._count.items} items` },
              { icon: BookOpen, label: 'Bookings', value: `${provider._count.bookings} bookings` },
            ].map(row => {
              const Icon = row.icon
              return (
                <div key={row.label} style={{ display: 'flex', gap: '10px', alignItems: 'flex-start' }}>
                  <Icon size={14} color="#475569" style={{ marginTop: 2, flexShrink: 0 }} />
                  <div>
                    <p style={{ margin: 0, fontSize: '11px', color: '#475569', fontWeight: 600, textTransform: 'uppercase', letterSpacing: '0.05em' }}>{row.label}</p>
                    <p style={{ margin: 0, fontSize: '13px', color: '#cbd5e1' }}>{row.value}</p>
                  </div>
                </div>
              )
            })}
          </div>
        </div>

        {/* Owner Info */}
        <div className="admin-card">
          <h3 style={{ margin: '0 0 18px', fontSize: '15px', fontWeight: 600, color: '#e2e8f0', display: 'flex', alignItems: 'center', gap: '8px' }}>
            <Mail size={16} color="#8B5CF6" /> Owner Details
          </h3>
          <div style={{ display: 'flex', flexDirection: 'column', gap: '12px' }}>
            {[
              { label: 'Full Name', value: provider.user.name },
              { label: 'Email', value: provider.user.email },
              { label: 'Account Status', value: provider.user.status },
              { label: 'Member Since', value: fmt(provider.user.createdAt) },
            ].map(row => (
              <div key={row.label}>
                <p style={{ margin: 0, fontSize: '11px', color: '#475569', fontWeight: 600, textTransform: 'uppercase', letterSpacing: '0.05em' }}>{row.label}</p>
                <p style={{ margin: 0, fontSize: '13px', color: '#cbd5e1' }}>{row.value}</p>
              </div>
            ))}
          </div>

          {provider.approvalNote && (
            <div style={{ marginTop: '20px', padding: '12px', background: 'rgba(245,158,11,0.08)', borderRadius: '10px', border: '1px solid rgba(245,158,11,0.15)' }}>
              <p style={{ margin: 0, fontSize: '11px', color: '#fbbf24', fontWeight: 600, textTransform: 'uppercase', letterSpacing: '0.05em' }}>Approval Note</p>
              <p style={{ margin: '4px 0 0', fontSize: '13px', color: '#fcd34d' }}>{provider.approvalNote}</p>
            </div>
          )}
        </div>
      </div>

      {/* Subscription Card */}
      <div className="admin-card" style={{ marginBottom: '20px' }}>
        <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '18px' }}>
          <h3 style={{ margin: 0, fontSize: '15px', fontWeight: 600, color: '#e2e8f0', display: 'flex', alignItems: 'center', gap: '8px' }}>
            <CreditCard size={16} color="#10B981" /> Subscription
          </h3>
          <button className="admin-btn admin-btn--ghost admin-btn--sm" onClick={() => setSubModal(true)}>
            <Edit2 size={13} /> Edit
          </button>
        </div>
        {provider.subscription ? (
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(160px, 1fr))', gap: '16px' }}>
            {[
              { label: 'Plan', value: provider.subscription.planName },
              { label: 'Status', value: provider.subscription.status, badge: true },
              { label: 'Price/month', value: `LKR ${provider.subscription.pricePerMonth.toLocaleString()}` },
              { label: 'Max Items', value: String(provider.subscription.maxItems) },
              { label: 'Trial Ends', value: provider.subscription.trialEndsAt ? fmt(provider.subscription.trialEndsAt) : '—' },
              { label: 'Period End', value: provider.subscription.currentPeriodEnd ? fmt(provider.subscription.currentPeriodEnd) : '—' },
            ].map(row => (
              <div key={row.label}>
                <p style={{ margin: '0 0 4px', fontSize: '11px', color: '#475569', fontWeight: 600, textTransform: 'uppercase', letterSpacing: '0.05em' }}>{row.label}</p>
                {row.badge ? (
                  <span className={`admin-badge admin-badge--${row.value}`}>{row.value}</span>
                ) : (
                  <p style={{ margin: 0, fontSize: '14px', color: '#e2e8f0', fontWeight: 500 }}>{row.value}</p>
                )}
              </div>
            ))}
          </div>
        ) : (
          <p style={{ color: '#475569', fontSize: '14px', margin: 0 }}>No subscription assigned. <button className="admin-btn admin-btn--primary admin-btn--sm" onClick={() => setSubModal(true)}>Create Subscription</button></p>
        )}
      </div>

      {/* Action Modal */}
      {actionModal && (
        <div className="admin-modal-overlay" onClick={() => setActionModal(null)}>
          <div className="admin-modal" onClick={e => e.stopPropagation()}>
            <h3 className="admin-modal__title">
              {actionModal === 'approve' && '✅ Approve Provider'}
              {actionModal === 'reject' && '❌ Reject Provider'}
              {actionModal === 'suspend' && '⏸️ Suspend Provider'}
            </h3>
            <p className="admin-modal__subtitle">
              {actionModal === 'approve' && `${provider.name} will be able to access the platform.`}
              {actionModal === 'reject' && `${provider.name}'s application will be rejected.`}
              {actionModal === 'suspend' && `${provider.name} will lose access immediately.`}
            </p>
            <div className="admin-form-group">
              <label className="admin-form-label">Note (optional)</label>
              <textarea
                className="admin-form-textarea"
                placeholder="Add a note to the provider..."
                value={actionNote}
                onChange={e => setActionNote(e.target.value)}
              />
            </div>
            <div className="admin-modal__actions">
              <button className="admin-btn admin-btn--ghost" onClick={() => setActionModal(null)}>Cancel</button>
              <button
                className={`admin-btn ${actionModal === 'approve' ? 'admin-btn--success' : 'admin-btn--danger'}`}
                onClick={() => doAction(actionModal === 'approve' ? 'approved' : actionModal === 'reject' ? 'rejected' : 'suspended')}
                disabled={submitting}
              >
                {submitting ? 'Saving...' : 'Confirm'}
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Subscription Modal */}
      {subModal && (
        <div className="admin-modal-overlay" onClick={() => setSubModal(false)}>
          <div className="admin-modal" style={{ maxWidth: '520px' }} onClick={e => e.stopPropagation()}>
            <h3 className="admin-modal__title">Edit Subscription</h3>
            <p className="admin-modal__subtitle">Manage {provider.name}'s subscription</p>
            <div className="admin-form-row">
              <div className="admin-form-group">
                <label className="admin-form-label">Status</label>
                <select className="admin-form-select" value={subForm.status} onChange={e => setSubForm(f => ({ ...f, status: e.target.value }))}>
                  <option value="trial">Trial</option>
                  <option value="active">Active</option>
                  <option value="expired">Expired</option>
                  <option value="suspended">Suspended</option>
                  <option value="cancelled">Cancelled</option>
                </select>
              </div>
              <div className="admin-form-group">
                <label className="admin-form-label">Plan Name</label>
                <input className="admin-form-input" value={subForm.planName} onChange={e => setSubForm(f => ({ ...f, planName: e.target.value }))} />
              </div>
            </div>
            <div className="admin-form-row">
              <div className="admin-form-group">
                <label className="admin-form-label">Price / Month (LKR)</label>
                <input className="admin-form-input" type="number" value={subForm.pricePerMonth} onChange={e => setSubForm(f => ({ ...f, pricePerMonth: Number(e.target.value) }))} />
              </div>
              <div className="admin-form-group">
                <label className="admin-form-label">Max Items</label>
                <input className="admin-form-input" type="number" value={subForm.maxItems} onChange={e => setSubForm(f => ({ ...f, maxItems: Number(e.target.value) }))} />
              </div>
            </div>
            <div className="admin-form-row">
              <div className="admin-form-group">
                <label className="admin-form-label">Trial Ends</label>
                <input className="admin-form-input" type="date" value={subForm.trialEndsAt} onChange={e => setSubForm(f => ({ ...f, trialEndsAt: e.target.value }))} />
              </div>
              <div className="admin-form-group">
                <label className="admin-form-label">Period End</label>
                <input className="admin-form-input" type="date" value={subForm.currentPeriodEnd} onChange={e => setSubForm(f => ({ ...f, currentPeriodEnd: e.target.value }))} />
              </div>
            </div>
            <div className="admin-form-group">
              <label className="admin-form-label">Admin Notes</label>
              <textarea className="admin-form-textarea" value={subForm.notes} onChange={e => setSubForm(f => ({ ...f, notes: e.target.value }))} placeholder="Internal notes..." />
            </div>
            <div className="admin-modal__actions">
              <button className="admin-btn admin-btn--ghost" onClick={() => setSubModal(false)}><X size={14} /> Cancel</button>
              <button className="admin-btn admin-btn--primary" onClick={saveSubscription} disabled={submitting}>
                <Save size={14} /> {submitting ? 'Saving...' : 'Save Changes'}
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Edit Business Profile Modal */}
      {editModal && (
        <div className="admin-modal-overlay" onClick={() => setEditModal(false)}>
          <div className="admin-modal" style={{ maxWidth: '520px' }} onClick={e => e.stopPropagation()}>
            <h3 className="admin-modal__title">Edit Business Profile</h3>
            <p className="admin-modal__subtitle">Administrative updates with mandatory audit logging.</p>

            {editError && (
              <div style={{ padding: '10px', backgroundColor: '#fef2f2', color: '#991b1b', borderRadius: '6px', marginBottom: '12px', fontSize: '12px' }}>
                {editError}
              </div>
            )}

            <div className="admin-form-group">
              <label className="admin-form-label">Business Name</label>
              <input className="admin-form-input" value={editForm.name} onChange={e => setEditForm(f => ({ ...f, name: e.target.value }))} />
            </div>

            <div className="admin-form-row">
              <div className="admin-form-group">
                <label className="admin-form-label">Address</label>
                <input className="admin-form-input" value={editForm.address} onChange={e => setEditForm(f => ({ ...f, address: e.target.value }))} />
              </div>
              <div className="admin-form-group">
                <label className="admin-form-label">City</label>
                <input className="admin-form-input" value={editForm.city} onChange={e => setEditForm(f => ({ ...f, city: e.target.value }))} />
              </div>
            </div>

            <div className="admin-form-group">
              <label className="admin-form-label">Advance Payment %</label>
              <input className="admin-form-input" type="number" value={editForm.advancePaymentPercent} onChange={e => setEditForm(f => ({ ...f, advancePaymentPercent: Number(e.target.value) }))} />
            </div>

            <div className="admin-form-group">
              <label className="admin-form-label">Business Description</label>
              <textarea className="admin-form-textarea" rows={3} value={editForm.description} onChange={e => setEditForm(f => ({ ...f, description: e.target.value }))} />
            </div>

            <div className="admin-form-group" style={{ backgroundColor: '#fffbeb', padding: '12px', borderRadius: '8px', border: '1px solid #fef08a' }}>
              <label className="admin-form-label" style={{ color: '#92400e', fontWeight: 600 }}>Mandatory Audit Reason *</label>
              <input
                className="admin-form-input"
                placeholder="Reason for change (e.g. Corrected business name per owner request)"
                value={editForm.auditReason}
                onChange={e => setEditForm(f => ({ ...f, auditReason: e.target.value }))}
              />
            </div>

            <div className="admin-modal__actions">
              <button className="admin-btn admin-btn--ghost" onClick={() => setEditModal(false)}><X size={14} /> Cancel</button>
              <button className="admin-btn admin-btn--primary" onClick={saveEdit} disabled={submitting}>
                <Save size={14} /> {submitting ? 'Saving...' : 'Save Profile Changes'}
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Grant Verification Exception Modal */}
      {exceptionModal && (
        <div className="admin-modal-overlay" onClick={() => setExceptionModal(false)}>
          <div className="admin-modal" style={{ maxWidth: '480px' }} onClick={e => e.stopPropagation()}>
            <h3 className="admin-modal__title">Grant Verification Exception</h3>
            <p className="admin-modal__subtitle">Grant time-limited bypass for provider phone verification.</p>

            {exceptionError && (
              <div style={{ padding: '10px', backgroundColor: '#fef2f2', color: '#991b1b', borderRadius: '6px', marginBottom: '12px', fontSize: '12px' }}>
                {exceptionError}
              </div>
            )}

            {exceptionSuccess && (
              <div style={{ padding: '10px', backgroundColor: '#f0fdf4', color: '#166534', borderRadius: '6px', marginBottom: '12px', fontSize: '12px' }}>
                {exceptionSuccess}
              </div>
            )}

            <div className="admin-form-group">
              <label className="admin-form-label">Target Exception Scope</label>
              <select
                className="admin-form-select"
                value={exceptionForm.targetType}
                onChange={e => setExceptionForm(f => ({ ...f, targetType: e.target.value }))}
              >
                <option value="PROVIDER_PHONE">Provider Phone Verification Bypass</option>
              </select>
            </div>

            <div className="admin-form-group">
              <label className="admin-form-label">Duration</label>
              <select
                className="admin-form-select"
                value={exceptionForm.durationHours}
                onChange={e => setExceptionForm(f => ({ ...f, durationHours: e.target.value }))}
              >
                <option value="24">24 Hours (1 Day)</option>
                <option value="48">48 Hours (2 Days)</option>
                <option value="168">168 Hours (7 Days)</option>
              </select>
            </div>

            <div className="admin-form-group" style={{ backgroundColor: '#fffbeb', padding: '12px', borderRadius: '8px', border: '1px solid #fef08a' }}>
              <label className="admin-form-label" style={{ color: '#92400e', fontWeight: 600 }}>Mandatory Justification / Reason *</label>
              <textarea
                className="admin-form-textarea"
                rows={3}
                placeholder="Reason for granting exception (e.g. WhatsApp API delivery failure for international provider phone)"
                value={exceptionForm.reason}
                onChange={e => setExceptionForm(f => ({ ...f, reason: e.target.value }))}
              />
            </div>

            <div className="admin-modal__actions">
              <button className="admin-btn admin-btn--ghost" onClick={() => setExceptionModal(false)}><X size={14} /> Cancel</button>
              <button className="admin-btn admin-btn--warning" onClick={saveException} disabled={submitting}>
                <ShieldCheck size={14} /> {submitting ? 'Granting...' : 'Grant Exception'}
              </button>
            </div>
          </div>
        </div>
      )}
    </>
  )
}
