'use client'

import { useState } from 'react'
import { Settings, Building2, Bell, CreditCard, Lock, Save, ChevronRight, User, Globe, Clock } from 'lucide-react'

const TABS = [
  { id: 'business', label: 'Business', icon: Building2 },
  { id: 'notifications', label: 'Notifications', icon: Bell },
  { id: 'billing', label: 'Billing & Plan', icon: CreditCard },
  { id: 'security', label: 'Security', icon: Lock },
]

export default function SettingsPage() {
  const [activeTab, setActiveTab] = useState('business')
  const [isSaving, setIsSaving] = useState(false)
  const [businessForm, setBusinessForm] = useState({
    name: 'My Rental Business',
    phone: '0771234567',
    address: '123 Main St',
    city: 'Colombo',
    currency: 'LKR',
    timezone: 'Asia/Colombo',
    advancePaymentPercent: '30',
    cancellationPolicy: '',
    depositPolicy: '',
  })

  const [notifications, setNotifications] = useState({
    bookingConfirmation: true,
    pickupReminder: true,
    returnReminder: true,
    overdueAlert: true,
    paymentDue: true,
    kycStatus: true,
    emailChannel: true,
    whatsappChannel: false,
    smsChannel: false,
  })

  const handleSave = async () => {
    setIsSaving(true)
    await new Promise(r => setTimeout(r, 1000))
    setIsSaving(false)
    alert('Settings saved!')
  }

  return (
    <div className="max-w-4xl mx-auto space-y-6">
      <div>
        <h1 className="text-2xl font-bold text-gray-900">Settings</h1>
        <p className="text-sm text-gray-500 mt-1">Manage your business preferences</p>
      </div>

      <div className="flex flex-col lg:flex-row gap-6">
        {/* Sidebar */}
        <div className="lg:w-56 shrink-0">
          <nav className="bg-white rounded-xl border border-gray-200 shadow-sm p-2 space-y-1">
            {TABS.map(tab => (
              <button key={tab.id} onClick={() => setActiveTab(tab.id)}
                className={`w-full flex items-center gap-3 px-3 py-2.5 rounded-lg text-sm font-medium transition-colors ${
                  activeTab === tab.id ? 'bg-blue-600 text-white' : 'text-gray-600 hover:bg-gray-100'
                }`}>
                <tab.icon className="w-4 h-4" />
                {tab.label}
              </button>
            ))}
          </nav>
        </div>

        {/* Content */}
        <div className="flex-1 space-y-4">
          {activeTab === 'business' && (
            <div className="bg-white rounded-xl border border-gray-200 shadow-sm p-6 space-y-4">
              <h2 className="text-lg font-semibold text-gray-900">Business Profile</h2>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div className="md:col-span-2">
                  <label className="block text-sm font-medium text-gray-700 mb-1">Business Name</label>
                  <input value={businessForm.name} onChange={e => setBusinessForm(f => ({...f, name: e.target.value}))}
                    className="w-full border border-gray-300 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500" />
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">Phone Number</label>
                  <input value={businessForm.phone} onChange={e => setBusinessForm(f => ({...f, phone: e.target.value}))}
                    className="w-full border border-gray-300 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500" />
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">City</label>
                  <input value={businessForm.city} onChange={e => setBusinessForm(f => ({...f, city: e.target.value}))}
                    className="w-full border border-gray-300 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500" />
                </div>
                <div className="md:col-span-2">
                  <label className="block text-sm font-medium text-gray-700 mb-1">Address</label>
                  <input value={businessForm.address} onChange={e => setBusinessForm(f => ({...f, address: e.target.value}))}
                    className="w-full border border-gray-300 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500" />
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">Currency</label>
                  <select value={businessForm.currency} onChange={e => setBusinessForm(f => ({...f, currency: e.target.value}))}
                    className="w-full border border-gray-300 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500">
                    <option value="LKR">LKR — Sri Lankan Rupee</option>
                    <option value="USD">USD — US Dollar</option>
                    <option value="EUR">EUR — Euro</option>
                    <option value="INR">INR — Indian Rupee</option>
                  </select>
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">Advance Payment %</label>
                  <input type="number" min="0" max="100" value={businessForm.advancePaymentPercent}
                    onChange={e => setBusinessForm(f => ({...f, advancePaymentPercent: e.target.value}))}
                    className="w-full border border-gray-300 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500" />
                </div>
                <div className="md:col-span-2">
                  <label className="block text-sm font-medium text-gray-700 mb-1">Cancellation Policy</label>
                  <textarea value={businessForm.cancellationPolicy} rows={3}
                    onChange={e => setBusinessForm(f => ({...f, cancellationPolicy: e.target.value}))}
                    className="w-full border border-gray-300 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500 resize-none"
                    placeholder="Describe your cancellation terms..." />
                </div>
              </div>
            </div>
          )}

          {activeTab === 'notifications' && (
            <div className="bg-white rounded-xl border border-gray-200 shadow-sm p-6 space-y-6">
              <h2 className="text-lg font-semibold text-gray-900">Notification Preferences</h2>
              
              <div>
                <h3 className="text-sm font-medium text-gray-700 mb-3">Events to notify</h3>
                <div className="space-y-3">
                  {[
                    { key: 'bookingConfirmation', label: 'Booking Confirmations', desc: 'When a booking is created or confirmed' },
                    { key: 'pickupReminder', label: 'Pickup Reminders', desc: '24 hours before pickup' },
                    { key: 'returnReminder', label: 'Return Reminders', desc: '24 hours before return date' },
                    { key: 'overdueAlert', label: 'Overdue Alerts', desc: 'When an item is not returned on time' },
                    { key: 'paymentDue', label: 'Payment Due', desc: 'When balance payment is due' },
                    { key: 'kycStatus', label: 'KYC Status Updates', desc: 'When customer KYC is reviewed' },
                  ].map(item => (
                    <label key={item.key} className="flex items-center justify-between p-3 rounded-lg border border-gray-100 hover:bg-gray-50 cursor-pointer">
                      <div>
                        <p className="text-sm font-medium text-gray-900">{item.label}</p>
                        <p className="text-xs text-gray-500">{item.desc}</p>
                      </div>
                      <div className="relative">
                        <input type="checkbox" className="sr-only"
                          checked={(notifications as any)[item.key]}
                          onChange={e => setNotifications(n => ({...n, [item.key]: e.target.checked}))} />
                        <div className={`w-10 h-5 rounded-full transition-colors ${(notifications as any)[item.key] ? 'bg-blue-600' : 'bg-gray-200'}`}>
                          <div className={`absolute top-0.5 w-4 h-4 bg-white rounded-full shadow transition-transform ${(notifications as any)[item.key] ? 'translate-x-5' : 'translate-x-0.5'}`} />
                        </div>
                      </div>
                    </label>
                  ))}
                </div>
              </div>

              <div>
                <h3 className="text-sm font-medium text-gray-700 mb-3">Channels</h3>
                <div className="space-y-3">
                  {[
                    { key: 'emailChannel', label: 'Email', desc: 'Send notifications via email' },
                    { key: 'whatsappChannel', label: 'WhatsApp', desc: 'Send notifications via WhatsApp (requires integration)' },
                    { key: 'smsChannel', label: 'SMS', desc: 'Send SMS notifications (requires integration)' },
                  ].map(item => (
                    <label key={item.key} className="flex items-center justify-between p-3 rounded-lg border border-gray-100 hover:bg-gray-50 cursor-pointer">
                      <div>
                        <p className="text-sm font-medium text-gray-900">{item.label}</p>
                        <p className="text-xs text-gray-500">{item.desc}</p>
                      </div>
                      <div className="relative">
                        <input type="checkbox" className="sr-only"
                          checked={(notifications as any)[item.key]}
                          onChange={e => setNotifications(n => ({...n, [item.key]: e.target.checked}))} />
                        <div className={`w-10 h-5 rounded-full transition-colors ${(notifications as any)[item.key] ? 'bg-blue-600' : 'bg-gray-200'}`}>
                          <div className={`absolute top-0.5 w-4 h-4 bg-white rounded-full shadow transition-transform ${(notifications as any)[item.key] ? 'translate-x-5' : 'translate-x-0.5'}`} />
                        </div>
                      </div>
                    </label>
                  ))}
                </div>
              </div>
            </div>
          )}

          {activeTab === 'billing' && (
            <div className="bg-white rounded-xl border border-gray-200 shadow-sm p-6 space-y-4">
              <h2 className="text-lg font-semibold text-gray-900">Billing & Plan</h2>
              <div className="border-2 border-blue-500 rounded-xl p-4 bg-blue-50">
                <div className="flex justify-between items-start">
                  <div>
                    <p className="font-bold text-blue-900 text-lg">Professional Plan</p>
                    <p className="text-sm text-blue-700">Unlimited items, bookings, and customers</p>
                  </div>
                  <span className="bg-blue-600 text-white text-xs font-bold px-2 py-1 rounded-full">ACTIVE</span>
                </div>
                <p className="mt-3 text-2xl font-bold text-blue-900">Rs. 4,999<span className="text-sm font-normal text-blue-700">/month</span></p>
                <p className="text-xs text-blue-600 mt-1">Next billing: November 1, 2024</p>
              </div>
              <div className="grid grid-cols-2 gap-3">
                <button className="p-3 border border-gray-200 rounded-lg text-sm text-gray-700 hover:bg-gray-50 text-left">
                  <p className="font-medium">Upgrade to Enterprise</p>
                  <p className="text-xs text-gray-500">Custom pricing, white-label</p>
                </button>
                <button className="p-3 border border-gray-200 rounded-lg text-sm text-gray-700 hover:bg-gray-50 text-left">
                  <p className="font-medium">View Invoices</p>
                  <p className="text-xs text-gray-500">Download billing history</p>
                </button>
              </div>
            </div>
          )}

          {activeTab === 'security' && (
            <div className="bg-white rounded-xl border border-gray-200 shadow-sm p-6 space-y-4">
              <h2 className="text-lg font-semibold text-gray-900">Security</h2>
              <div className="space-y-3">
                <div className="p-4 border border-gray-200 rounded-xl flex justify-between items-center">
                  <div>
                    <p className="text-sm font-medium text-gray-900">Change Password</p>
                    <p className="text-xs text-gray-500">Last changed: Never</p>
                  </div>
                  <button className="text-sm text-blue-600 hover:underline font-medium">Change</button>
                </div>
                <div className="p-4 border border-gray-200 rounded-xl flex justify-between items-center">
                  <div>
                    <p className="text-sm font-medium text-gray-900">Two-Factor Authentication</p>
                    <p className="text-xs text-gray-500">Add an extra layer of security</p>
                  </div>
                  <button className="text-sm text-blue-600 hover:underline font-medium">Enable</button>
                </div>
                <div className="p-4 border border-gray-200 rounded-xl flex justify-between items-center">
                  <div>
                    <p className="text-sm font-medium text-gray-900">Active Sessions</p>
                    <p className="text-xs text-gray-500">1 active session</p>
                  </div>
                  <button className="text-sm text-red-600 hover:underline font-medium">Sign Out All</button>
                </div>
              </div>
            </div>
          )}

          {/* Save Button */}
          {(activeTab === 'business' || activeTab === 'notifications') && (
            <div className="flex justify-end">
              <button onClick={handleSave} disabled={isSaving}
                className="flex items-center gap-2 bg-blue-600 text-white px-6 py-2.5 rounded-lg font-medium hover:bg-blue-700 disabled:opacity-50 transition-colors">
                <Save className="w-4 h-4" />
                {isSaving ? 'Saving...' : 'Save Changes'}
              </button>
            </div>
          )}
        </div>
      </div>
    </div>
  )
}
