'use client';

import { useState, useEffect } from 'react';
import { useParams } from 'next/navigation';
import { MapPin, Shield, ChevronLeft, ChevronRight, Layers, Phone } from 'lucide-react';
import Link from 'next/link';
import { getBookingEligibility } from '@/lib/auth/customerAccess';

export default function AdDetailPage() {
  const { adId } = useParams();
  const [ad, setAd] = useState<any>(null);
  const [loading, setLoading] = useState(true);
  const [session, setSession] = useState<any>(null); 
  const [customerProfile, setCustomerProfile] = useState<any>(null);
  const [activeImage, setActiveImage] = useState('');
  const [failedImages, setFailedImages] = useState<Set<string>>(new Set());

  useEffect(() => {
    fetch('/api/auth/session')
      .then(res => res.json())
      .then(data => {
        setSession(data);
        if (data?.user?.role === 'customer') {
          fetch('/api/auth/me')
            .then(res => res.json())
            .then(meData => {
              if (meData?.user?.customerProfile) {
                setCustomerProfile(meData.user.customerProfile);
              }
            })
            .catch(() => {});
        }
      })
      .catch(() => {});

    fetch(`/api/marketplace/ads/${adId}`)
      .then(res => res.json())
      .then(data => {
        setAd(data);
        setActiveImage(data.coverImageUrl || data.item?.itemImages?.[0]?.url);
        setLoading(false);
      })
      .catch(err => {
        console.error(err);
        setLoading(false);
      });
  }, [adId]);

  if (loading) return <div className="min-h-screen flex items-center justify-center">Loading...</div>;
  if (!ad || ad.error) return <div className="min-h-screen flex items-center justify-center">Ad not found</div>;

  const allImages = [
    ...(ad.coverImageUrl ? [ad.coverImageUrl] : []),
    ...(Array.isArray(ad.galleryImages) ? ad.galleryImages : []),
    ...(ad.item?.itemImages?.map((img: any) => img.url).filter(Boolean) || [])
  ].filter((v, i, a) => typeof v === 'string' && v.trim() && a.indexOf(v) === i);

  const validImages = allImages.filter(img => !failedImages.has(img));

  const eligibility = getBookingEligibility(session, customerProfile);

  const categoryData = ad.item?.categoryData && typeof ad.item.categoryData === 'object' ? ad.item.categoryData : {};

  return (
    <div className="min-h-screen bg-gray-50 py-8">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <Link href="/marketplace" className="inline-flex items-center text-sm font-medium text-blue-600 hover:text-blue-500 mb-6">
          <ChevronLeft className="h-4 w-4 mr-1" />
          Back to Marketplace
        </Link>

        <div className="bg-white rounded-2xl shadow-lg overflow-hidden">
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-0">
            {/* Image Gallery */}
            <div className="p-6 bg-gray-100 flex flex-col relative group">
              <div className="aspect-w-4 aspect-h-3 rounded-xl overflow-hidden bg-white mb-4 shadow-sm border border-gray-200 min-h-[320px] flex items-center justify-center relative">
                {activeImage && !failedImages.has(activeImage) ? (
                  <>
                    <img 
                      src={activeImage} 
                      alt={ad.title} 
                      className="w-full h-full object-contain max-h-[420px]" 
                      onError={() => setFailedImages(prev => { const n = new Set(prev); n.add(activeImage); return n; })}
                    />
                    {validImages.length > 1 && (
                      <>
                        <button
                          onClick={() => {
                            const idx = validImages.indexOf(activeImage);
                            const prevIdx = (idx - 1 + validImages.length) % validImages.length;
                            setActiveImage(validImages[prevIdx]);
                          }}
                          className="absolute left-2 top-1/2 -translate-y-1/2 bg-white/80 hover:bg-white p-2 rounded-full shadow-md text-gray-800 opacity-0 group-hover:opacity-100 transition-opacity"
                        >
                          <ChevronLeft className="w-5 h-5" />
                        </button>
                        <button
                          onClick={() => {
                            const idx = validImages.indexOf(activeImage);
                            const nextIdx = (idx + 1) % validImages.length;
                            setActiveImage(validImages[nextIdx]);
                          }}
                          className="absolute right-2 top-1/2 -translate-y-1/2 bg-white/80 hover:bg-white p-2 rounded-full shadow-md text-gray-800 opacity-0 group-hover:opacity-100 transition-opacity"
                        >
                          <ChevronRight className="w-5 h-5" />
                        </button>
                      </>
                    )}
                  </>
                ) : (
                  <div className="w-full h-full flex items-center justify-center text-gray-400">No image available</div>
                )}
              </div>
              
              {validImages.length > 0 && (
                <div className="flex gap-2 overflow-x-auto pb-2 scrollbar-thin scrollbar-thumb-gray-300">
                  {validImages.map((img: string, idx: number) => (
                    <button 
                      key={idx} 
                      onClick={() => setActiveImage(img)}
                      className={`flex-shrink-0 w-20 h-20 rounded-lg overflow-hidden border-2 transition-all ${activeImage === img ? 'border-blue-500 shadow-sm' : 'border-transparent opacity-70 hover:opacity-100'}`}
                    >
                      <img 
                        src={img} 
                        alt={`Thumbnail ${idx + 1}`} 
                        className="w-full h-full object-cover" 
                        onError={() => setFailedImages(prev => { const n = new Set(prev); n.add(img); return n; })}
                      />
                    </button>
                  ))}
                </div>
              )}
            </div>

            {/* Details */}
            <div className="p-8 lg:p-10 flex flex-col">
              <div className="flex justify-between items-start">
                <div>
                  <h1 className="text-3xl font-bold text-gray-900 mb-2">{ad.title}</h1>
                  <div className="flex items-center text-gray-500 mb-6">
                    <MapPin className="h-5 w-5 mr-1" />
                    <span>{ad.city || ad.business?.city || 'Location'}</span>
                    <span className="mx-2">•</span>
                    <span className="bg-blue-100 text-blue-800 text-xs px-2.5 py-1 rounded-full font-semibold">
                      {ad.item?.category?.icon || '📦'} {ad.item?.category?.name || 'Category'}
                    </span>
                  </div>
                </div>
              </div>

              <div className="prose prose-blue text-gray-600 mb-6 max-w-none">
                <p>{ad.description}</p>
              </div>

              {/* Public Category Specifications */}
              {Object.keys(categoryData).length > 0 && (
                <div className="mb-6 bg-slate-50 rounded-xl border border-slate-200 p-4 space-y-3">
                  <h3 className="text-xs font-bold text-slate-900 uppercase tracking-wider flex items-center gap-1.5">
                    <Layers className="w-4 h-4 text-blue-600" /> Specifications & Features
                  </h3>
                  <div className="grid grid-cols-2 gap-3 text-xs">
                    {Object.entries(categoryData).map(([key, value]) => {
                      if (value === undefined || value === null || value === '') return null
                      const label = key.replace(/([A-Z])/g, ' $1').replace(/^./, str => str.toUpperCase())

                      return (
                        <div key={key} className="bg-white p-2.5 rounded-lg border border-slate-200/80">
                          <span className="text-[11px] font-semibold text-slate-500 block mb-0.5">{label}</span>
                          <span className="font-semibold text-slate-900">
                            {typeof value === 'boolean' ? (value ? 'Yes ✓' : 'No') : Array.isArray(value) ? value.join(', ') : String(value)}
                          </span>
                        </div>
                      )
                    })}
                  </div>
                </div>
              )}

              {/* Pricing Cards */}
              <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-6">
                {ad.hourlyPrice && (
                  <div className="bg-gray-50 rounded-xl p-4 text-center border border-gray-100">
                    <p className="text-xs text-gray-500 uppercase tracking-wide font-semibold mb-1">Hourly</p>
                    <p className="text-2xl font-bold text-gray-900">Rs. {ad.hourlyPrice.toLocaleString()}</p>
                  </div>
                )}
                {ad.dailyPrice && (
                  <div className="bg-blue-50 rounded-xl p-4 text-center border border-blue-100 shadow-xs relative overflow-hidden">
                    <div className="absolute top-0 right-0 bg-blue-500 text-white text-[10px] px-2 py-0.5 rounded-bl-lg font-bold">POPULAR</div>
                    <p className="text-xs text-blue-600 uppercase tracking-wide font-semibold mb-1">Daily</p>
                    <p className="text-2xl font-bold text-blue-900">Rs. {ad.dailyPrice.toLocaleString()}</p>
                  </div>
                )}
                {ad.weeklyPrice && (
                  <div className="bg-gray-50 rounded-xl p-4 text-center border border-gray-100">
                    <p className="text-xs text-gray-500 uppercase tracking-wide font-semibold mb-1">Weekly</p>
                    <p className="text-2xl font-bold text-gray-900">Rs. {ad.weeklyPrice.toLocaleString()}</p>
                  </div>
                )}
                {ad.monthlyPrice && (
                  <div className="bg-gray-50 rounded-xl p-4 text-center border border-gray-100">
                    <p className="text-xs text-gray-500 uppercase tracking-wide font-semibold mb-1">Monthly</p>
                    <p className="text-2xl font-bold text-gray-900">Rs. {ad.monthlyPrice.toLocaleString()}</p>
                  </div>
                )}
              </div>

              {/* Security Deposit */}
              {ad.securityDeposit > 0 && (
                <div className="flex items-center text-sm text-gray-600 bg-orange-50 p-3 rounded-lg border border-orange-100 mb-6">
                  <Shield className="h-5 w-5 text-orange-500 mr-2 shrink-0" />
                  <span>Requires a refundable security deposit of <strong>Rs. {ad.securityDeposit.toLocaleString()}</strong></span>
                </div>
              )}

              {/* Provider Info */}
              <div className="mt-auto border-t border-gray-100 pt-6">
                <div className="flex items-center justify-between">
                  <div className="flex items-center">
                    <div className="h-12 w-12 rounded-full bg-gray-200 overflow-hidden mr-4 shadow-xs border border-gray-200">
                      {ad.business?.logo && <img src={ad.business.logo} alt={ad.business.name} className="w-full h-full object-cover" />}
                    </div>
                    <div>
                      <p className="text-xs text-gray-500">Provided by</p>
                      <p className="text-base font-bold text-gray-900">{ad.business?.name}</p>
                    </div>
                  </div>
                  
                  {/* Action Button */}
                  <div className="flex flex-col items-end gap-3">
                    {eligibility.canBook ? (
                      <Link 
                        href={`/marketplace/${ad.id}/book`}
                        className={`inline-block px-6 py-3 rounded-xl font-medium transition-colors shadow-md text-sm text-white ${eligibility.buttonStyle}`}
                      >
                        {eligibility.buttonText}
                      </Link>
                    ) : eligibility.linkTo ? (
                      <Link 
                        href={eligibility.linkTo} 
                        className={`inline-block px-6 py-3 rounded-xl font-medium transition-colors shadow-md text-sm text-white ${eligibility.buttonStyle}`}
                      >
                        {eligibility.buttonText}
                      </Link>
                    ) : (
                      eligibility.buttonText && (
                        <button disabled className={`px-6 py-3 rounded-xl font-medium shadow-md text-sm text-white ${eligibility.buttonStyle}`}>
                          {eligibility.buttonText}
                        </button>
                      )
                    )}

                    {/* Contact Provider */}
                    {ad.business?.phone && (
                      <div className="flex items-center gap-3 mt-1 text-sm">
                        <a 
                          href={`tel:${ad.business.phone}`}
                          className="flex items-center text-gray-600 hover:text-blue-600 font-medium transition-colors"
                        >
                          <Phone className="w-4 h-4 mr-1" /> Call
                        </a>
                        <span className="text-gray-300">|</span>
                        <a 
                          href={`https://wa.me/94${ad.business.phone.replace(/^0/, '')}`}
                          target="_blank"
                          rel="noopener noreferrer"
                          className="flex items-center text-green-600 hover:text-green-700 font-medium transition-colors"
                        >
                          <svg className="w-4 h-4 mr-1" viewBox="0 0 24 24" fill="currentColor">
                            <path d="M17.472 14.382c-.297-.149-1.758-.867-2.03-.967-.273-.099-.471-.148-.67.15-.197.297-.767.966-.94 1.164-.173.199-.347.223-.644.075-.297-.15-1.255-.463-2.39-1.475-.883-.788-1.48-1.761-1.653-2.059-.173-.297-.018-.458.13-.606.134-.133.298-.347.446-.52.149-.174.198-.298.298-.497.099-.198.05-.371-.025-.52-.075-.149-.669-1.612-.916-2.207-.242-.579-.487-.5-.669-.51-.173-.008-.371-.01-.57-.01-.198 0-.52.074-.792.372-.272.297-1.04 1.016-1.04 2.479 0 1.462 1.065 2.875 1.213 3.074.149.198 2.096 3.2 5.077 4.487.709.306 1.262.489 1.694.625.712.227 1.36.195 1.871.118.571-.085 1.758-.719 2.006-1.413.248-.694.248-1.289.173-1.413-.074-.124-.272-.198-.57-.347m-5.421 7.403h-.004a9.87 9.87 0 01-5.031-1.378l-.361-.214-3.741.982.998-3.648-.235-.374a9.86 9.86 0 01-1.51-5.26c.001-5.45 4.436-9.884 9.888-9.884 2.64 0 5.122 1.03 6.988 2.898a9.825 9.825 0 012.893 6.994c-.003 5.45-4.437 9.884-9.885 9.884m8.413-18.297A11.815 11.815 0 0012.05 0C5.495 0 .16 5.335.157 11.892c0 2.096.547 4.142 1.588 5.945L.057 24l6.305-1.654a11.882 11.882 0 005.683 1.448h.005c6.554 0 11.89-5.335 11.893-11.893a11.821 11.821 0 00-3.48-8.413Z" />
                          </svg>
                          WhatsApp
                        </a>
                      </div>
                    )}
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
