'use client'

import { useState } from 'react'
import Link from 'next/link'
import { usePathname } from 'next/navigation'
import { useSession, signOut } from 'next-auth/react'
import {
  Store,
  LayoutDashboard,
  User,
  LogOut,
  Menu,
  X,
  Shield,
  Building2,
  UserCheck,
  ChevronDown,
  Search,
  Sparkles
} from 'lucide-react'
import ThemeToggle from '@/components/theme/ThemeToggle'

export default function Header() {
  const { data: session, status } = useSession()
  const pathname = usePathname()
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false)
  const [userDropdownOpen, setUserDropdownOpen] = useState(false)

  const isLoading = status === 'loading'
  const isAuthenticated = status === 'authenticated' && !!session?.user
  const role = session?.user?.role || 'customer'

  // Role-aware dashboard targets
  let dashboardHref = '/customer/dashboard'
  let profileHref = '/customer/profile'
  let roleBadge = 'Customer'
  let roleIcon = UserCheck

  if (role === 'admin') {
    dashboardHref = '/admin'
    profileHref = '/admin/settings'
    roleBadge = 'Admin'
    roleIcon = Shield
  } else if (role === 'provider') {
    dashboardHref = '/dashboard'
    profileHref = '/dashboard/settings/profile'
    roleBadge = 'Provider'
    roleIcon = Building2
  }

  const RoleIconComponent = roleIcon

  return (
    <header className="bg-white/95 dark:bg-slate-900/95 backdrop-blur-md border-b border-slate-200/80 dark:border-slate-800 sticky top-0 z-50 shadow-xs transition-colors">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex items-center justify-between h-16 sm:h-20">
          {/* Logo */}
          <Link href="/" className="flex items-center gap-2.5 group">
            <div className="w-10 h-10 bg-gradient-to-br from-emerald-500 to-teal-600 group-hover:from-emerald-600 group-hover:to-teal-700 rounded-xl flex items-center justify-center text-white font-black text-xl shadow-md transition-all group-hover:scale-105">
              R
            </div>
            <div className="flex flex-col">
              <span className="text-xl font-extrabold tracking-tight text-slate-900 dark:text-white group-hover:text-emerald-600 dark:group-hover:text-emerald-400 transition-colors">
                RentHelper
              </span>
              <span className="text-[10px] text-emerald-600 dark:text-emerald-400 font-semibold tracking-wider uppercase -mt-1 hidden sm:inline">
                Marketplace
              </span>
            </div>
          </Link>

          {/* Desktop Navigation Links */}
          <nav className="hidden md:flex items-center gap-1 lg:gap-2">
            <Link
              href="/"
              className={`px-3 py-2 rounded-lg text-sm font-medium transition-colors ${
                pathname === '/'
                  ? 'text-emerald-600 dark:text-emerald-400 font-semibold bg-emerald-50 dark:bg-emerald-950/40'
                  : 'text-slate-600 dark:text-slate-300 hover:text-slate-900 dark:hover:text-white hover:bg-slate-100 dark:hover:bg-slate-800'
              }`}
            >
              Home
            </Link>

            <Link
              href="/#browse"
              className={`px-3 py-2 rounded-lg text-sm font-medium transition-colors text-slate-600 dark:text-slate-300 hover:text-slate-900 dark:hover:text-white hover:bg-slate-100 dark:hover:bg-slate-800`}
            >
              Browse Items
            </Link>

            <Link
              href="/#how-it-works"
              className={`px-3 py-2 rounded-lg text-sm font-medium transition-colors text-slate-600 dark:text-slate-300 hover:text-slate-900 dark:hover:text-white hover:bg-slate-100 dark:hover:bg-slate-800`}
            >
              How It Works
            </Link>

            <Link
              href="/terms"
              className={`px-3 py-2 rounded-lg text-sm font-medium transition-colors text-slate-600 dark:text-slate-300 hover:text-slate-900 dark:hover:text-white hover:bg-slate-100 dark:hover:bg-slate-800`}
            >
              About
            </Link>
          </nav>

          {/* Header Right Actions */}
          <div className="hidden md:flex items-center gap-3">
            {/* Theme Toggle */}
            <ThemeToggle />

            {isLoading ? (
              <div className="w-24 h-9 bg-slate-100 dark:bg-slate-800 animate-pulse rounded-xl" />
            ) : isAuthenticated ? (
              <div className="flex items-center gap-2 lg:gap-3">
                {/* Dashboard Button */}
                <Link
                  href={dashboardHref}
                  className="flex items-center gap-1.5 px-3.5 py-2 rounded-xl text-sm font-semibold text-slate-700 dark:text-slate-200 bg-slate-100 dark:bg-slate-800 hover:bg-slate-200 dark:hover:bg-slate-700 transition-colors"
                >
                  <LayoutDashboard className="w-4 h-4 text-emerald-600 dark:text-emerald-400" />
                  <span>Dashboard</span>
                </Link>

                {/* Profile Button */}
                <Link
                  href={profileHref}
                  className="flex items-center gap-1.5 px-3.5 py-2 rounded-xl text-sm font-semibold text-slate-700 dark:text-slate-200 bg-slate-100 dark:bg-slate-800 hover:bg-slate-200 dark:hover:bg-slate-700 transition-colors"
                >
                  <User className="w-4 h-4 text-slate-500 dark:text-slate-400" />
                  <span>Profile</span>
                </Link>

                {/* User Dropdown */}
                <div className="relative">
                  <button
                    onClick={() => setUserDropdownOpen(!userDropdownOpen)}
                    className="flex items-center gap-2 p-1.5 rounded-full hover:bg-slate-100 dark:hover:bg-slate-800 transition-colors border border-slate-200 dark:border-slate-700"
                    aria-label="User menu"
                  >
                    <div className="w-8 h-8 rounded-full bg-emerald-600 flex items-center justify-center text-white text-xs font-bold shadow-xs">
                      {session?.user?.name?.[0]?.toUpperCase() || session?.user?.email?.[0]?.toUpperCase() || 'U'}
                    </div>
                    <span className="text-xs font-semibold text-slate-700 dark:text-slate-200 max-w-[90px] truncate hidden lg:inline">
                      {session?.user?.name || session?.user?.email}
                    </span>
                    <ChevronDown className="w-3.5 h-3.5 text-slate-400" />
                  </button>

                  {userDropdownOpen && (
                    <div
                      className="absolute right-0 mt-2 w-60 bg-white dark:bg-slate-900 rounded-2xl shadow-xl border border-slate-100 dark:border-slate-800 py-2 z-50 animate-fadeIn"
                      onClick={() => setUserDropdownOpen(false)}
                    >
                      <div className="px-4 py-2.5 border-b border-slate-100 dark:border-slate-800">
                        <p className="text-sm font-bold text-slate-900 dark:text-white truncate">
                          {session?.user?.name || 'Account'}
                        </p>
                        <p className="text-xs text-slate-500 dark:text-slate-400 truncate">{session?.user?.email}</p>
                        <div className="mt-2 flex items-center gap-1 text-[11px] font-bold text-emerald-700 dark:text-emerald-300 bg-emerald-50 dark:bg-emerald-950/60 border border-emerald-200/60 dark:border-emerald-800/60 px-2 py-0.5 rounded-md w-fit">
                          <RoleIconComponent className="w-3 h-3" />
                          {roleBadge}
                        </div>
                      </div>

                      <Link
                        href={dashboardHref}
                        className="flex items-center gap-2.5 px-4 py-2.5 text-sm text-slate-700 dark:text-slate-200 hover:bg-slate-50 dark:hover:bg-slate-800 transition-colors"
                      >
                        <LayoutDashboard className="w-4 h-4 text-emerald-600 dark:text-emerald-400" />
                        Dashboard
                      </Link>

                      <Link
                        href={profileHref}
                        className="flex items-center gap-2.5 px-4 py-2.5 text-sm text-slate-700 dark:text-slate-200 hover:bg-slate-50 dark:hover:bg-slate-800 transition-colors"
                      >
                        <User className="w-4 h-4 text-slate-500 dark:text-slate-400" />
                        Profile Settings
                      </Link>

                      <div className="border-t border-slate-100 dark:border-slate-800 mt-1 pt-1">
                        <button
                          onClick={() => signOut({ callbackUrl: '/' })}
                          className="w-full flex items-center gap-2.5 px-4 py-2.5 text-sm font-medium text-rose-600 dark:text-rose-400 hover:bg-rose-50 dark:hover:bg-rose-950/40 transition-colors"
                        >
                          <LogOut className="w-4 h-4 text-rose-500" />
                          Log out
                        </button>
                      </div>
                    </div>
                  )}
                </div>
              </div>
            ) : (
              <div className="flex items-center gap-2.5">
                <Link
                  href="/auth/signin"
                  className="px-4 py-2 text-sm font-semibold text-slate-700 dark:text-slate-200 hover:text-emerald-600 dark:hover:text-emerald-400 transition-colors"
                >
                  Log in
                </Link>
                <Link
                  href="/auth/signup"
                  className="px-4 py-2 text-sm font-semibold text-white bg-emerald-600 hover:bg-emerald-700 rounded-xl shadow-md hover:shadow-emerald-600/20 transition-all"
                >
                  Sign up
                </Link>
              </div>
            )}
          </div>

          {/* Mobile menu controls */}
          <div className="md:hidden flex items-center gap-2">
            <ThemeToggle />
            <button
              onClick={() => setMobileMenuOpen(!mobileMenuOpen)}
              className="p-2 text-slate-600 dark:text-slate-300 hover:text-slate-900 dark:hover:text-white rounded-xl focus:outline-none"
              aria-label="Toggle menu"
            >
              {mobileMenuOpen ? <X className="w-6 h-6" /> : <Menu className="w-6 h-6" />}
            </button>
          </div>
        </div>
      </div>

      {/* Mobile Menu Drawer */}
      {mobileMenuOpen && (
        <div className="md:hidden bg-white dark:bg-slate-900 border-b border-slate-200 dark:border-slate-800 px-4 pt-3 pb-6 space-y-3 animate-fadeIn">
          <nav className="flex flex-col gap-1.5">
            <Link
              href="/"
              onClick={() => setMobileMenuOpen(false)}
              className="flex items-center gap-2.5 py-2 px-3 rounded-lg text-base font-semibold text-slate-800 dark:text-slate-200 hover:bg-slate-100 dark:hover:bg-slate-800"
            >
              <Store className="w-5 h-5 text-emerald-600 dark:text-emerald-400" />
              Home
            </Link>

            <Link
              href="/#browse"
              onClick={() => setMobileMenuOpen(false)}
              className="flex items-center gap-2.5 py-2 px-3 rounded-lg text-base font-medium text-slate-700 dark:text-slate-300 hover:bg-slate-100 dark:hover:bg-slate-800"
            >
              <Search className="w-5 h-5 text-slate-500" />
              Browse Items
            </Link>

            <Link
              href="/#how-it-works"
              onClick={() => setMobileMenuOpen(false)}
              className="flex items-center gap-2.5 py-2 px-3 rounded-lg text-base font-medium text-slate-700 dark:text-slate-300 hover:bg-slate-100 dark:hover:bg-slate-800"
            >
              <Sparkles className="w-5 h-5 text-slate-500" />
              How It Works
            </Link>

            <Link
              href="/terms"
              onClick={() => setMobileMenuOpen(false)}
              className="flex items-center gap-2.5 py-2 px-3 rounded-lg text-base font-medium text-slate-700 dark:text-slate-300 hover:bg-slate-100 dark:hover:bg-slate-800"
            >
              About
            </Link>
          </nav>

          {isAuthenticated ? (
            <div className="pt-3 border-t border-slate-100 dark:border-slate-800">
              <p className="text-xs text-slate-400 dark:text-slate-500 uppercase tracking-wider font-bold mb-2.5 px-3">
                Signed in as {session?.user?.name || session?.user?.email} ({roleBadge})
              </p>
              <Link
                href={dashboardHref}
                onClick={() => setMobileMenuOpen(false)}
                className="flex items-center gap-2.5 py-2.5 px-3 rounded-xl text-base font-semibold text-slate-800 dark:text-slate-200 hover:bg-slate-100 dark:hover:bg-slate-800"
              >
                <LayoutDashboard className="w-5 h-5 text-emerald-600 dark:text-emerald-400" />
                Dashboard
              </Link>
              <Link
                href={profileHref}
                onClick={() => setMobileMenuOpen(false)}
                className="flex items-center gap-2.5 py-2.5 px-3 rounded-xl text-base font-semibold text-slate-800 dark:text-slate-200 hover:bg-slate-100 dark:hover:bg-slate-800"
              >
                <User className="w-5 h-5 text-slate-500" />
                Profile
              </Link>

              <button
                onClick={() => {
                  setMobileMenuOpen(false)
                  signOut({ callbackUrl: '/' })
                }}
                className="w-full flex items-center justify-center gap-2 py-3 mt-3 text-base font-bold text-rose-600 dark:text-rose-400 bg-rose-50 dark:bg-rose-950/40 rounded-xl"
              >
                <LogOut className="w-5 h-5" />
                Log out
              </button>
            </div>
          ) : (
            <div className="pt-3 border-t border-slate-100 dark:border-slate-800 flex flex-col gap-2.5">
              <Link
                href="/auth/signin"
                onClick={() => setMobileMenuOpen(false)}
                className="w-full text-center py-2.5 text-base font-semibold text-slate-700 dark:text-slate-200 border border-slate-300 dark:border-slate-700 rounded-xl"
              >
                Log in
              </Link>
              <Link
                href="/auth/signup"
                onClick={() => setMobileMenuOpen(false)}
                className="w-full text-center py-2.5 text-base font-semibold text-white bg-emerald-600 hover:bg-emerald-700 rounded-xl shadow-md"
              >
                Sign up
              </Link>
            </div>
          )}
        </div>
      )}
    </header>
  )
}
