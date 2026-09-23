'use client'

import { CreditCard, TrendingUp, ArrowDownLeft, ArrowUpRight, Search, Plus } from 'lucide-react'

const TYPE_STYLES: Record<string, string> = {
  advance: 'bg-blue-100 text-blue-800',
  deposit: 'bg-purple-100 text-purple-800',
  balance: 'bg-green-100 text-green-800',
  refund: 'bg-amber-100 text-amber-800',
  damage: 'bg-red-100 text-red-800',
}

const METHOD_ICONS: Record<string, string> = {
  cash: '💵',
  bank_transfer: '🏦',
  card: '💳',
  online: '📱',
}

const mockPayments = [
  { id: '1', bookingId: 'BK-2024-001', customer: 'Kasun Perera', type: 'advance', method: 'cash', amount: 4500, paidAt: '2024-10-23', reference: null },
  { id: '2', bookingId: 'BK-2024-001', customer: 'Kasun Perera', type: 'deposit', method: 'bank_transfer', amount: 75000, paidAt: '2024-10-23', reference: 'TXN-98765' },
  { id: '3', bookingId: 'BK-2024-002', customer: 'Malsha Fernando', type: 'advance', method: 'card', amount: 7350, paidAt: '2024-10-24', reference: null },
  { id: '4', bookingId: 'BK-2024-003', customer: 'Priya Jayawardena', type: 'balance', method: 'online', amount: 12000, paidAt: '2024-10-20', reference: 'PAY-12345' },
  { id: '5', bookingId: 'BK-2024-004', customer: 'Ravi Silva', type: 'refund', method: 'bank_transfer', amount: 20000, paidAt: '2024-10-22', reference: 'REF-54321' },
]

const totalIn = mockPayments.filter(p => p.type !== 'refund').reduce((a, p) => a + p.amount, 0)
const totalOut = mockPayments.filter(p => p.type === 'refund').reduce((a, p) => a + p.amount, 0)

export default function PaymentsPage() {
  return (
    <div className="space-y-6">
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold text-gray-900">Payments</h1>
          <p className="text-sm text-gray-500 mt-1">Track all payment transactions</p>
        </div>
        <button className="flex items-center gap-2 bg-blue-600 text-white px-4 py-2.5 rounded-lg font-medium hover:bg-blue-700 text-sm">
          <Plus className="w-4 h-4" /> Record Payment
        </button>
      </div>

      {/* Summary Cards */}
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
        <div className="bg-white rounded-xl border border-gray-200 shadow-sm p-4 flex items-center gap-4">
          <div className="p-3 bg-green-50 rounded-xl text-green-600"><ArrowDownLeft className="w-5 h-5" /></div>
          <div>
            <p className="text-xs text-gray-500">Total Received</p>
            <p className="text-xl font-bold text-green-700">Rs. {totalIn.toLocaleString()}</p>
          </div>
        </div>
        <div className="bg-white rounded-xl border border-gray-200 shadow-sm p-4 flex items-center gap-4">
          <div className="p-3 bg-amber-50 rounded-xl text-amber-600"><ArrowUpRight className="w-5 h-5" /></div>
          <div>
            <p className="text-xs text-gray-500">Total Refunded</p>
            <p className="text-xl font-bold text-amber-700">Rs. {totalOut.toLocaleString()}</p>
          </div>
        </div>
        <div className="bg-white rounded-xl border border-gray-200 shadow-sm p-4 flex items-center gap-4">
          <div className="p-3 bg-blue-50 rounded-xl text-blue-600"><CreditCard className="w-5 h-5" /></div>
          <div>
            <p className="text-xs text-gray-500">Net Amount</p>
            <p className="text-xl font-bold text-gray-900">Rs. {(totalIn - totalOut).toLocaleString()}</p>
          </div>
        </div>
      </div>

      {/* Search */}
      <div className="bg-white rounded-xl border border-gray-200 shadow-sm p-4">
        <div className="relative">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400" />
          <input type="text" placeholder="Search by customer or booking..."
            className="pl-9 pr-4 py-2 w-full border border-gray-300 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-blue-500" />
        </div>
      </div>

      {/* Payments Table */}
      <div className="bg-white rounded-xl border border-gray-200 shadow-sm overflow-hidden">
        <table className="w-full">
          <thead className="bg-gray-50 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
            <tr>
              <th className="px-6 py-3">Booking</th>
              <th className="px-6 py-3">Customer</th>
              <th className="px-6 py-3">Type</th>
              <th className="px-6 py-3">Method</th>
              <th className="px-6 py-3">Date</th>
              <th className="px-6 py-3">Reference</th>
              <th className="px-6 py-3 text-right">Amount</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-gray-100 text-sm">
            {mockPayments.map(pmt => (
              <tr key={pmt.id} className="hover:bg-gray-50">
                <td className="px-6 py-4 font-mono text-xs font-medium text-gray-900">{pmt.bookingId}</td>
                <td className="px-6 py-4 text-gray-700">{pmt.customer}</td>
                <td className="px-6 py-4">
                  <span className={`px-2.5 py-1 text-xs font-medium rounded-full capitalize ${TYPE_STYLES[pmt.type]}`}>
                    {pmt.type}
                  </span>
                </td>
                <td className="px-6 py-4 text-gray-600 capitalize">
                  {METHOD_ICONS[pmt.method]} {pmt.method.replace('_', ' ')}
                </td>
                <td className="px-6 py-4 text-gray-600">{pmt.paidAt}</td>
                <td className="px-6 py-4 text-gray-500 font-mono text-xs">{pmt.reference || '—'}</td>
                <td className={`px-6 py-4 text-right font-semibold ${pmt.type === 'refund' ? 'text-amber-600' : 'text-gray-900'}`}>
                  {pmt.type === 'refund' ? '- ' : ''}Rs. {pmt.amount.toLocaleString()}
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  )
}
