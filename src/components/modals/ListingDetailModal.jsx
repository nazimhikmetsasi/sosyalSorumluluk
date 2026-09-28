import React, { useState } from 'react';
import { useApp } from '../../context/AppContext';
import {
  X,
  Clock,
  MapPin,
  Leaf,
  ShieldCheck,
  AlertTriangle,
  Minus,
  Plus,
  Share2,
  Heart,
  ChevronRight,
  ShoppingBag,
  Sparkles
} from 'lucide-react';

export const ListingDetailModal = () => {
  const { selectedListing, setSelectedListing, makeReservation, showToast } = useApp();
  const [portionCount, setPortionCount] = useState(1);
  const [isLiked, setIsLiked] = useState(false);

  if (!selectedListing) return null;

  const handleReserve = () => {
    makeReservation(selectedListing, portionCount);
    setSelectedListing(null);
  };

  const totalPrice = selectedListing.priceDiscounted * portionCount;
  const savedPrice = (selectedListing.priceOriginal - selectedListing.priceDiscounted) * portionCount;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-3 sm:p-6 bg-black/60 backdrop-blur-sm animate-in fade-in duration-200">
      <div className="relative w-full max-w-2xl bg-white rounded-3xl shadow-2xl overflow-hidden max-h-[92vh] flex flex-col animate-in zoom-in-95 duration-200">
        
        {/* Header Image & Action buttons */}
        <div className="relative h-64 sm:h-72 w-full bg-gray-100 flex-shrink-0">
          <img
            src={selectedListing.image}
            alt={selectedListing.title}
            className="w-full h-full object-cover"
          />
          <div className="absolute inset-0 bg-gradient-to-t from-black/80 via-black/20 to-transparent"></div>

          {/* Close Button */}
          <button
            onClick={() => setSelectedListing(null)}
            className="absolute top-4 right-4 w-10 h-10 rounded-full bg-white/80 hover:bg-white text-gray-800 flex items-center justify-center shadow-lg transition backdrop-blur-md"
          >
            <X className="w-5 h-5" />
          </button>

          {/* Favorite & Share */}
          <div className="absolute top-4 left-4 flex gap-2">
            <button
              onClick={() => {
                setIsLiked(!isLiked);
                showToast(isLiked ? 'Favorilerden çıkarıldı' : 'Favorilere eklendi! ❤️');
              }}
              className={`w-10 h-10 rounded-full flex items-center justify-center backdrop-blur-md shadow-lg transition ${
                isLiked ? 'bg-red-500 text-white' : 'bg-white/80 text-gray-800 hover:bg-white'
              }`}
            >
              <Heart className={`w-5 h-5 ${isLiked ? 'fill-white' : ''}`} />
            </button>
            <button
              onClick={() => {
                navigator.clipboard?.writeText(window.location.href);
                showToast('İlan bağlantısı kopyalandı! 🔗');
              }}
              className="w-10 h-10 rounded-full bg-white/80 hover:bg-white text-gray-800 flex items-center justify-center backdrop-blur-md shadow-lg transition"
            >
              <Share2 className="w-5 h-5" />
            </button>
          </div>

          {/* Badge over image */}
          <div className="absolute bottom-4 left-4 right-4 flex items-end justify-between">
            <div>
              <div className="flex items-center gap-2 mb-1.5">
                <span className="px-2.5 py-1 text-xs font-bold rounded-lg bg-[#2D6A4F] text-white shadow">
                  {selectedListing.category}
                </span>
                {selectedListing.type === 'free' ? (
                  <span className="px-2.5 py-1 text-xs font-extrabold rounded-lg bg-[#10B981] text-white shadow">
                    %100 ÜCRETSİZ
                  </span>
                ) : selectedListing.type === 'bulk' ? (
                  <span className="px-2.5 py-1 text-xs font-bold rounded-lg bg-[#3B82F6] text-white shadow">
                    STK Toplu Bağış
                  </span>
                ) : (
                  <span className="px-2.5 py-1 text-xs font-extrabold rounded-lg bg-[#F59E0B] text-white shadow">
                    %{selectedListing.discountPercentage} İndirim
                  </span>
                )}
              </div>
              <h2 className="text-xl sm:text-2xl font-bold text-white leading-tight drop-shadow-md">
                {selectedListing.title}
              </h2>
            </div>
          </div>
        </div>

        {/* Scrollable Content Body */}
        <div className="p-5 sm:p-6 overflow-y-auto space-y-6 flex-1">
          
          {/* Business Summary Card */}
          <div className="flex items-center justify-between p-3.5 bg-[#F0FFF4] rounded-2xl border border-[#A8E7C5]/50">
            <div className="flex items-center gap-3">
              <img
                src={selectedListing.businessAvatar}
                alt={selectedListing.businessName}
                className="w-12 h-12 rounded-2xl object-cover border border-white shadow-sm"
              />
              <div>
                <h4 className="text-sm font-bold text-[#0F5238] flex items-center gap-1.5">
                  {selectedListing.businessName}
                  <ShieldCheck className="w-4 h-4 text-[#10B981]" />
                </h4>
                <p className="text-xs text-gray-500 flex items-center gap-1 mt-0.5">
                  <MapPin className="w-3.5 h-3.5 text-gray-400" />
                  Kadıköy, İstanbul • {selectedListing.distanceKm} km yakında
                </p>
              </div>
            </div>
            <span className="px-2.5 py-1 rounded-xl text-xs font-bold bg-white text-[#0F5238] border border-[#52B788]/30 shadow-sm">
              ★ 4.9
            </span>
          </div>

          {/* Description */}
          <div>
            <h4 className="text-xs font-bold text-gray-400 uppercase tracking-wider mb-2">Kurtarma Paketi Açıklaması</h4>
            <p className="text-sm text-gray-700 leading-relaxed bg-[#F8FAFC] p-3.5 rounded-2xl border border-gray-100">
              {selectedListing.description}
            </p>
          </div>

          {/* Pickup Time & Environmental Impact grid */}
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
            <div className="p-4 bg-[#E8FFF0] rounded-2xl border border-[#95D5B2]/40 flex items-center gap-3">
              <div className="w-10 h-10 rounded-xl bg-[#2D6A4F] text-white flex items-center justify-center flex-shrink-0">
                <Clock className="w-5 h-5 text-[#95D5B2]" />
              </div>
              <div>
                <p className="text-[11px] font-bold text-[#006C48] uppercase">Teslim Alma Aralığı</p>
                <p className="text-sm font-bold text-[#0F5238]">
                  Bugün {selectedListing.pickupStartTime} - {selectedListing.pickupEndTime}
                </p>
              </div>
            </div>

            <div className="p-4 bg-[#CCF8DF]/60 rounded-2xl border border-[#52B788]/30 flex items-center gap-3">
              <div className="w-10 h-10 rounded-xl bg-[#006C48] text-white flex items-center justify-center flex-shrink-0">
                <Leaf className="w-5 h-5 text-[#92F7C3]" />
              </div>
              <div>
                <p className="text-[11px] font-bold text-[#006C48] uppercase">Kurtarılan Çevre Etkisi</p>
                <p className="text-sm font-bold text-[#0F5238]">
                  ~{selectedListing.co2ReductionKg} kg CO₂ Engellendi 🌍
                </p>
              </div>
            </div>
          </div>

          {/* Allergens warning */}
          {selectedListing.allergens && (
            <div>
              <h4 className="text-xs font-bold text-gray-400 uppercase tracking-wider mb-2 flex items-center gap-1.5">
                <AlertTriangle className="w-3.5 h-3.5 text-amber-500" />
                Alerjen Bilgisi
              </h4>
              <div className="flex flex-wrap gap-2">
                {selectedListing.allergens.map((alg, i) => (
                  <span
                    key={i}
                    className="px-3 py-1 bg-amber-50 text-amber-800 border border-amber-200 text-xs font-semibold rounded-lg"
                  >
                    {alg}
                  </span>
                ))}
              </div>
            </div>
          )}

          {/* Portion count selection */}
          <div className="p-4 bg-[#F8FAFC] rounded-2xl border border-gray-200 flex items-center justify-between">
            <div>
              <p className="text-xs font-bold text-gray-700">Porsiyon Adedi</p>
              <p className="text-[11px] text-gray-500">Kalan: {selectedListing.portionsAvailable} paket</p>
            </div>
            <div className="flex items-center gap-3 bg-white border border-gray-200 rounded-xl p-1 shadow-sm">
              <button
                disabled={portionCount <= 1}
                onClick={() => setPortionCount(p => Math.max(1, p - 1))}
                className="w-8 h-8 rounded-lg flex items-center justify-center text-gray-600 hover:bg-gray-100 disabled:opacity-30"
              >
                <Minus className="w-4 h-4" />
              </button>
              <span className="w-6 text-center font-bold text-sm text-[#0F5238]">{portionCount}</span>
              <button
                disabled={portionCount >= selectedListing.portionsAvailable}
                onClick={() => setPortionCount(p => Math.min(selectedListing.portionsAvailable, p + 1))}
                className="w-8 h-8 rounded-lg flex items-center justify-center text-gray-600 hover:bg-gray-100 disabled:opacity-30"
              >
                <Plus className="w-4 h-4" />
              </button>
            </div>
          </div>
        </div>

        {/* Footer Reserve Action */}
        <div className="p-4 sm:p-5 bg-white border-t border-gray-100 flex items-center justify-between gap-4">
          <div>
            <p className="text-[11px] text-gray-400 font-medium">Toplam Ödeme Tutarı</p>
            <div className="flex items-baseline gap-2">
              <span className="text-2xl font-black text-[#0F5238]">
                {totalPrice === 0 ? 'ÜCRETSİZ' : `${totalPrice} ₺`}
              </span>
              {selectedListing.priceOriginal > 0 && (
                <span className="text-xs text-gray-400 line-through">
                  {selectedListing.priceOriginal * portionCount} ₺
                </span>
              )}
            </div>
            {savedPrice > 0 && (
              <p className="text-[10px] font-bold text-[#10B981]">
                🎉 {savedPrice} ₺ Cebinizde Kaldı
              </p>
            )}
          </div>

          <button
            onClick={handleReserve}
            className="flex-1 max-w-xs flex items-center justify-center gap-2 bg-[#0F5238] hover:bg-[#2D6A4F] text-white py-3.5 px-6 rounded-2xl font-bold shadow-lg shadow-[#0F5238]/30 transition-all hover:scale-[1.02] active:scale-95"
          >
            <ShoppingBag className="w-5 h-5 text-[#95D5B2]" />
            <span>Gıdayı Kurtar</span>
          </button>
        </div>

      </div>
    </div>
  );
};
