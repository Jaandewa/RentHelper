import Link from 'next/link'
import { Package, ClipboardList, Users, TrendingUp, Calendar as CalendarIcon, ArrowRight, Plus } from 'lucide-react'

export default function DashboardHome() {
  return (
    <div className="space-y-6">
      <div className="flex justify-between items-center">
        <h1 className="text-2xl font-bold text-gray-900">Dashboard</h1>
        <div className="flex gap-2">
          <Link href="/dashboard/items/new" className="bg-white border border-gray-300 text-gray-700 px-4 py-2 rounded-lg font-medium hover:bg-gray-50 flex items-center gap-2 text-sm">
            <Package className="w-4 h-4" /> Add Item
          </Link>
          <Link href="/dashboard/bookings/new" className="bg-blue-600 text-white px-4 py-2 rounded-lg font-medium hover:bg-blue-700 flex items-center gap-2 text-sm shadow-sm">
            <Plus className="w-4 h-4" /> New Booking
          </Link>
        </div>
      </div>


      {/* Stats */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        <div className="bg-white p-6 rounded-xl border border-gray-200 shadow-sm">
          <div className="flex justify-between items-start">
            <div>
              <p className="text-sm font-medium text-gray-500">Total Items</p>
              <h3 className="text-3xl font-bold text-gray-900 mt-2">124</h3>
            </div>
            <div className="p-2 bg-blue-50 text-blue-600 rounded-lg">
              <Package className="w-6 h-6" />
            </div>
          </div>
          <p className="text-xs text-green-600 mt-4 flex items-center gap-1 font-medium">
            <TrendingUp className="w-3 h-3" /> +12 this month
          </p>
        </div>
        
        <div className="bg-white p-6 rounded-xl border border-gray-200 shadow-sm">
          <div className="flex justify-between items-start">
            <div>
              <p className="text-sm font-medium text-gray-500">Active Rentals</p>
              <h3 className="text-3xl font-bold text-gray-900 mt-2">38</h3>
            </div>
            <div className="p-2 bg-purple-50 text-purple-600 rounded-lg">
              <ClipboardList className="w-6 h-6" />
            </div>
          </div>
          <p className="text-xs text-gray-500 mt-4">12 returning today</p>
        </div>

        <div className="bg-white p-6 rounded-xl border border-gray-200 shadow-sm">
          <div className="flex justify-between items-start">
            <div>
              <p className="text-sm font-medium text-gray-500">Total Customers</p>
              <h3 className="text-3xl font-bold text-gray-900 mt-2">842</h3>
            </div>
            <div className="p-2 bg-green-50 text-green-600 rounded-lg">
              <Users className="w-6 h-6" />
            </div>
          </div>
          <p className="text-xs text-green-600 mt-4 flex items-center gap-1 font-medium">
            <TrendingUp className="w-3 h-3" /> +24 this month
          </p>
        </div>

        <div className="bg-white p-6 rounded-xl border border-gray-200 shadow-sm">
          <div className="flex justify-between items-start">
            <div>
              <p className="text-sm font-medium text-gray-500">Revenue (MTD)</p>
              <h3 className="text-3xl font-bold text-gray-900 mt-2">Rs. 425K</h3>
            </div>
            <div className="p-2 bg-amber-50 text-amber-600 rounded-lg">
              <TrendingUp className="w-6 h-6" />
            </div>
          </div>
          <p className="text-xs text-green-600 mt-4 flex items-center gap-1 font-medium">
            <TrendingUp className="w-3 h-3" /> +14% vs last month
          </p>
        </div>
      </div>

      <div className="grid lg:grid-cols-3 gap-6">
        {/* Recent Bookings */}
        <div className="lg:col-span-2 bg-white rounded-xl border border-gray-200 shadow-sm overflow-hidden">
          <div className="p-6 border-b border-gray-100 flex justify-between items-center">
            <h2 className="text-lg font-bold text-gray-900">Recent Bookings</h2>
            <Link href="/dashboard/bookings" className="text-sm text-blue-600 font-medium hover:underline">View all</Link>
          </div>
          <div className="overflow-x-auto">
            <table className="w-full">
              <thead className="bg-gray-50 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                <tr>
                  <th className="px-6 py-3">Booking ID</th>
                  <th className="px-6 py-3">Customer</th>
                  <th className="px-6 py-3">Dates</th>
                  <th className="px-6 py-3">Status</th>
                  <th className="px-6 py-3 text-right">Amount</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-100 text-sm">
                {[
                  { id: 'BK-2024-001', name: 'John Doe', dates: 'Oct 24 - Oct 26', status: 'Active', color: 'bg-green-100 text-green-800', amount: 'Rs. 15,000' },
                  { id: 'BK-2024-002', name: 'Jane Smith', dates: 'Oct 25 - Oct 28', status: 'Confirmed', color: 'bg-blue-100 text-blue-800', amount: 'Rs. 24,500' },
                  { id: 'BK-2024-003', name: 'Mike Johnson', dates: 'Oct 26 - Oct 27', status: 'Pending', color: 'bg-amber-100 text-amber-800', amount: 'Rs. 8,000' },
                  { id: 'BK-2024-004', name: 'Sarah Williams', dates: 'Oct 20 - Oct 24', status: 'Returned', color: 'bg-gray-100 text-gray-800', amount: 'Rs. 12,000' },
                  { id: 'BK-2024-005', name: 'David Brown', dates: 'Oct 27 - Oct 30', status: 'Quotation', color: 'bg-purple-100 text-purple-800', amount: 'Rs. 45,000' },
                ].map((row) => (
                  <tr key={row.id} className="hover:bg-gray-50">
                    <td className="px-6 py-4 font-medium text-gray-900">{row.id}</td>
                    <td className="px-6 py-4 text-gray-600">{row.name}</td>
                    <td className="px-6 py-4 text-gray-600">{row.dates}</td>
                    <td className="px-6 py-4">
                      <span className={`px-2.5 py-1 text-xs font-medium rounded-full ${row.color}`}>
                        {row.status}
                      </span>
                    </td>
                    <td className="px-6 py-4 text-right font-medium">{row.amount}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>

        {/* Action Items */}
        <div className="space-y-6">
          <div className="bg-white rounded-xl border border-gray-200 shadow-sm p-6">
            <h2 className="text-lg font-bold text-gray-900 mb-4">Upcoming Today</h2>
            <div className="space-y-4">
              <div className="flex gap-4">
                <div className="w-10 h-10 rounded-full bg-blue-100 text-blue-600 flex items-center justify-center shrink-0">
                  <Package className="w-5 h-5" />
                </div>
                <div>
                  <p className="text-sm font-medium text-gray-900">4 Pickups Scheduled</p>
                  <p className="text-xs text-gray-500">Next: Sony A7III (10:00 AM)</p>
                </div>
              </div>
              <div className="flex gap-4">
                <div className="w-10 h-10 rounded-full bg-green-100 text-green-600 flex items-center justify-center shrink-0">
                  <CalendarIcon className="w-5 h-5" />
                </div>
                <div>
                  <p className="text-sm font-medium text-gray-900">6 Returns Expected</p>
                  <p className="text-xs text-gray-500">Next: DJI Ronin S (11:30 AM)</p>
                </div>
              </div>
            </div>
            <button className="mt-6 w-full py-2 bg-gray-50 hover:bg-gray-100 border border-gray-200 rounded-lg text-sm font-medium text-gray-700 transition">
              View Calendar
            </button>
          </div>

          <div className="bg-white rounded-xl border border-gray-200 shadow-sm p-6">
            <h2 className="text-lg font-bold text-gray-900 mb-4">Inventory Status</h2>
            <div className="space-y-3">
              <div>
                <div className="flex justify-between text-sm mb-1">
                  <span className="text-gray-600">Available</span>
                  <span className="font-medium">65%</span>
                </div>
                <div className="w-full bg-gray-100 rounded-full h-2">
                  <div className="bg-green-500 h-2 rounded-full" style={{ width: '65%' }}></div>
                </div>
              </div>
              <div>
                <div className="flex justify-between text-sm mb-1">
                  <span className="text-gray-600">Rented Out</span>
                  <span className="font-medium">25%</span>
                </div>
                <div className="w-full bg-gray-100 rounded-full h-2">
                  <div className="bg-blue-500 h-2 rounded-full" style={{ width: '25%' }}></div>
                </div>
              </div>
              <div>
                <div className="flex justify-between text-sm mb-1">
                  <span className="text-gray-600">Maintenance</span>
                  <span className="font-medium">8%</span>
                </div>
                <div className="w-full bg-gray-100 rounded-full h-2">
                  <div className="bg-amber-500 h-2 rounded-full" style={{ width: '8%' }}></div>
                </div>
              </div>
              <div>
                <div className="flex justify-between text-sm mb-1">
                  <span className="text-gray-600">Overdue</span>
                  <span className="font-medium text-red-600">2%</span>
                </div>
                <div className="w-full bg-gray-100 rounded-full h-2">
                  <div className="bg-red-500 h-2 rounded-full" style={{ width: '2%' }}></div>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  )
}
