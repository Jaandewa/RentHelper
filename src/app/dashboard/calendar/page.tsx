'use client'

import { useState } from 'react'
import { ChevronLeft, ChevronRight, Package, Calendar as CalIcon } from 'lucide-react'

const MONTHS = ['January', 'February', 'March', 'April', 'May', 'June',
  'July', 'August', 'September', 'October', 'November', 'December']

const DAYS = ['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat']

const STATUS_COLORS: Record<string, string> = {
  active: 'bg-green-500',
  confirmed: 'bg-blue-500',
  pending_confirmation: 'bg-amber-500',
  overdue: 'bg-red-500',
  returned_pending_settlement: 'bg-purple-500',
  quotation: 'bg-indigo-400',
}

// Mock events
const mockEvents = [
  { id: '1', title: 'Kasun Perera — Sony A7III', start: new Date(2024, 9, 24), end: new Date(2024, 9, 26), status: 'active', bookingId: 'BK-2024-001' },
  { id: '2', title: 'Malsha Fernando — Toyota Corolla', start: new Date(2024, 9, 25), end: new Date(2024, 9, 28), status: 'confirmed', bookingId: 'BK-2024-002' },
  { id: '3', title: 'Ravi Silva — Tent 6x6m', start: new Date(2024, 9, 26), end: new Date(2024, 9, 27), status: 'pending_confirmation', bookingId: 'BK-2024-003' },
  { id: '4', title: 'Nimal — Generator 5kW', start: new Date(2024, 9, 15), end: new Date(2024, 9, 17), status: 'overdue', bookingId: 'BK-2024-005' },
  { id: '5', title: 'Priya — Canon 5D Kit', start: new Date(2024, 9, 28), end: new Date(2024, 9, 31), status: 'confirmed', bookingId: 'BK-2024-006' },
]

function getEventsForDay(date: Date) {
  return mockEvents.filter(ev => {
    const d = date.getTime()
    return d >= ev.start.getTime() && d <= ev.end.getTime()
  })
}

