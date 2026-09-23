'use client'

import { useEffect, useState, use } from 'react'
import { useRouter } from 'next/navigation'
import { ArrowLeft, Shield, FileText, CheckCircle, XCircle, AlertCircle, UserX } from 'lucide-react'

interface CustomerDetail {
  id: string
  nicNumber: string | null
  dateOfBirth: string | null
  kycStatus: string
  kycRejectionReason: string | null
  trustScore: number
  createdAt: string
  user: { id: string; name: string; email: string; status: string }
  customerDocuments: Array<{ id: string; type: string; url: string; uploadedAt: string }>
  bookings: Array<{ id: string; bookingNumber: string; status: string; totalAmount: number; createdAt: string }>
  kycApprovals: Array<{ id: string; action: string; performedBy: string; notes: string | null; createdAt: string }>
  _count: { bookings: number }
}

export default function CustomerDetailPage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = use(params)
  const router = useRouter()
  const [customer, setCustomer] = useState<CustomerDetail | null>(null)
  const [loading, setLoading] = useState(true)
  const [kycModal, setKycModal] = useState<'verified' | 'rejected' | null>(null)
  const [kycNote, setKycNote] = useState('')
  const [suspendModal, setSuspendModal] = useState(false)
  const [suspendReason, setSuspendReason] = useState('')
  const [submitting, setSubmitting] = useState(false)

  const fetchCustomer = async () => {
    const res = await fetch(`/api/admin/customers/${id}`)
    const data = await res.json()
    setCustomer(data.customer)
    setLoading(false)
  }

  useEffect(() => { fetchCustomer() }, [id])

  const doKyc = async () => {
    setSubmitting(true)
    await fetch(`/api/admin/customers/${id}`, {
      method: 'PATCH',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ kycStatus: kycModal, kycRejectionReason: kycNote }),
    })
    setKycModal(null); setKycNote('')
    await fetchCustomer()
    setSubmitting(false)
  }

  const doSuspend = async () => {
    setSubmitting(true)
    await fetch(`/api/admin/customers/${id}`, {
      method: 'PATCH',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ userStatus: 'suspended', suspendReason }),
    })
    setSuspendModal(false); setSuspendReason('')
    await fetchCustomer()
    setSubmitting(false)
  }

  const doUnsuspend = async () => {
    await fetch(`/api/admin/customers/${id}`, {
      method: 'PATCH',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ userStatus: 'active' }),
    })
    await fetchCustomer()
  }

  const fmt = (d: string) => new Date(d).toLocaleDateString('en-GB', { day: '2-digit', month: 'short', year: 'numeric' })

  if (loading) return <div style={{ padding: '60px', textAlign: 'center', color: '#475569' }}>Loading...</div>
  if (!customer) return <div style={{ padding: '60px', textAlign: 'center', color: '#f87171' }}>Customer not found</div>

  return (
    <>
      <div style={{ marginBottom: '24px', display: 'flex', alignItems: 'flex-start', gap: '16px' }}>
        <button onClick={() => router.back()} className="admin-btn admin-btn--ghost admin-btn--sm" style={{ marginTop: '4px' }}>
          <ArrowLeft size={14} />
        </button>
        <div style={{ flex: 1 }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: '12px', flexWrap: 'wrap' }}>
            <h1 className="admin-page-title" style={{ margin: 0 }}>{customer.user.name}</h1>
            <span className={`admin-badge admin-badge--${customer.kycStatus}`}>{customer.kycStatus}</span>
            <span className={`admin-badge admin-badge--${customer.user.status}`}>{customer.user.status}</span>
          </div>
          <p className="admin-page-subtitle">{customer.user.email} · Joined {fmt(customer.createdAt)}</p>
        </div>
        <div style={{ display: 'flex', gap: '8px' }}>
          {customer.kycStatus === 'pending' && (
            <>
              <button className="admin-btn admin-btn--success" onClick={() => setKycModal('verified')}>
                <CheckCircle size={15} /> Verify KYC
              </button>
              <button className="admin-btn admin-btn--danger" onClick={() => setKycModal('rejected')}>
                <XCircle size={15} /> Reject KYC
              </button>
            </>
          )}
          {customer.user.status === 'active' ? (
            <button className="admin-btn admin-btn--danger" onClick={() => setSuspendModal(true)}>
              <UserX size={15} /> Suspend
            </button>
          ) : (
            <button className="admin-btn admin-btn--success" onClick={doUnsuspend}>
              <CheckCircle size={15} /> Unsuspend
            </button>
          )}
        </div>
      </div>

      <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '20px', marginBottom: '20px' }}>
        {/* Personal Info */}
        <div className="admin-card">
          <h3 style={{ margin: '0 0 18px', fontSize: '15px', fontWeight: 600, color: '#e2e8f0' }}>Personal Info</h3>
          {[
            { label: 'Name', value: customer.user.name },
            { label: 'Email', value: customer.user.email },
            { label: 'NIC Number', value: customer.nicNumber || '—' },
            { label: 'Date of Birth', value: customer.dateOfBirth ? fmt(customer.dateOfBirth) : '—' },
          ].map(r => (
            <div key={r.label} style={{ marginBottom: '12px' }}>
              <p style={{ margin: 0, fontSize: '11px', color: '#475569', fontWeight: 600, textTransform: 'uppercase', letterSpacing: '0.05em' }}>{r.label}</p>
              <p style={{ margin: 0, fontSize: '13px', color: '#cbd5e1' }}>{r.value}</p>
            </div>
          ))}
          <div style={{ display: 'flex', alignItems: 'center', gap: '8px', marginTop: '12px' }}>
            <Shield size={16} color={customer.trustScore > 7 ? '#34d399' : customer.trustScore > 4 ? '#fbbf24' : '#f87171'} />
            <div>
              <p style={{ margin: 0, fontSize: '11px', color: '#475569', fontWeight: 600, textTransform: 'uppercase', letterSpacing: '0.05em' }}>Trust Score</p>
              <p style={{ margin: 0, fontSize: '20px', fontWeight: 700, color: '#e2e8f0' }}>{customer.trustScore.toFixed(1)}</p>
            </div>
          </div>
        </div>

        {/* KYC Documents */}
        <div className="admin-card">
          <h3 style={{ margin: '0 0 18px', fontSize: '15px', fontWeight: 600, color: '#e2e8f0', display: 'flex', alignItems: 'center', gap: '8px' }}>
            <FileText size={16} color="#3B82F6" /> KYC Documents
          </h3>
          {customer.customerDocuments.length === 0 ? (
            <p style={{ color: '#475569', fontSize: '13px', margin: 0 }}>No documents uploaded</p>
          ) : (
            customer.customerDocuments.map(doc => (
              <div key={doc.id} style={{ display: 'flex', alignItems: 'center', gap: '10px', padding: '10px', background: 'rgba(255,255,255,0.03)', borderRadius: '8px', marginBottom: '8px' }}>
                <FileText size={14} color="#3B82F6" />
                <div style={{ flex: 1 }}>
                  <p style={{ margin: 0, fontSize: '13px', color: '#cbd5e1', textTransform: 'capitalize' }}>{doc.type.replace(/_/g, ' ')}</p>
                  <p style={{ margin: 0, fontSize: '11px', color: '#475569' }}>{fmt(doc.uploadedAt)}</p>
                </div>
                <a href={doc.url} target="_blank" rel="noopener noreferrer" className="admin-btn admin-btn--ghost admin-btn--sm">View</a>
              </div>
            ))
          )}
          {customer.kycRejectionReason && (
            <div style={{ marginTop: '12px', padding: '10px', background: 'rgba(239,68,68,0.08)', borderRadius: '8px', border: '1px solid rgba(239,68,68,0.15)' }}>
              <p style={{ margin: 0, fontSize: '11px', color: '#f87171', fontWeight: 600 }}>Rejection Reason</p>
              <p style={{ margin: '4px 0 0', fontSize: '13px', color: '#fca5a5' }}>{customer.kycRejectionReason}</p>
            </div>
          )}
        </div>
      </div>

      {/* KYC History + Bookings */}
      <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '20px' }}>
        <div className="admin-card">
          <h3 style={{ margin: '0 0 18px', fontSize: '15px', fontWeight: 600, color: '#e2e8f0' }}>KYC History</h3>
          {customer.kycApprovals.length === 0 ? (
            <p style={{ color: '#475569', fontSize: '13px', margin: 0 }}>No KYC actions yet</p>
          ) : customer.kycApprovals.map(k => (
            <div key={k.id} style={{ borderLeft: '2px solid rgba(59,130,246,0.3)', paddingLeft: '12px', marginBottom: '12px' }}>
              <p style={{ margin: 0, fontSize: '13px', fontWeight: 600, color: '#cbd5e1', textTransform: 'capitalize' }}>{k.action}</p>
              {k.notes && <p style={{ margin: '2px 0', fontSize: '12px', color: '#64748b' }}>{k.notes}</p>}
              <p style={{ margin: 0, fontSize: '11px', color: '#475569' }}>{fmt(k.createdAt)}</p>
            </div>
          ))}
        </div>

        <div className="admin-card">
          <h3 style={{ margin: '0 0 18px', fontSize: '15px', fontWeight: 600, color: '#e2e8f0' }}>Recent Bookings ({customer._count.bookings})</h3>
          {customer.bookings.length === 0 ? (
            <p style={{ color: '#475569', fontSize: '13px', margin: 0 }}>No bookings yet</p>
          ) : customer.bookings.map(b => (
            <div key={b.id} style={{ display: 'flex', alignItems: 'center', gap: '10px', padding: '8px 0', borderBottom: '1px solid rgba(255,255,255,0.04)' }}>
              <div style={{ flex: 1 }}>
                <p style={{ margin: 0, fontSize: '13px', color: '#cbd5e1', fontWeight: 500 }}>{b.bookingNumber}</p>
                <p style={{ margin: 0, fontSize: '11px', color: '#475569' }}>LKR {b.totalAmount.toLocaleString()} · {fmt(b.createdAt)}</p>
              </div>
              <span className={`admin-badge admin-badge--${b.status === 'completed' ? 'approved' : b.status === 'cancelled' ? 'rejected' : 'trial'}`}>
                {b.status}
              </span>
            </div>
          ))}
        </div>
      </div>

      {/* KYC Action Modal */}
      {kycModal && (
        <div className="admin-modal-overlay" onClick={() => setKycModal(null)}>
          <div className="admin-modal" onClick={e => e.stopPropagation()}>
            <h3 className="admin-modal__title">
              {kycModal === 'verified' ? '✅ Verify KYC' : '❌ Reject KYC'}
            </h3>
            <p className="admin-modal__subtitle">
              {kycModal === 'verified' ? `${customer.user.name}'s identity will be verified.` : 'Provide a reason for rejection.'}
            </p>
            <div className="admin-form-group">
              <label className="admin-form-label">Note {kycModal === 'rejected' ? '(required)' : '(optional)'}</label>
              <textarea className="admin-form-textarea" placeholder="Add a note..." value={kycNote} onChange={e => setKycNote(e.target.value)} />
            </div>
            <div className="admin-modal__actions">
              <button className="admin-btn admin-btn--ghost" onClick={() => setKycModal(null)}>Cancel</button>
              <button
                className={`admin-btn ${kycModal === 'verified' ? 'admin-btn--success' : 'admin-btn--danger'}`}
                onClick={doKyc}
                disabled={submitting || (kycModal === 'rejected' && !kycNote)}
              >
                {submitting ? 'Saving...' : 'Confirm'}
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Suspend Modal */}
      {suspendModal && (
        <div className="admin-modal-overlay" onClick={() => setSuspendModal(false)}>
          <div className="admin-modal" onClick={e => e.stopPropagation()}>
            <h3 className="admin-modal__title">⏸️ Suspend Customer</h3>
            <p className="admin-modal__subtitle">{customer.user.name} will lose access immediately.</p>
            <div className="admin-form-group">
              <label className="admin-form-label">Reason (required)</label>
              <textarea className="admin-form-textarea" placeholder="Reason for suspension..." value={suspendReason} onChange={e => setSuspendReason(e.target.value)} />
            </div>
            <div className="admin-modal__actions">
              <button className="admin-btn admin-btn--ghost" onClick={() => setSuspendModal(false)}>Cancel</button>
              <button className="admin-btn admin-btn--danger" onClick={doSuspend} disabled={submitting || !suspendReason}>
                {submitting ? 'Saving...' : 'Suspend'}
              </button>
            </div>
          </div>
        </div>
      )}
    </>
  )
}
