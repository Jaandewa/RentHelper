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
  Heart,
  Star,
  X,
  CreditCard,
  ShoppingBag,
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
  RefreshCw,
} from 'lucide-react';
import {
  getAllProvinces,
  getDistrictsByProvince,
  getCitiesByDistrict,
  getAllCities,
} from '@/lib/location/sri-lanka';

// Curated Category configuration matching the reference image layout & pastel style
const CATEGORY_ITEMS = [
  {
    name: 'Electronics',
    slug: 'it-equipment',
    count: '120+',
    bgColor: 'bg-blue-50/90 dark:bg-blue-950/40 border-blue-100 dark:border-blue-900/40',
    iconColor: 'text-blue-600 dark:text-blue-400',
    imageUrl: 'https://images.unsplash.com/photo-1496181133206-80ce9b88a853?auto=format&fit=crop&w=300&q=80',
  },
  {
    name: 'Cameras',
    slug: 'camera-video',
    count: '85+',
    bgColor: 'bg-pink-50/90 dark:bg-pink-950/40 border-pink-100 dark:border-pink-900/40',
    iconColor: 'text-pink-600 dark:text-pink-400',
    imageUrl: 'https://images.unsplash.com/photo-1516035069371-29a1b244cc32?auto=format&fit=crop&w=300&q=80',
  },
  {
    name: 'Outdoor & Sports',
    slug: 'sports-outdoors',
    count: '65+',
    bgColor: 'bg-emerald-50/90 dark:bg-emerald-950/40 border-emerald-100 dark:border-emerald-900/40',
    iconColor: 'text-emerald-600 dark:text-emerald-400',
    imageUrl: 'https://images.unsplash.com/photo-1504280390367-361c6d9f38f4?auto=format&fit=crop&w=300&q=80',
  },
  {
    name: 'Vehicles',
    slug: 'vehicles',
    count: '45+',
    bgColor: 'bg-purple-50/90 dark:bg-purple-950/40 border-purple-100 dark:border-purple-900/40',
    iconColor: 'text-purple-600 dark:text-purple-400',
    imageUrl: 'https://images.unsplash.com/photo-1549399542-7e3f8b79c341?auto=format&fit=crop&w=300&q=80',
  },
  {
    name: 'Fashion',
    slug: 'clothing-bridal',
    count: '70+',
    bgColor: 'bg-amber-50/90 dark:bg-amber-950/40 border-amber-100 dark:border-amber-900/40',
    iconColor: 'text-amber-600 dark:text-amber-400',
    imageUrl: 'https://images.unsplash.com/photo-1515886657613-9f3515b0c78f?auto=format&fit=crop&w=300&q=80',
  },
  {
    name: 'Tools & Equipment',
    slug: 'tools-equipment',
    count: '50+',
    bgColor: 'bg-orange-50/90 dark:bg-orange-950/40 border-orange-100 dark:border-orange-900/40',
    iconColor: 'text-orange-600 dark:text-orange-400',
    imageUrl: 'https://images.unsplash.com/photo-1504148455328-c376907d081c?auto=format&fit=crop&w=300&q=80',
  },
  {
    name: 'Home Appliances',
    slug: 'furniture-appliances',
    count: '40+',
    bgColor: 'bg-sky-50/90 dark:bg-sky-950/40 border-sky-100 dark:border-sky-900/40',
    iconColor: 'text-sky-600 dark:text-sky-400',
    imageUrl: 'https://images.unsplash.com/photo-1584622650111-993a426fbf0a?auto=format&fit=crop&w=300&q=80',
  },
  {
    name: 'Party & Events',
    slug: 'party-events',
    count: '35+',
    bgColor: 'bg-rose-50/90 dark:bg-rose-950/40 border-rose-100 dark:border-rose-900/40',
    iconColor: 'text-rose-600 dark:text-rose-400',
    imageUrl: 'https://images.unsplash.com/photo-1511795409834-ef04bbd61622?auto=format&fit=crop&w=300&q=80',
  },
];

