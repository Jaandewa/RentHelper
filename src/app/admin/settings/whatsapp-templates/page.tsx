'use client'

import { useEffect, useState, useRef } from 'react'
import { MessageSquare, Save, RotateCcw, Eye, ChevronDown, ChevronUp, CheckCircle, XCircle, Copy } from 'lucide-react'

interface TemplateVariable {
  name: string
  description: string
}

interface WhatsappTemplate {
  eventType: string
  name: string
  description: string
  isEnabled: boolean
  messageBody: string
  variables: TemplateVariable[]
}

interface PreviewResult {
  success: boolean
  message?: string
  error?: string
}

export default function WhatsappTemplatesPage() {
  const [templates, setTemplates] = useState<WhatsappTemplate[]>([])
  const [loading, setLoading] = useState(true)
  const [expandedId, setExpandedId] = useState<string | null>(null)
  
  // Edit states for the currently expanded template
  const [draftBody, setDraftBody] = useState('')
  const [draftEnabled, setDraftEnabled] = useState(false)
  const [saving, setSaving] = useState(false)
  const [previewing, setPreviewing] = useState(false)
  const [previewResult, setPreviewResult] = useState<PreviewResult | null>(null)
  const [feedback, setFeedback] = useState<{ type: 'success' | 'error', message: string } | null>(null)
  
  const textareaRef = useRef<HTMLTextAreaElement>(null)

  useEffect(() => {
    loadTemplates()
  }, [])

  const loadTemplates = async () => {
    try {
      const res = await fetch('/api/admin/whatsapp-templates')
      if (res.ok) {
        const data = await res.json()
        setTemplates(data.templates || [])
      }
    } catch (e) {
      console.error(e)
    }
    setLoading(false)
  }

  const handleExpand = (template: WhatsappTemplate) => {
    if (expandedId === template.eventType) {
      setExpandedId(null)
    } else {
      setExpandedId(template.eventType)
      setDraftBody(template.messageBody)
      setDraftEnabled(template.isEnabled)
      setPreviewResult(null)
      setFeedback(null)
    }
  }

  const insertVariable = (varName: string) => {
    if (!textareaRef.current) return
    const textarea = textareaRef.current
    const start = textarea.selectionStart
    const end = textarea.selectionEnd
    const text = draftBody
    const before = text.substring(0, start)
    const after = text.substring(end)
    const newText = `${before}{${varName}}${after}`
    setDraftBody(newText)
    
    // Set focus back and adjust cursor position (need timeout for React to update value first)
    setTimeout(() => {
      textarea.focus()
      textarea.setSelectionRange(start + varName.length + 2, start + varName.length + 2)
    }, 0)
  }

  const handlePreview = async (eventType: string) => {
    setPreviewing(true)
    setPreviewResult(null)
    setFeedback(null)
    try {
      const res = await fetch(`/api/admin/whatsapp-templates/${eventType}/preview`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ messageBody: draftBody })
      })
      const data = await res.json()
      setPreviewResult(data)
    } catch (e) {
      setPreviewResult({ success: false, error: 'Network error occurred while previewing.' })
    }
    setPreviewing(false)
  }

  const handleSave = async (eventType: string) => {
    setSaving(true)
    setFeedback(null)
    try {
      const res = await fetch(`/api/admin/whatsapp-templates/${eventType}`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ isEnabled: draftEnabled, messageBody: draftBody })
      })
      
      if (res.ok) {
        setFeedback({ type: 'success', message: 'Template saved successfully.' })
        // Update local state
        setTemplates(templates.map(t => 
          t.eventType === eventType 
            ? { ...t, isEnabled: draftEnabled, messageBody: draftBody } 
            : t
        ))
        setTimeout(() => setFeedback(null), 3000)
      } else {
        const data = await res.json()
        setFeedback({ type: 'error', message: data.error || 'Failed to save template.' })
      }
    } catch (e) {
      setFeedback({ type: 'error', message: 'Network error occurred.' })
    }
    setSaving(false)
  }

  const handleRestoreDefault = async (eventType: string) => {
    if (!confirm('Are you sure you want to restore the default template? Any custom changes will be lost.')) return
    
    setSaving(true)
    setFeedback(null)
    try {
      const res = await fetch(`/api/admin/whatsapp-templates/${eventType}/restore-default`, {
        method: 'POST'
      })
      
      if (res.ok) {
        const data = await res.json()
        if (data.template) {
          setDraftBody(data.template.messageBody)
          setDraftEnabled(data.template.isEnabled)
          setTemplates(templates.map(t => 
            t.eventType === eventType ? data.template : t
          ))
          setFeedback({ type: 'success', message: 'Template restored to default.' })
          setPreviewResult(null)
        }
      } else {
        const data = await res.json()
        setFeedback({ type: 'error', message: data.error || 'Failed to restore default.' })
      }
    } catch (e) {
      setFeedback({ type: 'error', message: 'Network error occurred.' })
    }
    setSaving(false)
  }

  const handleToggleEnable = async (e: React.ChangeEvent<HTMLInputElement>, template: WhatsappTemplate) => {
    e.stopPropagation() // Prevent expanding/collapsing card
    const newEnabled = e.target.checked
    
    // If it's the expanded template, update the draft state
    if (expandedId === template.eventType) {
      setDraftEnabled(newEnabled)
    } else {
      // Just save the toggle change immediately if not expanded
      try {
        const res = await fetch(`/api/admin/whatsapp-templates/${template.eventType}`, {
          method: 'PUT',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ isEnabled: newEnabled, messageBody: template.messageBody })
        })
        if (res.ok) {
          setTemplates(templates.map(t => 
            t.eventType === template.eventType ? { ...t, isEnabled: newEnabled } : t
          ))
        }
      } catch (err) {
        console.error(err)
      }
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
        <h1 className="admin-page-title">WhatsApp Templates</h1>
        <p className="admin-page-subtitle">Manage automated WhatsApp message templates and variables</p>
      </div>

      <div style={{ display: 'flex', flexDirection: 'column', gap: '16px' }}>
        {templates.map(template => {
          const isExpanded = expandedId === template.eventType
          
          return (
            <div key={template.eventType} className="admin-card" style={{ padding: 0, overflow: 'hidden' }}>
              {/* Header (Always visible) */}
              <div 
                style={{ 
                  padding: '20px', 
                  display: 'flex', 
                  alignItems: 'flex-start', 
                  justifyContent: 'space-between',
                  cursor: 'pointer',
                  background: isExpanded ? 'rgba(255,255,255,0.02)' : 'transparent'
                }}
                onClick={() => handleExpand(template)}
              >
                <div style={{ display: 'flex', gap: '16px' }}>
                  <div style={{ width: '42px', height: '42px', borderRadius: '12px', background: 'rgba(37,211,102,0.1)', display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0 }}>
                    <MessageSquare size={20} color="#25D366" />
                  </div>
                  <div>
                    <div style={{ display: 'flex', alignItems: 'center', gap: '12px', marginBottom: '6px' }}>
                      <h3 style={{ margin: 0, fontSize: '16px', fontWeight: 600, color: '#f1f5f9' }}>{template.name}</h3>
                      <span className={`admin-badge admin-badge--${isExpanded ? (draftEnabled ? 'active' : 'pending') : (template.isEnabled ? 'active' : 'pending')}`}>
                        {template.eventType}
                      </span>
                    </div>
                    <p style={{ margin: 0, fontSize: '14px', color: '#94a3b8' }}>{template.description}</p>
                  </div>
                </div>
                
                <div style={{ display: 'flex', alignItems: 'center', gap: '20px' }}>
                  <div onClick={e => e.stopPropagation()}>
                    <label className="admin-toggle" style={{ display: 'flex' }}>
                      <input
                        type="checkbox"
                        checked={isExpanded ? draftEnabled : template.isEnabled}
                        onChange={(e) => handleToggleEnable(e, template)}
                      />
                      <span className="admin-toggle__slider" />
                    </label>
                  </div>
                  <div style={{ color: '#64748b' }}>
                    {isExpanded ? <ChevronUp size={20} /> : <ChevronDown size={20} />}
                  </div>
                </div>
              </div>

              {/* Expanded Content */}
              {isExpanded && (
                <div style={{ padding: '0 20px 20px', borderTop: '1px solid rgba(255,255,255,0.05)' }}>
                  <div style={{ display: 'grid', gridTemplateColumns: '1fr 350px', gap: '24px', marginTop: '20px' }}>
                    
                    {/* Left Column: Editor */}
                    <div>
                      <div className="admin-form-group">
                        <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '8px' }}>
                          <label className="admin-form-label" style={{ marginBottom: 0 }}>Message Body</label>
                          <span style={{ fontSize: '12px', color: draftBody.length > 2000 ? '#ef4444' : '#64748b' }}>
                            {draftBody.length} / 2000 characters
                          </span>
                        </div>
                        <textarea
                          ref={textareaRef}
                          className="admin-form-textarea"
                          value={draftBody}
                          onChange={(e) => setDraftBody(e.target.value)}
                          style={{ minHeight: '200px', fontFamily: 'monospace', fontSize: '14px', lineHeight: '1.5' }}
                          placeholder="Enter message template..."
                        />
                      </div>

                      <div style={{ marginTop: '20px' }}>
                        <label className="admin-form-label">Available Variables</label>
                        <p style={{ fontSize: '13px', color: '#94a3b8', marginBottom: '12px' }}>
                          Click a variable to insert it into the message body.
                        </p>
                        <div style={{ display: 'flex', flexWrap: 'wrap', gap: '8px' }}>
                          {template.variables.map(variable => (
                            <button
                              key={variable.name}
                              onClick={() => insertVariable(variable.name)}
                              style={{
                                background: 'rgba(56, 189, 248, 0.1)',
                                border: '1px solid rgba(56, 189, 248, 0.2)',
                                color: '#38bdf8',
                                padding: '4px 10px',
                                borderRadius: '16px',
                                fontSize: '12px',
                                fontWeight: 500,
                                cursor: 'pointer',
                                display: 'flex',
                                alignItems: 'center',
                                gap: '6px',
                                transition: 'all 0.2s'
                              }}
                              title={variable.description}
                              onMouseOver={(e) => e.currentTarget.style.background = 'rgba(56, 189, 248, 0.2)'}
                              onMouseOut={(e) => e.currentTarget.style.background = 'rgba(56, 189, 248, 0.1)'}
                            >
                              <Copy size={12} />
                              {`{${variable.name}}`}
                            </button>
                          ))}
                          {(!template.variables || template.variables.length === 0) && (
                            <span style={{ fontSize: '13px', color: '#64748b' }}>No variables available for this template.</span>
                          )}
                        </div>
                      </div>

                      {/* Actions */}
                      <div style={{ display: 'flex', alignItems: 'center', gap: '12px', marginTop: '30px' }}>
                        <button 
                          className="admin-btn admin-btn--primary" 
                          onClick={() => handleSave(template.eventType)}
                          disabled={saving || draftBody.length === 0 || draftBody.length > 2000}
                        >
                          <Save size={16} /> {saving ? 'Saving...' : 'Save Template'}
                        </button>
                        
                        <button 
                          className="admin-btn admin-btn--ghost" 
                          onClick={() => handleRestoreDefault(template.eventType)}
                          disabled={saving}
                        >
                          <RotateCcw size={16} /> Restore Default
                        </button>
                        
                        {feedback && (
                          <div style={{ display: 'flex', alignItems: 'center', gap: '6px', fontSize: '13px', color: feedback.type === 'success' ? '#34d399' : '#f87171', marginLeft: 'auto' }}>
                            {feedback.type === 'success' ? <CheckCircle size={14} /> : <XCircle size={14} />}
                            {feedback.message}
                          </div>
                        )}
                      </div>
                    </div>

                    {/* Right Column: Preview */}
                    <div>
                      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '12px' }}>
                        <label className="admin-form-label" style={{ marginBottom: 0 }}>Live Preview</label>
                        <button 
                          className="admin-btn admin-btn--ghost admin-btn--sm" 
                          onClick={() => handlePreview(template.eventType)}
                          disabled={previewing}
                          style={{ padding: '4px 10px' }}
                        >
                          <Eye size={14} /> {previewing ? 'Generating...' : 'Update Preview'}
                        </button>
                      </div>
                      
                      <div style={{ 
                        background: '#efeae2', // WhatsApp chat background color
                        borderRadius: '12px', 
                        padding: '16px',
                        minHeight: '200px',
                        position: 'relative',
                        backgroundImage: 'url("https://w0.peakpx.com/wallpaper/818/148/HD-wallpaper-whatsapp-background-cool-dark-green-new-theme-whatsapp.jpg")',
                        backgroundSize: 'cover',
                        backgroundBlendMode: 'overlay',
                        backgroundColor: 'rgba(255,255,255,0.9)'
                      }}>
                        {previewResult ? (
                          previewResult.success ? (
                            <div style={{
                              background: '#ffffff',
                              borderRadius: '8px',
                              borderTopLeftRadius: 0,
                              padding: '8px 12px',
                              boxShadow: '0 1px 2px rgba(0,0,0,0.1)',
                              maxWidth: '100%',
                              position: 'relative'
                            }}>
                              <div style={{ 
                                color: '#111b21', 
                                fontSize: '14.2px', 
                                lineHeight: '19px', 
                                whiteSpace: 'pre-wrap',
                                wordBreak: 'break-word',
                                fontFamily: '"Segoe UI", "Helvetica Neue", Helvetica, Arial, sans-serif'
                              }}>
                                {previewResult.message}
                              </div>
                              <div style={{ textAlign: 'right', marginTop: '4px', fontSize: '11px', color: '#667781' }}>
                                {new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                              </div>
                            </div>
                          ) : (
                            <div style={{ background: 'rgba(239, 68, 68, 0.1)', padding: '12px', borderRadius: '8px', border: '1px solid rgba(239, 68, 68, 0.2)', color: '#ef4444', fontSize: '13px' }}>
                              <div style={{ display: 'flex', alignItems: 'center', gap: '6px', marginBottom: '4px', fontWeight: 500 }}>
                                <XCircle size={14} /> Preview Error
                              </div>
                              {previewResult.error}
                            </div>
                          )
                        ) : (
                          <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', height: '100%', color: '#64748b', fontSize: '13px', textAlign: 'center', padding: '20px', background: 'rgba(255,255,255,0.7)', borderRadius: '8px' }}>
                            Click "Update Preview" to see how your message will look with sample data.
                          </div>
                        )}
                      </div>
                    </div>

                  </div>
                </div>
              )}
            </div>
          )
        })}
        
        {templates.length === 0 && !loading && (
          <div className="admin-empty" style={{ padding: '40px' }}>
            <div className="admin-empty-icon">📝</div>
            <p>No WhatsApp templates found.</p>
          </div>
        )}
      </div>
    </>
  )
}
