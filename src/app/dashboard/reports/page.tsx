'use client'

import { useState } from 'react'
import { BarChart3, TrendingUp, TrendingDown, Package, Users, ClipboardList, DollarSign, Download, Calendar } from 'lucide-react'

const MONTHS_SHORT = ['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun', 'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec']

const revenueData = [185000, 220000, 198000, 340000, 290000, 415000, 380000, 520000, 460000, 425000, 0, 0]

const topItems = [
  { name: 'Sony A7III Camera', bookings: 42, revenue: 210000, utilization: 87 },
  { name: 'Toyota Corolla 2022', bookings: 28, revenue: 224000, utilization: 72 },
  { name: 'Tent 6x6m', bookings: 35, revenue: 122500, utilization: 65 },
  { name: 'DJI Ronin-S Gimbal', bookings: 38, revenue: 95000, utilization: 79 },
  { name: 'Aputure 120D Light', bookings: 31, revenue: 46500, utilization: 54 },
]

const categoryData = [
  { name: 'Camera & Video', value: 42, color: '#3b82f6' },
  { name: 'Vehicles', value: 28, color: '#8b5cf6' },
  { name: 'Party & Events', value: 35, color: '#f59e0b' },
  { name: 'Tools & Equipment', value: 15, color: '#10b981' },
  { name: 'Other', value: 8, color: '#6b7280' },
]

export default function ReportsPage() {
  const [period, setPeriod] = useState('month')
  const maxRevenue = Math.max(...revenueData)

  const totalRevenue = revenueData.reduce((a, b) => a + b, 0)
  const avgMonthly = Math.round(totalRevenue / revenueData.filter(v => v > 0).length)

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold text-gray-900">Reports & Analytics</h1>
          <p className="text-sm text-gray-500 mt-1">Track your business performance</p>
        </div>
        <div className="flex gap-2">
          <div className="flex border border-gray-300 rounded-lg overflow-hidden">
            {['week', 'month', 'year'].map(p => (
              <button key={p} onClick={() => setPeriod(p)}
                className={`px-3 py-2 text-sm font-medium capitalize ${period === p ? 'bg-blue-600 text-white' : 'bg-white text-gray-600 hover:bg-gray-50'}`}>
                {p}
              </button>
            ))}
          </div>
          <button className="flex items-center gap-2 border border-gray-300 rounded-lg px-3 py-2 text-sm text-gray-700 hover:bg-gray-50">
            <Download className="w-4 h-4" /> Export
          </button>
        </div>
      </div>

      {/* KPI Cards */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
        {[
          { label: 'Total Revenue (YTD)', value: `Rs. ${(totalRevenue / 1000).toFixed(0)}K`, change: '+18%', up: true, icon: DollarSign, color: 'text-green-600 bg-green-50' },
          { label: 'Total Bookings', value: '158', change: '+12%', up: true, icon: ClipboardList, color: 'text-blue-600 bg-blue-50' },
          { label: 'Active Customers', value: '84', change: '+24', up: true, icon: Users, color: 'text-purple-600 bg-purple-50' },
          { label: 'Avg Utilization', value: '71%', change: '-3%', up: false, icon: Package, color: 'text-amber-600 bg-amber-50' },
        ].map(kpi => (
          <div key={kpi.label} className="bg-white rounded-xl border border-gray-200 shadow-sm p-4">
            <div className="flex justify-between items-start mb-3">
              <div className={`p-2 rounded-lg ${kpi.color}`}>
                <kpi.icon className="w-5 h-5" />
              </div>
              <span className={`flex items-center gap-0.5 text-xs font-medium ${kpi.up ? 'text-green-600' : 'text-red-500'}`}>
                {kpi.up ? <TrendingUp className="w-3 h-3" /> : <TrendingDown className="w-3 h-3" />}
                {kpi.change}
              </span>
            </div>
            <p className="text-xs text-gray-500">{kpi.label}</p>
            <p className="text-xl font-bold text-gray-900 mt-1">{kpi.value}</p>
          </div>
        ))}
      </div>

      {/* Revenue Chart */}
      <div className="bg-white rounded-xl border border-gray-200 shadow-sm p-6">
        <div className="flex justify-between items-center mb-6">
          <div>
            <h2 className="text-lg font-bold text-gray-900">Monthly Revenue</h2>
            <p className="text-sm text-gray-500">Avg Rs. {avgMonthly.toLocaleString()}/month</p>
          </div>
          <div className="text-right">
            <p className="text-2xl font-bold text-gray-900">Rs. {(totalRevenue / 1000).toFixed(0)}K</p>
            <p className="text-xs text-green-600 font-medium">+18% vs last year</p>
          </div>
        </div>
        <div className="flex items-end gap-2 h-48">
          {revenueData.map((val, idx) => (
            <div key={idx} className="flex-1 flex flex-col items-center gap-1">
              <div
                className={`w-full rounded-t-md transition-all ${val > 0 ? 'bg-blue-500 hover:bg-blue-600' : 'bg-gray-100'}`}
                style={{ height: `${maxRevenue > 0 ? (val / maxRevenue) * 100 : 0}%`, minHeight: val > 0 ? '4px' : '0' }}
                title={`Rs. ${val.toLocaleString()}`}
              />
              <span className="text-xs text-gray-400">{MONTHS_SHORT[idx]}</span>
            </div>
          ))}
        </div>
      </div>

      <div className="grid lg:grid-cols-2 gap-6">
        {/* Top Items */}
        <div className="bg-white rounded-xl border border-gray-200 shadow-sm p-6">
          <h2 className="text-lg font-bold text-gray-900 mb-4">Top Performing Items</h2>
          <div className="space-y-4">
            {topItems.map((item, idx) => (
              <div key={idx}>
                <div className="flex justify-between items-center mb-1">
                  <p className="text-sm font-medium text-gray-900 truncate flex-1">{item.name}</p>
                  <p className="text-sm font-bold text-gray-900 ml-2">Rs. {(item.revenue / 1000).toFixed(0)}K</p>
                </div>
                <div className="flex items-center gap-2">
                  <div className="flex-1 bg-gray-100 rounded-full h-2">
                    <div className="bg-blue-500 h-2 rounded-full" style={{ width: `${item.utilization}%` }} />
                  </div>
                  <span className="text-xs text-gray-500 w-8 text-right">{item.utilization}%</span>
                </div>
                <p className="text-xs text-gray-400 mt-0.5">{item.bookings} bookings</p>
              </div>
            ))}
          </div>
        </div>

        {/* Category Distribution */}
        <div className="bg-white rounded-xl border border-gray-200 shadow-sm p-6">
          <h2 className="text-lg font-bold text-gray-900 mb-4">Bookings by Category</h2>
          <div className="space-y-3">
            {categoryData.map(cat => {
              const total = categoryData.reduce((a, c) => a + c.value, 0)
              const pct = Math.round((cat.value / total) * 100)
              return (
                <div key={cat.name}>
                  <div className="flex justify-between items-center mb-1">
                    <div className="flex items-center gap-2">
                      <div className="w-3 h-3 rounded-full" style={{ backgroundColor: cat.color }} />
                      <p className="text-sm text-gray-700">{cat.name}</p>
                    </div>
                    <p className="text-sm font-medium text-gray-900">{cat.value} ({pct}%)</p>
                  </div>
                  <div className="bg-gray-100 rounded-full h-2">
                    <div className="h-2 rounded-full" style={{ width: `${pct}%`, backgroundColor: cat.color }} />
                  </div>
                </div>
              )
            })}
          </div>
        </div>
      </div>
    </div>
  )
}
