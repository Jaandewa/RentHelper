'use client';

import React, { useState, useEffect } from 'react';
import { FileText, Search, Eye, Loader2, DollarSign } from 'lucide-react';
import Link from 'next/link';

export default function InvoicesPage() {
  const [bookings, setBookings] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState('');
  const [statusFilter, setStatusFilter] = useState('');

  useEffect(() => {
    fetchBookings();
  }, []);

  const fetchBookings = async () => {
    try {
      const res = await fetch('/api/orders');
      if (res.ok) {
        const json = await res.json();
        const items = Array.isArray(json) ? json : (json.bookings || json.orders || []);
        setBookings(items);
      }
    } catch (error) {
      console.error('Failed to fetch bookings', error);
    } finally {
      setLoading(false);
    }
  };

  const getInvoiceStatus = (paymentStatus: string, balanceDue: number) => {
    if (paymentStatus === 'paid' || balanceDue <= 0) return 'PAID';
    if (paymentStatus === 'partially_paid') return 'PARTIALLY PAID';
    if (paymentStatus === 'refunded') return 'REFUNDED';
    return 'OPEN';
  };

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'OPEN': return 'bg-amber-100 text-amber-700';
      case 'PARTIALLY PAID': return 'bg-blue-100 text-blue-700';
      case 'PAID': return 'bg-green-100 text-green-700';
      case 'REFUNDED': return 'bg-purple-100 text-purple-700';
      case 'OVERDUE': return 'bg-red-100 text-red-700';
      default: return 'bg-gray-100 text-gray-700';
    }
  };

  const validStatuses = ['confirmed', 'active', 'completed', 'returned_pending_settlement'];
  
  const invoices = bookings
    .filter(b => validStatuses.includes(b.status))
    .map(b => {
      const advanceAmount = b.advanceAmount || 0;
      const totalAmount = b.totalAmount || 0;
      // Use actual balanceDue from booking record, not recalculated
      const balanceDue = Math.max(0, b.balanceDue ?? (totalAmount - advanceAmount));
      
      return {
        ...b,
        invoiceNumber: `INV-${b.bookingNumber}`,
        advanceAmount,
        totalAmount,
        balanceDue,
        customerName: b.customer?.user?.name || b.customer?.name || 'N/A',
        invoiceStatus: getInvoiceStatus(b.paymentStatus, balanceDue)
      };
    })
    .filter(inv => {
      if (statusFilter && inv.invoiceStatus !== statusFilter) return false;
      if (search) {
        const searchLower = search.toLowerCase();
        return (
          inv.invoiceNumber.toLowerCase().includes(searchLower) ||
          inv.customerName.toLowerCase().includes(searchLower) ||
          inv.bookingNumber.toLowerCase().includes(searchLower)
        );
      }
      return true;
    });

  const totalInvoiced = invoices.reduce((sum, inv) => sum + inv.totalAmount, 0);
  const totalReceived = invoices.reduce((sum, inv) => sum + (inv.totalAmount - inv.balanceDue), 0);
  const totalOutstanding = invoices.reduce((sum, inv) => sum + inv.balanceDue, 0);

  return (
    <div className="p-6 max-w-7xl mx-auto space-y-6">
      <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4">
        <div>
          <h1 className="text-2xl font-bold text-gray-900">Booking Billing</h1>
          <p className="text-gray-500">Billing summaries for your rental bookings</p>
        </div>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        <div className="bg-white rounded-xl border border-gray-200 p-5 shadow-sm">
          <div className="text-sm font-medium text-gray-500 mb-1">Total Invoiced</div>
          <div className="text-2xl font-bold text-gray-900">Rs. {totalInvoiced.toLocaleString()}</div>
        </div>
        <div className="bg-white rounded-xl border border-gray-200 p-5 shadow-sm">
          <div className="text-sm font-medium text-gray-500 mb-1">Total Received</div>
          <div className="text-2xl font-bold text-gray-900 text-green-600">Rs. {totalReceived.toLocaleString()}</div>
        </div>
        <div className="bg-white rounded-xl border border-gray-200 p-5 shadow-sm">
          <div className="text-sm font-medium text-gray-500 mb-1">Total Outstanding</div>
          <div className="text-2xl font-bold text-gray-900 text-amber-600">Rs. {totalOutstanding.toLocaleString()}</div>
        </div>
      </div>

      <div className="bg-white rounded-xl border border-gray-200 shadow-sm overflow-hidden">
        <div className="p-4 border-b border-gray-200 flex flex-col sm:flex-row gap-4 justify-between">
          <div className="relative flex-1 max-w-md">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400" />
            <input 
              type="text" 
              placeholder="Search by invoice, booking, or customer..."
              className="w-full pl-9 pr-4 py-2 border border-gray-200 rounded-lg text-sm outline-none focus:border-blue-500 transition-colors"
              value={search}
              onChange={(e) => setSearch(e.target.value)}
            />
          </div>
          <div className="w-full sm:w-auto">
            <select 
              className="w-full px-4 py-2 border border-gray-200 rounded-lg text-sm outline-none bg-white focus:border-blue-500 transition-colors"
              value={statusFilter}
              onChange={(e) => setStatusFilter(e.target.value)}
            >
              <option value="">All Statuses</option>
              <option value="OPEN">Open</option>
              <option value="PARTIALLY PAID">Partially Paid</option>
              <option value="PAID">Paid</option>
              <option value="OVERDUE">Overdue</option>
              <option value="REFUNDED">Refunded</option>
            </select>
          </div>
        </div>

        <div className="overflow-x-auto">
          {loading ? (
            <div className="flex justify-center items-center h-48">
              <Loader2 className="w-6 h-6 animate-spin text-blue-600" />
            </div>
          ) : (
            <table className="w-full text-left text-sm">
              <thead className="bg-gray-50 text-gray-600 font-medium">
                <tr>
                  <th className="px-6 py-4">Invoice #</th>
                  <th className="px-6 py-4">Booking #</th>
                  <th className="px-6 py-4">Customer</th>
                  <th className="px-6 py-4">Issue Date</th>
                  <th className="px-6 py-4 text-right">Total</th>
                  <th className="px-6 py-4 text-right">Balance Due</th>
                  <th className="px-6 py-4 text-center">Status</th>
                  <th className="px-6 py-4 text-right">Actions</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-100">
                {invoices.length === 0 ? (
                  <tr>
                    <td colSpan={8} className="px-6 py-8 text-center text-gray-500">
                      No invoices found matching your criteria.
                    </td>
                  </tr>
                ) : (
                  invoices.map((inv) => (
                    <tr key={inv.id} className="hover:bg-gray-50 transition-colors">
                      <td className="px-6 py-4 font-medium text-gray-900">
                        <div className="flex items-center gap-2">
                          <FileText className="w-4 h-4 text-gray-400" />
                          {inv.invoiceNumber}
                        </div>
                      </td>
                      <td className="px-6 py-4 text-gray-600">{inv.bookingNumber}</td>
                      <td className="px-6 py-4 text-gray-900">{inv.customerName}</td>
                      <td className="px-6 py-4 text-gray-600">
                        {inv.createdAt ? new Date(inv.createdAt).toLocaleDateString() : 'N/A'}
                      </td>
                      <td className="px-6 py-4 text-right font-medium">Rs. {inv.totalAmount?.toLocaleString() || 0}</td>
                      <td className="px-6 py-4 text-right text-gray-600">Rs. {inv.balanceDue?.toLocaleString() || 0}</td>
                      <td className="px-6 py-4 text-center">
                        <span className={`px-2.5 py-1 rounded-full text-xs font-semibold ${getStatusColor(inv.invoiceStatus)}`}>
                          {inv.invoiceStatus}
                        </span>
                      </td>
                      <td className="px-6 py-4 text-right">
                        <Link 
                          href={`/dashboard/bookings/${inv.id}`}
                          className="inline-flex items-center justify-center p-2 text-gray-500 hover:text-blue-600 hover:bg-blue-50 rounded-lg transition-colors"
                          title="View Booking"
                        >
                          <Eye className="w-4 h-4" />
                        </Link>
                      </td>
                    </tr>
                  ))
                )}
              </tbody>
            </table>
          )}
        </div>
      </div>
    </div>
  );
}
