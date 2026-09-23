'use client'

import { useState } from 'react'
import Link from 'next/link'
import { ArrowLeft, CalendarCog, CheckCircle2, XCircle, RefreshCw, ExternalLink, AlertCircle, Unlink } from 'lucide-react'

export default function CalendarSyncPage() {
  const [isConnected, setIsConnected] = useState(false)
  const [syncEnabled, setSyncEnabled] = useState(true)
  const [isConnecting, setIsConnecting] = useState(false)

  const handleConnect = async () => {
    setIsConnecting(true)
    // In production, redirect to Google OAuth for calendar scope
    await new Promise(r => setTimeout(r, 1500))
    setIsConnected(true)
    setIsConnecting(false)
  }

  const handleDisconnect = () => {
    if (confirm('Disconnect Google Calendar? Future bookings will not be synced.')) {
      setIsConnected(false)
    }
  }

  return (
    <div className="max-w-2xl mx-auto space-y-6">
      <div className="flex items-center gap-4">
        <Link href="/dashboard/settings" className="p-2 rounded-lg text-gray-500 hover:bg-gray-100">
          <ArrowLeft className="w-5 h-5" />
        </Link>
        <div>
          <h1 className="text-2xl font-bold text-gray-900">Google Calendar Sync</h1>
          <p className="text-sm text-gray-500">Automatically sync bookings to your Google Calendar</p>
        </div>
      </div>

      {/* Status Card */}
      <div className={`rounded-xl border-2 p-6 ${isConnected ? 'border-green-400 bg-green-50' : 'border-gray-200 bg-white'}`}>
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-4">
            {/* Google Calendar Icon */}
            <div className="w-12 h-12 rounded-xl bg-white border border-gray-200 shadow-sm flex items-center justify-center text-2xl">
              📅
            </div>
            <div>
              <p className="font-semibold text-gray-900">Google Calendar</p>
              <div className="flex items-center gap-1 mt-0.5">
                {isConnected ? (
                  <>
                    <CheckCircle2 className="w-4 h-4 text-green-600" />
                    <span className="text-sm text-green-700 font-medium">Connected</span>
                  </>
                ) : (
                  <>
                    <XCircle className="w-4 h-4 text-gray-400" />
                    <span className="text-sm text-gray-500">Not connected</span>
                  </>
                )}
              </div>
            </div>
          </div>
          {isConnected ? (
            <button
              onClick={handleDisconnect}
              className="flex items-center gap-2 px-4 py-2 border border-red-300 text-red-600 rounded-lg text-sm font-medium hover:bg-red-50 transition-colors"
            >
              <Unlink className="w-4 h-4" /> Disconnect
            </button>
          ) : (
            <button
              onClick={handleConnect}
              disabled={isConnecting}
              className="flex items-center gap-2 px-4 py-2 bg-blue-600 text-white rounded-lg text-sm font-medium hover:bg-blue-700 disabled:opacity-50 transition-colors"
            >
              {isConnecting ? (
                <><RefreshCw className="w-4 h-4 animate-spin" /> Connecting...</>
              ) : (
                <><ExternalLink className="w-4 h-4" /> Connect Google</>
              )}
            </button>
          )}
        </div>

        {isConnected && (
          <div className="mt-4 pt-4 border-t border-green-200 space-y-3">
            <div className="text-sm text-gray-600">
              <span className="font-medium">Connected calendar:</span> Primary Calendar
            </div>
            <div className="text-sm text-gray-600">
              <span className="font-medium">Last synced:</span> Just now
            </div>

            {/* Sync Toggle */}
            <label className="flex items-center justify-between p-3 rounded-lg bg-white border border-green-200 cursor-pointer">
              <div>
                <p className="text-sm font-medium text-gray-900">Auto-sync new bookings</p>
                <p className="text-xs text-gray-500">Create calendar events when bookings are confirmed</p>
              </div>
              <div className="relative" onClick={() => setSyncEnabled(v => !v)}>
                <div className={`w-10 h-5 rounded-full transition-colors ${syncEnabled ? 'bg-blue-600' : 'bg-gray-200'}`}>
                  <div className={`absolute top-0.5 w-4 h-4 bg-white rounded-full shadow transition-transform ${syncEnabled ? 'translate-x-5' : 'translate-x-0.5'}`} />
                </div>
              </div>
            </label>
          </div>
        )}
      </div>

      {/* How it works */}
      <div className="bg-white rounded-xl border border-gray-200 shadow-sm p-6">
        <h2 className="text-lg font-semibold text-gray-900 mb-4">How it works</h2>
        <div className="space-y-4">
          {[
            { step: '1', title: 'Connect your Google account', desc: 'Authorize RentHelper to create events in your Google Calendar.' },
            { step: '2', title: 'Bookings sync automatically', desc: 'When a booking is confirmed, an event is created with pickup/return dates and customer name.' },
            { step: '3', title: 'Stay organized', desc: 'View your rental schedule directly in Google Calendar alongside your personal events.' },
          ].map(item => (
            <div key={item.step} className="flex gap-4">
              <div className="w-8 h-8 rounded-full bg-blue-100 text-blue-600 flex items-center justify-center font-bold text-sm shrink-0">
                {item.step}
              </div>
              <div>
                <p className="text-sm font-medium text-gray-900">{item.title}</p>
                <p className="text-sm text-gray-500">{item.desc}</p>
              </div>
            </div>
          ))}
        </div>
      </div>

      {/* Note */}
      <div className="bg-amber-50 border border-amber-200 rounded-xl p-4 flex gap-3">
        <AlertCircle className="w-5 h-5 text-amber-600 shrink-0 mt-0.5" />
        <p className="text-sm text-amber-700">
          Calendar sync requires your Google OAuth credentials to be configured in <span className="font-mono text-xs">.env.local</span>. Set <span className="font-mono text-xs">GOOGLE_CLIENT_ID</span> and <span className="font-mono text-xs">GOOGLE_CLIENT_SECRET</span>.
        </p>
      </div>
    </div>
  )
}
