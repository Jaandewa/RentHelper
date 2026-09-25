import Link from 'next/link'
import { Package, ClipboardList, Users, TrendingUp, Calendar as CalendarIcon, ArrowRight, Plus } from 'lucide-react'
import prisma from '@/lib/prisma'
import { auth } from '@/lib/auth'
import { getUserDestination } from '@/lib/auth/getUserDestination'
import { redirect } from 'next/navigation'

export default async function DashboardHome() {
  const session = await auth()
  if (!session?.user?.id) {
    redirect('/auth/signin')
  }

  const dest = await getUserDestination(session.user.id)
  if (dest !== '/dashboard') {
    redirect(dest)
  }

  const business = await prisma.business.findUnique({
    where: { userId: session.user.id }
  })

  if (!business) {
    redirect('/onboarding/business')
  }

  const businessId = business.id

  // Fetch actual data
  const totalItems = await prisma.item.count({
    where: { businessId }
  })

  const activeRentals = await prisma.booking.count({
    where: { businessId, status: 'active' }
  })

  const totalCustomersResult = await prisma.booking.groupBy({
    by: ['customerId'],
    where: { businessId },
  })
  const totalCustomers = totalCustomersResult.length

  const currentMonthStart = new Date()
  currentMonthStart.setDate(1)
  currentMonthStart.setHours(0, 0, 0, 0)

  const revenueResult = await prisma.payment.aggregate({
    _sum: { amount: true },
    where: {
      booking: { businessId },
      paidAt: { gte: currentMonthStart }
    }
  })
  const revenue = revenueResult._sum.amount || 0

  const recentBookings = await prisma.booking.findMany({
    where: { businessId },
    orderBy: { createdAt: 'desc' },
    take: 5,
    include: {
      customer: { include: { user: true } }
    }
  })

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
              <h3 className="text-3xl font-bold text-gray-900 mt-2">{totalItems}</h3>
            </div>
            <div className="p-2 bg-blue-50 text-blue-600 rounded-lg">
              <Package className="w-6 h-6" />
            </div>
          </div>
        </div>
        
        <div className="bg-white p-6 rounded-xl border border-gray-200 shadow-sm">
          <div className="flex justify-between items-start">
            <div>
              <p className="text-sm font-medium text-gray-500">Active Rentals</p>
              <h3 className="text-3xl font-bold text-gray-900 mt-2">{activeRentals}</h3>
            </div>
            <div className="p-2 bg-purple-50 text-purple-600 rounded-lg">
              <ClipboardList className="w-6 h-6" />
            </div>
          </div>
        </div>

        <div className="bg-white p-6 rounded-xl border border-gray-200 shadow-sm">
          <div className="flex justify-between items-start">
            <div>
              <p className="text-sm font-medium text-gray-500">Total Customers</p>
              <h3 className="text-3xl font-bold text-gray-900 mt-2">{totalCustomers}</h3>
            </div>
            <div className="p-2 bg-green-50 text-green-600 rounded-lg">
              <Users className="w-6 h-6" />
            </div>
          </div>
        </div>

        <div className="bg-white p-6 rounded-xl border border-gray-200 shadow-sm">
          <div className="flex justify-between items-start">
            <div>
              <p className="text-sm font-medium text-gray-500">Revenue (MTD)</p>
              <h3 className="text-3xl font-bold text-gray-900 mt-2">Rs. {revenue.toLocaleString()}</h3>
            </div>
            <div className="p-2 bg-amber-50 text-amber-600 rounded-lg">
              <TrendingUp className="w-6 h-6" />
            </div>
          </div>
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
            {recentBookings.length > 0 ? (
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
                  {recentBookings.map((booking) => (
                    <tr key={booking.id} className="hover:bg-gray-50">
                      <td className="px-6 py-4 font-medium text-gray-900">{booking.bookingNumber}</td>
                      <td className="px-6 py-4 text-gray-600">{booking.customer?.user?.name || 'Unknown'}</td>
                      <td className="px-6 py-4 text-gray-600">
                        {booking.pickupDate.toLocaleDateString()} - {booking.returnDate.toLocaleDateString()}
                      </td>
                      <td className="px-6 py-4">
                        <span className={`px-2.5 py-1 text-xs font-medium rounded-full ${
                          booking.status === 'active' ? 'bg-green-100 text-green-800' :
                          booking.status === 'confirmed' ? 'bg-blue-100 text-blue-800' :
                          'bg-gray-100 text-gray-800'
                        }`}>
                          {booking.status}
                        </span>
                      </td>
                      <td className="px-6 py-4 text-right font-medium">Rs. {booking.totalAmount.toLocaleString()}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            ) : (
              <div className="p-8 text-center text-gray-500">
                No bookings yet. Start by adding items to your inventory!
              </div>
            )}
          </div>
        </div>

        {/* Action Items */}
        <div className="space-y-6">
          <div className="bg-white rounded-xl border border-gray-200 shadow-sm p-6">
            <h2 className="text-lg font-bold text-gray-900 mb-4">Inventory Status</h2>
            <div className="space-y-3">
              <div>
                <div className="flex justify-between text-sm mb-1">
                  <span className="text-gray-600">Available</span>
                  <span className="font-medium">{totalItems > 0 ? '100%' : '0%'}</span>
                </div>
                <div className="w-full bg-gray-100 rounded-full h-2">
                  <div className="bg-green-500 h-2 rounded-full" style={{ width: totalItems > 0 ? '100%' : '0%' }}></div>
                </div>
              </div>
            </div>
            <Link href="/dashboard/items" className="mt-6 block text-center w-full py-2 bg-gray-50 hover:bg-gray-100 border border-gray-200 rounded-lg text-sm font-medium text-gray-700 transition">
              Manage Inventory
            </Link>
          </div>
        </div>
      </div>
    </div>
  )
}
