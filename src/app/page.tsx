'use client'

import Link from 'next/link'
import { Camera, Car, PartyPopper, Wrench, Star, Shield, Users, BarChart3, Calendar, CheckCircle2, ArrowRight, Building2, Laptop, Scissors, Stethoscope, Tent, Home } from 'lucide-react'

export default function LandingPage() {
  return (
    <div className="min-h-screen bg-white">
      {/* Hero Section */}
      <section className="pt-32 pb-20 px-4 text-center max-w-5xl mx-auto">
        <h1 className="text-5xl md:text-7xl font-extrabold tracking-tight text-gray-900 mb-6">
          The Complete Rental Management Platform
        </h1>
        <p className="text-xl text-gray-600 mb-10 max-w-3xl mx-auto">
          Manage your rental business with confidence. Cameras, vehicles, party items, tools, and more — all in one place.
        </p>
        <div className="flex flex-col sm:flex-row justify-center gap-4">
          <Link href="/auth/signup?role=provider" className="flex items-center justify-center gap-2 bg-blue-600 hover:bg-blue-700 text-white px-8 py-4 rounded-xl text-lg font-semibold transition-all shadow-lg hover:shadow-xl">
            <Building2 className="w-6 h-6" /> I'm a Rental Provider
          </Link>
          <Link href="/auth/signup?role=customer" className="flex items-center justify-center gap-2 bg-white border-2 border-gray-200 hover:border-gray-300 text-gray-900 px-8 py-4 rounded-xl text-lg font-semibold transition-all">
            <Users className="w-6 h-6" /> I'm a Customer
          </Link>
        </div>
        <p className="mt-6 text-sm text-gray-500">
          Already have an account? <Link href="/auth/signin" className="text-blue-600 font-medium hover:underline">Sign In</Link>
        </p>
      </section>

      {/* Stats Bar */}
      <section className="border-y border-gray-100 bg-gray-50 py-10">
        <div className="max-w-7xl mx-auto px-4 grid grid-cols-2 md:grid-cols-4 gap-8 text-center">
          <div>
            <div className="text-3xl font-bold text-gray-900">500+</div>
            <div className="text-gray-500 mt-1">Businesses</div>
          </div>
          <div>
            <div className="text-3xl font-bold text-gray-900">10,000+</div>
            <div className="text-gray-500 mt-1">Items Managed</div>
          </div>
          <div>
            <div className="text-3xl font-bold text-gray-900">50,000+</div>
            <div className="text-gray-500 mt-1">Bookings Completed</div>
          </div>
          <div>
            <div className="text-3xl font-bold text-gray-900">4.8★</div>
            <div className="text-gray-500 mt-1">Average Rating</div>
          </div>
        </div>
      </section>

      {/* Categories Section */}
      <section className="py-20 px-4 max-w-7xl mx-auto">
        <h2 className="text-3xl font-bold text-center mb-12">One Platform for Every Rental Business</h2>
        <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-6">
          <div className="p-6 border rounded-2xl bg-white shadow-sm hover:shadow-md transition">
            <Camera className="w-10 h-10 text-blue-500 mb-4" />
            <h3 className="text-xl font-bold mb-2">Camera & Video</h3>
            <p className="text-gray-600">DSLR cameras, lenses, lighting, microphones, gimbals</p>
          </div>
          <div className="p-6 border rounded-2xl bg-white shadow-sm hover:shadow-md transition">
            <Car className="w-10 h-10 text-blue-500 mb-4" />
            <h3 className="text-xl font-bold mb-2">Vehicles</h3>
            <p className="text-gray-600">Cars, vans, motorcycles, tuk-tuks, buses</p>
          </div>
          <div className="p-6 border rounded-2xl bg-white shadow-sm hover:shadow-md transition">
            <PartyPopper className="w-10 h-10 text-blue-500 mb-4" />
            <h3 className="text-xl font-bold mb-2">Party & Events</h3>
            <p className="text-gray-600">Tents, chairs, sound systems, decorations, stages</p>
          </div>
          <div className="p-6 border rounded-2xl bg-white shadow-sm hover:shadow-md transition">
            <Wrench className="w-10 h-10 text-blue-500 mb-4" />
            <h3 className="text-xl font-bold mb-2">Tools & Equipment</h3>
            <p className="text-gray-600">Generators, drills, scaffolding, welding machines</p>
          </div>
          <div className="p-6 border rounded-2xl bg-white shadow-sm hover:shadow-md transition">
            <Scissors className="w-10 h-10 text-blue-500 mb-4" />
            <h3 className="text-xl font-bold mb-2">Clothing & Bridal</h3>
            <p className="text-gray-600">Wedding dresses, suits, traditional wear, accessories</p>
          </div>
          <div className="p-6 border rounded-2xl bg-white shadow-sm hover:shadow-md transition">
            <Laptop className="w-10 h-10 text-blue-500 mb-4" />
            <h3 className="text-xl font-bold mb-2">IT Equipment</h3>
            <p className="text-gray-600">Laptops, projectors, cameras, WiFi routers, servers</p>
          </div>
        </div>
      </section>

      {/* Features Section */}
      <section className="bg-gray-900 text-white py-20 px-4">
        <div className="max-w-7xl mx-auto">
          <div className="grid md:grid-cols-3 gap-12 text-center">
            <div>
              <div className="w-16 h-16 bg-gray-800 rounded-full flex items-center justify-center mx-auto mb-6">
                <Calendar className="w-8 h-8 text-blue-400" />
              </div>
              <h3 className="text-xl font-bold mb-4">Smart Booking System</h3>
              <p className="text-gray-400">Real-time availability, double-booking prevention, Google Calendar sync.</p>
            </div>
            <div>
              <div className="w-16 h-16 bg-gray-800 rounded-full flex items-center justify-center mx-auto mb-6">
                <Star className="w-8 h-8 text-blue-400" />
              </div>
              <h3 className="text-xl font-bold mb-4">Customer Trust Scores</h3>
              <p className="text-gray-400">KYC verification, cross-provider ratings, blacklist protection.</p>
            </div>
            <div>
              <div className="w-16 h-16 bg-gray-800 rounded-full flex items-center justify-center mx-auto mb-6">
                <BarChart3 className="w-8 h-8 text-blue-400" />
              </div>
              <h3 className="text-xl font-bold mb-4">Analytics & Invoicing</h3>
              <p className="text-gray-400">PDF invoices, payment tracking, revenue reports.</p>
            </div>
          </div>
        </div>
      </section>

      {/* How it works */}
      <section className="py-20 px-4 max-w-5xl mx-auto text-center">
        <h2 className="text-3xl font-bold mb-12">How It Works</h2>
        <div className="flex flex-col md:flex-row justify-between items-center gap-8 relative">
          <div className="flex flex-col items-center flex-1">
            <div className="w-12 h-12 rounded-full bg-blue-100 text-blue-600 flex items-center justify-center font-bold text-xl mb-4">1</div>
            <h4 className="font-bold">Register</h4>
          </div>
          <div className="hidden md:block w-full h-1 bg-gray-200 absolute top-6 -z-10"></div>
          <div className="flex flex-col items-center flex-1">
            <div className="w-12 h-12 rounded-full bg-blue-100 text-blue-600 flex items-center justify-center font-bold text-xl mb-4">2</div>
            <h4 className="font-bold">Set up business</h4>
          </div>
          <div className="flex flex-col items-center flex-1">
            <div className="w-12 h-12 rounded-full bg-blue-100 text-blue-600 flex items-center justify-center font-bold text-xl mb-4">3</div>
            <h4 className="font-bold">Add inventory</h4>
          </div>
          <div className="flex flex-col items-center flex-1">
            <div className="w-12 h-12 rounded-full bg-blue-100 text-blue-600 flex items-center justify-center font-bold text-xl mb-4">4</div>
            <h4 className="font-bold">Start earning</h4>
          </div>
        </div>
      </section>

      <footer className="bg-gray-50 py-10 text-center border-t border-gray-200 text-gray-500">
        <p>© {new Date().getFullYear()} RentHelper. All rights reserved.</p>
      </footer>
    </div>
  )
}
