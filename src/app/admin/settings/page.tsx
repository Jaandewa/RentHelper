'use client'

import { useEffect, useState } from 'react'
import { Save, Eye, EyeOff, Palette, Globe, Mail, CreditCard, Shield, CheckCircle, Package } from 'lucide-react'

interface SiteSettings {
  id: string
  siteName: string
  siteTagline: string
  logoUrl: string | null
  faviconUrl: string | null
  primaryColor: string
  secondaryColor: string
  googleClientId: string | null
  googleClientSecret: string | null
  emailFromName: string
  emailFromAddress: string
  smtpHost: string | null
  smtpPort: number
  smtpUser: string | null
  smtpPass: string | null
  maintenanceMode: boolean
  allowNewRegistrations: boolean
  defaultTrialDays: number
  subscriptionPrice: number
  subscriptionName: string
  subscriptionMaxItems: number
  itemFieldConfig: string | null
}

// All available item fields with their default settings
const ITEM_FIELDS = [
  { key: 'sku',          label: 'SKU / Item Code',         group: 'Basic' },
  { key: 'brand',        label: 'Brand',                   group: 'Basic' },
  { key: 'model',        label: 'Model',                   group: 'Basic' },
  { key: 'serialNumber', label: 'Serial Number',           group: 'Basic' },
  { key: 'description',  label: 'Description',             group: 'Basic' },
  { key: 'condition',    label: 'Condition',                group: 'Basic' },
  { key: 'images',       label: 'Images / Photos',         group: 'Basic' },
  { key: 'dailyRate',    label: 'Daily Rate (LKR)',         group: 'Pricing' },
  { key: 'weeklyRate',   label: 'Weekly Rate (LKR)',        group: 'Pricing' },
  { key: 'monthlyRate',  label: 'Monthly Rate (LKR)',       group: 'Pricing' },
  { key: 'hourlyRate',   label: 'Hourly Rate (LKR)',        group: 'Pricing' },
  { key: 'deposit',      label: 'Security Deposit (LKR)',   group: 'Pricing' },
  { key: 'minDays',      label: 'Minimum Rental Days',     group: 'Rules' },
  { key: 'maxDays',      label: 'Maximum Rental Days',     group: 'Rules' },
  { key: 'quantity',     label: 'Available Quantity',      group: 'Stock' },
  { key: 'location',     label: 'Item Location / Address', group: 'Location' },
  { key: 'deliveryAvailable', label: 'Delivery Available', group: 'Location' },
  { key: 'deliveryFee', label: 'Delivery Fee (LKR)',       group: 'Location' },
  { key: 'tags',         label: 'Tags / Keywords',         group: 'Extra' },
  { key: 'notes',        label: 'Internal Notes',          group: 'Extra' },
]

const FIELD_GROUPS = ['Basic', 'Pricing', 'Rules', 'Stock', 'Location', 'Extra']

type FieldConfig = Record<string, { required: boolean; visible: boolean }>

const DEFAULT_FIELD_CONFIG: FieldConfig = {
  sku: { required: false, visible: true },
  brand: { required: false, visible: true },
  model: { required: false, visible: true },
  serialNumber: { required: false, visible: false },
  description: { required: true, visible: true },
  condition: { required: true, visible: true },
  images: { required: false, visible: true },
  dailyRate: { required: true, visible: true },
  weeklyRate: { required: false, visible: true },
  monthlyRate: { required: false, visible: true },
  hourlyRate: { required: false, visible: true },
  deposit: { required: false, visible: true },
  minDays: { required: false, visible: true },
  maxDays: { required: false, visible: true },
  quantity: { required: true, visible: true },
  location: { required: false, visible: true },
  deliveryAvailable: { required: false, visible: true },
  deliveryFee: { required: false, visible: true },
  tags: { required: false, visible: true },
  notes: { required: false, visible: false },
}

const TABS = [
  { id: 'branding', label: 'Branding & Site', icon: Palette },
  { id: 'subscription', label: 'Subscription', icon: CreditCard },
  { id: 'itemfields', label: 'Item Fields', icon: Package },
  { id: 'apis', label: 'API Keys', icon: Shield },
  { id: 'email', label: 'Email / SMTP', icon: Mail },
  { id: 'platform', label: 'Platform', icon: Globe },
]

