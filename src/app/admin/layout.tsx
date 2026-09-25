'use client'

import { useSession, signOut } from 'next-auth/react'
import { useRouter, usePathname } from 'next/navigation'
import { useEffect, useState } from 'react'
import Link from 'next/link'
import {
  LayoutDashboard,
  Building2,
  Users,
  CreditCard,
  Settings,
  LogOut,
  Menu,
  X,
  ShieldCheck,
  UserCircle,
  ChevronRight,
  Bell,
  Tag,
  ShieldQuestion,
} from 'lucide-react'

const navItems = [
  { label: 'Dashboard', href: '/admin', icon: LayoutDashboard, exact: true },
  { label: 'Providers', href: '/admin/providers', icon: Building2 },
  { label: 'Customers', href: '/admin/customers', icon: Users },
  { label: 'KYC Review', href: '/admin/customers?kycStatus=pending', icon: ShieldQuestion },
  { label: 'Subscriptions', href: '/admin/subscriptions', icon: CreditCard },
  { label: 'Categories', href: '/admin/categories', icon: Tag },
  { label: 'All Users', href: '/admin/users', icon: UserCircle },
  { label: 'Site Settings', href: '/admin/settings', icon: Settings },
]

export default function AdminLayout({ children }: { children: React.ReactNode }) {
  const { data: session, status } = useSession()
  const router = useRouter()
  const pathname = usePathname()
  const [sidebarOpen, setSidebarOpen] = useState(false)

  useEffect(() => {
    if (status === 'loading') return
    if (!session?.user) { router.replace('/auth/signin'); return }
    // Only redirect if role is KNOWN and not admin — avoids loop with stale JWT
    if (session.user.role && session.user.role !== 'admin') { router.replace('/dashboard'); return }
  }, [session, status, router])

  if (status === 'loading' || !session?.user) {
    return (
      <div className="admin-loading">
        <div className="admin-spinner" />
      </div>
    )
  }

  const isActive = (href: string, exact?: boolean) => {
    if (exact) return pathname === href
    return pathname.startsWith(href)
  }

  return (
    <div className="admin-shell">
      {/* Sidebar */}
      <aside className={`admin-sidebar ${sidebarOpen ? 'admin-sidebar--open' : ''}`}>
        {/* Logo / Brand */}
        <div className="admin-sidebar__brand">
          <div className="admin-sidebar__logo">
            <ShieldCheck size={22} />
          </div>
          <div>
            <p className="admin-sidebar__logo-title">RentHelper</p>
            <p className="admin-sidebar__logo-sub">Admin Console</p>
          </div>
          <button
            className="admin-sidebar__close"
            onClick={() => setSidebarOpen(false)}
          >
            <X size={18} />
          </button>
        </div>

        {/* Admin Badge */}
        <div className="admin-sidebar__badge">
          <div className="admin-sidebar__badge-avatar">
            {session.user.name?.[0]?.toUpperCase() || 'A'}
          </div>
          <div className="admin-sidebar__badge-info">
            <p className="admin-sidebar__badge-name">{session.user.name}</p>
            <p className="admin-sidebar__badge-role">Super Admin</p>
          </div>
        </div>

        {/* Nav */}
        <nav className="admin-sidebar__nav">
          <p className="admin-sidebar__nav-label">Management</p>
          {navItems.map((item) => {
            const Icon = item.icon
            const active = isActive(item.href, item.exact)
            return (
              <Link
                key={item.href}
                href={item.href}
                className={`admin-sidebar__nav-item ${active ? 'admin-sidebar__nav-item--active' : ''}`}
                onClick={() => setSidebarOpen(false)}
              >
                <Icon size={18} />
                <span>{item.label}</span>
                {active && <ChevronRight size={14} className="admin-sidebar__nav-arrow" />}
              </Link>
            )
          })}
        </nav>

        {/* Sign Out */}
        <div className="admin-sidebar__footer">
          <Link href="/" className="admin-sidebar__footer-link">
            View Site
          </Link>
          <button
            className="admin-sidebar__logout"
            onClick={() => signOut({ callbackUrl: '/auth/signin' })}
          >
            <LogOut size={16} />
            Sign Out
          </button>
        </div>
      </aside>

      {/* Overlay for mobile */}
      {sidebarOpen && (
        <div
          className="admin-overlay"
          onClick={() => setSidebarOpen(false)}
        />
      )}

      {/* Main */}
      <div className="admin-main">
        {/* Top bar */}
        <header className="admin-topbar">
          <button
            className="admin-topbar__menu"
            onClick={() => setSidebarOpen(true)}
          >
            <Menu size={20} />
          </button>
          <div className="admin-topbar__breadcrumb">
            <span>Admin</span>
            {pathname !== '/admin' && (
              <>
                <ChevronRight size={14} />
                <span className="admin-topbar__breadcrumb-current">
                  {navItems.find(n => pathname.startsWith(n.href) && n.href !== '/admin')?.label || 'Page'}
                </span>
              </>
            )}
          </div>
          <div className="admin-topbar__actions">
            <button className="admin-topbar__icon-btn">
              <Bell size={18} />
            </button>
            <div className="admin-topbar__avatar">
              {session.user.name?.[0]?.toUpperCase() || 'A'}
            </div>
          </div>
        </header>

        {/* Page content */}
        <main className="admin-content">
          {children}
        </main>
      </div>

      <style jsx global>{`
        /* ===== ADMIN SHELL ===== */
        .admin-shell {
          display: flex;
          min-height: 100vh;
          background: #0a0f1e;
          font-family: 'Inter', sans-serif;
        }

        /* ===== SIDEBAR ===== */
        .admin-sidebar {
          width: 260px;
          min-height: 100vh;
          background: linear-gradient(180deg, #0d1426 0%, #0a0f1e 100%);
          border-right: 1px solid rgba(59, 130, 246, 0.1);
          display: flex;
          flex-direction: column;
          position: fixed;
          top: 0;
          left: 0;
          z-index: 100;
          transition: transform 0.3s ease;
        }

        .admin-sidebar__brand {
          display: flex;
          align-items: center;
          gap: 12px;
          padding: 24px 20px 20px;
          border-bottom: 1px solid rgba(59, 130, 246, 0.08);
        }

        .admin-sidebar__logo {
          width: 38px;
          height: 38px;
          border-radius: 10px;
          background: linear-gradient(135deg, #3B82F6, #6366F1);
          display: flex;
          align-items: center;
          justify-content: center;
          color: white;
          flex-shrink: 0;
        }

        .admin-sidebar__logo-title {
          font-size: 15px;
          font-weight: 700;
          color: #f1f5f9;
          margin: 0;
        }

        .admin-sidebar__logo-sub {
          font-size: 11px;
          color: #3B82F6;
          margin: 0;
          font-weight: 500;
          text-transform: uppercase;
          letter-spacing: 0.05em;
        }

        .admin-sidebar__close {
          margin-left: auto;
          display: none;
          background: none;
          border: none;
          color: #64748b;
          cursor: pointer;
          padding: 4px;
        }

        .admin-sidebar__badge {
          display: flex;
          align-items: center;
          gap: 10px;
          margin: 16px 16px 8px;
          padding: 12px;
          background: rgba(59, 130, 246, 0.08);
          border-radius: 12px;
          border: 1px solid rgba(59, 130, 246, 0.12);
        }

        .admin-sidebar__badge-avatar {
          width: 36px;
          height: 36px;
          border-radius: 50%;
          background: linear-gradient(135deg, #3B82F6, #6366F1);
          display: flex;
          align-items: center;
          justify-content: center;
          color: white;
          font-size: 14px;
          font-weight: 700;
          flex-shrink: 0;
        }

        .admin-sidebar__badge-name {
          font-size: 13px;
          font-weight: 600;
          color: #e2e8f0;
          margin: 0;
          white-space: nowrap;
          overflow: hidden;
          text-overflow: ellipsis;
        }

        .admin-sidebar__badge-role {
          font-size: 11px;
          color: #3B82F6;
          margin: 0;
          font-weight: 500;
        }

        .admin-sidebar__nav {
          flex: 1;
          padding: 16px 12px;
          overflow-y: auto;
        }

        .admin-sidebar__nav-label {
          font-size: 10px;
          font-weight: 700;
          color: #475569;
          text-transform: uppercase;
          letter-spacing: 0.08em;
          padding: 0 8px;
          margin: 0 0 8px;
        }

        .admin-sidebar__nav-item {
          display: flex;
          align-items: center;
          gap: 10px;
          padding: 10px 12px;
          border-radius: 10px;
          color: #94a3b8;
          font-size: 14px;
          font-weight: 500;
          text-decoration: none;
          transition: all 0.15s ease;
          margin-bottom: 2px;
          position: relative;
        }

        .admin-sidebar__nav-item:hover {
          background: rgba(59, 130, 246, 0.08);
          color: #e2e8f0;
        }

        .admin-sidebar__nav-item--active {
          background: rgba(59, 130, 246, 0.15);
          color: #60a5fa;
          font-weight: 600;
        }

        .admin-sidebar__nav-item--active::before {
          content: '';
          position: absolute;
          left: 0;
          top: 50%;
          transform: translateY(-50%);
          width: 3px;
          height: 60%;
          background: #3B82F6;
          border-radius: 0 3px 3px 0;
        }

        .admin-sidebar__nav-arrow {
          margin-left: auto;
          opacity: 0.6;
        }

        .admin-sidebar__footer {
          padding: 16px;
          border-top: 1px solid rgba(59, 130, 246, 0.08);
          display: flex;
          flex-direction: column;
          gap: 8px;
        }

        .admin-sidebar__footer-link {
          display: block;
          text-align: center;
          padding: 8px;
          font-size: 13px;
          color: #64748b;
          text-decoration: none;
          border-radius: 8px;
          transition: all 0.15s;
        }

        .admin-sidebar__footer-link:hover {
          color: #94a3b8;
          background: rgba(255,255,255,0.04);
        }

        .admin-sidebar__logout {
          display: flex;
          align-items: center;
          justify-content: center;
          gap: 8px;
          padding: 10px;
          background: rgba(239, 68, 68, 0.1);
          border: 1px solid rgba(239, 68, 68, 0.15);
          border-radius: 10px;
          color: #f87171;
          font-size: 13px;
          font-weight: 500;
          cursor: pointer;
          transition: all 0.15s;
          width: 100%;
        }

        .admin-sidebar__logout:hover {
          background: rgba(239, 68, 68, 0.18);
          border-color: rgba(239, 68, 68, 0.3);
        }

        /* ===== MAIN ===== */
        .admin-main {
          margin-left: 260px;
          flex: 1;
          display: flex;
          flex-direction: column;
          min-height: 100vh;
        }

        /* ===== TOP BAR ===== */
        .admin-topbar {
          position: sticky;
          top: 0;
          z-index: 50;
          background: rgba(10, 15, 30, 0.92);
          backdrop-filter: blur(12px);
          border-bottom: 1px solid rgba(59, 130, 246, 0.08);
          display: flex;
          align-items: center;
          padding: 0 24px;
          height: 60px;
          gap: 16px;
        }

        .admin-topbar__menu {
          display: none;
          background: none;
          border: none;
          color: #64748b;
          cursor: pointer;
          padding: 6px;
          border-radius: 8px;
          transition: background 0.15s;
        }

        .admin-topbar__menu:hover {
          background: rgba(255,255,255,0.06);
          color: #94a3b8;
        }

        .admin-topbar__breadcrumb {
          display: flex;
          align-items: center;
          gap: 6px;
          font-size: 14px;
          color: #475569;
        }

        .admin-topbar__breadcrumb-current {
          color: #e2e8f0;
          font-weight: 500;
        }

        .admin-topbar__actions {
          margin-left: auto;
          display: flex;
          align-items: center;
          gap: 10px;
        }

        .admin-topbar__icon-btn {
          width: 36px;
          height: 36px;
          display: flex;
          align-items: center;
          justify-content: center;
          background: rgba(255,255,255,0.05);
          border: 1px solid rgba(255,255,255,0.08);
          border-radius: 10px;
          color: #64748b;
          cursor: pointer;
          transition: all 0.15s;
        }

        .admin-topbar__icon-btn:hover {
          background: rgba(255,255,255,0.08);
          color: #94a3b8;
        }

        .admin-topbar__avatar {
          width: 36px;
          height: 36px;
          border-radius: 50%;
          background: linear-gradient(135deg, #3B82F6, #6366F1);
          display: flex;
          align-items: center;
          justify-content: center;
          color: white;
          font-size: 14px;
          font-weight: 700;
        }

        /* ===== CONTENT ===== */
        .admin-content {
          flex: 1;
          padding: 28px 28px 40px;
        }

        /* ===== LOADING ===== */
        .admin-loading {
          min-height: 100vh;
          display: flex;
          align-items: center;
          justify-content: center;
          background: #0a0f1e;
        }

        .admin-spinner {
          width: 40px;
          height: 40px;
          border: 3px solid rgba(59, 130, 246, 0.2);
          border-top-color: #3B82F6;
          border-radius: 50%;
          animation: spin 0.8s linear infinite;
        }

        @keyframes spin { to { transform: rotate(360deg); } }

        /* ===== OVERLAY ===== */
        .admin-overlay {
          display: none;
          position: fixed;
          inset: 0;
          background: rgba(0,0,0,0.5);
          z-index: 99;
        }

        /* ===== RESPONSIVE ===== */
        @media (max-width: 768px) {
          .admin-sidebar {
            transform: translateX(-100%);
          }
          .admin-sidebar--open {
            transform: translateX(0);
          }
          .admin-sidebar__close {
            display: flex;
          }
          .admin-main {
            margin-left: 0;
          }
          .admin-topbar__menu {
            display: flex;
          }
          .admin-overlay {
            display: block;
          }
          .admin-content {
            padding: 20px 16px 32px;
          }
        }

        /* ===== SHARED ADMIN COMPONENTS ===== */
        .admin-page-header {
          margin-bottom: 28px;
        }

        .admin-page-title {
          font-size: 24px;
          font-weight: 700;
          color: #f1f5f9;
          margin: 0 0 4px;
        }

        .admin-page-subtitle {
          font-size: 14px;
          color: #64748b;
          margin: 0;
        }

        .admin-card {
          background: rgba(255,255,255,0.03);
          border: 1px solid rgba(255,255,255,0.06);
          border-radius: 16px;
          padding: 24px;
        }

        .admin-stat-grid {
          display: grid;
          grid-template-columns: repeat(auto-fit, minmax(200px, 1fr));
          gap: 16px;
          margin-bottom: 28px;
        }

        .admin-stat-card {
          background: rgba(255,255,255,0.03);
          border: 1px solid rgba(255,255,255,0.06);
          border-radius: 16px;
          padding: 20px;
          position: relative;
          overflow: hidden;
          transition: border-color 0.2s, transform 0.2s;
        }

        .admin-stat-card:hover {
          border-color: rgba(59, 130, 246, 0.2);
          transform: translateY(-2px);
        }

        .admin-stat-card__icon {
          width: 42px;
          height: 42px;
          border-radius: 12px;
          display: flex;
          align-items: center;
          justify-content: center;
          margin-bottom: 14px;
        }

        .admin-stat-card__value {
          font-size: 28px;
          font-weight: 800;
          color: #f1f5f9;
          margin: 0 0 4px;
          letter-spacing: -0.02em;
        }

        .admin-stat-card__label {
          font-size: 13px;
          color: #64748b;
          margin: 0;
        }

        .admin-stat-card__badge {
          display: inline-flex;
          align-items: center;
          gap: 4px;
          margin-top: 8px;
          font-size: 12px;
          font-weight: 500;
          padding: 3px 8px;
          border-radius: 20px;
        }

        .admin-table-wrapper {
          background: rgba(255,255,255,0.02);
          border: 1px solid rgba(255,255,255,0.06);
          border-radius: 16px;
          overflow: hidden;
        }

        .admin-table-toolbar {
          display: flex;
          align-items: center;
          gap: 12px;
          padding: 16px 20px;
          border-bottom: 1px solid rgba(255,255,255,0.05);
          flex-wrap: wrap;
        }

        .admin-table-toolbar__title {
          font-size: 15px;
          font-weight: 600;
          color: #e2e8f0;
          margin: 0;
          flex: 1;
        }

        .admin-search {
          display: flex;
          align-items: center;
          gap: 8px;
          background: rgba(255,255,255,0.05);
          border: 1px solid rgba(255,255,255,0.08);
          border-radius: 10px;
          padding: 8px 12px;
          color: #64748b;
          width: 240px;
        }

        .admin-search input {
          background: none;
          border: none;
          outline: none;
          color: #e2e8f0;
          font-size: 13px;
          width: 100%;
        }

        .admin-search input::placeholder {
          color: #475569;
        }

        .admin-filter-btn {
          display: flex;
          align-items: center;
          gap: 6px;
          padding: 8px 14px;
          background: rgba(255,255,255,0.04);
          border: 1px solid rgba(255,255,255,0.08);
          border-radius: 10px;
          color: #94a3b8;
          font-size: 13px;
          font-weight: 500;
          cursor: pointer;
          transition: all 0.15s;
          white-space: nowrap;
        }

        .admin-filter-btn:hover, .admin-filter-btn--active {
          background: rgba(59, 130, 246, 0.12);
          border-color: rgba(59, 130, 246, 0.25);
          color: #60a5fa;
        }

        table.admin-table {
          width: 100%;
          border-collapse: collapse;
        }

        .admin-table th {
          padding: 12px 16px;
          text-align: left;
          font-size: 11px;
          font-weight: 700;
          text-transform: uppercase;
          letter-spacing: 0.06em;
          color: #475569;
          background: rgba(255,255,255,0.02);
          border-bottom: 1px solid rgba(255,255,255,0.05);
          white-space: nowrap;
        }

        .admin-table td {
          padding: 14px 16px;
          font-size: 13px;
          color: #cbd5e1;
          border-bottom: 1px solid rgba(255,255,255,0.04);
          vertical-align: middle;
        }

        .admin-table tr:last-child td {
          border-bottom: none;
        }

        .admin-table tr:hover td {
          background: rgba(255,255,255,0.02);
        }

        .admin-badge {
          display: inline-flex;
          align-items: center;
          gap: 5px;
          padding: 3px 10px;
          border-radius: 20px;
          font-size: 11px;
          font-weight: 600;
          white-space: nowrap;
        }

        .admin-badge--pending   { background: rgba(245,158,11,0.15); color: #fbbf24; border: 1px solid rgba(245,158,11,0.2); }
        .admin-badge--approved  { background: rgba(16,185,129,0.15); color: #34d399; border: 1px solid rgba(16,185,129,0.2); }
        .admin-badge--rejected  { background: rgba(239,68,68,0.15);  color: #f87171; border: 1px solid rgba(239,68,68,0.2); }
        .admin-badge--suspended { background: rgba(239,68,68,0.15);  color: #f87171; border: 1px solid rgba(239,68,68,0.2); }
        .admin-badge--active    { background: rgba(16,185,129,0.15); color: #34d399; border: 1px solid rgba(16,185,129,0.2); }
        .admin-badge--trial     { background: rgba(59,130,246,0.15); color: #60a5fa; border: 1px solid rgba(59,130,246,0.2); }
        .admin-badge--expired   { background: rgba(100,116,139,0.15); color: #94a3b8; border: 1px solid rgba(100,116,139,0.2); }
        .admin-badge--verified  { background: rgba(16,185,129,0.15); color: #34d399; border: 1px solid rgba(16,185,129,0.2); }
        .admin-badge--banned    { background: rgba(127,29,29,0.3); color: #fca5a5; border: 1px solid rgba(239,68,68,0.2); }

        .admin-btn {
          display: inline-flex;
          align-items: center;
          justify-content: center;
          gap: 6px;
          padding: 8px 16px;
          border-radius: 10px;
          font-size: 13px;
          font-weight: 600;
          cursor: pointer;
          transition: all 0.15s;
          border: none;
          text-decoration: none;
          white-space: nowrap;
        }

        .admin-btn--primary {
          background: linear-gradient(135deg, #3B82F6, #6366F1);
          color: white;
        }

        .admin-btn--primary:hover {
          opacity: 0.9;
          transform: translateY(-1px);
          box-shadow: 0 4px 12px rgba(59,130,246,0.35);
        }

        .admin-btn--success {
          background: rgba(16,185,129,0.15);
          border: 1px solid rgba(16,185,129,0.25);
          color: #34d399;
        }

        .admin-btn--success:hover {
          background: rgba(16,185,129,0.25);
        }

        .admin-btn--danger {
          background: rgba(239,68,68,0.12);
          border: 1px solid rgba(239,68,68,0.2);
          color: #f87171;
        }

        .admin-btn--danger:hover {
          background: rgba(239,68,68,0.2);
        }

        .admin-btn--ghost {
          background: rgba(255,255,255,0.05);
          border: 1px solid rgba(255,255,255,0.08);
          color: #94a3b8;
        }

        .admin-btn--ghost:hover {
          background: rgba(255,255,255,0.08);
          color: #e2e8f0;
        }

        .admin-btn--sm {
          padding: 5px 10px;
          font-size: 12px;
        }

        .admin-modal-overlay {
          position: fixed;
          inset: 0;
          background: rgba(0,0,0,0.7);
          backdrop-filter: blur(4px);
          z-index: 200;
          display: flex;
          align-items: center;
          justify-content: center;
          padding: 20px;
        }

        .admin-modal {
          background: #111827;
          border: 1px solid rgba(255,255,255,0.1);
          border-radius: 20px;
          padding: 28px;
          width: 100%;
          max-width: 480px;
          box-shadow: 0 25px 60px rgba(0,0,0,0.5);
        }

        .admin-modal__title {
          font-size: 18px;
          font-weight: 700;
          color: #f1f5f9;
          margin: 0 0 6px;
        }

        .admin-modal__subtitle {
          font-size: 13px;
          color: #64748b;
          margin: 0 0 24px;
        }

        .admin-form-group {
          margin-bottom: 16px;
        }

        .admin-form-label {
          display: block;
          font-size: 12px;
          font-weight: 600;
          color: #94a3b8;
          text-transform: uppercase;
          letter-spacing: 0.05em;
          margin-bottom: 6px;
        }

        .admin-form-input, .admin-form-select, .admin-form-textarea {
          width: 100%;
          padding: 10px 14px;
          background: rgba(255,255,255,0.05);
          border: 1px solid rgba(255,255,255,0.1);
          border-radius: 10px;
          color: #e2e8f0;
          font-size: 14px;
          outline: none;
          transition: border-color 0.15s;
          box-sizing: border-box;
        }

        .admin-form-input:focus, .admin-form-select:focus, .admin-form-textarea:focus {
          border-color: #3B82F6;
          box-shadow: 0 0 0 3px rgba(59,130,246,0.12);
        }

        .admin-form-select option {
          background: #1e293b;
        }

        .admin-form-textarea {
          resize: vertical;
          min-height: 80px;
        }

        .admin-form-row {
          display: grid;
          grid-template-columns: 1fr 1fr;
          gap: 12px;
        }

        .admin-modal__actions {
          display: flex;
          gap: 10px;
          margin-top: 20px;
          justify-content: flex-end;
        }

        .admin-empty {
          text-align: center;
          padding: 60px 20px;
          color: #475569;
        }

        .admin-empty-icon {
          font-size: 48px;
          margin-bottom: 12px;
        }

        .admin-pagination {
          display: flex;
          align-items: center;
          justify-content: space-between;
          padding: 14px 20px;
          border-top: 1px solid rgba(255,255,255,0.05);
          font-size: 13px;
          color: #64748b;
        }

        .admin-pagination__btns {
          display: flex;
          gap: 6px;
        }

        .admin-pagination__btn {
          padding: 6px 12px;
          background: rgba(255,255,255,0.04);
          border: 1px solid rgba(255,255,255,0.08);
          border-radius: 8px;
          color: #94a3b8;
          cursor: pointer;
          font-size: 12px;
          transition: all 0.15s;
        }

        .admin-pagination__btn:hover:not(:disabled) {
          background: rgba(59,130,246,0.12);
          border-color: rgba(59,130,246,0.25);
          color: #60a5fa;
        }

        .admin-pagination__btn:disabled {
          opacity: 0.4;
          cursor: not-allowed;
        }

        .admin-avatar {
          width: 36px;
          height: 36px;
          border-radius: 10px;
          background: linear-gradient(135deg, #3B82F6, #6366F1);
          display: flex;
          align-items: center;
          justify-content: center;
          color: white;
          font-size: 13px;
          font-weight: 700;
          flex-shrink: 0;
        }

        .admin-user-cell {
          display: flex;
          align-items: center;
          gap: 10px;
        }

        .admin-user-cell__name {
          font-size: 14px;
          font-weight: 600;
          color: #e2e8f0;
          margin: 0;
        }

        .admin-user-cell__email {
          font-size: 12px;
          color: #64748b;
          margin: 0;
        }

        .admin-tabs {
          display: flex;
          gap: 4px;
          margin-bottom: 24px;
          background: rgba(255,255,255,0.03);
          border-radius: 12px;
          padding: 4px;
          border: 1px solid rgba(255,255,255,0.06);
        }

        .admin-tab {
          flex: 1;
          padding: 9px 16px;
          border-radius: 9px;
          border: none;
          background: none;
          color: #64748b;
          font-size: 13px;
          font-weight: 500;
          cursor: pointer;
          transition: all 0.15s;
        }

        .admin-tab--active {
          background: rgba(59,130,246,0.15);
          color: #60a5fa;
          font-weight: 600;
        }

        .admin-toggle {
          position: relative;
          width: 44px;
          height: 24px;
          flex-shrink: 0;
        }

        .admin-toggle input {
          opacity: 0;
          width: 0;
          height: 0;
        }

        .admin-toggle__slider {
          position: absolute;
          cursor: pointer;
          top: 0; left: 0; right: 0; bottom: 0;
          background: rgba(255,255,255,0.1);
          border-radius: 24px;
          transition: 0.2s;
        }

        .admin-toggle__slider:before {
          position: absolute;
          content: '';
          height: 18px; width: 18px;
          left: 3px; bottom: 3px;
          background: white;
          border-radius: 50%;
          transition: 0.2s;
        }

        .admin-toggle input:checked + .admin-toggle__slider {
          background: #3B82F6;
        }

        .admin-toggle input:checked + .admin-toggle__slider:before {
          transform: translateX(20px);
        }
      `}</style>
    </div>
  )
}
