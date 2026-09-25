'use client';

import { useState, useEffect } from 'react';
import { useParams } from 'next/navigation';
import { MapPin, Shield, Calendar, Info, Clock, CheckCircle, ChevronLeft } from 'lucide-react';
import Link from 'next/link';

export default function AdDetailPage() {
  const { adId } = useParams();
  const [ad, setAd] = useState<any>(null);
  const [loading, setLoading] = useState(true);
  const [session, setSession] = useState<any>(null); 
  const [activeImage, setActiveImage] = useState('');

  useEffect(() => {
    fetch('/api/auth/session').then(res => res.json()).then(data => setSession(data)).catch(() => {});

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
    ...(ad.galleryImages || []),
    ...(ad.item?.itemImages?.map((img: any) => img.url) || [])
  ];

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
            <div className="p-6 bg-gray-100 flex flex-col">
              <div className="aspect-w-4 aspect-h-3 rounded-xl overflow-hidden bg-white mb-4 shadow-sm border border-gray-200">
                {activeImage ? (
                  <img src={activeImage} alt={ad.title} className="w-full h-full object-contain" />
                ) : (
                  <div className="w-full h-full flex items-center justify-center text-gray-400">No image available</div>
                )}
              </div>
              <div className="flex gap-2 overflow-x-auto pb-2">
                {allImages.map((img: string, idx: number) => (
                  <button 
                    key={idx} 
                    onClick={() => setActiveImage(img)}
                    className={`flex-shrink-0 w-20 h-20 rounded-lg overflow-hidden border-2 ${activeImage === img ? 'border-blue-500' : 'border-transparent opacity-70 hover:opacity-100'}`}
                  >
                    <img src={img} alt="" className="w-full h-full object-cover" />
                  </button>
                ))}
              </div>
            </div>

            {/* Details */}
            <div className="p-8 lg:p-10 flex flex-col">
              <div className="flex justify-between items-start">
                <div>
                  <h1 className="text-3xl font-bold text-gray-900 mb-2">{ad.title}</h1>
                  <div className="flex items-center text-gray-500 mb-6">
                    <MapPin className="h-5 w-5 mr-1" />
                    <span>{ad.city}</span>
                    <span className="mx-2">•</span>
                    <span className="bg-blue-100 text-blue-800 text-xs px-2 py-1 rounded-full font-medium">
                      {ad.item?.category?.name || 'Category'}
                    </span>
                  </div>
                </div>
              </div>

              <div className="prose prose-blue text-gray-600 mb-8 max-w-none">
                <p>{ad.description}</p>
              </div>

              {/* Pricing Cards */}
              <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-8">
                {ad.hourlyPrice && (
                  <div className="bg-gray-50 rounded-xl p-4 text-center border border-gray-100">
                    <p className="text-xs text-gray-500 uppercase tracking-wide font-semibold mb-1">Hourly</p>
                    <p className="text-2xl font-bold text-gray-900">${ad.hourlyPrice}</p>
                  </div>
                )}
                {ad.dailyPrice && (
                  <div className="bg-blue-50 rounded-xl p-4 text-center border border-blue-100 shadow-sm relative overflow-hidden">
                    <div className="absolute top-0 right-0 bg-blue-500 text-white text-[10px] px-2 py-0.5 rounded-bl-lg font-bold">POPULAR</div>
                    <p className="text-xs text-blue-600 uppercase tracking-wide font-semibold mb-1">Daily</p>
                    <p className="text-2xl font-bold text-blue-900">${ad.dailyPrice}</p>
                  </div>
                )}
                {ad.weeklyPrice && (
                  <div className="bg-gray-50 rounded-xl p-4 text-center border border-gray-100">
                    <p className="text-xs text-gray-500 uppercase tracking-wide font-semibold mb-1">Weekly</p>
                    <p className="text-2xl font-bold text-gray-900">${ad.weeklyPrice}</p>
                  </div>
                )}
                {ad.monthlyPrice && (
                  <div className="bg-gray-50 rounded-xl p-4 text-center border border-gray-100">
                    <p className="text-xs text-gray-500 uppercase tracking-wide font-semibold mb-1">Monthly</p>
                    <p className="text-2xl font-bold text-gray-900">${ad.monthlyPrice}</p>
                  </div>
                )}
              </div>

              {/* Security Deposit */}
              {ad.securityDeposit && (
                <div className="flex items-center text-sm text-gray-600 bg-orange-50 p-3 rounded-lg border border-orange-100 mb-8">
                  <Shield className="h-5 w-5 text-orange-500 mr-2" />
                  <span>Requires a security deposit of <strong>${ad.securityDeposit}</strong></span>
                </div>
              )}

              {/* Provider Info */}
              <div className="mt-auto border-t border-gray-100 pt-6">
                <div className="flex items-center justify-between">
                  <div className="flex items-center">
                    <div className="h-12 w-12 rounded-full bg-gray-200 overflow-hidden mr-4 shadow-sm border border-gray-200">
                      {ad.business?.logo && <img src={ad.business.logo} alt={ad.business.name} className="w-full h-full object-cover" />}
                    </div>
                    <div>
                      <p className="text-sm text-gray-500">Provided by</p>
                      <p className="text-lg font-semibold text-gray-900">{ad.business?.name}</p>
                    </div>
                  </div>
                  
                  {/* Action Button */}
                  <div>
                    {!session || !session.user ? (
                      <button className="bg-gray-900 hover:bg-gray-800 text-white px-6 py-3 rounded-xl font-medium transition-colors shadow-md">
                        Sign in to Book
                      </button>
                    ) : session.user?.kycStatus !== 'APPROVED' ? (
                      <button className="bg-orange-500 hover:bg-orange-600 text-white px-6 py-3 rounded-xl font-medium transition-colors shadow-md">
                        Complete Verification First
                      </button>
                    ) : (
                      <button className="bg-blue-600 hover:bg-blue-700 text-white px-6 py-3 rounded-xl font-medium transition-colors shadow-md">
                        Request Booking
                      </button>
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
