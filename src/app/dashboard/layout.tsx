'use client'

import { useState, useEffect } from 'react'
import Link from 'next/link'
import { usePathname } from 'next/navigation'
import { 
  LayoutDashboard, Calendar, ClipboardList, Package, Tag, Users, ShieldOff, 
  FileText, CreditCard, Settings, CalendarCog, User, LogOut, Menu, X, Search, Bell, BarChart3,
  Clock
} from 'lucide-react'
import { signOut, useSession } from 'next-auth/react'

export default function DashboardLayout({ children }: { children: React.ReactNode }) {
  const pathname = usePathname()
  const [sidebarOpen, setSidebarOpen] = useState(false)
  const { data: session } = useSession()
  const [approvalStatus, setApprovalStatus] = useState<string | null>(null)
  const [trialDaysLeft, setTrialDaysLeft] = useState<number | null>(null)

  useEffect(() => {
    if (session?.user?.role === 'provider') {
      fetch('/api/business/status')
        .then(r => r.json())
        .then(d => {
          setApprovalStatus(d.approvalStatus)
          if (d.subscription?.trialEndsAt) {
            const days = Math.ceil((new Date(d.subscription.trialEndsAt).getTime() - Date.now()) / 86400000)
            setTrialDaysLeft(Math.max(0, days))
          }
        })
        .catch(() => {})
    }
  }, [session])

  const navGroups = [
    {
      title: 'MAIN',
      items: [
        { name: 'Dashboard', href: '/dashboard', icon: LayoutDashboard },
        { name: 'Calendar', href: '/dashboard/calendar', icon: Calendar },
        { name: 'Bookings', href: '/dashboard/bookings', icon: ClipboardList },
      ]
    },
    {
      title: 'INVENTORY',
      items: [
        { name: 'Items', href: '/dashboard/items', icon: Package },
        { name: 'Categories', href: '/dashboard/categories', icon: Tag },
      ]
    },
    {
      title: 'CUSTOMERS',
      items: [
        { name: 'All Customers', href: '/dashboard/customers', icon: Users },
        { name: 'Blacklist', href: '/dashboard/blacklist', icon: ShieldOff },
      ]
    },
    {
      title: 'FINANCE',
      items: [
        { name: 'Reports', href: '/dashboard/reports', icon: BarChart3 },
        { name: 'Invoices', href: '/dashboard/invoices', icon: FileText },
        { name: 'Payments', href: '/dashboard/payments', icon: CreditCard },
      ]
    },
    {
      title: 'SETTINGS',
      items: [
        { name: 'Business Settings', href: '/dashboard/settings', icon: Settings },
        { name: 'Calendar Sync', href: '/dashboard/settings/calendar', icon: CalendarCog },
        { name: 'Profile', href: '/dashboard/settings/profile', icon: User },
      ]
    }
  ]

  return (
    <div className="min-h-screen bg-gray-50 flex">
      {/* Mobile sidebar backdrop */}
      {sidebarOpen && (
        <div className="fixed inset-0 z-40 bg-gray-900/50 lg:hidden" onClick={() => setSidebarOpen(false)} />
      )}

      {/* Sidebar */}
      <aside className={`fixed inset-y-0 left-0 z-50 w-64 bg-slate-900 text-slate-300 transition-transform duration-300 lg:static lg:translate-x-0 ${sidebarOpen ? 'translate-x-0' : '-translate-x-full'}`}>
        <div className="flex items-center justify-between h-16 px-6 bg-slate-950">
          <Link href="/dashboard" className="text-xl font-bold text-white flex items-center gap-2">
            <span className="w-8 h-8 bg-blue-600 rounded-lg flex items-center justify-center">R</span>
            RentHelper
          </Link>
          <button className="lg:hidden text-slate-400 hover:text-white" onClick={() => setSidebarOpen(false)}>
            <X className="w-6 h-6" />
          </button>
        </div>

        <div className="p-4 h-[calc(100vh-4rem-5rem)] overflow-y-auto">
          {navGroups.map((group, idx) => (
            <div key={idx} className="mb-6">
              <h3 className="px-3 text-xs font-semibold text-slate-500 uppercase tracking-wider mb-2">
                {group.title}
              </h3>
              <div className="space-y-1">
                {group.items.map((item) => {
                  const isActive = pathname === item.href || (item.href !== '/dashboard' && pathname.startsWith(item.href))
                  const Icon = item.icon
                  return (
                    <Link
                      key={item.name}
                      href={item.href}
                      className={`flex items-center gap-3 px-3 py-2 rounded-md transition-colors ${
                        isActive 
                          ? 'bg-blue-600 text-white' 
                          : 'text-slate-400 hover:bg-slate-800 hover:text-white'
                      }`}
                    >
                      <Icon className="w-5 h-5" />
                      {item.name}
                    </Link>
                  )
                })}
              </div>
            </div>
          ))}
        </div>

        <div className="absolute bottom-0 w-full p-4 bg-slate-950 border-t border-slate-800">
          <div className="flex items-center gap-3 mb-4">
            <div className="w-10 h-10 rounded-full bg-blue-600 flex items-center justify-center text-white font-semibold text-sm">
              {session?.user?.name?.charAt(0)?.toUpperCase() ?? 'U'}
            </div>
            <div className="min-w-0">
              <div className="text-sm font-medium text-white truncate">{session?.user?.name ?? 'My Account'}</div>
              <div className="text-xs text-slate-400 truncate">{session?.user?.email ?? ''}</div>
            </div>
          </div>
          <button 
            onClick={() => signOut()} 
            className="w-full flex items-center justify-center gap-2 px-3 py-2 text-sm font-medium text-red-400 bg-red-400/10 rounded-md hover:bg-red-400/20 transition-colors"
          >
            <LogOut className="w-4 h-4" /> Sign Out
          </button>
        </div>
      </aside>

      {/* Main Content */}
      <main className="flex-1 flex flex-col min-w-0">
        <header className="h-16 bg-white border-b border-gray-200 flex items-center justify-between px-4 lg:px-8">
          <div className="flex items-center gap-4">
            <button className="lg:hidden text-gray-500" onClick={() => setSidebarOpen(true)}>
              <Menu className="w-6 h-6" />
            </button>
            <div className="hidden sm:block relative">
              <Search className="w-5 h-5 absolute left-3 top-1/2 -translate-y-1/2 text-gray-400" />
              <input 
                type="text" 
                placeholder="Search bookings, items..." 
                className="pl-10 pr-4 py-2 border border-gray-300 rounded-lg text-sm w-64 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
              />
            </div>
          </div>
          <div className="flex items-center gap-4">
            <button className="relative text-gray-500 hover:text-gray-700">
              <Bell className="w-6 h-6" />
              <span className="absolute top-0 right-0 w-2.5 h-2.5 bg-red-500 rounded-full border-2 border-white"></span>
            </button>
          </div>
        </header>

        <div className="flex-1 overflow-auto">
          {/* Trial expiry warning */}
          {trialDaysLeft !== null && trialDaysLeft <= 7 && trialDaysLeft > 0 && (
            <div style={{ background: 'rgba(59,130,246,0.08)', borderBottom: '1px solid rgba(59,130,246,0.15)', padding: '10px 24px', display: 'flex', alignItems: 'center', gap: '10px' }}>
              <Clock size={15} color="#60a5fa" style={{ flexShrink: 0 }} />
              <p style={{ margin: 0, fontSize: '13px', color: '#60a5fa', fontWeight: 500 }}>
                Your free trial expires in <strong>{trialDaysLeft} day{trialDaysLeft !== 1 ? 's' : ''}</strong>. Contact your admin to upgrade.
              </p>
            </div>
          )}
          <div className="p-4 lg:p-8">
            {children}
          </div>
        </div>
      </main>
    </div>
  )
}
