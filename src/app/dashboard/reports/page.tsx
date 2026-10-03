'use client';

import React, { useState, useEffect } from 'react';
import { 
  BarChart3, TrendingUp, DollarSign, Package, Users, 
  ClipboardList, Download, Calendar, Loader2, Shield, 
  ArrowDownCircle, ArrowUpCircle 
} from 'lucide-react';

export default function ReportsPage() {
  const [data, setData] = useState<any>(null);
  const [loading, setLoading] = useState(true);
  const [dateFrom, setDateFrom] = useState('');
  const [dateTo, setDateTo] = useState('');

  useEffect(() => {
    fetchData();
  }, [dateFrom, dateTo]);

  const fetchData = async () => {
    setLoading(true);
    try {
      const params = new URLSearchParams();
      if (dateFrom) params.append('dateFrom', dateFrom);
      if (dateTo) params.append('dateTo', dateTo);
      
      const res = await fetch(`/api/provider/finance?${params.toString()}`);
      if (res.ok) {
        const json = await res.json();
        setData(json);
      }
    } catch (error) {
      console.error('Failed to fetch report data', error);
    } finally {
      setLoading(false);
    }
  };

  if (loading && !data) {
    return (
      <div className="flex justify-center items-center h-64">
        <Loader2 className="w-8 h-8 animate-spin text-blue-600" />
      </div>
    );
  }

  const {
    grossRentalValue = 0,
    rentalPaymentsReceived = 0,
    outstandingBalance = 0,
    activeRentals = 0,
    confirmedBookings = 0,
    completedBookings = 0,
    cancelledBookings = 0,
    depositsHeld = 0,
    depositsRefunded = 0,
    depositDeductions = 0,
    monthlyRevenue = [],
    topItems = []
  } = data || {};

  return (
    <div className="p-6 max-w-7xl mx-auto space-y-6">
      <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4">
        <div>
          <h1 className="text-2xl font-bold text-gray-900">Financial Reports</h1>
          <p className="text-gray-500">Overview of your rental business performance</p>
        </div>
        
        <div className="flex flex-wrap items-center gap-3">
          <div className="flex items-center gap-2 bg-white rounded-lg border border-gray-200 p-2 shadow-sm">
            <Calendar className="w-4 h-4 text-gray-500" />
            <input 
              type="date" 
              value={dateFrom}
              onChange={(e) => setDateFrom(e.target.value)}
              className="text-sm outline-none bg-transparent"
            />
            <span className="text-gray-400">-</span>
            <input 
              type="date" 
              value={dateTo}
              onChange={(e) => setDateTo(e.target.value)}
              className="text-sm outline-none bg-transparent"
            />
          </div>
          <button className="flex items-center gap-2 px-4 py-2 bg-white border border-gray-200 rounded-lg shadow-sm hover:bg-gray-50 transition-colors text-sm font-medium">
            <Download className="w-4 h-4" />
            Export
          </button>
        </div>
      </div>

      {/* KPI Cards */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        <div className="bg-white rounded-xl border border-gray-200 p-5 shadow-sm flex flex-col">
          <div className="flex justify-between items-start mb-4">
            <div className="text-sm font-medium text-gray-500">Gross Rental Value</div>
            <div className="p-2 bg-green-100 rounded-lg text-green-600">
              <TrendingUp className="w-5 h-5" />
            </div>
          </div>
          <div className="text-2xl font-bold text-gray-900">Rs. {grossRentalValue.toLocaleString()}</div>
        </div>

        <div className="bg-white rounded-xl border border-gray-200 p-5 shadow-sm flex flex-col">
          <div className="flex justify-between items-start mb-4">
            <div className="text-sm font-medium text-gray-500">Payments Received</div>
            <div className="p-2 bg-blue-100 rounded-lg text-blue-600">
              <DollarSign className="w-5 h-5" />
            </div>
          </div>
          <div className="text-2xl font-bold text-gray-900">Rs. {rentalPaymentsReceived.toLocaleString()}</div>
        </div>

        <div className="bg-white rounded-xl border border-gray-200 p-5 shadow-sm flex flex-col">
          <div className="flex justify-between items-start mb-4">
            <div className="text-sm font-medium text-gray-500">Outstanding Balance</div>
            <div className="p-2 bg-amber-100 rounded-lg text-amber-600">
              <BarChart3 className="w-5 h-5" />
            </div>
          </div>
          <div className="text-2xl font-bold text-gray-900">Rs. {outstandingBalance.toLocaleString()}</div>
        </div>

        <div className="bg-white rounded-xl border border-gray-200 p-5 shadow-sm flex flex-col">
          <div className="flex justify-between items-start mb-4">
            <div className="text-sm font-medium text-gray-500">Active Rentals</div>
            <div className="p-2 bg-purple-100 rounded-lg text-purple-600">
              <Users className="w-5 h-5" />
            </div>
          </div>
          <div className="text-2xl font-bold text-gray-900">{activeRentals}</div>
        </div>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        {/* Booking Status Cards */}
        <div className="bg-white rounded-xl border border-gray-200 p-5 shadow-sm">
          <h3 className="text-lg font-semibold text-gray-900 mb-4 flex items-center gap-2">
            <ClipboardList className="w-5 h-5 text-gray-500" />
            Booking Status
          </h3>
          <div className="grid grid-cols-3 gap-4">
            <div className="text-center p-3 bg-gray-50 rounded-lg">
              <div className="text-2xl font-bold text-gray-900">{confirmedBookings}</div>
              <div className="text-xs text-gray-500 font-medium uppercase tracking-wider mt-1">Confirmed</div>
            </div>
            <div className="text-center p-3 bg-gray-50 rounded-lg">
              <div className="text-2xl font-bold text-gray-900">{completedBookings}</div>
              <div className="text-xs text-gray-500 font-medium uppercase tracking-wider mt-1">Completed</div>
            </div>
            <div className="text-center p-3 bg-gray-50 rounded-lg">
              <div className="text-2xl font-bold text-gray-900">{cancelledBookings}</div>
              <div className="text-xs text-gray-500 font-medium uppercase tracking-wider mt-1">Cancelled</div>
            </div>
          </div>
        </div>

        {/* Deposit Summary Cards */}
        <div className="bg-white rounded-xl border border-gray-200 p-5 shadow-sm">
          <h3 className="text-lg font-semibold text-gray-900 mb-4 flex items-center gap-2">
            <Shield className="w-5 h-5 text-gray-500" />
            Security Deposits
          </h3>
          <div className="grid grid-cols-3 gap-4">
            <div className="text-center p-3 bg-gray-50 rounded-lg">
              <div className="text-xl font-bold text-gray-900">Rs. {depositsHeld.toLocaleString()}</div>
              <div className="text-xs text-gray-500 font-medium uppercase tracking-wider mt-1">Held</div>
            </div>
            <div className="text-center p-3 bg-gray-50 rounded-lg">
              <div className="text-xl font-bold text-gray-900">Rs. {depositsRefunded.toLocaleString()}</div>
              <div className="text-xs text-gray-500 font-medium uppercase tracking-wider mt-1">Refunded</div>
            </div>
            <div className="text-center p-3 bg-gray-50 rounded-lg">
              <div className="text-xl font-bold text-gray-900">Rs. {depositDeductions.toLocaleString()}</div>
              <div className="text-xs text-gray-500 font-medium uppercase tracking-wider mt-1">Deducted</div>
            </div>
          </div>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-4">
        {/* Monthly Revenue Chart */}
        <div className="bg-white rounded-xl border border-gray-200 p-5 shadow-sm lg:col-span-2">
          <h3 className="text-lg font-semibold text-gray-900 mb-6">Monthly Revenue</h3>
          <div className="h-64 flex items-end gap-2 md:gap-4 justify-between pt-4 border-b border-gray-100">
            {monthlyRevenue.map((item: any, i: number) => {
              const maxVal = Math.max(...monthlyRevenue.map((m: any) => m.amount), 1);
              const heightPercent = `${(item.amount / maxVal) * 100}%`;
              return (
                <div key={i} className="flex flex-col items-center flex-1 group">
                  <div className="relative w-full flex justify-center h-full items-end pb-2">
                    <div 
                      className="w-full max-w-[40px] bg-blue-500 rounded-t-md transition-all group-hover:bg-blue-600"
                      style={{ height: heightPercent }}
                    />
                    <div className="absolute -top-8 bg-gray-800 text-white text-xs py-1 px-2 rounded opacity-0 group-hover:opacity-100 whitespace-nowrap transition-opacity pointer-events-none z-10">
                      Rs. {item.amount.toLocaleString()}
                    </div>
                  </div>
                  <div className="text-xs font-medium text-gray-500 mt-2">{item.month}</div>
                </div>
              );
            })}
          </div>
        </div>

        {/* Top Items Table */}
        <div className="bg-white rounded-xl border border-gray-200 p-5 shadow-sm">
          <h3 className="text-lg font-semibold text-gray-900 mb-4 flex items-center gap-2">
            <Package className="w-5 h-5 text-gray-500" />
            Top Performing Items
          </h3>
          <div className="space-y-4">
            {topItems.map((item: any, i: number) => (
              <div key={i} className="flex justify-between items-center p-3 hover:bg-gray-50 rounded-lg border border-gray-100 transition-colors">
                <div className="flex-1">
                  <div className="font-medium text-gray-900 text-sm truncate pr-4">{item.name}</div>
                  <div className="text-xs text-gray-500">{item.bookingCount} bookings</div>
                </div>
                <div className="font-bold text-gray-900">
                  Rs. {item.revenue.toLocaleString()}
                </div>
              </div>
            ))}
            {topItems.length === 0 && (
              <div className="text-center text-sm text-gray-500 py-8">
                No item data available
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}
