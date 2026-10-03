'use client';

import React, { useState, useEffect } from 'react';
import { 
  CreditCard, Search, Loader2, DollarSign, 
  ArrowDownCircle, ArrowUpCircle, TrendingUp 
} from 'lucide-react';

export default function PaymentsPage() {
  const [payments, setPayments] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [typeFilter, setTypeFilter] = useState('');
  const [dateFrom, setDateFrom] = useState('');
  const [dateTo, setDateTo] = useState('');

  useEffect(() => {
    fetchPayments();
  }, [typeFilter, dateFrom, dateTo]);

  const fetchPayments = async () => {
    setLoading(true);
    try {
      const params = new URLSearchParams();
      if (typeFilter) params.append('type', typeFilter);
      if (dateFrom) params.append('dateFrom', dateFrom);
      if (dateTo) params.append('dateTo', dateTo);

      const res = await fetch(`/api/provider/payments?${params.toString()}`);
      if (res.ok) {
        const json = await res.json();
        setPayments(Array.isArray(json) ? json : (json.payments || []));
      }
    } catch (error) {
      console.error('Failed to fetch payments', error);
    } finally {
      setLoading(false);
    }
  };

  const getTypeColor = (type: string) => {
    switch (type?.toLowerCase()) {
      case 'advance': return 'bg-blue-100 text-blue-700';
      case 'deposit': return 'bg-purple-100 text-purple-700';
      case 'balance': return 'bg-green-100 text-green-700';
      case 'refund': return 'bg-amber-100 text-amber-700';
      case 'damage': return 'bg-red-100 text-red-700';
      default: return 'bg-gray-100 text-gray-700';
    }
  };

  const isOutflow = (type: string) => ['refund'].includes(type?.toLowerCase());

  const totalIn = payments
    .filter(p => !isOutflow(p.type))
    .reduce((sum, p) => sum + (Number(p.amount) || 0), 0);
    
  const totalOut = payments
    .filter(p => isOutflow(p.type))
    .reduce((sum, p) => sum + (Number(p.amount) || 0), 0);
    
  const netRevenue = totalIn - totalOut;

  return (
    <div className="p-6 max-w-7xl mx-auto space-y-6">
      <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4">
        <div>
          <h1 className="text-2xl font-bold text-gray-900">Payments</h1>
          <p className="text-gray-500">Track all incoming and outgoing transactions</p>
        </div>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        <div className="bg-white rounded-xl border border-gray-200 p-5 shadow-sm flex items-center gap-4">
          <div className="p-3 bg-green-100 text-green-600 rounded-lg">
            <ArrowDownCircle className="w-6 h-6" />
          </div>
          <div>
            <div className="text-sm font-medium text-gray-500 mb-1">Total Received</div>
            <div className="text-2xl font-bold text-gray-900">Rs. {totalIn.toLocaleString()}</div>
          </div>
        </div>
        <div className="bg-white rounded-xl border border-gray-200 p-5 shadow-sm flex items-center gap-4">
          <div className="p-3 bg-red-100 text-red-600 rounded-lg">
            <ArrowUpCircle className="w-6 h-6" />
          </div>
          <div>
            <div className="text-sm font-medium text-gray-500 mb-1">Total Refunded</div>
            <div className="text-2xl font-bold text-gray-900">Rs. {totalOut.toLocaleString()}</div>
          </div>
        </div>
        <div className="bg-white rounded-xl border border-gray-200 p-5 shadow-sm flex items-center gap-4">
          <div className="p-3 bg-blue-100 text-blue-600 rounded-lg">
            <TrendingUp className="w-6 h-6" />
          </div>
          <div>
            <div className="text-sm font-medium text-gray-500 mb-1">Net Revenue</div>
            <div className="text-2xl font-bold text-gray-900">Rs. {netRevenue.toLocaleString()}</div>
          </div>
        </div>
      </div>

      <div className="bg-white rounded-xl border border-gray-200 shadow-sm overflow-hidden">
        <div className="p-4 border-b border-gray-200 flex flex-col sm:flex-row gap-4 justify-between items-center">
          <div className="flex flex-wrap items-center gap-3 w-full sm:w-auto">
            <select 
              className="px-4 py-2 border border-gray-200 rounded-lg text-sm outline-none bg-white focus:border-blue-500 transition-colors flex-1 sm:flex-none"
              value={typeFilter}
              onChange={(e) => setTypeFilter(e.target.value)}
            >
              <option value="">All Types</option>
              <option value="advance">Advance</option>
              <option value="deposit">Deposit</option>
              <option value="balance">Balance</option>
              <option value="refund">Refund</option>
              <option value="damage">Damage</option>
            </select>
          </div>
          
          <div className="flex items-center gap-2 bg-white rounded-lg border border-gray-200 p-2 shadow-sm w-full sm:w-auto">
            <input 
              type="date" 
              value={dateFrom}
              onChange={(e) => setDateFrom(e.target.value)}
              className="text-sm outline-none bg-transparent w-full sm:w-auto"
            />
            <span className="text-gray-400">-</span>
            <input 
              type="date" 
              value={dateTo}
              onChange={(e) => setDateTo(e.target.value)}
              className="text-sm outline-none bg-transparent w-full sm:w-auto"
            />
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
                  <th className="px-6 py-4">Reference</th>
                  <th className="px-6 py-4">Booking #</th>
                  <th className="px-6 py-4">Customer</th>
                  <th className="px-6 py-4">Item</th>
                  <th className="px-6 py-4">Type</th>
                  <th className="px-6 py-4">Method</th>
                  <th className="px-6 py-4">Date</th>
                  <th className="px-6 py-4 text-right">Amount</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-100">
                {payments.length === 0 ? (
                  <tr>
                    <td colSpan={8} className="px-6 py-8 text-center text-gray-500">
                      No payments found matching your criteria.
                    </td>
                  </tr>
                ) : (
                  payments.map((p) => (
                    <tr key={p.id || p.reference} className="hover:bg-gray-50 transition-colors">
                      <td className="px-6 py-4 font-medium text-gray-900">
                        <div className="flex items-center gap-2">
                          <CreditCard className="w-4 h-4 text-gray-400" />
                          <span className="truncate max-w-[120px] inline-block" title={p.id}>
                            {p.id ? p.id.substring(0, 8) + '...' : (p.reference || 'N/A')}
                          </span>
                        </div>
                      </td>
                      <td className="px-6 py-4 text-gray-600">{p.bookingNumber || p.booking?.bookingNumber || 'N/A'}</td>
                      <td className="px-6 py-4 text-gray-900">{p.customer?.name || p.booking?.customer?.name || 'N/A'}</td>
                      <td className="px-6 py-4 text-gray-600 truncate max-w-[150px]">{p.item?.name || p.booking?.items?.[0]?.item?.name || 'N/A'}</td>
                      <td className="px-6 py-4">
                        <span className={`px-2.5 py-1 rounded-full text-xs font-semibold capitalize ${getTypeColor(p.type)}`}>
                          {p.type || 'Unknown'}
                        </span>
                      </td>
                      <td className="px-6 py-4 text-gray-600 capitalize">{p.method || p.paymentMethod || 'cash'}</td>
                      <td className="px-6 py-4 text-gray-600">
                        {p.createdAt || p.date ? new Date(p.createdAt || p.date).toLocaleDateString() : 'N/A'}
                      </td>
                      <td className={`px-6 py-4 text-right font-medium ${isOutflow(p.type) ? 'text-red-600' : 'text-green-600'}`}>
                        {isOutflow(p.type) ? '-' : '+'}Rs. {Number(p.amount || 0).toLocaleString()}
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
