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
  ChevronDown
} from 'lucide-react'

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
    <header className="bg-white/95 backdrop-blur-md border-b border-gray-200/80 sticky top-0 z-50 shadow-sm transition-all">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex items-center justify-between h-16">
          {/* Logo */}
          <Link href="/" className="flex items-center gap-2 group">
            <div className="w-9 h-9 bg-blue-600 group-hover:bg-blue-700 rounded-xl flex items-center justify-center text-white font-black text-lg shadow-md transition-all">
              R
            </div>
            <span className="text-xl font-bold tracking-tight text-gray-900 group-hover:text-blue-600 transition-colors">
              RentHelper
            </span>
          </Link>

          {/* Desktop Navigation */}
          <div className="hidden md:flex items-center gap-6">
            <Link
              href="/"
              className={`flex items-center gap-1.5 text-sm font-medium transition-colors ${
                pathname === '/' || pathname.startsWith('/marketplace')
                  ? 'text-blue-600 font-semibold'
                  : 'text-gray-600 hover:text-gray-900'
              }`}
            >
              <Store className="w-4 h-4" />
              Marketplace
            </Link>

            {isLoading ? (
              <div className="w-24 h-8 bg-gray-100 animate-pulse rounded-lg" />
            ) : isAuthenticated ? (
              <div className="flex items-center gap-4">
                {/* Dashboard Button */}
                <Link
                  href={dashboardHref}
                  className="flex items-center gap-1.5 px-3.5 py-2 rounded-lg text-sm font-medium text-gray-700 bg-gray-100 hover:bg-gray-200 transition-colors"
                >
                  <LayoutDashboard className="w-4 h-4 text-blue-600" />
                  Dashboard
                </Link>

                {/* Profile Button */}
                <Link
                  href={profileHref}
                  className="flex items-center gap-1.5 px-3.5 py-2 rounded-lg text-sm font-medium text-gray-700 bg-gray-100 hover:bg-gray-200 transition-colors"
                >
                  <User className="w-4 h-4 text-gray-600" />
                  Profile
                </Link>

                {/* Dropdown / User Details */}
                <div className="relative">
                  <button
                    onClick={() => setUserDropdownOpen(!userDropdownOpen)}
                    className="flex items-center gap-2 p-1.5 rounded-full hover:bg-gray-100 transition-colors border border-gray-200"
                  >
                    <div className="w-7 h-7 rounded-full bg-blue-600 flex items-center justify-center text-white text-xs font-bold">
                      {session?.user?.name?.[0]?.toUpperCase() || session?.user?.email?.[0]?.toUpperCase() || 'U'}
                    </div>
                    <span className="text-xs font-medium text-gray-700 max-w-[100px] truncate hidden lg:inline">
                      {session?.user?.name || session?.user?.email}
                    </span>
                    <ChevronDown className="w-3.5 h-3.5 text-gray-400" />
                  </button>

                  {userDropdownOpen && (
                    <div
                      className="absolute right-0 mt-2 w-56 bg-white rounded-xl shadow-lg border border-gray-100 py-2 z-50 animate-fadeIn"
                      onClick={() => setUserDropdownOpen(false)}
                    >
                      <div className="px-4 py-2 border-b border-gray-100">
                        <p className="text-sm font-semibold text-gray-900 truncate">
                          {session?.user?.name || 'Account'}
                        </p>
                        <p className="text-xs text-gray-500 truncate">{session?.user?.email}</p>
                        <div className="mt-1.5 flex items-center gap-1 text-[11px] font-semibold text-blue-700 bg-blue-50 px-2 py-0.5 rounded-md w-fit">
                          <RoleIconComponent className="w-3 h-3" />
                          {roleBadge}
                        </div>
                      </div>

                      <Link
                        href={dashboardHref}
                        className="flex items-center gap-2 px-4 py-2 text-sm text-gray-700 hover:bg-gray-50 transition-colors"
                      >
                        <LayoutDashboard className="w-4 h-4 text-gray-500" />
                        Dashboard
                      </Link>

                      <Link
                        href={profileHref}
                        className="flex items-center gap-2 px-4 py-2 text-sm text-gray-700 hover:bg-gray-50 transition-colors"
                      >
                        <User className="w-4 h-4 text-gray-500" />
                        Profile Settings
                      </Link>

                      <div className="border-t border-gray-100 mt-1 pt-1">
                        <button
                          onClick={() => signOut({ callbackUrl: '/' })}
                          className="w-full flex items-center gap-2 px-4 py-2 text-sm text-red-600 hover:bg-red-50 transition-colors"
                        >
                          <LogOut className="w-4 h-4 text-red-500" />
                          Log out
                        </button>
                      </div>
                    </div>
                  )}
                </div>
              </div>
            ) : (
              <div className="flex items-center gap-3">
                <Link
                  href="/auth/signin"
                  className="px-4 py-2 text-sm font-medium text-gray-700 hover:text-blue-600 transition-colors"
                >
                  Log in
                </Link>
                <Link
                  href="/auth/signup"
                  className="px-4 py-2 text-sm font-medium text-white bg-blue-600 hover:bg-blue-700 rounded-xl shadow-sm transition-all"
                >
                  Sign up
                </Link>
              </div>
            )}
          </div>

          {/* Mobile menu button */}
          <div className="md:hidden flex items-center">
            <button
              onClick={() => setMobileMenuOpen(!mobileMenuOpen)}
              className="p-2 text-gray-600 hover:text-gray-900 rounded-lg focus:outline-none"
            >
              {mobileMenuOpen ? <X className="w-6 h-6" /> : <Menu className="w-6 h-6" />}
            </button>
          </div>
        </div>
      </div>

      {/* Mobile dropdown */}
      {mobileMenuOpen && (
        <div className="md:hidden bg-white border-b border-gray-200 px-4 pt-2 pb-4 space-y-3">
          <Link
            href="/"
            onClick={() => setMobileMenuOpen(false)}
            className="flex items-center gap-2 py-2 text-base font-medium text-gray-700 hover:text-blue-600"
          >
            <Store className="w-5 h-5" />
            Marketplace
          </Link>

          {isAuthenticated ? (
            <>
              <div className="pt-2 border-t border-gray-100">
                <p className="text-xs text-gray-400 uppercase tracking-wider font-semibold mb-2">
                  Signed in as {session?.user?.name || session?.user?.email} ({roleBadge})
                </p>
                <Link
                  href={dashboardHref}
                  onClick={() => setMobileMenuOpen(false)}
                  className="flex items-center gap-2 py-2 text-base font-medium text-gray-700 hover:text-blue-600"
                >
                  <LayoutDashboard className="w-5 h-5 text-blue-600" />
                  Dashboard
                </Link>
                <Link
                  href={profileHref}
                  onClick={() => setMobileMenuOpen(false)}
                  className="flex items-center gap-2 py-2 text-base font-medium text-gray-700 hover:text-blue-600"
                >
                  <User className="w-5 h-5 text-gray-600" />
                  Profile
                </Link>
              </div>

              <button
                onClick={() => {
                  setMobileMenuOpen(false)
                  signOut({ callbackUrl: '/' })
                }}
                className="w-full flex items-center justify-center gap-2 py-2.5 mt-2 text-base font-medium text-red-600 bg-red-50 rounded-xl"
              >
                <LogOut className="w-5 h-5" />
                Log out
              </button>
            </>
          ) : (
            <div className="pt-2 border-t border-gray-100 flex flex-col gap-2">
              <Link
                href="/auth/signin"
                onClick={() => setMobileMenuOpen(false)}
                className="w-full text-center py-2.5 text-base font-medium text-gray-700 border border-gray-300 rounded-xl"
              >
                Log in
              </Link>
              <Link
                href="/auth/signup"
                onClick={() => setMobileMenuOpen(false)}
                className="w-full text-center py-2.5 text-base font-medium text-white bg-blue-600 hover:bg-blue-700 rounded-xl"
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
