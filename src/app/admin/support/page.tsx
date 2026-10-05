'use client'

import { useEffect, useState } from 'react'
import {
  LifeBuoy,
  MessageSquare,
  Clock,
  CheckCircle,
  AlertCircle,
  Search,
  Filter,
  UserCheck,
  Send,
  Lock,
  ArrowRight,
  RefreshCw,
} from 'lucide-react'

interface Ticket {
  id: string
  ticketNumber: string
  userId: string | null
  guestName: string | null
  guestEmail: string | null
  guestPhone: string | null
  category: string
  subject: string
  description: string
  status: string
  priority: string
  createdAt: string
  user: { id: string; name: string; email: string; role: string } | null
  _count: { messages: number }
}

interface TicketDetail extends Ticket {
  messages: Array<{
    id: string
    senderId: string | null
    senderType: string
    message: string
    isInternal: boolean
    createdAt: string
    sender: { id: string; name: string; role: string } | null
  }>
}

export default function AdminSupportInboxPage() {
  const [tickets, setTickets] = useState<Ticket[]>([])
  const [loading, setLoading] = useState(true)
  const [statusFilter, setStatusFilter] = useState('ALL')
  const [categoryFilter, setCategoryFilter] = useState('ALL')

  const [selectedTicket, setSelectedTicket] = useState<TicketDetail | null>(null)
  const [loadingDetail, setLoadingDetail] = useState(false)
  const [replyMessage, setReplyMessage] = useState('')
  const [isInternalNote, setIsInternalNote] = useState(false)
  const [sendingReply, setSendingReply] = useState(false)
  const [actionError, setActionError] = useState<string | null>(null)

  const fetchTickets = async () => {
    setLoading(true)
    try {
      const query = new URLSearchParams()
      if (statusFilter !== 'ALL') query.set('status', statusFilter)
      if (categoryFilter !== 'ALL') query.set('category', categoryFilter)

      const res = await fetch(`/api/admin/support?${query.toString()}`)
      const data = await res.json()
      setTickets(data.tickets || [])
    } catch {
      console.error('Failed to fetch support tickets')
    } finally {
      setLoading(false)
    }
  }

  useEffect(() => {
    fetchTickets()
  }, [statusFilter, categoryFilter])

  const fetchTicketDetail = async (id: string) => {
    setLoadingDetail(true)
    setActionError(null)
    try {
      const res = await fetch(`/api/admin/support/${id}`)
      const data = await res.json()
      setSelectedTicket(data.ticket || null)
    } catch {
      setActionError('Failed to load ticket details')
    } finally {
      setLoadingDetail(false)
    }
  }

  const handlePostReply = async () => {
    if (!selectedTicket || !replyMessage.trim()) return

    setSendingReply(true)
    setActionError(null)

    try {
      const res = await fetch(`/api/admin/support/${selectedTicket.id}`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          message: replyMessage.trim(),
          isInternal: isInternalNote,
        }),
      })

      const data = await res.json()

      if (!res.ok) {
        setActionError(data.message || 'Failed to send reply')
        return
      }

      setReplyMessage('')
      setIsInternalNote(false)
      fetchTicketDetail(selectedTicket.id)
      fetchTickets()
    } catch {
      setActionError('Network error sending reply')
    } finally {
      setSendingReply(false)
    }
  }

  const handleUpdateStatus = async (newStatus: string) => {
    if (!selectedTicket) return
    try {
      await fetch(`/api/admin/support/${selectedTicket.id}`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ status: newStatus }),
      })
      fetchTicketDetail(selectedTicket.id)
      fetchTickets()
    } catch {
      setActionError('Failed to update status')
    }
  }

  const fmtDate = (d: string) =>
    new Date(d).toLocaleString('en-GB', {
      day: '2-digit',
      month: 'short',
      year: 'numeric',
      hour: '2-digit',
      minute: '2-digit',
    })

  return (
    <div style={{ padding: '24px', maxWidth: '1400px', margin: '0 auto' }}>
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '24px' }}>
        <div>
          <h1 className="admin-page-title" style={{ margin: 0, display: 'flex', alignItems: 'center', gap: '10px' }}>
            <LifeBuoy size={24} className="text-purple-600" /> Support Inbox
          </h1>
          <p className="admin-page-subtitle">Manage customer and provider inquiries, login issues, and support tickets.</p>
        </div>
        <button onClick={fetchTickets} className="admin-btn admin-btn--ghost">
          <RefreshCw size={14} /> Refresh
        </button>
      </div>

      {/* Filter Toolbar */}
      <div className="admin-card" style={{ marginBottom: '20px', padding: '16px' }}>
        <div style={{ display: 'flex', gap: '16px', flexWrap: 'wrap', alignItems: 'center' }}>
          <div>
            <label style={{ fontSize: '12px', fontWeight: 500, color: '#64748b', display: 'block', marginBottom: '4px' }}>Status</label>
            <select
              value={statusFilter}
              onChange={(e) => setStatusFilter(e.target.value)}
              className="admin-input"
              style={{ width: '160px' }}
            >
              <option value="ALL">All Statuses</option>
              <option value="OPEN">Open</option>
              <option value="IN_PROGRESS">In Progress</option>
              <option value="WAITING_USER">Waiting User</option>
              <option value="RESOLVED">Resolved</option>
              <option value="CLOSED">Closed</option>
            </select>
          </div>

          <div>
            <label style={{ fontSize: '12px', fontWeight: 500, color: '#64748b', display: 'block', marginBottom: '4px' }}>Category</label>
            <select
              value={categoryFilter}
              onChange={(e) => setCategoryFilter(e.target.value)}
              className="admin-input"
              style={{ width: '220px' }}
            >
              <option value="ALL">All Categories</option>
              <option value="WHATSAPP_VERIFICATION_HELP">WhatsApp Verification</option>
              <option value="LOGIN_BLOCKED">Login / Access Blocked</option>
              <option value="KYC_HELP">KYC Help</option>
              <option value="GENERAL_INQUIRY">General Inquiry</option>
            </select>
          </div>
        </div>
      </div>

      {/* Main Grid: Left List, Right Detail */}
      <div style={{ display: 'grid', gridTemplateColumns: selectedTicket ? '1fr 1.2fr' : '1fr', gap: '20px' }}>
        {/* Ticket List */}
        <div className="admin-card" style={{ padding: '0', overflow: 'hidden' }}>
          {loading ? (
            <div style={{ padding: '40px', textAlign: 'center', color: '#64748b' }}>Loading tickets...</div>
          ) : tickets.length === 0 ? (
            <div style={{ padding: '40px', textAlign: 'center', color: '#64748b' }}>No support tickets found matching filters.</div>
          ) : (
            <div>
              {tickets.map((t) => (
                <div
                  key={t.id}
                  onClick={() => fetchTicketDetail(t.id)}
                  style={{
                    padding: '16px',
                    cursor: 'pointer',
                    backgroundColor: selectedTicket?.id === t.id ? '#f8fafc' : 'transparent',
                    borderLeft: selectedTicket?.id === t.id ? '4px solid #7c3aed' : '4px solid transparent',
                    borderBottom: '1px solid #f1f5f9',
                    transition: 'background-color 0.15s ease',
                  }}
                >
                  <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '6px' }}>
                    <span style={{ fontSize: '12px', fontFamily: 'monospace', fontWeight: 600, color: '#7c3aed' }}>
                      {t.ticketNumber}
                    </span>
                    <span className={`admin-badge admin-badge--${t.status.toLowerCase()}`}>{t.status}</span>
                  </div>

                  <h3 style={{ fontSize: '14px', fontWeight: 600, margin: '0 0 4px 0', color: '#0f172a' }}>{t.subject}</h3>

                  <p style={{ fontSize: '12px', color: '#64748b', margin: '0 0 8px 0', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>
                    {t.description}
                  </p>

                  <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', fontSize: '11px', color: '#94a3b8' }}>
                    <span>{t.user?.name || t.guestName || 'Guest'} · {t.user?.email || t.guestEmail || 'No email'}</span>
                    <span>{fmtDate(t.createdAt)}</span>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>

        {/* Selected Ticket Drawer / Conversation */}
        {selectedTicket && (
          <div className="admin-card" style={{ padding: '20px', display: 'flex', flexDirection: 'column', height: 'fit-content' }}>
            {loadingDetail ? (
              <div style={{ padding: '40px', textAlign: 'center', color: '#64748b' }}>Loading conversation...</div>
            ) : (
              <>
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: '16px', borderBottom: '1px solid #f1f5f9', paddingBottom: '16px' }}>
                  <div>
                    <div style={{ display: 'flex', alignItems: 'center', gap: '8px', marginBottom: '4px' }}>
                      <span style={{ fontSize: '13px', fontFamily: 'monospace', fontWeight: 700, color: '#7c3aed' }}>
                        {selectedTicket.ticketNumber}
                      </span>
                      <span className={`admin-badge admin-badge--${selectedTicket.status.toLowerCase()}`}>
                        {selectedTicket.status}
                      </span>
                    </div>
                    <h2 style={{ fontSize: '18px', fontWeight: 700, margin: 0, color: '#0f172a' }}>{selectedTicket.subject}</h2>
                    <p style={{ fontSize: '12px', color: '#64748b', marginTop: '4px' }}>
                      Category: <strong>{selectedTicket.category}</strong> · Requested by:{' '}
                      <strong>{selectedTicket.user?.name || selectedTicket.guestName || 'Guest'}</strong> (
                      {selectedTicket.user?.email || selectedTicket.guestEmail || 'N/A'})
                    </p>
                  </div>

                  {/* Status controls */}
                  <div style={{ display: 'flex', gap: '6px' }}>
                    {selectedTicket.status !== 'RESOLVED' && (
                      <button
                        onClick={() => handleUpdateStatus('RESOLVED')}
                        className="admin-btn admin-btn--success admin-btn--sm"
                      >
                        <CheckCircle size={13} /> Mark Resolved
                      </button>
                    )}
                    {selectedTicket.status !== 'CLOSED' && (
                      <button
                        onClick={() => handleUpdateStatus('CLOSED')}
                        className="admin-btn admin-btn--ghost admin-btn--sm"
                      >
                        Close Ticket
                      </button>
                    )}
                  </div>
                </div>

                {actionError && (
                  <div style={{ padding: '10px', backgroundColor: '#fef2f2', color: '#991b1b', borderRadius: '6px', marginBottom: '12px', fontSize: '12px' }}>
                    {actionError}
                  </div>
                )}

                {/* Message Thread */}
                <div style={{ display: 'flex', flexDirection: 'column', gap: '12px', marginBottom: '20px', maxHeight: '400px', overflowY: 'auto', paddingRight: '8px' }}>
                  {selectedTicket.messages.map((m) => (
                    <div
                      key={m.id}
                      style={{
                        padding: '12px',
                        borderRadius: '8px',
                        backgroundColor: m.isInternal
                          ? '#fefce8'
                          : m.senderType === 'ADMIN'
                          ? '#f0f9ff'
                          : '#f8fafc',
                        border: m.isInternal ? '1px solid #fef08a' : '1px solid #e2e8f0',
                      }}
                    >
                      <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '4px', fontSize: '11px', color: '#64748b' }}>
                        <strong>
                          {m.isInternal ? '🔒 Internal Note by Admin' : m.senderType === 'ADMIN' ? '🛡️ Support Admin' : selectedTicket.user?.name || selectedTicket.guestName || 'Requester'}
                        </strong>
                        <span>{fmtDate(m.createdAt)}</span>
                      </div>
                      <p style={{ fontSize: '13px', margin: 0, color: '#1e293b', whiteSpace: 'pre-wrap' }}>{m.message}</p>
                    </div>
                  ))}
                </div>

                {/* Reply Form */}
                <div style={{ borderTop: '1px solid #f1f5f9', paddingTop: '16px' }}>
                  <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '8px' }}>
                    <label style={{ fontSize: '12px', fontWeight: 600, color: '#475569' }}>Post Response or Note</label>
                    <label style={{ fontSize: '12px', color: '#854d0e', display: 'flex', alignItems: 'center', gap: '4px', cursor: 'pointer' }}>
                      <input
                        type="checkbox"
                        checked={isInternalNote}
                        onChange={(e) => setIsInternalNote(e.target.checked)}
                      />
                      Internal Note Only (Hidden from user)
                    </label>
                  </div>

                  <textarea
                    rows={3}
                    placeholder={isInternalNote ? 'Write an internal staff note...' : 'Type public response to the user...'}
                    value={replyMessage}
                    onChange={(e) => setReplyMessage(e.target.value)}
                    className="admin-input"
                    style={{ width: '100%', marginBottom: '8px', resize: 'vertical' }}
                  />

                  <div style={{ display: 'flex', justifyContent: 'flex-end' }}>
                    <button
                      onClick={handlePostReply}
                      disabled={sendingReply || !replyMessage.trim()}
                      className="admin-btn admin-btn--primary"
                    >
                      <Send size={14} /> {sendingReply ? 'Sending...' : isInternalNote ? 'Save Internal Note' : 'Send Reply'}
                    </button>
                  </div>
                </div>
              </>
            )}
          </div>
        )}
      </div>
    </div>
  )
}
