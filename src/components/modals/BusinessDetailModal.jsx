import React, { useState } from 'react';
import { useApp } from '../../context/AppContext';
import {
  X,
  MapPin,
  Phone,
  Clock,
  ShieldCheck,
  Star,
  Leaf,
  ShoppingBag,
  Award,
  ChevronRight,
  Share2
} from 'lucide-react';

export const BusinessDetailModal = () => {
  const { businesses, listings, setSelectedListing, showToast } = useApp();
  const [activeBizModal, setActiveBizModal] = useState(null);

  // We can expose an opener via window event or context if needed, or check selected business
  // Let's attach a listener for opening business profile
  React.useEffect(() => {
    const handleOpenBiz = (e) => {
      const bizId = e.detail;
      const found = businesses.find(b => b.id === bizId) || businesses[0];
      setActiveBizModal(found);
    };
    window.addEventListener('OPEN_BIZ_MODAL', handleOpenBiz);
    return () => window.removeEventListener('OPEN_BIZ_MODAL', handleOpenBiz);
  }, [businesses]);

  if (!activeBizModal) return null;

  const bizListings = listings.filter(l => l.businessId === activeBizModal.id);

  const mockReviews = [
    { author: 'Ahmet D.', date: '3 gün önce', rating: 5, comment: 'Ekmekler ve kruvasanlar sıcacıktı, çalışanlar çok nazikti!' },
    { author: 'Merve S.', date: '1 hafta önce', rating: 5, comment: 'Muhteşem bir kurtarma paketi, hem bütçeme hem doğaya katkı oldu.' },
    { author: 'Can T.', date: '2 hafta önce', rating: 4, comment: 'Çok lezzetliydi, paketleme de gayet özenliydi.' }
  ];

  return (
    <div className="fixed inset-0 z-[2000] flex items-center justify-center p-3 sm:p-6 bg-black/60 backdrop-blur-sm animate-in fade-in duration-200">
      <div className="relative w-full max-w-2xl bg-white rounded-3xl shadow-2xl overflow-hidden max-h-[90vh] flex flex-col animate-in zoom-in-95 duration-200">
        
        {/* Cover image & close */}
        <div className="relative h-48 sm:h-56 bg-gray-100 flex-shrink-0">
          <img
            src={activeBizModal.cover}
            alt={activeBizModal.name}
            className="w-full h-full object-cover"
          />
          <div className="absolute inset-0 bg-gradient-to-t from-black/80 via-black/30 to-transparent"></div>

          <button
            onClick={() => setActiveBizModal(null)}
            className="absolute top-4 right-4 w-9 h-9 rounded-full bg-white/80 hover:bg-white text-gray-800 flex items-center justify-center shadow-lg transition backdrop-blur-md"
          >
            <X className="w-5 h-5" />
          </button>

          <div className="absolute bottom-4 left-4 right-4 flex items-end gap-3.5">
            <img
              src={activeBizModal.avatar}
              alt={activeBizModal.name}
              className="w-16 h-16 rounded-2xl object-cover border-2 border-white shadow-lg bg-white"
            />
            <div className="text-white">
              <div className="flex items-center gap-1.5">
                <h2 className="text-lg sm:text-xl font-bold">{activeBizModal.name}</h2>
                <ShieldCheck className="w-5 h-5 text-[#10B981]" />
              </div>
              <p className="text-xs text-white/80">{activeBizModal.type} • {activeBizModal.address}</p>
            </div>
          </div>
        </div>

        {/* Scrollable Content */}
        <div className="p-5 sm:p-6 overflow-y-auto space-y-6 flex-1">
          
          {/* 3 Metric Pills */}
          <div className="grid grid-cols-3 gap-3 text-center">
            <div className="p-3 bg-[#F0FFF4] rounded-2xl border border-[#A8E7C5]/50">
              <p className="text-xs font-bold text-gray-500">Güven Skoru</p>
              <p className="text-base font-black text-[#10B981] mt-0.5">%{activeBizModal.trustScore}</p>
            </div>
            <div className="p-3 bg-[#E8FFF0] rounded-2xl border border-[#95D5B2]/40">
              <p className="text-xs font-bold text-gray-500">Kurtarılan Gıda</p>
              <p className="text-base font-black text-[#0F5238] mt-0.5">{activeBizModal.totalDonatedKg} kg</p>
            </div>
            <div className="p-3 bg-[#FEF3C7] rounded-2xl border border-amber-200">
              <p className="text-xs font-bold text-gray-500">Değerlendirme</p>
              <p className="text-base font-black text-amber-600 mt-0.5">★ {activeBizModal.rating} ({activeBizModal.reviewCount})</p>
            </div>
          </div>

          {/* Active Listings in this Store */}
          <div>
            <h3 className="font-bold text-sm text-[#0F5238] mb-3 flex items-center gap-2">
              <ShoppingBag className="w-4 h-4 text-[#52B788]" />
              Şu An Yayındaki Kurtarma Paketleri ({bizListings.length})
            </h3>

            {bizListings.length === 0 ? (
              <p className="text-xs text-gray-500 bg-gray-50 p-4 rounded-2xl text-center">
                Bu işletmenin şu an aktif kurtarma paketi bulunmuyor.
              </p>
            ) : (
              <div className="space-y-2.5">
                {bizListings.map(item => (
                  <div
                    key={item.id}
                    onClick={() => {
                      setSelectedListing(item);
                      setActiveBizModal(null);
                    }}
                    className="flex items-center justify-between p-3 rounded-2xl bg-[#F8FAFC] border border-gray-100 hover:border-[#52B788] transition cursor-pointer"
                  >
                    <div className="flex items-center gap-3">
                      <img src={item.image} alt={item.title} className="w-12 h-12 rounded-xl object-cover" />
                      <div>
                        <h4 className="font-bold text-xs text-[#0F5238]">{item.title}</h4>
                        <p className="text-[10px] text-gray-500">Teslim: {item.pickupStartTime} - {item.pickupEndTime} • {item.portionsAvailable} paket kaldı</p>
                      </div>
                    </div>

                    <div className="text-right">
                      <span className="text-xs font-black text-[#0F5238] block">{item.priceDiscounted === 0 ? 'Ücretsiz' : `${item.priceDiscounted} ₺`}</span>
                      <span className="text-[10px] text-[#52B788] font-bold">İncele ↗</span>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>

          {/* Customer Reviews */}
          <div>
            <h3 className="font-bold text-sm text-[#0F5238] mb-3 flex items-center gap-2">
              <Star className="w-4 h-4 text-amber-500" />
              Müşteri Değerlendirmeleri
            </h3>
            <div className="space-y-2.5">
              {mockReviews.map((rev, i) => (
                <div key={i} className="p-3.5 bg-gray-50 rounded-2xl border border-gray-100 space-y-1">
                  <div className="flex items-center justify-between">
                    <span className="text-xs font-bold text-gray-800">{rev.author}</span>
                    <span className="text-[10px] text-gray-400">{rev.date}</span>
                  </div>
                  <div className="flex text-amber-400 text-xs">
                    {'★'.repeat(rev.rating)}
                  </div>
                  <p className="text-xs text-gray-600">{rev.comment}</p>
                </div>
              ))}
            </div>
          </div>

        </div>

      </div>
    </div>
  );
};
