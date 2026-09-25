'use client'

import { useEffect, useState } from 'react'
import { MessageSquare, Send, Eye, EyeOff, RefreshCw, CheckCircle, XCircle, Clock, AlertCircle } from 'lucide-react'

interface WhatsAppConfig {
  whatsappEnabled: boolean
  whatsappProvider: string
  whatsappBaseUrl: string
  whatsappAccessToken: string
  whatsappPhoneNumberId: string
  whatsappBusinessId: string
  whatsappWebhookToken: string
  whatsappCountryCode: string
}

interface DeliveryLog {
  id: string
  type: string
  recipient: string
  channel: string
  status: string
  error: string | null
  sentAt: string | null
  createdAt: string
}

export default function NotificationSettingsPage() {
  const [config, setConfig] = useState<WhatsAppConfig>({
    whatsappEnabled: false,
    whatsappProvider: 'meta',
    whatsappBaseUrl: 'https://graph.facebook.com/v17.0',
    whatsappAccessToken: '',
    whatsappPhoneNumberId: '',
    whatsappBusinessId: '',
    whatsappWebhookToken: '',
    whatsappCountryCode: '+94',
  })
  const [logs, setLogs] = useState<DeliveryLog[]>([])
  const [loading, setLoading] = useState(true)
  const [saving, setSaving] = useState(false)
  const [testPhone, setTestPhone] = useState('')
  const [testMessage, setTestMessage] = useState('Hello from RentHelper! This is a test message.')
  const [testResult, setTestResult] = useState<{ success: boolean; message: string } | null>(null)
  const [showToken, setShowToken] = useState(false)
  const [saved, setSaved] = useState(false)

  useEffect(() => {
    loadSettings()
    loadLogs()
  }, [])

  const loadSettings = async () => {
    try {
      const res = await fetch('/api/admin/notifications/settings')
      if (res.ok) {
        const data = await res.json()
        setConfig(data)
      }
    } catch {
      // Use defaults
    }
    setLoading(false)
  }

  const loadLogs = async () => {
    try {
      const res = await fetch('/api/admin/notifications/logs?limit=20')
      if (res.ok) {
        const data = await res.json()
        setLogs(data.logs || [])
      }
    } catch {
      // Ignore
    }
  }

  const saveSettings = async () => {
    setSaving(true)
    setSaved(false)
    try {
      const res = await fetch('/api/admin/notifications/settings', {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(config),
      })
      if (res.ok) {
        setSaved(true)
        setTimeout(() => setSaved(false), 3000)
        await loadSettings()
      }
    } catch {
      // Handle error
    }
    setSaving(false)
  }

  const sendTest = async () => {
    setTestResult(null)
    try {
      const res = await fetch('/api/admin/notifications/test-whatsapp', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ phone: testPhone, message: testMessage }),
      })
      const data = await res.json()
      setTestResult({ success: res.ok, message: data.message || data.error || 'Unknown result' })
      await loadLogs()
    } catch {
      setTestResult({ success: false, message: 'Network error' })
    }
  }

  const statusIcon = (status: string) => {
    switch (status) {
      case 'sent': return <CheckCircle className="w-3.5 h-3.5 text-green-400" />
      case 'failed': return <XCircle className="w-3.5 h-3.5 text-red-400" />
      case 'not_configured': return <AlertCircle className="w-3.5 h-3.5 text-yellow-400" />
      default: return <Clock className="w-3.5 h-3.5 text-gray-400" />
    }
  }

  if (loading) {
    return (
      <div style={{ padding: '60px', textAlign: 'center', color: '#475569' }}>
        <div className="admin-spinner" style={{ margin: '0 auto' }} />
      </div>
    )
  }

  return (
    <>
      <div className="admin-page-header">
        <h1 className="admin-page-title">Notification Settings</h1>
        <p className="admin-page-subtitle">Configure WhatsApp API for customer notifications</p>
      </div>

      <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '20px' }}>
        {/* WhatsApp Configuration */}
        <div className="admin-card" style={{ gridColumn: '1 / -1' }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: '12px', marginBottom: '24px' }}>
            <div style={{ width: '42px', height: '42px', borderRadius: '12px', background: 'rgba(37,211,102,0.15)', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
              <MessageSquare size={20} color="#25D366" />
            </div>
            <div>
              <p style={{ margin: 0, fontSize: '16px', fontWeight: 600, color: '#f1f5f9' }}>WhatsApp Business API</p>
              <p style={{ margin: 0, fontSize: '13px', color: '#64748b' }}>Meta Cloud API integration</p>
            </div>
            <label className="admin-toggle" style={{ marginLeft: 'auto' }}>
              <input type="checkbox" checked={config.whatsappEnabled} onChange={e => setConfig({ ...config, whatsappEnabled: e.target.checked })} />
              <span className="admin-toggle__slider" />
            </label>
          </div>

          <div className="admin-form-row" style={{ marginBottom: '16px' }}>
            <div className="admin-form-group">
              <label className="admin-form-label">API Base URL</label>
              <input className="admin-form-input" value={config.whatsappBaseUrl || ''} onChange={e => setConfig({ ...config, whatsappBaseUrl: e.target.value })} placeholder="https://graph.facebook.com/v17.0" />
            </div>
            <div className="admin-form-group">
              <label className="admin-form-label">Provider</label>
              <select className="admin-form-select" value={config.whatsappProvider} onChange={e => setConfig({ ...config, whatsappProvider: e.target.value })}>
                <option value="meta">Meta Business API</option>
                <option value="twilio">Twilio</option>
                <option value="dialog">Dialog (Sri Lanka)</option>
              </select>
            </div>
          </div>

          <div className="admin-form-row" style={{ marginBottom: '16px' }}>
            <div className="admin-form-group">
              <label className="admin-form-label">Access Token / API Key</label>
              <div style={{ position: 'relative' }}>
                <input className="admin-form-input" type={showToken ? 'text' : 'password'} value={config.whatsappAccessToken || ''} onChange={e => setConfig({ ...config, whatsappAccessToken: e.target.value })} placeholder="Enter access token" style={{ paddingRight: '40px' }} />
                <button onClick={() => setShowToken(!showToken)} style={{ position: 'absolute', right: '10px', top: '50%', transform: 'translateY(-50%)', background: 'none', border: 'none', color: '#64748b', cursor: 'pointer' }}>
                  {showToken ? <EyeOff size={16} /> : <Eye size={16} />}
                </button>
              </div>
            </div>
            <div className="admin-form-group">
              <label className="admin-form-label">Phone Number ID</label>
              <input className="admin-form-input" value={config.whatsappPhoneNumberId || ''} onChange={e => setConfig({ ...config, whatsappPhoneNumberId: e.target.value })} placeholder="e.g. 123456789012345" />
            </div>
          </div>

          <div className="admin-form-row" style={{ marginBottom: '16px' }}>
            <div className="admin-form-group">
              <label className="admin-form-label">Business Account ID</label>
              <input className="admin-form-input" value={config.whatsappBusinessId || ''} onChange={e => setConfig({ ...config, whatsappBusinessId: e.target.value })} placeholder="Optional" />
            </div>
            <div className="admin-form-group">
              <label className="admin-form-label">Default Country Code</label>
              <input className="admin-form-input" value={config.whatsappCountryCode || '+94'} onChange={e => setConfig({ ...config, whatsappCountryCode: e.target.value })} placeholder="+94" />
            </div>
          </div>

          <div style={{ display: 'flex', gap: '10px', justifyContent: 'flex-end' }}>
            {saved && <span style={{ color: '#34d399', fontSize: '13px', display: 'flex', alignItems: 'center', gap: '6px' }}><CheckCircle size={14} /> Saved</span>}
            <button className="admin-btn admin-btn--primary" onClick={saveSettings} disabled={saving}>
              {saving ? 'Saving...' : 'Save Settings'}
            </button>
          </div>
        </div>

        {/* Test Message */}
        <div className="admin-card">
          <p style={{ fontSize: '15px', fontWeight: 600, color: '#e2e8f0', margin: '0 0 16px' }}>Send Test Message</p>
          <div className="admin-form-group">
            <label className="admin-form-label">Phone Number</label>
            <input className="admin-form-input" value={testPhone} onChange={e => setTestPhone(e.target.value)} placeholder="e.g. 0771234567" />
          </div>
          <div className="admin-form-group">
            <label className="admin-form-label">Message</label>
            <textarea className="admin-form-textarea" value={testMessage} onChange={e => setTestMessage(e.target.value)} rows={3} />
          </div>
          <button className="admin-btn admin-btn--success" onClick={sendTest} disabled={!testPhone} style={{ width: '100%' }}>
            <Send size={14} /> Send Test WhatsApp
          </button>
          {testResult && (
            <div style={{ marginTop: '12px', padding: '10px 14px', borderRadius: '8px', background: testResult.success ? 'rgba(16,185,129,0.12)' : 'rgba(239,68,68,0.12)', border: `1px solid ${testResult.success ? 'rgba(16,185,129,0.25)' : 'rgba(239,68,68,0.25)'}`, fontSize: '13px', color: testResult.success ? '#34d399' : '#f87171' }}>
              {testResult.success ? <CheckCircle size={14} style={{ display: 'inline', marginRight: '6px' }} /> : <XCircle size={14} style={{ display: 'inline', marginRight: '6px' }} />}
              {testResult.message}
            </div>
          )}
        </div>

        {/* Delivery Logs */}
        <div className="admin-table-wrapper">
          <div className="admin-table-toolbar">
            <p className="admin-table-toolbar__title">Delivery Logs</p>
            <button className="admin-btn admin-btn--ghost admin-btn--sm" onClick={loadLogs}>
              <RefreshCw size={12} /> Refresh
            </button>
          </div>
          {logs.length === 0 ? (
            <div className="admin-empty" style={{ padding: '30px' }}>
              <div className="admin-empty-icon">📨</div>
              <p>No delivery logs yet</p>
            </div>
          ) : (
            <table className="admin-table">
              <thead>
                <tr>
                  <th>Status</th>
                  <th>Type</th>
                  <th>Recipient</th>
                  <th>Channel</th>
                  <th>Time</th>
                </tr>
              </thead>
              <tbody>
                {logs.map(log => (
                  <tr key={log.id}>
                    <td>{statusIcon(log.status)} <span style={{ marginLeft: '6px' }}>{log.status}</span></td>
                    <td style={{ textTransform: 'capitalize' }}>{log.type.replace(/_/g, ' ')}</td>
                    <td>{log.recipient}</td>
                    <td><span className={`admin-badge admin-badge--${log.channel === 'whatsapp' ? 'active' : 'trial'}`}>{log.channel}</span></td>
                    <td>{new Date(log.createdAt).toLocaleString()}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          )}
        </div>
      </div>
    </>
  )
}
