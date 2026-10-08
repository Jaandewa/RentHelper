'use client';

import { useState, useEffect, useMemo } from 'react';
import Link from 'next/link';
import Header from '@/components/layout/Header';
import {
  Search,
  MapPin,
  ChevronLeft,
  ChevronRight,
  Sparkles,
  ArrowRight,
  ShieldCheck,
  CheckCircle2,
  Calendar,
  Package,
  SlidersHorizontal,
  X,
  Camera,
  Smartphone,
  Laptop,
  Car,
  Shirt,
  Wrench,
  Compass,
  Volume2,
  Armchair,
  HeartPulse,
  Building,
  Heart,
  Store,
  Clock,
  RefreshCw,
} from 'lucide-react';
import {
  getAllProvinces,
  getDistrictsByProvince,
  getCitiesByDistrict,
  getAllCities,
} from '@/lib/location/sri-lanka';

// Fallback category configuration for icons & pastel themes
const CATEGORY_UI_CONFIG: Record<
  string,
  { icon: any; colorBg: string; colorText: string; darkBg: string }
> = {
  'camera-video': {
    icon: Camera,
    colorBg: 'bg-rose-50 border-rose-100',
    colorText: 'text-rose-600',
    darkBg: 'dark:bg-rose-950/30 dark:border-rose-900/40',
  },
  'mobile-tablets': {
    icon: Smartphone,
    colorBg: 'bg-sky-50 border-sky-100',
    colorText: 'text-sky-600',
    darkBg: 'dark:bg-sky-950/30 dark:border-sky-900/40',
  },
  'it-equipment': {
    icon: Laptop,
    colorBg: 'bg-indigo-50 border-indigo-100',
    colorText: 'text-indigo-600',
    darkBg: 'dark:bg-indigo-950/30 dark:border-indigo-900/40',
  },
  vehicles: {
    icon: Car,
    colorBg: 'bg-amber-50 border-amber-100',
    colorText: 'text-amber-600',
    darkBg: 'dark:bg-amber-950/30 dark:border-amber-900/40',
  },
  'clothing-bridal': {
    icon: Shirt,
    colorBg: 'bg-pink-50 border-pink-100',
    colorText: 'text-pink-600',
    darkBg: 'dark:bg-pink-950/30 dark:border-pink-900/40',
  },
  'party-events': {
    icon: Sparkles,
    colorBg: 'bg-purple-50 border-purple-100',
    colorText: 'text-purple-600',
    darkBg: 'dark:bg-purple-950/30 dark:border-purple-900/40',
  },
  'tools-equipment': {
    icon: Wrench,
    colorBg: 'bg-emerald-50 border-emerald-100',
    colorText: 'text-emerald-600',
    darkBg: 'dark:bg-emerald-950/30 dark:border-emerald-900/40',
  },
  'sports-outdoors': {
    icon: Compass,
    colorBg: 'bg-teal-50 border-teal-100',
    colorText: 'text-teal-600',
    darkBg: 'dark:bg-teal-950/30 dark:border-teal-900/40',
  },
  'sound-stage': {
    icon: Volume2,
    colorBg: 'bg-violet-50 border-violet-100',
    colorText: 'text-violet-600',
    darkBg: 'dark:bg-violet-950/30 dark:border-violet-900/40',
  },
  'furniture-appliances': {
    icon: Armchair,
    colorBg: 'bg-orange-50 border-orange-100',
    colorText: 'text-orange-600',
    darkBg: 'dark:bg-orange-950/30 dark:border-orange-900/40',
  },
  medical: {
    icon: HeartPulse,
    colorBg: 'bg-red-50 border-red-100',
    colorText: 'text-red-600',
    darkBg: 'dark:bg-red-950/30 dark:border-red-900/40',
  },
  'rooms-halls-studios': {
    icon: Building,
    colorBg: 'bg-blue-50 border-blue-100',
    colorText: 'text-blue-600',
    darkBg: 'dark:bg-blue-950/30 dark:border-blue-900/40',
  },
  default: {
    icon: Package,
    colorBg: 'bg-slate-50 border-slate-100',
    colorText: 'text-slate-600',
    darkBg: 'dark:bg-slate-900 dark:border-slate-800',
  },
};