export default function SettingsPage() {
  const [settings, setSettings] = useState<SiteSettings | null>(null)
  const [form, setForm] = useState<Partial<SiteSettings>>({})
  const [fieldConfig, setFieldConfig] = useState<FieldConfig>(DEFAULT_FIELD_CONFIG)
  const [loading, setLoading] = useState(true)
  const [saving, setSaving] = useState(false)
  const [saved, setSaved] = useState(false)
  const [activeTab, setActiveTab] = useState('branding')
  const [showSecrets, setShowSecrets] = useState<Record<string, boolean>>({})

  useEffect(() => {
    fetch('/api/admin/settings')
      .then(r => r.json())
      .then(d => {
        setSettings(d.settings)
        setForm(d.settings)
        // Parse stored fieldConfig or use defaults
        if (d.settings?.itemFieldConfig) {
          try {
            const parsed = JSON.parse(d.settings.itemFieldConfig)
            setFieldConfig({ ...DEFAULT_FIELD_CONFIG, ...parsed })
          } catch { /* keep defaults */ }
        }
        setLoading(false)
      })
  }, [])

  const save = async () => {
    setSaving(true)
    const res = await fetch('/api/admin/settings', {
      method: 'PATCH',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ ...form, itemFieldConfig: JSON.stringify(fieldConfig) }),
    })
    if (!res.ok) {
      setSaving(false)
      alert('Failed to save settings. Please try again.')
      return
    }
    const data = await res.json()
    setSettings(data.settings)
    setForm(data.settings)
    setSaving(false)
    setSaved(true)
    setTimeout(() => setSaved(false), 3000)
  }

  const set = (key: keyof SiteSettings, value: string | number | boolean) =>
    setForm(f => ({ ...f, [key]: value }))

  const toggleSecret = (key: string) =>
    setShowSecrets(s => ({ ...s, [key]: !s[key] }))

  if (loading) return <div style={{ padding: '60px', textAlign: 'center', color: '#475569' }}>Loading settings...</div>

  return (
    <>
      <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '28px', flexWrap: 'wrap', gap: '12px' }}>
        <div className="admin-page-header" style={{ margin: 0 }}>
          <h1 className="admin-page-title">Site Settings</h1>
          <p className="admin-page-subtitle">Configure your RentHelper platform</p>
        </div>
        <button
          className="admin-btn admin-btn--primary"
          onClick={save}
          disabled={saving}
          style={{ minWidth: '140px' }}
        >
          {saved ? <><CheckCircle size={15} /> Saved!</> : saving ? 'Saving...' : <><Save size={15} /> Save Changes</>}
        </button>
      </div>

      {/* Tabs */}
      <div className="admin-tabs">
        {TABS.map(tab => {
          const Icon = tab.icon
          return (
            <button
              key={tab.id}
              className={`admin-tab ${activeTab === tab.id ? 'admin-tab--active' : ''}`}
              onClick={() => setActiveTab(tab.id)}
              style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '6px' }}
            >
              <Icon size={14} />
              {tab.label}
            </button>
          )
        })}
      </div>

      {/* BRANDING TAB */}
      {activeTab === 'branding' && (
        <div className="admin-card">
          <h3 style={{ margin: '0 0 20px', fontSize: '15px', fontWeight: 600, color: '#e2e8f0' }}>Branding & Identity</h3>
          
          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '16px' }}>
            <div className="admin-form-group">
              <label className="admin-form-label">Site Name</label>
              <input
                className="admin-form-input"
                value={form.siteName || ''}
                onChange={e => set('siteName', e.target.value)}
                placeholder="RentHelper"
              />
            </div>
            <div className="admin-form-group">
              <label className="admin-form-label">Site Tagline</label>
              <input
                className="admin-form-input"
                value={form.siteTagline || ''}
                onChange={e => set('siteTagline', e.target.value)}
                placeholder="Smart Rental Management"
              />
            </div>
          </div>

          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '16px' }}>
            <div className="admin-form-group">
              <label className="admin-form-label">Logo URL</label>
              <input
                className="admin-form-input"
                value={form.logoUrl || ''}
                onChange={e => set('logoUrl', e.target.value)}
                placeholder="https://... or /logo.png"
              />
              {form.logoUrl && (
                <div style={{ marginTop: '8px', padding: '8px', background: 'rgba(255,255,255,0.03)', borderRadius: '8px' }}>
                  {/* eslint-disable-next-line @next/next/no-img-element */}
                  <img src={form.logoUrl} alt="Logo preview" style={{ maxHeight: '50px', objectFit: 'contain' }} />
                </div>
              )}
            </div>
            <div className="admin-form-group">
              <label className="admin-form-label">Favicon URL</label>
              <input
                className="admin-form-input"
                value={form.faviconUrl || ''}
                onChange={e => set('faviconUrl', e.target.value)}
                placeholder="https://... or /favicon.ico"
              />
            </div>
          </div>

          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '16px' }}>
            <div className="admin-form-group">
              <label className="admin-form-label">Primary Color</label>
              <div style={{ display: 'flex', gap: '10px', alignItems: 'center' }}>
                <input
                  type="color"
                  value={form.primaryColor || '#7C3AED'}
                  onChange={e => set('primaryColor', e.target.value)}
                  style={{ width: '44px', height: '40px', padding: '2px', border: 'none', borderRadius: '8px', cursor: 'pointer', background: 'transparent' }}
                />
                <input
                  className="admin-form-input"
                  value={form.primaryColor || ''}
                  onChange={e => set('primaryColor', e.target.value)}
                  placeholder="#7C3AED"
                  style={{ flex: 1 }}
                />
              </div>
            </div>
            <div className="admin-form-group">
              <label className="admin-form-label">Secondary Color</label>
              <div style={{ display: 'flex', gap: '10px', alignItems: 'center' }}>
                <input
                  type="color"
                  value={form.secondaryColor || '#4F46E5'}
                  onChange={e => set('secondaryColor', e.target.value)}
                  style={{ width: '44px', height: '40px', padding: '2px', border: 'none', borderRadius: '8px', cursor: 'pointer', background: 'transparent' }}
                />
                <input
                  className="admin-form-input"
                  value={form.secondaryColor || ''}
                  onChange={e => set('secondaryColor', e.target.value)}
                  placeholder="#4F46E5"
                  style={{ flex: 1 }}
                />
              </div>
            </div>
          </div>

          {/* Color Preview */}
          <div style={{
            marginTop: '8px', padding: '20px', borderRadius: '12px',
            background: `linear-gradient(135deg, ${form.primaryColor || '#7C3AED'}, ${form.secondaryColor || '#4F46E5'})`,
          }}>
            <p style={{ margin: 0, color: 'white', fontWeight: 700, fontSize: '16px' }}>{form.siteName || 'RentHelper'}</p>
            <p style={{ margin: '4px 0 0', color: 'rgba(255,255,255,0.8)', fontSize: '13px' }}>{form.siteTagline || 'Smart Rental Management'}</p>
          </div>
        </div>
      )}

      {/* SUBSCRIPTION TAB */}
      {activeTab === 'subscription' && (
        <div className="admin-card">
          <h3 style={{ margin: '0 0 8px', fontSize: '15px', fontWeight: 600, color: '#e2e8f0' }}>Subscription Plan</h3>
          <p style={{ margin: '0 0 20px', fontSize: '13px', color: '#64748b' }}>
            These settings define the default paid plan offered to providers after their free trial ends. 
            Individual overrides can be set per-provider in the Providers section.
          </p>
          
          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '16px' }}>
            <div className="admin-form-group">
              <label className="admin-form-label">Plan Name</label>
              <input
                className="admin-form-input"
                value={form.subscriptionName || ''}
                onChange={e => set('subscriptionName', e.target.value)}
                placeholder="Standard Plan"
              />
            </div>
            <div className="admin-form-group">
              <label className="admin-form-label">Price per Month (LKR)</label>
              <input
                className="admin-form-input"
                type="number"
                value={form.subscriptionPrice || 0}
                onChange={e => set('subscriptionPrice', Number(e.target.value))}
              />
            </div>
          </div>
          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '16px' }}>
            <div className="admin-form-group">
              <label className="admin-form-label">Max Items (per provider)</label>
              <input
                className="admin-form-input"
                type="number"
                value={form.subscriptionMaxItems || 50}
                onChange={e => set('subscriptionMaxItems', Number(e.target.value))}
              />
            </div>
            <div className="admin-form-group">
              <label className="admin-form-label">Free Trial Days</label>
              <input
                className="admin-form-input"
                type="number"
                value={form.defaultTrialDays || 30}
                onChange={e => set('defaultTrialDays', Number(e.target.value))}
              />
            </div>
          </div>

          {/* Plan Preview */}
          <div style={{
            marginTop: '8px', padding: '20px', borderRadius: '12px',
            background: 'rgba(59,130,246,0.06)', border: '1px solid rgba(59,130,246,0.15)',
          }}>
            <p style={{ margin: '0 0 4px', fontSize: '14px', fontWeight: 700, color: '#e2e8f0' }}>{form.subscriptionName || 'Standard Plan'}</p>
            <p style={{ margin: 0, fontSize: '24px', fontWeight: 800, color: '#60a5fa' }}>
              LKR {(form.subscriptionPrice || 0).toLocaleString()}
              <span style={{ fontSize: '14px', color: '#64748b', fontWeight: 400 }}>/month</span>
            </p>
            <p style={{ margin: '8px 0 0', fontSize: '13px', color: '#94a3b8' }}>
              Up to {form.subscriptionMaxItems || 50} items · {form.defaultTrialDays || 30}-day free trial
            </p>
          </div>
        </div>
      )}

      {/* ITEM FIELDS TAB */}
      {activeTab === 'itemfields' && (
        <div className="admin-card">
          <h3 style={{ margin: '0 0 8px', fontSize: '15px', fontWeight: 600, color: '#e2e8f0' }}>Item Field Configuration</h3>
          <p style={{ margin: '0 0 20px', fontSize: '13px', color: '#64748b' }}>
            Configure which fields appear when providers add items. Toggle each field as <strong style={{ color: '#34d399' }}>Visible</strong> (shown on the form) and <strong style={{ color: '#f87171' }}>Required</strong> (must be filled in).
          </p>

          <div style={{ display: 'grid', gridTemplateColumns: '1fr', gap: '8px', marginBottom: '8px' }}>
            {/* Header */}
            <div style={{ display: 'grid', gridTemplateColumns: '1fr 120px 120px', gap: '8px', padding: '8px 16px' }}>
              <span style={{ fontSize: '11px', color: '#475569', fontWeight: 700, textTransform: 'uppercase', letterSpacing: '0.05em' }}>Field</span>
              <span style={{ fontSize: '11px', color: '#475569', fontWeight: 700, textTransform: 'uppercase', letterSpacing: '0.05em', textAlign: 'center' }}>Visible</span>
              <span style={{ fontSize: '11px', color: '#475569', fontWeight: 700, textTransform: 'uppercase', letterSpacing: '0.05em', textAlign: 'center' }}>Required</span>
            </div>

            {FIELD_GROUPS.map(group => {
              const groupFields = ITEM_FIELDS.filter(f => f.group === group)
              return (
                <div key={group}>
                  <div style={{ padding: '6px 16px', background: 'rgba(255,255,255,0.03)', borderRadius: '6px', marginBottom: '4px' }}>
                    <span style={{ fontSize: '11px', fontWeight: 700, color: '#3B82F6', textTransform: 'uppercase', letterSpacing: '0.08em' }}>{group}</span>
                  </div>
                  {groupFields.map(field => {
                    const cfg = fieldConfig[field.key] || { visible: true, required: false }
                    return (
                      <div
                        key={field.key}
                        style={{
                          display: 'grid', gridTemplateColumns: '1fr 120px 120px', gap: '8px',
                          padding: '10px 16px', borderRadius: '8px', marginBottom: '2px',
                          background: cfg.visible ? 'rgba(255,255,255,0.02)' : 'rgba(0,0,0,0.1)',
                          opacity: cfg.visible ? 1 : 0.5,
                          transition: 'all 0.15s',
                        }}
                      >
                        <span style={{ fontSize: '13px', color: cfg.visible ? '#cbd5e1' : '#475569', display: 'flex', alignItems: 'center', gap: '8px' }}>
                          {field.label}
                          {cfg.required && cfg.visible && (
                            <span style={{ fontSize: '10px', color: '#f87171', fontWeight: 700, background: 'rgba(239,68,68,0.1)', padding: '2px 6px', borderRadius: '4px' }}>REQUIRED</span>
                          )}
                        </span>
                        {/* Visible toggle */}
                        <div style={{ display: 'flex', justifyContent: 'center', alignItems: 'center' }}>
                          <label className="admin-toggle">
                            <input
                              type="checkbox"
                              checked={cfg.visible}
                              onChange={e => setFieldConfig(fc => ({
                                ...fc,
                                [field.key]: { ...cfg, visible: e.target.checked, required: e.target.checked ? cfg.required : false }
                              }))}
                            />
                            <span className="admin-toggle__slider" />
                          </label>
                        </div>
                        {/* Required toggle */}
                        <div style={{ display: 'flex', justifyContent: 'center', alignItems: 'center' }}>
                          <label className="admin-toggle">
                            <input
                              type="checkbox"
                              checked={cfg.required}
                              disabled={!cfg.visible}
                              onChange={e => setFieldConfig(fc => ({
                                ...fc,
                                [field.key]: { ...cfg, required: e.target.checked }
                              }))}
                            />
                            <span className="admin-toggle__slider" style={{ opacity: cfg.visible ? 1 : 0.4 }} />
                          </label>
                        </div>
                      </div>
                    )
                  })}
                </div>
              )
            })}
          </div>

          <div style={{ marginTop: '16px', padding: '12px 16px', background: 'rgba(59,130,246,0.06)', borderRadius: '10px', border: '1px solid rgba(59,130,246,0.12)' }}>
            <p style={{ margin: 0, fontSize: '12px', color: '#60a5fa' }}>
              💡 These settings apply globally — all providers will see the configured fields when adding or editing items. Save changes using the Save button above.
            </p>
          </div>
        </div>
      )}

      {/* API KEYS TAB */}
      {activeTab === 'apis' && (
        <div className="admin-card">
          <h3 style={{ margin: '0 0 8px', fontSize: '15px', fontWeight: 600, color: '#e2e8f0' }}>API Keys & OAuth</h3>
          <p style={{ margin: '0 0 20px', fontSize: '13px', color: '#64748b' }}>
            These are stored in the database. Sensitive fields are masked — enter new values to update.
          </p>
          
          <div style={{ background: 'rgba(245,158,11,0.06)', border: '1px solid rgba(245,158,11,0.15)', borderRadius: '10px', padding: '12px 16px', marginBottom: '20px' }}>
            <p style={{ margin: 0, fontSize: '12px', color: '#fbbf24', fontWeight: 500 }}>
              ⚠️ Changes here require restarting the server to take effect on OAuth flows.
            </p>
          </div>

          {[
            { key: 'googleClientId', label: 'Google Client ID', sensitive: false },
            { key: 'googleClientSecret', label: 'Google Client Secret', sensitive: true },
          ].map(({ key, label, sensitive }) => (
            <div key={key} className="admin-form-group">
              <label className="admin-form-label">{label}</label>
              <div style={{ display: 'flex', gap: '8px' }}>
                <input
                  className="admin-form-input"
                  type={sensitive && !showSecrets[key] ? 'password' : 'text'}
                  value={(form as Record<string, unknown>)[key] as string || ''}
                  onChange={e => set(key as keyof SiteSettings, e.target.value)}
                  placeholder={`Enter ${label}...`}
                />
                {sensitive && (
                  <button
                    className="admin-btn admin-btn--ghost"
                    style={{ padding: '8px 12px', flexShrink: 0 }}
                    onClick={() => toggleSecret(key)}
                    type="button"
                  >
                    {showSecrets[key] ? <EyeOff size={15} /> : <Eye size={15} />}
                  </button>
                )}
              </div>
            </div>
          ))}
        </div>
      )}

      {/* EMAIL TAB */}
      {activeTab === 'email' && (
        <div className="admin-card">
          <h3 style={{ margin: '0 0 20px', fontSize: '15px', fontWeight: 600, color: '#e2e8f0' }}>Email / SMTP Configuration</h3>
          
          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '16px' }}>
            <div className="admin-form-group">
              <label className="admin-form-label">From Name</label>
              <input className="admin-form-input" value={form.emailFromName || ''} onChange={e => set('emailFromName', e.target.value)} placeholder="RentHelper" />
            </div>
            <div className="admin-form-group">
              <label className="admin-form-label">From Email</label>
              <input className="admin-form-input" type="email" value={form.emailFromAddress || ''} onChange={e => set('emailFromAddress', e.target.value)} placeholder="noreply@renthelper.lk" />
            </div>
          </div>
          <div style={{ display: 'grid', gridTemplateColumns: '2fr 1fr', gap: '16px' }}>
            <div className="admin-form-group">
              <label className="admin-form-label">SMTP Host</label>
              <input className="admin-form-input" value={form.smtpHost || ''} onChange={e => set('smtpHost', e.target.value)} placeholder="smtp.gmail.com" />
            </div>
            <div className="admin-form-group">
              <label className="admin-form-label">SMTP Port</label>
              <input className="admin-form-input" type="number" value={form.smtpPort || 587} onChange={e => set('smtpPort', Number(e.target.value))} />
            </div>
          </div>
          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '16px' }}>
            <div className="admin-form-group">
              <label className="admin-form-label">SMTP User</label>
              <input className="admin-form-input" value={form.smtpUser || ''} onChange={e => set('smtpUser', e.target.value)} placeholder="your@email.com" />
            </div>
            <div className="admin-form-group">
              <label className="admin-form-label">SMTP Password</label>
              <div style={{ display: 'flex', gap: '8px' }}>
                <input
                  className="admin-form-input"
                  type={showSecrets['smtpPass'] ? 'text' : 'password'}
                  value={form.smtpPass || ''}
                  onChange={e => set('smtpPass', e.target.value)}
                  placeholder="Password"
                />
                <button className="admin-btn admin-btn--ghost" style={{ padding: '8px 12px', flexShrink: 0 }} onClick={() => toggleSecret('smtpPass')} type="button">
                  {showSecrets['smtpPass'] ? <EyeOff size={15} /> : <Eye size={15} />}
                </button>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* PLATFORM TAB */}
      {activeTab === 'platform' && (
        <div className="admin-card">
          <h3 style={{ margin: '0 0 20px', fontSize: '15px', fontWeight: 600, color: '#e2e8f0' }}>Platform Controls</h3>
          
          {[
            {
              key: 'maintenanceMode', label: 'Maintenance Mode',
              description: 'When enabled, the site shows a maintenance message to all non-admin visitors.',
              danger: true,
            },
            {
              key: 'allowNewRegistrations', label: 'Allow New Registrations',
              description: 'When disabled, new users cannot register. Existing users can still log in.',
              danger: false,
            },
          ].map(({ key, label, description, danger }) => (
            <div key={key} style={{
              display: 'flex', alignItems: 'flex-start', justifyContent: 'space-between', gap: '16px',
              padding: '18px', marginBottom: '12px',
              background: danger && (form as Record<string, unknown>)[key] ? 'rgba(239,68,68,0.06)' : 'rgba(255,255,255,0.02)',
              border: `1px solid ${danger && (form as Record<string, unknown>)[key] ? 'rgba(239,68,68,0.15)' : 'rgba(255,255,255,0.05)'}`,
              borderRadius: '12px',
            }}>
              <div>
                <p style={{ margin: '0 0 4px', fontSize: '14px', fontWeight: 600, color: '#e2e8f0' }}>{label}</p>
                <p style={{ margin: 0, fontSize: '13px', color: '#64748b' }}>{description}</p>
              </div>
              <label className="admin-toggle" style={{ marginTop: '2px', flexShrink: 0 }}>
                <input
                  type="checkbox"
                  checked={!!(form as Record<string, unknown>)[key]}
                  onChange={e => set(key as keyof SiteSettings, e.target.checked)}
                />
                <span className="admin-toggle__slider" />
              </label>
            </div>
          ))}

          {form.maintenanceMode && (
            <div style={{ padding: '14px', background: 'rgba(239,68,68,0.08)', border: '1px solid rgba(239,68,68,0.2)', borderRadius: '10px' }}>
              <p style={{ margin: 0, fontSize: '13px', color: '#f87171', fontWeight: 500 }}>
                ⚠️ Maintenance mode is ON. All non-admin users will see a maintenance page. Make sure to disable this when done.
              </p>
            </div>
          )}
        </div>
      )}

      {/* Sticky Save for mobile */}
      <div style={{ marginTop: '28px', display: 'flex', justifyContent: 'flex-end' }}>
        <button className="admin-btn admin-btn--primary" onClick={save} disabled={saving} style={{ minWidth: '160px' }}>
          {saved ? <><CheckCircle size={15} /> Changes Saved!</> : saving ? 'Saving...' : <><Save size={15} /> Save All Changes</>}
        </button>
      </div>
    </>
  )
}
