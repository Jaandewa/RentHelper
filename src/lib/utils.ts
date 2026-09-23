import { type ClassValue, clsx } from 'clsx'
import { twMerge } from 'tailwind-merge'

export function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs))
}

export function formatCurrency(amount: number, currency = 'LKR') {
  return new Intl.NumberFormat('en-LK', { style: 'currency', currency }).format(amount)
}

export function formatDate(date: Date | string) {
  return new Intl.DateTimeFormat('en-LK', { dateStyle: 'medium' }).format(new Date(date))
}

export function generateBookingNumber() {
  const year = new Date().getFullYear()
  const random = Math.floor(Math.random() * 10000).toString().padStart(4, '0')
  return `BK-${year}-${random}`
}

export function calculateDays(pickup: Date, returnDate: Date): number {
  const diff = returnDate.getTime() - pickup.getTime()
  return Math.ceil(diff / (1000 * 60 * 60 * 24))
}
