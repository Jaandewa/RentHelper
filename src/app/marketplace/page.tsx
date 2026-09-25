'use client';

import { useState, useEffect } from 'react';
import Link from 'next/link';
import { Search, MapPin, SlidersHorizontal, ChevronLeft, ChevronRight } from 'lucide-react';

export default function MarketplacePage() {
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
  const cities = ['Colombo', 'Kandy', 'Galle', 'Negombo', 'Matara', 'Jaffna', 'Kurunegala'];

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
    <div className="min-h-screen bg-gray-50 py-12">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="text-center mb-12">
          <h1 className="text-4xl font-extrabold text-gray-900 sm:text-5xl">
            Rent Anything, Anytime.
          </h1>
          <p className="mt-4 text-xl text-gray-500">
            Discover thousands of rental items from trusted providers near you.
          </p>
        </div>

        {/* Search and Filters */}
        <div className="bg-white rounded-xl shadow-md p-6 mb-8">
          <div className="flex flex-col md:flex-row gap-4">
            <div className="flex-1 relative">
              <Search className="absolute left-3 top-3 h-5 w-5 text-gray-400" />
              <input
                type="text"
                placeholder="What are you looking for?"
                className="w-full pl-10 pr-4 py-2 border border-gray-300 rounded-lg focus:ring-blue-500 focus:border-blue-500"
                value={search}
                onChange={(e) => setSearch(e.target.value)}
              />
            </div>
            <div className="w-full md:w-64 relative">
              <MapPin className="absolute left-3 top-3 h-5 w-5 text-gray-400" />
              <select
                className="w-full pl-10 pr-4 py-2 border border-gray-300 rounded-lg focus:ring-blue-500 focus:border-blue-500 appearance-none"
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
              className={`px-4 py-2 rounded-full text-sm font-medium transition-colors ${
                category === '' ? 'bg-blue-600 text-white' : 'bg-gray-100 text-gray-700 hover:bg-gray-200'
              }`}
            >
              All Categories
            </button>
            {categories.map((c) => (
              <button
                key={c.slug}
                onClick={() => setCategory(c.slug)}
                className={`px-4 py-2 rounded-full text-sm font-medium transition-colors ${
                  category === c.slug ? 'bg-blue-600 text-white' : 'bg-gray-100 text-gray-700 hover:bg-gray-200'
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
              <div key={i} className="animate-pulse bg-white rounded-xl shadow-sm h-80"></div>
            ))}
          </div>
        ) : ads.length > 0 ? (
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6">
            {ads.map((ad: any) => (
              <Link href={`/marketplace/${ad.id}`} key={ad.id} className="group block">
                <div className="bg-white rounded-xl shadow-sm hover:shadow-xl transition-shadow overflow-hidden border border-gray-100">
                  <div className="relative h-48 bg-gray-200">
                    {ad.coverImageUrl ? (
                      <img src={ad.coverImageUrl} alt={ad.title} className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-300" />
                    ) : (
                      <div className="w-full h-full flex items-center justify-center text-gray-400">No Image</div>
                    )}
                    {ad.isAvailable && (
                      <span className="absolute top-2 right-2 bg-green-500 text-white text-xs px-2 py-1 rounded-md font-medium">
                        Available
                      </span>
                    )}
                  </div>
                  <div className="p-4">
                    <div className="flex justify-between items-start mb-2">
                      <h3 className="text-lg font-semibold text-gray-900 line-clamp-1 group-hover:text-blue-600 transition-colors">
                        {ad.title}
                      </h3>
                    </div>
                    <div className="flex items-center text-gray-500 text-sm mb-3">
                      <MapPin className="h-4 w-4 mr-1" />
                      {ad.city}
                    </div>
                    <div className="flex justify-between items-center mt-4">
                      <div>
                        <p className="text-xs text-gray-500">From</p>
                        <p className="text-xl font-bold text-gray-900">${ad.dailyPrice}<span className="text-sm font-normal text-gray-500">/day</span></p>
                      </div>
                      <div className="flex items-center">
                        <div className="w-6 h-6 rounded-full bg-gray-200 overflow-hidden mr-2">
                          {ad.business?.logo && <img src={ad.business.logo} alt="" className="w-full h-full object-cover" />}
                        </div>
                        <span className="text-xs text-gray-600 truncate max-w-[80px]">{ad.business?.name}</span>
                      </div>
                    </div>
                  </div>
                </div>
              </Link>
            ))}
          </div>
        ) : (
          <div className="text-center py-20 bg-white rounded-xl shadow-sm">
            <h3 className="text-lg font-medium text-gray-900">No items found</h3>
            <p className="mt-1 text-gray-500">Try adjusting your search or filters.</p>
          </div>
        )}

        {/* Pagination */}
        {totalPages > 1 && (
          <div className="mt-10 flex justify-center items-center space-x-4">
            <button
              onClick={() => setPage(p => Math.max(1, p - 1))}
              disabled={page === 1}
              className="p-2 rounded-full border border-gray-300 disabled:opacity-50 hover:bg-gray-50"
            >
              <ChevronLeft className="h-5 w-5" />
            </button>
            <span className="text-gray-600 font-medium">
              Page {page} of {totalPages}
            </span>
            <button
              onClick={() => setPage(p => Math.min(totalPages, p + 1))}
              disabled={page === totalPages}
              className="p-2 rounded-full border border-gray-300 disabled:opacity-50 hover:bg-gray-50"
            >
              <ChevronRight className="h-5 w-5" />
            </button>
          </div>
        )}
      </div>
    </div>
  );
}