export default function MarketplaceHomePage() {
  const [ads, setAds] = useState<any[]>([]);
  const [categories, setCategories] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [categoriesLoading, setCategoriesLoading] = useState(true);

  // Search & Filter State
  const [search, setSearch] = useState('');
  const [province, setProvince] = useState('');
  const [district, setDistrict] = useState('');
  const [city, setCity] = useState('');
  const [category, setCategory] = useState('');
  const [page, setPage] = useState(1);
  const [totalPages, setTotalPages] = useState(1);
  const [totalAds, setTotalAds] = useState(0);

  // Sri Lanka location data
  const provinces = useMemo(() => getAllProvinces(), []);
  const availableDistricts = useMemo(
    () => (province ? getDistrictsByProvince(province) : []),
    [province]
  );
  const availableCities = useMemo(() => {
    if (district) {
      return getCitiesByDistrict(district, province);
    }
    if (province) {
      const districts = getDistrictsByProvince(province);
      return Array.from(
        new Set(districts.flatMap((d) => getCitiesByDistrict(d, province)))
      ).sort((a, b) => a.localeCompare(b));
    }
    return getAllCities();
  }, [province, district]);

  // Fetch Categories from API
  useEffect(() => {
    async function fetchCategories() {
      try {
        const res = await fetch('/api/categories');
        const data = await res.json();
        if (data?.categories) {
          setCategories(data.categories);
        }
      } catch (err) {
        console.error('Failed to load categories', err);
      } finally {
        setCategoriesLoading(false);
      }
    }
    fetchCategories();
  }, []);

  // Fetch Marketplace Ads from API
  const fetchAds = async () => {
    setLoading(true);
    try {
      const params = new URLSearchParams();
      if (search.trim()) params.append('search', search.trim());

      // If city is explicitly selected, filter by city
      if (city) {
        params.append('city', city);
      } else if (district) {
        // Search by district name in city field
        params.append('city', district);
      } else if (province) {
        // Search by province
        params.append('city', province);
      }

      if (category) params.append('category', category);
      params.append('page', page.toString());
      params.append('limit', '12');

      const res = await fetch(`/api/marketplace/ads?${params.toString()}`);
      const data = await res.json();
      setAds(data.ads || []);
      setTotalPages(data.pagination?.totalPages || 1);
      setTotalAds(data.pagination?.total || (data.ads ? data.ads.length : 0));
    } catch (error) {
      console.error('Failed to fetch ads', error);
      setAds([]);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchAds();
  }, [search, province, district, city, category, page]);

  // Handle location cascading changes
  const handleProvinceChange = (e: React.ChangeEvent<HTMLSelectElement>) => {
    const selected = e.target.value;
    setProvince(selected);
    setDistrict('');
    setCity('');
    setPage(1);
  };

  const handleDistrictChange = (e: React.ChangeEvent<HTMLSelectElement>) => {
    const selected = e.target.value;
    setDistrict(selected);
    setCity('');
    setPage(1);
  };

  const handleCityChange = (e: React.ChangeEvent<HTMLSelectElement>) => {
    setCity(e.target.value);
    setPage(1);
  };

  const clearAllFilters = () => {
    setSearch('');
    setProvince('');
    setDistrict('');
    setCity('');
    setCategory('');
    setPage(1);
  };

  const hasActiveFilters = Boolean(search || province || district || city || category);

  return (
    <div className="min-h-screen bg-slate-50 dark:bg-slate-950 text-slate-900 dark:text-slate-100 flex flex-col font-sans transition-colors">
      <Header />

      <main className="flex-1 py-6 sm:py-10">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          {/* ─────────────────────────────────────────────────────────────
              1. HERO SECTION
          ───────────────────────────────────────────────────────────── */}
          <section className="relative rounded-3xl bg-gradient-to-br from-slate-900 via-slate-800 to-emerald-950 text-white p-6 sm:p-10 lg:p-14 mb-12 shadow-2xl overflow-hidden border border-slate-700/50">
            {/* Ambient Background Glows */}
            <div className="absolute -top-32 -right-32 w-96 h-96 bg-emerald-500/20 rounded-full blur-3xl pointer-events-none" />
            <div className="absolute -bottom-32 -left-32 w-96 h-96 bg-teal-500/20 rounded-full blur-3xl pointer-events-none" />

            <div className="relative z-10 max-w-3xl">
              {/* Green Accent Pill */}
              <div className="inline-flex items-center gap-2 px-4 py-1.5 rounded-full text-xs font-bold uppercase tracking-wider bg-emerald-500/20 text-emerald-300 border border-emerald-500/30 backdrop-blur-md mb-6 shadow-sm">
                <Sparkles className="w-3.5 h-3.5 text-emerald-400" />
                <span>Rent Anything, Anywhere</span>
              </div>

              {/* Headline */}
              <h1 className="text-3xl sm:text-5xl lg:text-6xl font-black tracking-tight leading-tight">
                Need an Item?{' '}
                <span className="bg-gradient-to-r from-emerald-400 via-teal-300 to-emerald-200 bg-clip-text text-transparent">
                  Rent It Instead!
                </span>
              </h1>

              {/* Subtitle */}
              <p className="mt-4 text-base sm:text-lg text-slate-300 font-normal leading-relaxed max-w-2xl">
                From photography gear and vehicles to event equipment and power tools — discover and rent items at fraction of the cost from trusted local providers across Sri Lanka.
              </p>
            </div>

            {/* Floating Hero Search Box */}
            <div className="relative z-10 mt-8 sm:mt-10 bg-white dark:bg-slate-900 rounded-2xl p-4 sm:p-6 shadow-2xl border border-slate-100 dark:border-slate-800 text-slate-900 dark:text-white backdrop-blur-lg">
              <div className="grid grid-cols-1 md:grid-cols-12 gap-3 sm:gap-4 items-center">
                {/* Search Text Input */}
                <div className="md:col-span-4 relative">
                  <label htmlFor="hero-search" className="block text-[11px] font-bold text-slate-500 dark:text-slate-400 uppercase tracking-wider mb-1">
                    Keyword Search
                  </label>
                  <div className="relative">
                    <Search className="absolute left-3.5 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400" />
                    <input
                      id="hero-search"
                      type="text"
                      placeholder="What are you looking for?"
                      className="w-full pl-10 pr-4 py-2.5 bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-xl text-sm font-medium focus:ring-2 focus:ring-emerald-500 focus:border-emerald-500 outline-none transition"
                      value={search}
                      onChange={(e) => {
                        setSearch(e.target.value);
                        setPage(1);
                      }}
                    />
                  </div>
                </div>

                {/* Province Dropdown */}
                <div className="md:col-span-2 relative">
                  <label htmlFor="province-filter" className="block text-[11px] font-bold text-slate-500 dark:text-slate-400 uppercase tracking-wider mb-1">
                    Province
                  </label>
                  <select
                    id="province-filter"
                    className="w-full px-3 py-2.5 bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-xl text-sm font-medium focus:ring-2 focus:ring-emerald-500 focus:border-emerald-500 outline-none transition appearance-none cursor-pointer"
                    value={province}
                    onChange={handleProvinceChange}
                  >
                    <option value="">All Provinces</option>
                    {provinces.map((p) => (
                      <option key={p} value={p}>
                        {p}
                      </option>
                    ))}
                  </select>
                </div>

                {/* District Dropdown */}
                <div className="md:col-span-2 relative">
                  <label htmlFor="district-filter" className="block text-[11px] font-bold text-slate-500 dark:text-slate-400 uppercase tracking-wider mb-1">
                    District
                  </label>
                  <select
                    id="district-filter"
                    disabled={!province}
                    className="w-full px-3 py-2.5 bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-xl text-sm font-medium focus:ring-2 focus:ring-emerald-500 focus:border-emerald-500 outline-none transition appearance-none cursor-pointer disabled:opacity-50 disabled:cursor-not-allowed"
                    value={district}
                    onChange={handleDistrictChange}
                  >
                    <option value="">
                      {!province ? 'Select Province' : 'All Districts'}
                    </option>
                    {availableDistricts.map((d) => (
                      <option key={d} value={d}>
                        {d}
                      </option>
                    ))}
                  </select>
                </div>

                {/* City Dropdown */}
                <div className="md:col-span-2 relative">
                  <label htmlFor="city-filter" className="block text-[11px] font-bold text-slate-500 dark:text-slate-400 uppercase tracking-wider mb-1">
                    City
                  </label>
                  <div className="relative">
                    <MapPin className="absolute left-3 top-1/2 -translate-y-1/2 w-3.5 h-3.5 text-slate-400 pointer-events-none" />
                    <select
                      id="city-filter"
                      className="w-full pl-8 pr-3 py-2.5 bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-xl text-sm font-medium focus:ring-2 focus:ring-emerald-500 focus:border-emerald-500 outline-none transition appearance-none cursor-pointer"
                      value={city}
                      onChange={handleCityChange}
                    >
                      <option value="">All Cities</option>
                      {availableCities.map((c) => (
                        <option key={c} value={c}>
                          {c}
                        </option>
                      ))}
                    </select>
                  </div>
                </div>

                {/* Search Button */}
                <div className="md:col-span-2 flex items-end">
                  <button
                    onClick={() => {
                      setPage(1);
                      fetchAds();
                    }}
                    className="w-full py-2.5 px-5 bg-emerald-600 hover:bg-emerald-700 text-white font-bold text-sm rounded-xl shadow-lg hover:shadow-emerald-600/25 transition-all flex items-center justify-center gap-2 group cursor-pointer"
                  >
                    <Search className="w-4 h-4 group-hover:scale-110 transition-transform" />
                    <span>Search</span>
                  </button>
                </div>
              </div>
            </div>
          </section>

          {/* ─────────────────────────────────────────────────────────────
              2. BROWSE BY CATEGORY SECTION
          ───────────────────────────────────────────────────────────── */}
          <section className="mb-14">
            <div className="flex items-center justify-between mb-6">
              <div>
                <h2 className="text-2xl sm:text-3xl font-extrabold text-slate-900 dark:text-white tracking-tight">
                  Browse by Category
                </h2>
                <p className="text-sm text-slate-500 dark:text-slate-400 mt-1">
                  Find the perfect rental item for your needs
                </p>
              </div>

              {category && (
                <button
                  onClick={() => {
                    setCategory('');
                    setPage(1);
                  }}
                  className="text-xs font-semibold text-emerald-600 dark:text-emerald-400 hover:underline flex items-center gap-1 cursor-pointer"
                >
                  Clear Category Filter
                </button>
              )}
            </div>

            {categoriesLoading ? (
              <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-6 gap-4">
                {[...Array(6)].map((_, i) => (
                  <div
                    key={i}
                    className="h-28 bg-white dark:bg-slate-900 rounded-2xl animate-pulse border border-slate-100 dark:border-slate-800"
                  />
                ))}
              </div>
            ) : (
              <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-6 gap-4">
                {categories.map((cat) => {
                  const ui = CATEGORY_UI_CONFIG[cat.slug] || CATEGORY_UI_CONFIG.default;
                  const IconComp = ui.icon;
                  const isSelected = category === cat.slug;
                  const itemCount = cat._count?.items ?? 0;

                  return (
                    <button
                      key={cat.id || cat.slug}
                      onClick={() => {
                        setCategory(isSelected ? '' : cat.slug);
                        setPage(1);
                      }}
                      className={`p-4 rounded-2xl border text-left transition-all duration-300 flex flex-col justify-between group cursor-pointer ${
                        isSelected
                          ? 'bg-emerald-50/90 dark:bg-emerald-950/50 border-emerald-500 dark:border-emerald-500 ring-2 ring-emerald-500/20 shadow-md'
                          : `bg-white dark:bg-slate-900 border-slate-200/70 dark:border-slate-800 hover:border-emerald-300 dark:hover:border-emerald-700 hover:shadow-md hover:-translate-y-1`
                      }`}
                    >
                      <div className="flex items-center justify-between mb-3">
                        <div
                          className={`w-10 h-10 rounded-xl flex items-center justify-center border ${ui.colorBg} ${ui.colorText} ${ui.darkBg} group-hover:scale-110 transition-transform`}
                        >
                          <IconComp className="w-5 h-5" />
                        </div>
                        {isSelected && (
                          <span className="w-2 h-2 rounded-full bg-emerald-500 animate-pulse" />
                        )}
                      </div>

                      <div>
                        <h3 className="text-sm font-bold text-slate-900 dark:text-white line-clamp-1 group-hover:text-emerald-600 dark:group-hover:text-emerald-400 transition-colors">
                          {cat.name}
                        </h3>
                        <p className="text-[11px] text-slate-500 dark:text-slate-400 mt-0.5 font-medium">
                          {itemCount > 0 ? `${itemCount}+ Available` : 'Available'}
                        </p>
                      </div>
                    </button>
                  );
                })}
              </div>
            )}
          </section>

          {/* ─────────────────────────────────────────────────────────────
              3. POPULAR & FEATURED ITEMS FOR RENT
          ───────────────────────────────────────────────────────────── */}
          <section id="browse" className="mb-16 scroll-mt-24">
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 mb-6">
              <div>
                <h2 className="text-2xl sm:text-3xl font-extrabold text-slate-900 dark:text-white tracking-tight">
                  Popular Items for Rent
                </h2>
                <p className="text-sm text-slate-500 dark:text-slate-400 mt-1">
                  Discover top-rated and available items near you
                </p>
              </div>

              {/* Active Filter Badges */}
              {hasActiveFilters && (
                <div className="flex items-center gap-2 flex-wrap">
                  <span className="text-xs font-bold text-slate-500 dark:text-slate-400">
                    Active Filters:
                  </span>
                  {category && (
                    <span className="inline-flex items-center gap-1 text-xs font-semibold px-2.5 py-1 bg-emerald-100 dark:bg-emerald-950 text-emerald-800 dark:text-emerald-300 rounded-full border border-emerald-300 dark:border-emerald-800">
                      Category: {category}
                      <X
                        className="w-3 h-3 cursor-pointer hover:opacity-75"
                        onClick={() => setCategory('')}
                      />
                    </span>
                  )}
                  {city && (
                    <span className="inline-flex items-center gap-1 text-xs font-semibold px-2.5 py-1 bg-emerald-100 dark:bg-emerald-950 text-emerald-800 dark:text-emerald-300 rounded-full border border-emerald-300 dark:border-emerald-800">
                      City: {city}
                      <X
                        className="w-3 h-3 cursor-pointer hover:opacity-75"
                        onClick={() => setCity('')}
                      />
                    </span>
                  )}
                  {search && (
                    <span className="inline-flex items-center gap-1 text-xs font-semibold px-2.5 py-1 bg-emerald-100 dark:bg-emerald-950 text-emerald-800 dark:text-emerald-300 rounded-full border border-emerald-300 dark:border-emerald-800">
                      Query: &quot;{search}&quot;
                      <X
                        className="w-3 h-3 cursor-pointer hover:opacity-75"
                        onClick={() => setSearch('')}
                      />
                    </span>
                  )}
                  <button
                    onClick={clearAllFilters}
                    className="text-xs font-bold text-rose-600 dark:text-rose-400 hover:underline ml-1 cursor-pointer"
                  >
                    Clear All
                  </button>
                </div>
              )}
            </div>

            {/* Listing Grid */}
            {loading ? (
              <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6">
                {[...Array(8)].map((_, i) => (
                  <div
                    key={i}
                    className="bg-white dark:bg-slate-900 rounded-2xl h-80 animate-pulse border border-slate-100 dark:border-slate-800 shadow-xs"
                  />
                ))}
              </div>
            ) : ads.length > 0 ? (
              <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6">
                {ads.map((ad: any) => (
                  <Link
                    href={`/marketplace/${ad.id}`}
                    key={ad.id}
                    className="group block h-full"
                  >
                    <div className="bg-white dark:bg-slate-900 rounded-2xl shadow-sm hover:shadow-xl transition-all duration-300 overflow-hidden border border-slate-200/80 dark:border-slate-800 flex flex-col h-full hover:-translate-y-1">
                      {/* Image Container */}
                      <div className="relative h-52 bg-slate-100 dark:bg-slate-800 overflow-hidden">
                        {ad.coverImageUrl ? (
                          <img
                            src={ad.coverImageUrl}
                            alt={ad.title}
                            className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-500"
                          />
                        ) : (
                          <div className="w-full h-full flex flex-col items-center justify-center text-slate-400 text-xs font-semibold gap-1">
                            <Package className="w-8 h-8 text-slate-300 dark:text-slate-600" />
                            <span>No Preview Image</span>
                          </div>
                        )}

                        {/* Status Badge */}
                        <div className="absolute top-3 left-3">
                          <span className="inline-flex items-center gap-1 bg-emerald-600/90 text-white text-[11px] font-bold px-2.5 py-1 rounded-full shadow-md backdrop-blur-md">
                            <CheckCircle2 className="w-3 h-3" />
                            Available
                          </span>
                        </div>
                      </div>

                      {/* Content Section */}
                      <div className="p-5 flex-1 flex flex-col justify-between">
                        <div>
                          <h3 className="text-base font-bold text-slate-900 dark:text-white line-clamp-1 group-hover:text-emerald-600 dark:group-hover:text-emerald-400 transition-colors">
                            {ad.title}
                          </h3>

                          <div className="flex items-center text-slate-500 dark:text-slate-400 text-xs font-medium mt-1.5 gap-1">
                            <MapPin className="w-3.5 h-3.5 text-emerald-500 shrink-0" />
                            <span className="truncate">{ad.city || 'Sri Lanka'}</span>
                          </div>
                        </div>

                        {/* Price & Provider Footer */}
                        <div className="mt-5 pt-4 border-t border-slate-100 dark:border-slate-800/80">
                          <div className="flex items-end justify-between mb-3">
                            <div>
                              <p className="text-[10px] font-bold uppercase tracking-wider text-slate-400">
                                Daily Rate
                              </p>
                              <p className="text-lg font-black text-slate-900 dark:text-white">
                                <span className="text-xs text-emerald-600 dark:text-emerald-400 font-bold mr-0.5">
                                  LKR
                                </span>
                                {(ad.dailyPrice || ad.hourlyPrice || 0).toLocaleString()}
                                <span className="text-xs font-normal text-slate-500">
                                  /day
                                </span>
                              </p>
                            </div>

                            {/* Provider Info */}
                            <div className="flex items-center gap-1.5">
                              <div className="w-6 h-6 rounded-full bg-emerald-100 dark:bg-emerald-950 border border-emerald-300 dark:border-emerald-800 flex items-center justify-center text-emerald-700 dark:text-emerald-300 text-[10px] font-bold overflow-hidden">
                                {ad.business?.logo ? (
                                  <img
                                    src={ad.business.logo}
                                    alt=""
                                    className="w-full h-full object-cover"
                                  />
                                ) : (
                                  ad.business?.name?.[0]?.toUpperCase() || 'P'
                                )}
                              </div>
                              <span className="text-xs font-semibold text-slate-600 dark:text-slate-400 truncate max-w-[80px]">
                                {ad.business?.name || 'Verified'}
                              </span>
                            </div>
                          </div>

                          {/* Rent Now Action Button */}
                          <div className="w-full py-2.5 px-4 bg-emerald-600 hover:bg-emerald-700 text-white font-bold text-xs rounded-xl text-center shadow-sm group-hover:shadow-md transition-all flex items-center justify-center gap-1.5">
                            <span>Rent Now</span>
                            <ArrowRight className="w-3.5 h-3.5 group-hover:translate-x-1 transition-transform" />
                          </div>
                        </div>
                      </div>
                    </div>
                  </Link>
                ))}
              </div>
            ) : (
              /* Polished Empty State */
              <div className="text-center py-16 px-6 bg-white dark:bg-slate-900 rounded-3xl border border-slate-200/80 dark:border-slate-800 shadow-sm max-w-2xl mx-auto">
                <div className="w-16 h-16 bg-emerald-50 dark:bg-emerald-950/60 text-emerald-600 dark:text-emerald-400 rounded-2xl flex items-center justify-center mx-auto mb-4 border border-emerald-200/60 dark:border-emerald-800">
                  <Search className="w-8 h-8" />
                </div>
                <h3 className="text-xl font-extrabold text-slate-900 dark:text-white">
                  No Rental Listings Found
                </h3>
                <p className="mt-2 text-sm text-slate-500 dark:text-slate-400 max-w-md mx-auto">
                  We couldn&apos;t find any active rental ads matching your search criteria or selected filters.
                </p>
                {hasActiveFilters && (
                  <button
                    onClick={clearAllFilters}
                    className="mt-6 inline-flex items-center gap-2 px-5 py-2.5 rounded-xl font-bold text-xs text-white bg-emerald-600 hover:bg-emerald-700 shadow-md transition-all cursor-pointer"
                  >
                    <RefreshCw className="w-3.5 h-3.5" />
                    <span>Reset All Filters</span>
                  </button>
                )}
              </div>
            )}

            {/* Pagination Controls */}
            {totalPages > 1 && (
              <div className="mt-12 flex justify-center items-center space-x-3">
                <button
                  onClick={() => setPage((p) => Math.max(1, p - 1))}
                  disabled={page === 1}
                  className="p-2.5 rounded-xl border border-slate-300 dark:border-slate-700 bg-white dark:bg-slate-900 text-slate-700 dark:text-slate-200 disabled:opacity-40 hover:bg-slate-100 dark:hover:bg-slate-800 transition cursor-pointer"
                  aria-label="Previous page"
                >
                  <ChevronLeft className="w-5 h-5" />
                </button>
                <span className="text-sm font-bold text-slate-700 dark:text-slate-300 px-3">
                  Page {page} of {totalPages}
                </span>
                <button
                  onClick={() => setPage((p) => Math.min(totalPages, p + 1))}
                  disabled={page === totalPages}
                  className="p-2.5 rounded-xl border border-slate-300 dark:border-slate-700 bg-white dark:bg-slate-900 text-slate-700 dark:text-slate-200 disabled:opacity-40 hover:bg-slate-100 dark:hover:bg-slate-800 transition cursor-pointer"
                  aria-label="Next page"
                >
                  <ChevronRight className="w-5 h-5" />
                </button>
              </div>
            )}
          </section>

          {/* ─────────────────────────────────────────────────────────────
              4. HOW IT WORKS SECTION
          ───────────────────────────────────────────────────────────── */}
          <section id="how-it-works" className="mb-16 scroll-mt-24">
            <div className="text-center max-w-2xl mx-auto mb-12">
              <span className="text-xs font-extrabold uppercase tracking-wider text-emerald-600 dark:text-emerald-400 bg-emerald-50 dark:bg-emerald-950/60 px-3 py-1 rounded-full border border-emerald-200 dark:border-emerald-800">
                Simple & Transparent
              </span>
              <h2 className="text-2xl sm:text-4xl font-black text-slate-900 dark:text-white tracking-tight mt-3">
                How RentHelper Works
              </h2>
              <p className="text-sm sm:text-base text-slate-500 dark:text-slate-400 mt-2">
                Renting equipment and items is fast, secure, and hassle-free in 4 easy steps.
              </p>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
              {/* Step 1 */}
              <div className="bg-white dark:bg-slate-900 p-6 rounded-3xl border border-slate-200/80 dark:border-slate-800 shadow-xs relative group hover:border-emerald-500/40 transition-all">
                <div className="w-12 h-12 rounded-2xl bg-emerald-50 dark:bg-emerald-950 text-emerald-600 dark:text-emerald-400 border border-emerald-200 dark:border-emerald-800 flex items-center justify-center font-black text-lg mb-4 group-hover:scale-110 transition-transform">
                  1
                </div>
                <h3 className="text-lg font-extrabold text-slate-900 dark:text-white">
                  Search & Discover
                </h3>
                <p className="text-xs text-slate-500 dark:text-slate-400 mt-2 leading-relaxed">
                  Browse thousands of rental items by category, location, or provider across Sri Lanka.
                </p>
              </div>

              {/* Step 2 */}
              <div className="bg-white dark:bg-slate-900 p-6 rounded-3xl border border-slate-200/80 dark:border-slate-800 shadow-xs relative group hover:border-emerald-500/40 transition-all">
                <div className="w-12 h-12 rounded-2xl bg-emerald-50 dark:bg-emerald-950 text-emerald-600 dark:text-emerald-400 border border-emerald-200 dark:border-emerald-800 flex items-center justify-center font-black text-lg mb-4 group-hover:scale-110 transition-transform">
                  2
                </div>
                <h3 className="text-lg font-extrabold text-slate-900 dark:text-white">
                  Select & Request
                </h3>
                <p className="text-xs text-slate-500 dark:text-slate-400 mt-2 leading-relaxed">
                  Choose your required pickup and return dates, then submit a rental request to the owner.
                </p>
              </div>

              {/* Step 3 */}
              <div className="bg-white dark:bg-slate-900 p-6 rounded-3xl border border-slate-200/80 dark:border-slate-800 shadow-xs relative group hover:border-emerald-500/40 transition-all">
                <div className="w-12 h-12 rounded-2xl bg-emerald-50 dark:bg-emerald-950 text-emerald-600 dark:text-emerald-400 border border-emerald-200 dark:border-emerald-800 flex items-center justify-center font-black text-lg mb-4 group-hover:scale-110 transition-transform">
                  3
                </div>
                <h3 className="text-lg font-extrabold text-slate-900 dark:text-white">
                  Confirm & Reserve
                </h3>
                <p className="text-xs text-slate-500 dark:text-slate-400 mt-2 leading-relaxed">
                  Get fast provider approval and confirm your booking details with complete transparency.
                </p>
              </div>

              {/* Step 4 */}
              <div className="bg-white dark:bg-slate-900 p-6 rounded-3xl border border-slate-200/80 dark:border-slate-800 shadow-xs relative group hover:border-emerald-500/40 transition-all">
                <div className="w-12 h-12 rounded-2xl bg-emerald-50 dark:bg-emerald-950 text-emerald-600 dark:text-emerald-400 border border-emerald-200 dark:border-emerald-800 flex items-center justify-center font-black text-lg mb-4 group-hover:scale-110 transition-transform">
                  4
                </div>
                <h3 className="text-lg font-extrabold text-slate-900 dark:text-white">
                  Pick Up & Enjoy
                </h3>
                <p className="text-xs text-slate-500 dark:text-slate-400 mt-2 leading-relaxed">
                  Collect your item or arrange delivery, use it for your project, and return when finished!
                </p>
              </div>
            </div>
          </section>
        </div>
      </main>

      {/* ─────────────────────────────────────────────────────────────
          5. FOOTER
      ───────────────────────────────────────────────────────────── */}
      <footer className="bg-slate-950 text-slate-400 border-t border-slate-800 pt-14 pb-8 px-4 sm:px-6 lg:px-8">
        <div className="max-w-7xl mx-auto grid grid-cols-1 md:grid-cols-4 gap-8 mb-12">
          {/* Col 1: Brand */}
          <div className="space-y-4">
            <Link href="/" className="flex items-center gap-2.5">
              <div className="w-9 h-9 bg-emerald-500 rounded-xl flex items-center justify-center text-white font-black text-lg shadow-md">
                R
              </div>
              <span className="text-xl font-black text-white tracking-tight">
                RentHelper
              </span>
            </Link>
            <p className="text-xs text-slate-400 leading-relaxed">
              Smart, transparent, and trusted rental management connecting equipment owners and renters across Sri Lanka.
            </p>
            <div className="pt-2">
              <span className="inline-flex items-center gap-1.5 text-xs text-emerald-400 font-semibold bg-emerald-950/60 px-3 py-1 rounded-full border border-emerald-800">
                <ShieldCheck className="w-3.5 h-3.5" />
                Verified Local Rentals
              </span>
            </div>
          </div>

          {/* Col 2: Navigation */}
          <div>
            <h4 className="text-sm font-bold text-white uppercase tracking-wider mb-4">
              Marketplace
            </h4>
            <ul className="space-y-2.5 text-xs">
              <li>
                <Link href="/" className="hover:text-emerald-400 transition-colors">
                  Home
                </Link>
              </li>
              <li>
                <Link href="/#browse" className="hover:text-emerald-400 transition-colors">
                  Browse All Items
                </Link>
              </li>
              <li>
                <Link href="/#how-it-works" className="hover:text-emerald-400 transition-colors">
                  How It Works
                </Link>
              </li>
              <li>
                <Link href="/auth/signup" className="hover:text-emerald-400 transition-colors">
                  Become a Provider
                </Link>
              </li>
            </ul>
          </div>

          {/* Col 3: Legal & Support */}
          <div>
            <h4 className="text-sm font-bold text-white uppercase tracking-wider mb-4">
              Legal & Support
            </h4>
            <ul className="space-y-2.5 text-xs">
              <li>
                <Link href="/terms" className="hover:text-emerald-400 transition-colors">
                  Platform Terms
                </Link>
              </li>
              <li>
                <Link href="/terms/provider" className="hover:text-emerald-400 transition-colors">
                  Provider Terms
                </Link>
              </li>
              <li>
                <Link href="/terms/platform" className="hover:text-emerald-400 transition-colors">
                  Privacy & Guidelines
                </Link>
              </li>
              <li>
                <Link href="/auth/signin" className="hover:text-emerald-400 transition-colors">
                  User Account Login
                </Link>
              </li>
            </ul>
          </div>

          {/* Col 4: Locations */}
          <div>
            <h4 className="text-sm font-bold text-white uppercase tracking-wider mb-4">
              Top Locations
            </h4>
            <div className="flex flex-wrap gap-1.5">
              {['Colombo', 'Kandy', 'Galle', 'Negombo', 'Jaffna', 'Kurunegala', 'Matara'].map(
                (cityName) => (
                  <button
                    key={cityName}
                    onClick={() => {
                      setCity(cityName);
                      window.scrollTo({ top: 400, behavior: 'smooth' });
                    }}
                    className="text-[11px] px-2.5 py-1 bg-slate-900 hover:bg-slate-800 text-slate-300 hover:text-emerald-400 rounded-lg border border-slate-800 transition-colors cursor-pointer"
                  >
                    {cityName}
                  </button>
                )
              )}
            </div>
          </div>
        </div>

        {/* Bottom copyright bar */}
        <div className="max-w-7xl mx-auto pt-8 border-t border-slate-900 flex flex-col sm:flex-row items-center justify-between text-xs text-slate-500 gap-4">
          <p>© {new Date().getFullYear()} RentHelper. All rights reserved.</p>
          <p className="flex items-center gap-1 text-slate-400 font-medium">
            <span>Powered by RentHelper Sri Lanka</span>
          </p>
        </div>
      </footer>
    </div>
  );
}
