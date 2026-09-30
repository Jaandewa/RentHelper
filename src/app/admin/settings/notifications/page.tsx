'use client'

import { useEffect, useState } from 'react'
import { MessageSquare, Send, Eye, EyeOff, RefreshCw, CheckCircle, XCircle, Clock, AlertCircle } from 'lucide-react'

interface HostGrapConfig {
  whatsappEnabled: boolean
  hostgrapEmail: string
  hostgrapApiKey: string
  hostgrapApiUrl: string
  hostgrapTestPhone: string
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
  const [config, setConfig] = useState<HostGrapConfig>({
    whatsappEnabled: false,
    hostgrapEmail: '',
    hostgrapApiKey: '',
    hostgrapApiUrl: 'https://wa-api.hostgrap.com',
    hostgrapTestPhone: '',
    whatsappCountryCode: '+94',
  })
  const [logs, setLogs] = useState<DeliveryLog[]>([])
  const [loading, setLoading] = useState(true)
  const [saving, setSaving] = useState(false)
  const [sendingTest, setSendingTest] = useState(false)
  const [testResult, setTestResult] = useState<{ success: boolean; message: string } | null>(null)
  const [showApiKey, setShowApiKey] = useState(false)
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
        setConfig(prev => ({
          whatsappEnabled: data.whatsappEnabled ?? prev.whatsappEnabled,
          hostgrapEmail: data.hostgrapEmail ?? '',
          hostgrapApiKey: data.hostgrapApiKey ?? '',
          hostgrapApiUrl: data.hostgrapApiUrl || 'https://wa-api.hostgrap.com',
          hostgrapTestPhone: data.hostgrapTestPhone ?? '',
          whatsappCountryCode: data.whatsappCountryCode || '+94',
        }))
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
    setSendingTest(true)
    setTestResult(null)
    try {
      const res = await fetch('/api/admin/notifications/test-whatsapp', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({}),
      })
      const data = await res.json()
      setTestResult({
        success: res.ok && data.success !== false,
        message: data.message || data.error || (res.ok ? 'Test message sent successfully' : 'Failed to send test message'),
      })
      await loadLogs()
    } catch {
      setTestResult({ success: false, message: 'Network error' })
    }
    setSendingTest(false)
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
        {/* HostGrap WhatsApp Configuration */}
        <div className="admin-card" style={{ gridColumn: '1 / -1' }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: '12px', marginBottom: '24px' }}>
            <div style={{ width: '42px', height: '42px', borderRadius: '12px', background: 'rgba(37,211,102,0.15)', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
              <MessageSquare size={20} color="#25D366" />
            </div>
            <div>
              <p style={{ margin: 0, fontSize: '16px', fontWeight: 600, color: '#f1f5f9' }}>HostGrap WhatsApp API V2</p>
              <p style={{ margin: 0, fontSize: '13px', color: '#64748b' }}>Configure HostGrap WhatsApp gateway for notifications</p>
            </div>
            <label className="admin-toggle" style={{ marginLeft: 'auto' }}>
              <input
                type="checkbox"
                checked={config.whatsappEnabled}
                onChange={e => setConfig({ ...config, whatsappEnabled: e.target.checked })}
              />
              <span className="admin-toggle__slider" />
            </label>
          </div>

          <div className="admin-form-row" style={{ marginBottom: '16px' }}>
            <div className="admin-form-group">
              <label className="admin-form-label">Registered Email</label>
              <input
                type="email"
                className="admin-form-input"
                value={config.hostgrapEmail}
                onChange={e => setConfig({ ...config, hostgrapEmail: e.target.value })}
                placeholder="e.g. user@example.com"
              />
            </div>
            <div className="admin-form-group">
              <label className="admin-form-label">API Key</label>
              <div style={{ position: 'relative' }}>
                <input
                  className="admin-form-input"
                  type={showApiKey ? 'text' : 'password'}
                  value={config.hostgrapApiKey}
                  onChange={e => setConfig({ ...config, hostgrapApiKey: e.target.value })}
                  placeholder="Enter HostGrap API key"
                  style={{ paddingRight: '40px' }}
                />
                <button
                  type="button"
                  onClick={() => setShowApiKey(!showApiKey)}
                  style={{
                    position: 'absolute',
                    right: '10px',
                    top: '50%',
                    transform: 'translateY(-50%)',
                    background: 'none',
                    border: 'none',
                    color: '#64748b',
                    cursor: 'pointer',
                  }}
                  aria-label={showApiKey ? 'Hide API key' : 'Show API key'}
                >
                  {showApiKey ? <EyeOff size={16} /> : <Eye size={16} />}
                </button>
              </div>
            </div>
          </div>

          <div className="admin-form-row" style={{ marginBottom: '16px' }}>
            <div className="admin-form-group">
              <label className="admin-form-label">API URL</label>
              <input
                type="text"
                className="admin-form-input"
                value={config.hostgrapApiUrl}
                onChange={e => setConfig({ ...config, hostgrapApiUrl: e.target.value })}
                placeholder="https://wa-api.hostgrap.com"
              />
            </div>
            <div className="admin-form-group">
              <label className="admin-form-label">Country Code</label>
              <input
                type="text"
                className="admin-form-input"
                value={config.whatsappCountryCode}
                onChange={e => setConfig({ ...config, whatsappCountryCode: e.target.value })}
                placeholder="+94"
              />
            </div>
          </div>

          <div className="admin-form-row" style={{ marginBottom: '16px' }}>
            <div className="admin-form-group">
              <label className="admin-form-label">Test Phone Number</label>
              <input
                type="text"
                className="admin-form-input"
                value={config.hostgrapTestPhone}
                onChange={e => setConfig({ ...config, hostgrapTestPhone: e.target.value })}
                placeholder="947XXXXXXXX"
              />
            </div>
          </div>

          <div style={{ display: 'flex', gap: '10px', justifyContent: 'flex-end', alignItems: 'center' }}>
            {saved && (
              <span style={{ color: '#34d399', fontSize: '13px', display: 'flex', alignItems: 'center', gap: '6px' }}>
                <CheckCircle size={14} /> Saved
              </span>
            )}
            <button className="admin-btn admin-btn--primary" onClick={saveSettings} disabled={saving}>
              {saving ? 'Saving...' : 'Save Settings'}
            </button>
          </div>
        </div>

        {/* Send Test Message */}
        <div className="admin-card">
          <p style={{ fontSize: '15px', fontWeight: 600, color: '#e2e8f0', margin: '0 0 16px' }}>
            Send Test Message
          </p>
          <p style={{ fontSize: '13px', color: '#94a3b8', margin: '0 0 14px', lineHeight: '1.5' }}>
            Sends a test notification to the configured test phone number: <strong style={{ color: '#f1f5f9' }}>{config.hostgrapTestPhone || 'Not configured'}</strong>.
          </p>
          <div style={{ background: 'rgba(255, 255, 255, 0.03)', border: '1px solid rgba(255, 255, 255, 0.08)', borderRadius: '8px', padding: '12px 14px', marginBottom: '16px', fontSize: '13px', color: '#cbd5e1' }}>
            <span style={{ fontSize: '11px', textTransform: 'uppercase', letterSpacing: '0.05em', color: '#64748b', display: 'block', marginBottom: '4px' }}>Test Message</span>
            RentHelper WhatsApp test message. If you received this message, HostGrap WhatsApp integration is working.
          </div>
          <button
            className="admin-btn admin-btn--success"
            onClick={sendTest}
            disabled={sendingTest}
            style={{ width: '100%' }}
          >
            <Send size={14} /> {sendingTest ? 'Sending...' : 'Send Test Message'}
          </button>
          {testResult && (
            <div
              style={{
                marginTop: '12px',
                padding: '10px 14px',
                borderRadius: '8px',
                background: testResult.success ? 'rgba(16,185,129,0.12)' : 'rgba(239,68,68,0.12)',
                border: `1px solid ${testResult.success ? 'rgba(16,185,129,0.25)' : 'rgba(239,68,68,0.25)'}`,
                fontSize: '13px',
                color: testResult.success ? '#34d399' : '#f87171',
              }}
            >
              {testResult.success ? (
                <CheckCircle size={14} style={{ display: 'inline', marginRight: '6px', verticalAlign: 'text-bottom' }} />
              ) : (
                <XCircle size={14} style={{ display: 'inline', marginRight: '6px', verticalAlign: 'text-bottom' }} />
              )}
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