import { HeroSlideItem, DEFAULT_HERO_SLIDES } from '@/app/api/hero-slides/route';

export default function MarketplaceHomePage() {
  const [ads, setAds] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);

  // Slideshow State
  const [slides, setSlides] = useState<HeroSlideItem[]>(DEFAULT_HERO_SLIDES);
  const [currentSlideIndex, setCurrentSlideIndex] = useState(0);
  const [slideDuration, setSlideDuration] = useState(3);
  const [isHovered, setIsHovered] = useState(false);

  // Search & Filter State
  const [search, setSearch] = useState('');
  const [province, setProvince] = useState('');
  const [district, setDistrict] = useState('');
  const [city, setCity] = useState('');
  const [category, setCategory] = useState('');
  const [page, setPage] = useState(1);
  const [totalPages, setTotalPages] = useState(1);
  const [wishlist, setWishlist] = useState<Record<string, boolean>>({});

  // Fetch Hero Slides configuration
  useEffect(() => {
    fetch('/api/hero-slides')
      .then((r) => r.json())
      .then((d) => {
        if (d?.slides && Array.isArray(d.slides) && d.slides.length > 0) {
          setSlides(d.slides);
        }
        if (d?.duration) {
          setSlideDuration(d.duration);
        }
      })
      .catch(() => {});
  }, []);

  // Auto Slide Timer (3 seconds default or custom duration)
  useEffect(() => {
    if (slides.length <= 1 || isHovered) return;
    const interval = setInterval(() => {
      setCurrentSlideIndex((prev) => (prev + 1) % slides.length);
    }, (slideDuration || 3) * 1000);
    return () => clearInterval(interval);
  }, [slides.length, slideDuration, isHovered]);

  const currentSlide = slides[currentSlideIndex] || DEFAULT_HERO_SLIDES[0];

  const handlePrevSlide = () => {
    setCurrentSlideIndex((prev) => (prev === 0 ? slides.length - 1 : prev - 1));
  };

  const handleNextSlide = () => {
    setCurrentSlideIndex((prev) => (prev + 1) % slides.length);
  };

  // Location data
  const provinces = useMemo(() => getAllProvinces(), []);
  const availableDistricts = useMemo(
    () => (province ? getDistrictsByProvince(province) : []),
    [province]
  );
  const availableCities = useMemo(() => {
    if (district) return getCitiesByDistrict(district, province);
    if (province) {
      const dists = getDistrictsByProvince(province);
      return Array.from(
        new Set(dists.flatMap((d) => getCitiesByDistrict(d, province)))
      ).sort((a, b) => a.localeCompare(b));
    }
    return getAllCities();
  }, [province, district]);

  // Fetch Marketplace Ads from API
  const fetchAds = async () => {
    setLoading(true);
    try {
      const params = new URLSearchParams();
      if (search.trim()) params.append('search', search.trim());
      if (city) {
        params.append('city', city);
      } else if (district) {
        params.append('city', district);
      } else if (province) {
        params.append('city', province);
      }
      if (category) params.append('category', category);
      params.append('page', page.toString());
      params.append('limit', '10');

      const res = await fetch(`/api/marketplace/ads?${params.toString()}`);
      const data = await res.json();
      setAds(data.ads || []);
      setTotalPages(data.pagination?.totalPages || 1);
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

  const toggleWishlist = (id: string, e: React.MouseEvent) => {
    e.preventDefault();
    e.stopPropagation();
    setWishlist((prev) => ({ ...prev, [id]: !prev[id] }));
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
    <div className="min-h-screen bg-slate-50 dark:bg-slate-950 text-slate-900 dark:text-slate-100 flex flex-col font-sans transition-colors selection:bg-teal-500 selection:text-white">
      <Header />

      <main className="flex-1 py-6 sm:py-8">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          {/* ─────────────────────────────────────────────────────────────
              1. HERO SECTION (Matching Reference Image Vibe & Layout)
          ───────────────────────────────────────────────────────────── */}
          <section
            onMouseEnter={() => setIsHovered(true)}
            onMouseLeave={() => setIsHovered(false)}
            className="relative rounded-[2.5rem] overflow-hidden shadow-2xl mb-12 border border-slate-200/50 dark:border-slate-800 transition-all duration-700"
          >
            {/* Background Image Slideshow with smooth transition */}
            <div
              key={currentSlide.id}
              className="absolute inset-0 bg-cover bg-center transition-all duration-1000 scale-105 animate-fade-in"
              style={{
                backgroundImage: `url('${currentSlide.imageUrl}')`,
              }}
            />

            {/* Dark Scenic Overlay */}
            <div className="absolute inset-0 bg-gradient-to-r from-slate-950/90 via-slate-950/70 to-slate-950/30 dark:from-slate-950/95 dark:via-slate-950/80 dark:to-slate-950/50" />

            {/* Previous Slide Arrow */}
            {slides.length > 1 && (
              <button
                onClick={handlePrevSlide}
                className="absolute left-4 top-1/2 -translate-y-1/2 z-20 w-11 h-11 rounded-full bg-slate-950/40 hover:bg-slate-950/80 text-white backdrop-blur-md border border-white/20 flex items-center justify-center transition-all hover:scale-110 active:scale-95 shadow-lg"
                aria-label="Previous Slide"
              >
                <ChevronLeft className="w-6 h-6" />
              </button>
            )}

            {/* Next Slide Arrow */}
            {slides.length > 1 && (
              <button
                onClick={handleNextSlide}
                className="absolute right-4 top-1/2 -translate-y-1/2 z-20 w-11 h-11 rounded-full bg-slate-950/40 hover:bg-slate-950/80 text-white backdrop-blur-md border border-white/20 flex items-center justify-center transition-all hover:scale-110 active:scale-95 shadow-lg"
                aria-label="Next Slide"
              >
                <ChevronRight className="w-6 h-6" />
              </button>
            )}

            <div className="relative z-10 px-6 sm:px-12 lg:px-16 pt-12 sm:pt-16 pb-20 sm:pb-24 flex flex-col justify-between min-h-[480px]">
              <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-6">
                <div className="max-w-2xl">
                  {/* Top Green Pill Badge */}
                  <div className="inline-flex items-center gap-2 px-4 py-1.5 rounded-full text-xs font-bold uppercase tracking-wider bg-teal-500 text-white shadow-lg backdrop-blur-md mb-6">
                    <Sparkles className="w-3.5 h-3.5" />
                    <span>{currentSlide.badgeText || 'Rent Anything, Anywhere'}</span>
                  </div>

                  {/* Headline */}
                  <h1 className="text-4xl sm:text-6xl font-black text-white tracking-tight leading-[1.15]">
                    {currentSlide.title}{' '}
                    <span className="block text-teal-400 dark:text-teal-300 font-extrabold mt-1 drop-shadow-md">
                      {currentSlide.highlightText}
                    </span>
                  </h1>

                  {/* Subtitle */}
                  <p className="mt-4 text-base sm:text-lg text-slate-200 font-medium leading-relaxed max-w-xl">
                    {currentSlide.subtitle}
                  </p>

                  {/* Slide CTA Button (if custom CTA link present) */}
                  {currentSlide.ctaLink && currentSlide.ctaLink !== '#search' && (
                    <div className="mt-6">
                      <Link
                        href={currentSlide.ctaLink}
                        className="inline-flex items-center gap-2 px-6 py-3 rounded-full bg-white/10 hover:bg-white/20 text-white font-bold backdrop-blur-md border border-white/30 transition-all shadow-lg hover:scale-105 active:scale-95"
                      >
                        <span>{currentSlide.ctaText || 'Explore Category →'}</span>
                      </Link>
                    </div>
                  )}
                </div>

                {/* Handwritten Doodle Graphic Annotation */}
                <div className="hidden lg:flex flex-col items-center rotate-6 text-amber-300 font-semibold tracking-wide drop-shadow-lg select-none">
                  <span className="text-xl font-bold italic border-b-2 border-dashed border-amber-300/60 pb-1">
                    {currentSlide.doodleTop || 'More Choices ✨'}
                  </span>
                  <span className="text-2xl font-black text-white">
                    {currentSlide.doodleBottom || 'Less Cost!'}
                  </span>
                </div>
              </div>

              {/* Floating White Search Card & Slide Pagination Dots */}
              <div className="mt-10">
                <div id="search" className="bg-white dark:bg-slate-900 rounded-full sm:rounded-full p-2 sm:p-3 shadow-2xl border border-slate-100 dark:border-slate-800 text-slate-900 dark:text-white backdrop-blur-xl">
                  <div className="flex flex-col md:flex-row items-center justify-between gap-2 px-2">
                    {/* Search Input */}
                    <div className="flex-1 flex items-center gap-3 px-4 py-2.5 w-full">
                      <Search className="w-5 h-5 text-slate-400 shrink-0" />
                      <input
                        type="text"
                        placeholder="What are you looking for?"
                        className="w-full bg-transparent text-sm font-medium focus:outline-none placeholder:text-slate-400 text-slate-900 dark:text-white"
                        value={search}
                        onChange={(e) => {
                          setSearch(e.target.value);
                          setPage(1);
                        }}
                      />
                    </div>

                    {/* Vertical Divider */}
                    <div className="hidden md:block w-px h-8 bg-slate-200 dark:bg-slate-800" />

                    {/* Cascading Location Selectors */}
                    <div className="flex items-center gap-2 px-3 py-2 w-full md:w-auto">
                      <MapPin className="w-4 h-4 text-slate-400 shrink-0" />
                      <select
                        className="bg-transparent text-sm font-semibold focus:outline-none cursor-pointer text-slate-700 dark:text-slate-200 max-w-[140px] truncate"
                        value={province}
                        onChange={(e) => {
                          setProvince(e.target.value);
                          setDistrict('');
                          setCity('');
                          setPage(1);
                        }}
                      >
                        <option value="" className="text-slate-900 dark:text-white">All Provinces</option>
                        {provinces.map((p) => (
                          <option key={p} value={p} className="text-slate-900 dark:text-white">
                            {p}
                          </option>
                        ))}
                      </select>

                      <select
                        className="bg-transparent text-sm font-semibold focus:outline-none cursor-pointer text-slate-700 dark:text-slate-200 max-w-[140px] truncate"
                        value={city}
                        onChange={(e) => {
                          setCity(e.target.value);
                          setPage(1);
                        }}
                      >
                        <option value="" className="text-slate-900 dark:text-white">All Cities</option>
                        {availableCities.map((c) => (
                          <option key={c} value={c} className="text-slate-900 dark:text-white">
                            {c}
                          </option>
                        ))}
                      </select>
                    </div>

                    {/* Search Action Button */}
                    <button
                      onClick={() => {
                        setPage(1);
                        fetchAds();
                      }}
                      className="w-full md:w-auto bg-teal-600 hover:bg-teal-700 text-white font-bold px-8 py-3 rounded-full shadow-lg hover:shadow-teal-600/30 transition-all cursor-pointer flex items-center justify-center gap-2 hover:scale-[1.02] active:scale-95"
                    >
                      <span>Search</span>
                    </button>
                  </div>
                </div>

                {/* Slideshow Dots Pagination */}
                {slides.length > 1 && (
                  <div className="flex items-center justify-center gap-2 mt-4">
                    {slides.map((s, idx) => (
                      <button
                        key={s.id}
                        onClick={() => setCurrentSlideIndex(idx)}
                        className={`h-2.5 rounded-full transition-all cursor-pointer ${
                          idx === currentSlideIndex
                            ? 'w-8 bg-teal-400 shadow-md scale-110'
                            : 'w-2.5 bg-white/40 hover:bg-white/70'
                        }`}
                        aria-label={`Go to slide ${idx + 1}`}
                      />
                    ))}
                  </div>
                )}
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
                <p className="text-xs sm:text-sm text-slate-500 dark:text-slate-400 mt-0.5">
                  Find the perfect item for your needs
                </p>
              </div>

              <Link
                href="/#browse"
                className="text-sm font-bold text-teal-600 dark:text-teal-400 hover:underline flex items-center gap-1 group"
              >
                <span>View All</span>
                <ArrowRight className="w-4 h-4 group-hover:translate-x-1 transition-transform" />
              </Link>
            </div>

            {/* Category Cards Grid */}
            <div className="grid grid-cols-2 sm:grid-cols-4 lg:grid-cols-8 gap-3.5">
              {CATEGORY_ITEMS.map((cat) => {
                const isSelected = category === cat.slug;
                return (
                  <button
                    key={cat.name}
                    onClick={() => {
                      setCategory(isSelected ? '' : cat.slug);
                      setPage(1);
                    }}
                    className={`p-3.5 rounded-2xl border text-center transition-all duration-300 flex flex-col items-center justify-between group cursor-pointer ${
                      isSelected
                        ? 'bg-teal-500 text-white border-teal-600 shadow-lg scale-105 ring-2 ring-teal-500/30'
                        : `${cat.bgColor} hover:shadow-md hover:-translate-y-1.5`
                    }`}
                  >
                    {/* Category Image Box */}
                    <div className="w-14 h-14 rounded-xl overflow-hidden mb-2 shadow-xs group-hover:scale-105 transition-transform bg-white dark:bg-slate-800 p-1 flex items-center justify-center">
                      <img
                        src={cat.imageUrl}
                        alt={cat.name}
                        className="w-full h-full object-cover rounded-lg"
                      />
                    </div>

                    <div>
                      <h3
                        className={`text-xs font-bold line-clamp-1 ${
                          isSelected ? 'text-white' : 'text-slate-900 dark:text-white'
                        }`}
                      >
                        {cat.name}
                      </h3>
                      <p
                        className={`text-[10px] font-semibold mt-0.5 ${
                          isSelected ? 'text-teal-100' : 'text-slate-500 dark:text-slate-400'
                        }`}
                      >
                        ({cat.count})
                      </p>
                    </div>
                  </button>
                );
              })}
            </div>
          </section>

          {/* ─────────────────────────────────────────────────────────────
              3. POPULAR ITEMS FOR RENT SECTION
          ───────────────────────────────────────────────────────────── */}
          <section id="browse" className="mb-16 scroll-mt-24">
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 mb-6">
              <div>
                <h2 className="text-2xl sm:text-3xl font-extrabold text-slate-900 dark:text-white tracking-tight">
                  Popular Items for Rent
                </h2>
                <p className="text-xs sm:text-sm text-slate-500 dark:text-slate-400 mt-0.5">
                  Discover top-rated and most rented items in your area
                </p>
              </div>

              <div className="flex items-center gap-3">
                {hasActiveFilters && (
                  <button
                    onClick={clearAllFilters}
                    className="text-xs font-bold text-rose-600 dark:text-rose-400 hover:underline flex items-center gap-1 cursor-pointer"
                  >
                    <RefreshCw className="w-3 h-3" />
                    Reset Filters
                  </button>
                )}
                <Link
                  href="/#browse"
                  className="text-sm font-bold text-teal-600 dark:text-teal-400 hover:underline flex items-center gap-1 group"
                >
                  <span>View All</span>
                  <ArrowRight className="w-4 h-4 group-hover:translate-x-1 transition-transform" />
                </Link>
              </div>
            </div>

            {/* Ads Cards Grid */}
            {loading ? (
              <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-5 gap-5">
                {[...Array(5)].map((_, i) => (
                  <div
                    key={i}
                    className="bg-white dark:bg-slate-900 rounded-2xl h-80 animate-pulse border border-slate-100 dark:border-slate-800 shadow-xs"
                  />
                ))}
              </div>
            ) : ads.length > 0 ? (
              <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-5 gap-5">
                {ads.map((ad: any, idx: number) => {
                  const badgeType =
                    idx % 3 === 0 ? 'Featured' : idx % 3 === 1 ? 'Bestseller' : 'Popular';
                  const badgeColor =
                    badgeType === 'Featured'
                      ? 'bg-teal-600 text-white'
                      : badgeType === 'Bestseller'
                      ? 'bg-amber-500 text-white'
                      : 'bg-purple-600 text-white';

                  const isWishlisted = Boolean(wishlist[ad.id]);

                  return (
                    <Link
                      href={`/marketplace/${ad.id}`}
                      key={ad.id}
                      className="group block h-full"
                    >
                      <div className="bg-white dark:bg-slate-900 rounded-2xl shadow-sm hover:shadow-xl transition-all duration-300 border border-slate-200/80 dark:border-slate-800 overflow-hidden flex flex-col h-full hover:-translate-y-1.5">
                        {/* Top Image Box */}
                        <div className="relative h-48 bg-slate-100 dark:bg-slate-800 overflow-hidden">
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

                          {/* Left Badge */}
                          <div className="absolute top-2.5 left-2.5">
                            <span
                              className={`text-[10px] font-bold px-2.5 py-0.5 rounded-full shadow-md ${badgeColor}`}
                            >
                              {badgeType}
                            </span>
                          </div>

                          {/* Heart Wishlist Icon */}
                          <button
                            onClick={(e) => toggleWishlist(ad.id, e)}
                            className="absolute top-2.5 right-2.5 p-1.5 bg-white/90 dark:bg-slate-900/90 rounded-full shadow-md text-slate-400 hover:text-rose-500 transition-colors cursor-pointer"
                            aria-label="Favorite"
                          >
                            <Heart
                              className={`w-3.5 h-3.5 ${
                                isWishlisted ? 'fill-rose-500 text-rose-500' : ''
                              }`}
                            />
                          </button>
                        </div>

                        {/* Card Body */}
                        <div className="p-4 flex-1 flex flex-col justify-between">
                          <div>
                            <h3 className="text-sm font-extrabold text-slate-900 dark:text-white line-clamp-1 group-hover:text-teal-600 dark:group-hover:text-teal-400 transition-colors">
                              {ad.title}
                            </h3>

                            {/* Price */}
                            <p className="text-sm font-black text-slate-900 dark:text-white mt-1">
                              LKR {(ad.dailyPrice || ad.hourlyPrice || 0).toLocaleString()}
                              <span className="text-xs font-normal text-slate-500 dark:text-slate-400">
                                {' '}
                                / day
                              </span>
                            </p>

                            {/* Rating & Reviews */}
                            <div className="flex items-center gap-1 mt-1 text-[11px] font-semibold text-slate-600 dark:text-slate-400">
                              <Star className="w-3.5 h-3.5 fill-amber-400 text-amber-400" />
                              <span className="text-slate-900 dark:text-white font-bold">
                                4.8
                              </span>
                              <span>(18 reviews)</span>
                            </div>

                            {/* Location */}
                            <div className="flex items-center gap-1 text-[11px] text-slate-500 dark:text-slate-400 mt-1">
                              <MapPin className="w-3 h-3 text-slate-400 shrink-0" />
                              <span className="truncate">{ad.city || 'Colombo'}</span>
                            </div>
                          </div>

                          {/* Rent Now Solid Button */}
                          <div className="mt-4 pt-2">
                            <div className="w-full py-2.5 bg-teal-600 hover:bg-teal-700 text-white font-bold text-xs rounded-full text-center shadow-md transition-all group-hover:scale-[1.02]">
                              Rent Now
                            </div>
                          </div>
                        </div>
                      </div>
                    </Link>
                  );
                })}
              </div>
            ) : (
              /* Polished Empty State */
              <div className="text-center py-14 px-6 bg-white dark:bg-slate-900 rounded-3xl border border-slate-200/80 dark:border-slate-800 shadow-sm max-w-xl mx-auto">
                <div className="w-14 h-14 bg-teal-50 dark:bg-teal-950 text-teal-600 dark:text-teal-400 rounded-2xl flex items-center justify-center mx-auto mb-3 border border-teal-200 dark:border-teal-800">
                  <Search className="w-7 h-7" />
                </div>
                <h3 className="text-lg font-bold text-slate-900 dark:text-white">
                  No Rental Listings Found
                </h3>
                <p className="mt-1 text-xs text-slate-500 dark:text-slate-400">
                  Try clearing your search query or selecting a different city or category.
                </p>
                {hasActiveFilters && (
                  <button
                    onClick={clearAllFilters}
                    className="mt-5 inline-flex items-center gap-2 px-4 py-2 rounded-full font-bold text-xs text-white bg-teal-600 hover:bg-teal-700 shadow-md transition-all cursor-pointer"
                  >
                    <RefreshCw className="w-3.5 h-3.5" />
                    <span>Reset All Filters</span>
                  </button>
                )}
              </div>
            )}

            {/* Pagination Controls */}
            {totalPages > 1 && (
              <div className="mt-10 flex justify-center items-center space-x-3">
                <button
                  onClick={() => setPage((p) => Math.max(1, p - 1))}
                  disabled={page === 1}
                  className="p-2.5 rounded-full border border-slate-300 dark:border-slate-700 bg-white dark:bg-slate-900 text-slate-700 dark:text-slate-200 disabled:opacity-40 hover:bg-slate-100 dark:hover:bg-slate-800 transition cursor-pointer"
                  aria-label="Previous page"
                >
                  <ChevronLeft className="w-5 h-5" />
                </button>
                <span className="text-xs font-bold text-slate-700 dark:text-slate-300 px-2">
                  Page {page} of {totalPages}
                </span>
                <button
                  onClick={() => setPage((p) => Math.min(totalPages, p + 1))}
                  disabled={page === totalPages}
                  className="p-2.5 rounded-full border border-slate-300 dark:border-slate-700 bg-white dark:bg-slate-900 text-slate-700 dark:text-slate-200 disabled:opacity-40 hover:bg-slate-100 dark:hover:bg-slate-800 transition cursor-pointer"
                  aria-label="Next page"
                >
                  <ChevronRight className="w-5 h-5" />
                </button>
              </div>
            )}
          </section>

          {/* ─────────────────────────────────────────────────────────────
              4. HOW IT WORKS SECTION (Matching Soft Mint Card Style)
          ───────────────────────────────────────────────────────────── */}
          <section id="how-it-works" className="mb-16 scroll-mt-24">
            <div className="bg-[#EBF7F4] dark:bg-teal-950/40 rounded-3xl p-8 sm:p-12 border border-teal-100 dark:border-teal-900/50">
              <div className="flex flex-col md:flex-row md:items-center justify-between gap-6 mb-10">
                <div>
                  <h2 className="text-2xl sm:text-3xl font-extrabold text-slate-900 dark:text-white tracking-tight">
                    How It Works
                  </h2>
                  <p className="text-xs sm:text-sm text-slate-600 dark:text-slate-400 mt-1">
                    Renting is simple, safe and fast!
                  </p>
                </div>
              </div>

              {/* 4 Process Steps */}
              <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6 items-center">
                {/* Step 1 */}
                <div className="flex flex-col items-center text-center group">
                  <div className="w-14 h-14 rounded-full bg-teal-100 dark:bg-teal-900/60 text-teal-700 dark:text-teal-300 flex items-center justify-center mb-3 group-hover:scale-110 transition-transform">
                    <Search className="w-6 h-6" />
                  </div>
                  <h3 className="text-sm font-bold text-slate-900 dark:text-white">
                    1. Search
                  </h3>
                  <p className="text-xs text-slate-600 dark:text-slate-400 mt-1 max-w-[200px]">
                    Find the item you need from our marketplace.
                  </p>
                </div>

                {/* Step 2 */}
                <div className="flex flex-col items-center text-center group">
                  <div className="w-14 h-14 rounded-full bg-teal-100 dark:bg-teal-900/60 text-teal-700 dark:text-teal-300 flex items-center justify-center mb-3 group-hover:scale-110 transition-transform">
                    <Calendar className="w-6 h-6" />
                  </div>
                  <h3 className="text-sm font-bold text-slate-900 dark:text-white">
                    2. Book
                  </h3>
                  <p className="text-xs text-slate-600 dark:text-slate-400 mt-1 max-w-[200px]">
                    Choose your dates and make a reservation.
                  </p>
                </div>

                {/* Step 3 */}
                <div className="flex flex-col items-center text-center group">
                  <div className="w-14 h-14 rounded-full bg-teal-100 dark:bg-teal-900/60 text-teal-700 dark:text-teal-300 flex items-center justify-center mb-3 group-hover:scale-110 transition-transform">
                    <ShieldCheck className="w-6 h-6" />
                  </div>
                  <h3 className="text-sm font-bold text-slate-900 dark:text-white">
                    3. Pay Securely
                  </h3>
                  <p className="text-xs text-slate-600 dark:text-slate-400 mt-1 max-w-[200px]">
                    Complete the payment using our secure system.
                  </p>
                </div>

                {/* Step 4 */}
                <div className="flex flex-col items-center text-center group">
                  <div className="w-14 h-14 rounded-full bg-teal-100 dark:bg-teal-900/60 text-teal-700 dark:text-teal-300 flex items-center justify-center mb-3 group-hover:scale-110 transition-transform">
                    <Package className="w-6 h-6" />
                  </div>
                  <h3 className="text-sm font-bold text-slate-900 dark:text-white">
                    4. Pick Up & Enjoy
                  </h3>
                  <p className="text-xs text-slate-600 dark:text-slate-400 mt-1 max-w-[200px]">
                    Get the item and start using it!
                  </p>
                </div>
              </div>
            </div>
          </section>
        </div>
      </main>

      {/* ─────────────────────────────────────────────────────────────
          5. FOOTER (Matching Dark Sleek Footer Style)
      ───────────────────────────────────────────────────────────── */}
      <footer className="bg-[#0B132B] text-slate-300 py-12 px-4 sm:px-6 lg:px-8 border-t border-slate-800">
        <div className="max-w-7xl mx-auto flex flex-col md:flex-row items-center justify-between gap-6 pb-8 border-b border-slate-800">
          {/* Logo */}
          <Link href="/" className="flex items-center gap-2.5">
            <div className="w-9 h-9 bg-teal-500 rounded-xl flex items-center justify-center text-white font-black text-lg shadow-md">
              R
            </div>
            <div className="flex flex-col">
              <span className="text-lg font-black text-white tracking-tight">
                RentHelper
              </span>
              <span className="text-[9px] text-teal-400 uppercase tracking-widest font-semibold -mt-1">
                Rent • Use • Enjoy
              </span>
            </div>
          </Link>

          {/* Links */}
          <div className="flex flex-wrap items-center justify-center gap-6 text-xs font-semibold text-slate-400">
            <Link href="/" className="hover:text-teal-400 transition-colors">
              Home
            </Link>
            <Link href="/#browse" className="hover:text-teal-400 transition-colors">
              Browse Items
            </Link>
            <Link href="/#how-it-works" className="hover:text-teal-400 transition-colors">
              How It Works
            </Link>
            <Link href="/terms" className="hover:text-teal-400 transition-colors">
              About
            </Link>
            <Link href="/terms/platform" className="hover:text-teal-400 transition-colors">
              Contact
            </Link>
          </div>
        </div>

        {/* Bottom copyright line */}
        <div className="max-w-7xl mx-auto pt-6 flex flex-col sm:flex-row items-center justify-between text-xs text-slate-500 gap-4">
          <p>© {new Date().getFullYear()} RentHelper. All rights reserved.</p>
          <p className="text-slate-400 font-medium">
            Smart Rental Marketplace Sri Lanka
          </p>
        </div>
      </footer>
    </div>
  );
}
