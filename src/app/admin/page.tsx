'use client'

import { useEffect, useState } from 'react'
import Link from 'next/link'
import { Building2, Users, CreditCard, TrendingUp, Clock, CheckCircle, AlertCircle, ArrowRight } from 'lucide-react'

interface DashboardStats {
  stats: {
    totalProviders: number
    pendingProviders: number
    totalCustomers: number
    activeSubscriptions: number
    trialSubscriptions: number
    totalBookings: number
    mrr: number
  }
  recentProviders: Array<{
    id: string
    name: string
    approvalStatus: string
    createdAt: string
    user: { name: string; email: string }
    subscription: { status: string; planName: string } | null
  }>
  recentCustomers: Array<{
    id: string
    name: string
    email: string
    status: string
    createdAt: string
  }>
}

export default function AdminDashboard() {
  const [data, setData] = useState<DashboardStats | null>(null)
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    fetch('/api/admin/dashboard')
      .then(r => r.json())
      .then(d => { setData(d); setLoading(false) })
      .catch(() => setLoading(false))
  }, [])

  const stats = data?.stats

  const statCards = [
    {
      label: 'Total Providers',
      value: stats?.totalProviders ?? 0,
      icon: Building2,
      color: '#3B82F6',
      bg: 'rgba(59,130,246,0.12)',
      badge: stats?.pendingProviders ? `${stats.pendingProviders} pending` : null,
      badgeColor: '#fbbf24',
      link: '/admin/providers',
    },
    {
      label: 'Total Customers',
      value: stats?.totalCustomers ?? 0,
      icon: Users,
      color: '#8B5CF6',
      bg: 'rgba(139,92,246,0.12)',
      link: '/admin/customers',
    },
    {
      label: 'Active Subscriptions',
      value: stats?.activeSubscriptions ?? 0,
      icon: CreditCard,
      color: '#10B981',
      bg: 'rgba(16,185,129,0.12)',
      badge: stats?.trialSubscriptions ? `${stats.trialSubscriptions} on trial` : null,
      badgeColor: '#60a5fa',
      link: '/admin/subscriptions',
    },
    {
      label: 'Monthly Revenue',
      value: `LKR ${(stats?.mrr ?? 0).toLocaleString()}`,
      icon: TrendingUp,
      color: '#F59E0B',
      bg: 'rgba(245,158,11,0.12)',
    },
  ]

  return (
    <>
      {/* Header */}
      <div className="admin-page-header">
        <h1 className="admin-page-title">Admin Dashboard</h1>
        <p className="admin-page-subtitle">Platform overview — RentHelper admin console</p>
      </div>

      {/* KYC Pending Alert — customers only need review */}
      {(stats?.pendingProviders ?? 0) > 0 && (
        <div style={{
          background: 'rgba(59,130,246,0.08)',
          border: '1px solid rgba(59,130,246,0.2)',
          borderRadius: '14px',
          padding: '16px 20px',
          marginBottom: '24px',
          display: 'flex',
          alignItems: 'center',
          gap: '12px',
        }}>
          <AlertCircle size={20} color="#60a5fa" />
          <div style={{ flex: 1 }}>
            <p style={{ margin: 0, fontSize: '14px', fontWeight: 600, color: '#60a5fa' }}>
              Customers Awaiting KYC Verification
            </p>
            <p style={{ margin: 0, fontSize: '13px', color: '#1e3a5f' }}>
              Review and verify customer identity documents before they can rent items.
            </p>
          </div>
          <Link href="/admin/customers?kycStatus=pending" className="admin-btn admin-btn--ghost admin-btn--sm">
            Review KYC <ArrowRight size={14} />
          </Link>
        </div>
      )}

      {/* Stat Cards */}
      <div className="admin-stat-grid">
        {statCards.map((card) => {
          const Icon = card.icon
          const content = (
            <div className="admin-stat-card">
              <div
                className="admin-stat-card__icon"
                style={{ background: card.bg }}
              >
                <Icon size={20} color={card.color} />
              </div>
              <p className="admin-stat-card__value">{loading ? '—' : card.value}</p>
              <p className="admin-stat-card__label">{card.label}</p>
              {card.badge && !loading && (
                <span
                  className="admin-stat-card__badge"
                  style={{ background: `${card.badgeColor}20`, color: card.badgeColor }}
                >
                  <Clock size={10} />
                  {card.badge}
                </span>
              )}
            </div>
          )
          return card.link ? (
            <Link key={card.label} href={card.link} style={{ textDecoration: 'none' }}>
              {content}
            </Link>
          ) : (
            <div key={card.label}>{content}</div>
          )
        })}
      </div>

      {/* Two column: Recent Providers + Recent Customers */}
      <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '20px' }}>
        {/* Recent Providers */}
        <div className="admin-table-wrapper">
          <div className="admin-table-toolbar">
            <p className="admin-table-toolbar__title">Recent Providers</p>
            <Link href="/admin/providers" className="admin-btn admin-btn--ghost admin-btn--sm">
              View All <ArrowRight size={12} />
            </Link>
          </div>
          {loading ? (
            <div style={{ padding: '40px', textAlign: 'center', color: '#475569' }}>Loading...</div>
          ) : (data?.recentProviders?.length ?? 0) === 0 ? (
            <div className="admin-empty">
              <div className="admin-empty-icon">🏢</div>
              <p>No providers yet</p>
            </div>
          ) : (
            <div style={{ padding: '8px' }}>
              {data!.recentProviders.map(provider => (
                <Link
                  key={provider.id}
                  href={`/admin/providers/${provider.id}`}
                  style={{
                    display: 'flex',
                    alignItems: 'center',
                    gap: '12px',
                    padding: '12px',
                    borderRadius: '10px',
                    textDecoration: 'none',
                    transition: 'background 0.15s',
                  }}
                  onMouseEnter={e => (e.currentTarget.style.background = 'rgba(255,255,255,0.03)')}
                  onMouseLeave={e => (e.currentTarget.style.background = 'transparent')}
                >
                  <div className="admin-avatar">
                    {provider.name?.[0]?.toUpperCase() || 'B'}
                  </div>
                  <div style={{ flex: 1, minWidth: 0 }}>
                    <p style={{ margin: 0, fontSize: '13px', fontWeight: 600, color: '#e2e8f0', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>
                      {provider.name}
                    </p>
                    <p style={{ margin: 0, fontSize: '11px', color: '#64748b' }}>
                      {provider.user?.email}
                    </p>
                  </div>
                  <span className={`admin-badge admin-badge--${provider.approvalStatus}`}>
                    {provider.approvalStatus}
                  </span>
                </Link>
              ))}
            </div>
          )}
        </div>

        {/* Recent Customers */}
        <div className="admin-table-wrapper">
          <div className="admin-table-toolbar">
            <p className="admin-table-toolbar__title">Recent Customers</p>
            <Link href="/admin/customers" className="admin-btn admin-btn--ghost admin-btn--sm">
              View All <ArrowRight size={12} />
            </Link>
          </div>
          {loading ? (
            <div style={{ padding: '40px', textAlign: 'center', color: '#475569' }}>Loading...</div>
          ) : (data?.recentCustomers?.length ?? 0) === 0 ? (
            <div className="admin-empty">
              <div className="admin-empty-icon">👤</div>
              <p>No customers yet</p>
            </div>
          ) : (
            <div style={{ padding: '8px' }}>
              {data!.recentCustomers.map(customer => (
                <Link
                  key={customer.id}
                  href={`/admin/customers`}
                  style={{
                    display: 'flex',
                    alignItems: 'center',
                    gap: '12px',
                    padding: '12px',
                    borderRadius: '10px',
                    textDecoration: 'none',
                    transition: 'background 0.15s',
                  }}
                  onMouseEnter={e => (e.currentTarget.style.background = 'rgba(255,255,255,0.03)')}
                  onMouseLeave={e => (e.currentTarget.style.background = 'transparent')}
                >
                  <div className="admin-avatar" style={{ background: 'linear-gradient(135deg, #8B5CF6, #6366F1)' }}>
                    {customer.name?.[0]?.toUpperCase() || 'C'}
                  </div>
                  <div style={{ flex: 1, minWidth: 0 }}>
                    <p style={{ margin: 0, fontSize: '13px', fontWeight: 600, color: '#e2e8f0', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>
                      {customer.name}
                    </p>
                    <p style={{ margin: 0, fontSize: '11px', color: '#64748b' }}>
                      {customer.email}
                    </p>
                  </div>
                  <span className={`admin-badge admin-badge--${customer.status}`}>
                    {customer.status}
                  </span>
                </Link>
              ))}
            </div>
          )}
        </div>
      </div>

      {/* Quick Actions */}
      <div style={{ marginTop: '24px', display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(200px, 1fr))', gap: '12px' }}>
        {[
          { label: 'Review Pending Providers', href: '/admin/providers?approvalStatus=pending', icon: CheckCircle, color: '#fbbf24' },
          { label: 'KYC Review Queue', href: '/admin/customers?kycStatus=pending', icon: Users, color: '#60a5fa' },
          { label: 'Manage Subscriptions', href: '/admin/subscriptions', icon: CreditCard, color: '#34d399' },
          { label: 'Site Settings', href: '/admin/settings', icon: AlertCircle, color: '#a78bfa' },
        ].map(action => {
          const Icon = action.icon
          return (
            <Link
              key={action.label}
              href={action.href}
              className="admin-card"
              style={{ textDecoration: 'none', display: 'flex', alignItems: 'center', gap: '12px', transition: 'border-color 0.2s, transform 0.2s' }}
              onMouseEnter={e => {
                (e.currentTarget as HTMLElement).style.borderColor = `${action.color}40`
                ;(e.currentTarget as HTMLElement).style.transform = 'translateY(-2px)'
              }}
              onMouseLeave={e => {
                ;(e.currentTarget as HTMLElement).style.borderColor = 'rgba(255,255,255,0.06)'
                ;(e.currentTarget as HTMLElement).style.transform = 'none'
              }}
            >
              <div style={{
                width: '36px', height: '36px', borderRadius: '10px',
                background: `${action.color}20`,
                display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0,
              }}>
                <Icon size={18} color={action.color} />
              </div>
              <span style={{ fontSize: '13px', fontWeight: 500, color: '#cbd5e1' }}>{action.label}</span>
              <ArrowRight size={14} color="#475569" style={{ marginLeft: 'auto' }} />
            </Link>
          )
        })}
      </div>
    </>
  )
}
