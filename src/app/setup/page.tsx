'use client'

import { useState } from 'react'

export default function SeedAdminPage() {
  const [result, setResult] = useState<string>('')
  const [loading, setLoading] = useState(false)

  const seedAdmin = async () => {
    setLoading(true)
    try {
      const res = await fetch('/api/auth/seed-admin', { method: 'POST' })
      const data = await res.json()
      setResult(JSON.stringify(data, null, 2))
    } catch (err: any) {
      setResult('Error: ' + err.message)
    } finally {
      setLoading(false)
    }
  }

  return (
    <div style={{ 
      minHeight: '100vh', display: 'flex', alignItems: 'center', justifyContent: 'center',
      background: '#0a0f1e', fontFamily: 'monospace', padding: '20px'
    }}>
      <div style={{
        background: '#111827', border: '1px solid #1e3a5f', borderRadius: '16px',
        padding: '40px', maxWidth: '500px', width: '100%', textAlign: 'center'
      }}>
        <h1 style={{ color: '#60a5fa', fontSize: '24px', marginBottom: '8px' }}>🔧 RentHelper Setup</h1>
        <p style={{ color: '#64748b', fontSize: '14px', marginBottom: '24px' }}>
          Click the button below to create the admin account and seed initial data.
        </p>
        
        <button
          onClick={seedAdmin}
          disabled={loading}
          style={{
            background: 'linear-gradient(135deg, #3B82F6, #6366F1)',
            color: 'white', border: 'none', borderRadius: '12px',
            padding: '14px 32px', fontSize: '16px', fontWeight: 600,
            cursor: loading ? 'not-allowed' : 'pointer',
            opacity: loading ? 0.6 : 1, width: '100%'
          }}
        >
          {loading ? 'Seeding...' : 'Seed Admin & Categories'}
        </button>

        {result && (
          <div style={{
            marginTop: '20px', textAlign: 'left', background: '#0a0f1e',
            borderRadius: '10px', padding: '16px', fontSize: '12px', color: '#34d399',
            whiteSpace: 'pre-wrap', wordBreak: 'break-all', maxHeight: '300px', overflow: 'auto'
          }}>
            {result}
          </div>
        )}

        {result && !result.includes('Error') && (
          <div style={{ marginTop: '20px', color: '#94a3b8', fontSize: '13px' }}>
            <p style={{ marginBottom: '8px' }}>✅ Admin account created!</p>
            <p style={{ color: '#60a5fa' }}>Email: <strong>admin@renthelper.lk</strong></p>
            <p style={{ color: '#60a5fa' }}>Password: <strong>Admin@1234</strong></p>
            <a href="/auth/signin" style={{
              display: 'inline-block', marginTop: '16px', color: '#3B82F6',
              textDecoration: 'underline', fontSize: '14px'
            }}>
              → Go to Sign In
            </a>
          </div>
        )}
      </div>
    </div>
  )
}