export default function CalendarPage() {
  const now = new Date()
  const [year, setYear] = useState(now.getFullYear())
  const [month, setMonth] = useState(now.getMonth())
  const [selectedEvent, setSelectedEvent] = useState<typeof mockEvents[0] | null>(null)

  const firstDay = new Date(year, month, 1).getDay()
  const daysInMonth = new Date(year, month + 1, 0).getDate()

  const prevMonth = () => {
    if (month === 0) { setMonth(11); setYear(y => y - 1) }
    else setMonth(m => m - 1)
  }

  const nextMonth = () => {
    if (month === 11) { setMonth(0); setYear(y => y + 1) }
    else setMonth(m => m + 1)
  }

  const isToday = (day: number) =>
    day === now.getDate() && month === now.getMonth() && year === now.getFullYear()

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold text-gray-900">Calendar</h1>
          <p className="text-sm text-gray-500 mt-1">Rental schedule overview</p>
        </div>
        <div className="flex items-center gap-2">
          {/* Legend */}
          <div className="hidden lg:flex items-center gap-3 mr-4">
            {Object.entries(STATUS_COLORS).map(([status, color]) => (
              <div key={status} className="flex items-center gap-1">
                <div className={`w-2.5 h-2.5 rounded-full ${color}`} />
                <span className="text-xs text-gray-600 capitalize">{status.replace(/_/g, ' ')}</span>
              </div>
            ))}
          </div>
        </div>
      </div>

      {/* Calendar Navigation */}
      <div className="bg-white rounded-xl border border-gray-200 shadow-sm overflow-hidden">
        <div className="flex items-center justify-between px-6 py-4 border-b border-gray-100">
          <button onClick={prevMonth} className="p-2 rounded-lg text-gray-500 hover:bg-gray-100 transition-colors">
            <ChevronLeft className="w-5 h-5" />
          </button>
          <h2 className="text-lg font-bold text-gray-900">{MONTHS[month]} {year}</h2>
          <button onClick={nextMonth} className="p-2 rounded-lg text-gray-500 hover:bg-gray-100 transition-colors">
            <ChevronRight className="w-5 h-5" />
          </button>
        </div>

        {/* Day Headers */}
        <div className="grid grid-cols-7 border-b border-gray-100">
          {DAYS.map(day => (
            <div key={day} className="py-3 text-center text-xs font-semibold text-gray-500 uppercase tracking-wide">
              {day}
            </div>
          ))}
        </div>

        {/* Calendar Grid */}
        <div className="grid grid-cols-7">
          {/* Empty cells for first week */}
          {Array.from({ length: firstDay }).map((_, i) => (
            <div key={`empty-${i}`} className="min-h-[120px] border-b border-r border-gray-50 bg-gray-50/50" />
          ))}

          {/* Days */}
          {Array.from({ length: daysInMonth }).map((_, i) => {
            const day = i + 1
            const date = new Date(year, month, day)
            const events = getEventsForDay(date)
            const today = isToday(day)

            return (
              <div
                key={day}
                className={`min-h-[120px] border-b border-r border-gray-100 p-1.5 ${today ? 'bg-blue-50' : 'hover:bg-gray-50'} transition-colors`}
              >
                <div className={`w-7 h-7 flex items-center justify-center rounded-full text-sm font-medium mb-1 ${
                  today ? 'bg-blue-600 text-white' : 'text-gray-700'
                }`}>
                  {day}
                </div>
                <div className="space-y-0.5">
                  {events.slice(0, 3).map(event => (
                    <button
                      key={event.id}
                      onClick={() => setSelectedEvent(event)}
                      className={`w-full text-left px-1.5 py-0.5 rounded text-xs text-white font-medium truncate ${STATUS_COLORS[event.status]} hover:opacity-90 transition-opacity`}
                    >
                      {event.title}
                    </button>
                  ))}
                  {events.length > 3 && (
                    <p className="text-xs text-gray-500 pl-1">+{events.length - 3} more</p>
                  )}
                </div>
              </div>
            )
          })}
        </div>
      </div>

      {/* Event Detail Popup */}
      {selectedEvent && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/30" onClick={() => setSelectedEvent(null)}>
          <div className="bg-white rounded-2xl shadow-xl p-6 max-w-sm w-full" onClick={e => e.stopPropagation()}>
            <div className={`inline-flex items-center gap-2 px-3 py-1 rounded-full text-white text-xs font-medium mb-4 ${STATUS_COLORS[selectedEvent.status]}`}>
              <CalIcon className="w-3 h-3" />
              {selectedEvent.status.replace(/_/g, ' ')}
            </div>
            <h3 className="text-lg font-bold text-gray-900 mb-2">{selectedEvent.title}</h3>
            <div className="space-y-2 text-sm text-gray-600">
              <p><span className="font-medium">Booking ID:</span> {selectedEvent.bookingId}</p>
              <p><span className="font-medium">Start:</span> {selectedEvent.start.toLocaleDateString()}</p>
              <p><span className="font-medium">End:</span> {selectedEvent.end.toLocaleDateString()}</p>
            </div>
            <div className="flex gap-2 mt-4">
              <button onClick={() => setSelectedEvent(null)} className="flex-1 py-2 border border-gray-300 rounded-lg text-sm font-medium hover:bg-gray-50">Close</button>
              <a href={`/dashboard/bookings/${selectedEvent.bookingId}`} className="flex-1 py-2 bg-blue-600 text-white rounded-lg text-sm font-medium text-center hover:bg-blue-700">View Booking</a>
            </div>
          </div>
        </div>
      )}

      {/* Upcoming Bookings Sidebar */}
      <div className="bg-white rounded-xl border border-gray-200 shadow-sm p-6">
        <h2 className="text-lg font-bold text-gray-900 mb-4">Upcoming this month</h2>
        <div className="space-y-3">
          {mockEvents.map(event => (
            <div key={event.id} className="flex items-center gap-3 p-3 rounded-lg border border-gray-100 hover:bg-gray-50">
              <div className={`w-3 h-3 rounded-full shrink-0 ${STATUS_COLORS[event.status]}`} />
              <div className="flex-1 min-w-0">
                <p className="text-sm font-medium text-gray-900 truncate">{event.title}</p>
                <p className="text-xs text-gray-500">
                  {event.start.toLocaleDateString()} — {event.end.toLocaleDateString()}
                </p>
              </div>
              <a href={`/dashboard/bookings/${event.bookingId}`} className="text-xs text-blue-600 hover:underline shrink-0">
                View
              </a>
            </div>
          ))}
        </div>
      </div>
    </div>
  )
}
