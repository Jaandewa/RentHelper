'use client'

import Link from 'next/link'
import { FileText, Plus, Search, Download, Eye, Filter } from 'lucide-react'

const STATUS_STYLES: Record<string, string> = {
  invoice: 'bg-blue-100 text-blue-800',
  quotation: 'bg-purple-100 text-purple-800',
  receipt: 'bg-green-100 text-green-800',
}

const mockInvoices: any[] = []

export default function InvoicesPage() {
  return (
    <div className="space-y-6">
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold text-gray-900">Invoices</h1>
          <p className="text-sm text-gray-500 mt-1">Manage invoices, quotations and receipts</p>
        </div>
        <button className="flex items-center gap-2 bg-blue-600 text-white px-4 py-2.5 rounded-lg font-medium hover:bg-blue-700 text-sm">
          <Plus className="w-4 h-4" /> Create Invoice
        </button>
      </div>

      <div className="bg-white rounded-xl border border-gray-200 shadow-sm p-4">
        <div className="relative">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400" />
          <input type="text" placeholder="Search invoices..."
            className="pl-9 pr-4 py-2 w-full border border-gray-300 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-blue-500" />
        </div>
      </div>

      <div className="bg-white rounded-xl border border-gray-200 shadow-sm overflow-hidden">
        <table className="w-full">
          <thead className="bg-gray-50 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
            <tr>
              <th className="px-6 py-3">Invoice #</th>
              <th className="px-6 py-3">Customer</th>
              <th className="px-6 py-3">Type</th>
              <th className="px-6 py-3">Date</th>
              <th className="px-6 py-3">Status</th>
              <th className="px-6 py-3 text-right">Amount</th>
              <th className="px-6 py-3 text-right">Actions</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-gray-100 text-sm">
            {mockInvoices.map(inv => (
              <tr key={inv.id} className="hover:bg-gray-50">
                <td className="px-6 py-4 font-mono font-medium text-gray-900">{inv.id}</td>
                <td className="px-6 py-4 text-gray-700">{inv.customer}</td>
                <td className="px-6 py-4">
                  <span className={`px-2.5 py-1 text-xs font-medium rounded-full capitalize ${STATUS_STYLES[inv.type]}`}>
                    {inv.type}
                  </span>
                </td>
                <td className="px-6 py-4 text-gray-600">{inv.date}</td>
                <td className="px-6 py-4">
                  {inv.sentAt
                    ? <span className="text-xs text-green-600 font-medium">Sent {inv.sentAt}</span>
                    : <span className="text-xs text-amber-600 font-medium">Not sent</span>}
                </td>
                <td className="px-6 py-4 text-right font-semibold">Rs. {inv.amount.toLocaleString()}</td>
                <td className="px-6 py-4 text-right">
                  <div className="flex justify-end gap-1">
                    <button className="p-1.5 rounded-lg text-gray-400 hover:text-blue-600 hover:bg-blue-50" title="View">
                      <Eye className="w-4 h-4" />
                    </button>
                    <button className="p-1.5 rounded-lg text-gray-400 hover:text-gray-700 hover:bg-gray-100" title="Download PDF">
                      <Download className="w-4 h-4" />
                    </button>
                  </div>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  )
}
