'use client';

import { useState, useEffect } from 'react';
import Link from 'next/link';
import Header from '@/components/layout/Header';
import { getAllCities } from '@/lib/location/sri-lanka';
import { Search, MapPin, ChevronLeft, ChevronRight } from 'lucide-react';

export default function MarketplaceHomePage() {
  const [ads, setAds] = useState([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState('');
  const [city, setCity] = useState('');
  const [category, setCategory] = useState('');
  const [page, setPage] = useState(1);
  const [totalPages, setTotalPages] = useState(1);

  const categories = [
    { name: 'Camera & Video', slug: 'camera-video' },
    { name: 'Vehicles', slug: 'vehicles' },
    { name: 'Party & Events', slug: 'party-events' },
    { name: 'Tools & Equipment', slug: 'tools-equipment' },
    { name: 'IT Equipment', slug: 'it-equipment' },
    { name: 'Sports & Outdoors', slug: 'sports-outdoors' },
  ];
  const cities = getAllCities();

  const fetchAds = async () => {
    setLoading(true);
    try {
      const params = new URLSearchParams();
      if (search) params.append('search', search);
      if (city) params.append('city', city);
      if (category) params.append('category', category);
      params.append('page', page.toString());

      const res = await fetch(`/api/marketplace/ads?${params.toString()}`);
      const data = await res.json();
      setAds(data.ads || []);
      setTotalPages(data.pagination?.totalPages || 1);
    } catch (error) {
      console.error('Failed to fetch ads', error);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchAds();
  }, [search, city, category, page]);

  return (
    <div className="min-h-screen bg-gray-50 flex flex-col">
      <Header />

      <main className="flex-1 py-8 sm:py-12">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="text-center mb-10">
            <h1 className="text-3xl font-extrabold text-gray-900 sm:text-5xl tracking-tight">
              Rent Anything, Anytime.
            </h1>
            <p className="mt-3 text-lg text-gray-600 max-w-2xl mx-auto">
              Discover thousands of rental items from trusted providers near you.
            </p>
          </div>

          {/* Search and Filters */}
          <div className="bg-white rounded-2xl shadow-md p-6 mb-8 border border-gray-100">
            <div className="flex flex-col md:flex-row gap-4">
              <div className="flex-1 relative">
                <Search className="absolute left-3.5 top-1/2 -translate-y-1/2 h-5 w-5 text-gray-400" />
                <input
                  type="text"
                  placeholder="What are you looking for?"
                  className="w-full pl-11 pr-4 py-2.5 border border-gray-300 rounded-xl focus:ring-2 focus:ring-blue-500 focus:border-blue-500 outline-none text-sm transition"
                  value={search}
                  onChange={(e) => setSearch(e.target.value)}
                />
              </div>
              <div className="w-full md:w-64 relative">
                <MapPin className="absolute left-3.5 top-1/2 -translate-y-1/2 h-5 w-5 text-gray-400" />
                <select
                  className="w-full pl-11 pr-4 py-2.5 border border-gray-300 rounded-xl focus:ring-2 focus:ring-blue-500 focus:border-blue-500 appearance-none bg-white text-sm outline-none transition"
                  value={city}
                  onChange={(e) => setCity(e.target.value)}
                >
                  <option value="">All Cities</option>
                  {cities.map((c) => (
                    <option key={c} value={c}>{c}</option>
                  ))}
                </select>
              </div>
            </div>

            <div className="mt-6 flex flex-wrap gap-2">
              <button
                onClick={() => setCategory('')}
                className={`px-4 py-2 rounded-full text-xs font-semibold transition-colors ${
                  category === '' ? 'bg-blue-600 text-white shadow-sm' : 'bg-gray-100 text-gray-700 hover:bg-gray-200'
                }`}
              >
                All Categories
              </button>
              {categories.map((c) => (
                <button
                  key={c.slug}
                  onClick={() => setCategory(c.slug)}
                  className={`px-4 py-2 rounded-full text-xs font-semibold transition-colors ${
                    category === c.slug ? 'bg-blue-600 text-white shadow-sm' : 'bg-gray-100 text-gray-700 hover:bg-gray-200'
                  }`}
                >
                  {c.name}
                </button>
              ))}
            </div>
          </div>

          {/* Results Grid */}
          {loading ? (
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6">
              {[...Array(8)].map((_, i) => (
                <div key={i} className="animate-pulse bg-white rounded-2xl shadow-sm h-80 border border-gray-100"></div>
              ))}
            </div>
          ) : ads.length > 0 ? (
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6">
              {ads.map((ad: any) => (
                <Link href={`/marketplace/${ad.id}`} key={ad.id} className="group block">
                  <div className="bg-white rounded-2xl shadow-sm hover:shadow-xl transition-all duration-300 overflow-hidden border border-gray-100 flex flex-col h-full">
                    <div className="relative h-48 bg-gray-100 overflow-hidden">
                      {ad.coverImageUrl ? (
                        <img src={ad.coverImageUrl} alt={ad.title} className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-300" />
                      ) : (
                        <div className="w-full h-full flex items-center justify-center text-gray-400 text-sm">No Image</div>
                      )}
                      {ad.isAvailable && (
                        <span className="absolute top-3 right-3 bg-emerald-500 text-white text-xs px-2.5 py-1 rounded-full font-semibold shadow-sm">
                          Available
                        </span>
                      )}
                    </div>
                    <div className="p-5 flex-1 flex flex-col justify-between">
                      <div>
                        <h3 className="text-base font-bold text-gray-900 line-clamp-1 group-hover:text-blue-600 transition-colors">
                          {ad.title}
                        </h3>
                        <div className="flex items-center text-gray-500 text-xs mt-1">
                          <MapPin className="h-3.5 w-3.5 mr-1 text-gray-400" />
                          {ad.city || 'Sri Lanka'}
                        </div>
                      </div>
                      <div className="flex justify-between items-end mt-4 pt-4 border-t border-gray-50">
                        <div>
                          <p className="text-[10px] uppercase tracking-wider font-semibold text-gray-400">Rate</p>
                          <p className="text-lg font-extrabold text-gray-900">
                            LKR {ad.dailyPrice || ad.hourlyPrice || 0}
                            <span className="text-xs font-normal text-gray-500">/day</span>
                          </p>
                        </div>
                        <div className="flex items-center">
                          <div className="w-6 h-6 rounded-full bg-blue-100 flex items-center justify-center text-blue-700 text-xs font-bold mr-1.5 overflow-hidden">
                            {ad.business?.logo ? (
                              <img src={ad.business.logo} alt="" className="w-full h-full object-cover" />
                            ) : (
                              ad.business?.name?.[0]?.toUpperCase() || 'P'
                            )}
                          </div>
                          <span className="text-xs text-gray-600 font-medium truncate max-w-[80px]">{ad.business?.name}</span>
                        </div>
                      </div>
                    </div>
                  </div>
                </Link>
              ))}
            </div>
          ) : (
            <div className="text-center py-20 bg-white rounded-2xl shadow-sm border border-gray-100">
              <h3 className="text-lg font-bold text-gray-900">No items found</h3>
              <p className="mt-1 text-sm text-gray-500">Try adjusting your search query or filters.</p>
            </div>
          )}

          {/* Pagination */}
          {totalPages > 1 && (
            <div className="mt-10 flex justify-center items-center space-x-4">
              <button
                onClick={() => setPage(p => Math.max(1, p - 1))}
                disabled={page === 1}
                className="p-2.5 rounded-full border border-gray-300 disabled:opacity-40 hover:bg-gray-100 transition"
              >
                <ChevronLeft className="h-5 w-5 text-gray-600" />
              </button>
              <span className="text-sm font-semibold text-gray-700">
                Page {page} of {totalPages}
              </span>
              <button
                onClick={() => setPage(p => Math.min(totalPages, p + 1))}
                disabled={page === totalPages}
                className="p-2.5 rounded-full border border-gray-300 disabled:opacity-40 hover:bg-gray-100 transition"
              >
                <ChevronRight className="h-5 w-5 text-gray-600" />
              </button>
            </div>
          )}
        </div>
      </main>

      <footer className="bg-white border-t border-gray-200 py-8 text-center text-xs text-gray-500">
        <p>© {new Date().getFullYear()} RentHelper. All rights reserved.</p>
      </footer>
    </div>
  );
}
