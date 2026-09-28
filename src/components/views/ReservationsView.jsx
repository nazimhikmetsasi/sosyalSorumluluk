import React, { useState } from 'react';
import { useApp } from '../../context/AppContext';
import {
  QrCode,
  Clock,
  Star,
  ChevronRight,
  ShoppingBag,
} from 'lucide-react';

export const ReservationsView = () => {
  const {
    reservations,
    setSelectedReservation,
    setIsReviewModalOpen,
    setReviewListingTarget,
    setActiveTab
  } = useApp();

  const [activeSubTab, setActiveSubTab] = useState('active');

  const activeReservations = reservations.filter(r => r.status === 'confirmed' || r.status === 'ready');
  const pastReservations = reservations.filter(r => r.status === 'completed' || r.status === 'cancelled');
  const currentList = activeSubTab === 'active' ? activeReservations : pastReservations;

  return (
    <div className="space-y-4 pb-20 lg:pb-10 animate-in fade-in duration-300">

      {/* Header + Sub-tabs */}
      <div className="space-y-3">
        <div>
          <h1 className="text-base font-black text-[#0F5238]">Rezervasyonlarım</h1>
          <p className="text-[11px] text-gray-400 mt-0.5">
            QR kodu veya 4 haneli teslimat kodunu işletmede gösterin.
          </p>
        </div>

        <div className="flex items-center p-1 bg-white rounded-xl border border-gray-200 shadow-sm">
          <button
            onClick={() => setActiveSubTab('active')}
            className={`flex-1 flex items-center justify-center gap-1.5 py-2 rounded-lg text-[11px] font-bold transition ${
              activeSubTab === 'active'
                ? 'bg-[#0F5238] text-white shadow-sm'
                : 'text-gray-500'
            }`}
          >
            <span>Aktif Kuponlar</span>
            <span className={`px-1.5 py-0.5 rounded-full text-[9px] font-black ${activeSubTab === 'active' ? 'bg-white/20 text-white' : 'bg-gray-100 text-gray-500'}`}>
              {activeReservations.length}
            </span>
          </button>

          <button
            onClick={() => setActiveSubTab('completed')}
            className={`flex-1 flex items-center justify-center gap-1.5 py-2 rounded-lg text-[11px] font-bold transition ${
              activeSubTab === 'completed'
                ? 'bg-[#0F5238] text-white shadow-sm'
                : 'text-gray-500'
            }`}
          >
            <span>Geçmiş</span>
            <span className={`px-1.5 py-0.5 rounded-full text-[9px] font-black ${activeSubTab === 'completed' ? 'bg-white/20 text-white' : 'bg-gray-100 text-gray-500'}`}>
              {pastReservations.length}
            </span>
          </button>
        </div>
      </div>

      {/* List */}
      {currentList.length === 0 ? (
        <div className="bg-white rounded-2xl p-8 text-center border border-gray-100 space-y-3">
          <div className="w-12 h-12 rounded-full bg-[#F0FFF4] flex items-center justify-center mx-auto text-xl">🛍️</div>
          <h3 className="text-sm font-bold text-gray-800">
            {activeSubTab === 'active' ? 'Aktif rezervasyon yok' : 'Geçmiş rezervasyon yok'}
          </h3>
          <button
            onClick={() => setActiveTab('explore')}
            className="px-4 py-2 bg-[#0F5238] text-white text-[11px] font-bold rounded-xl"
          >
            İlanları Keşfet
          </button>
        </div>
      ) : (
        <div className="space-y-3">
          {currentList.map((res) => (
            <div
              key={res.id}
              className="bg-white rounded-2xl p-3.5 border border-gray-100 shadow-sm"
            >
              {/* Top row: image + info */}
              <div className="flex items-start gap-3">
                <img
                  src={res.image}
                  alt={res.listingTitle}
                  className="w-16 h-16 rounded-xl object-cover flex-shrink-0"
                />

                <div className="flex-1 min-w-0 space-y-1">
                  <div className="flex items-center gap-1.5 flex-wrap">
                    <span className="text-[10px] font-bold text-gray-400 truncate">{res.businessName}</span>
                    <span className={`px-2 py-0.5 rounded-md text-[9px] font-extrabold whitespace-nowrap ${
                      res.status === 'confirmed'
                        ? 'bg-[#D1FEE5] text-[#006C48]'
                        : 'bg-gray-100 text-gray-500'
                    }`}>
                      {res.status === 'confirmed' ? '⏳ Bekliyor' : '✅ Tamamlandı'}
                    </span>
                  </div>

                  <h3 className="text-xs font-bold text-[#0F5238] line-clamp-1">{res.listingTitle}</h3>

                  <div className="flex items-center gap-1 text-[10px] text-gray-400">
                    <Clock className="w-3 h-3 text-[#2D6A4F]" />
                    <span>{res.pickupDate} · {res.pickupStartTime}–{res.pickupEndTime}</span>
                  </div>

                  <div className="flex items-center gap-2 text-[10px] text-gray-500">
                    <span>{res.portionCount} Porsiyon</span>
                    <span>•</span>
                    <span className="font-bold text-[#0F5238]">{res.paidAmount === 0 ? 'Ücretsiz' : `${res.paidAmount} ₺`}</span>
                  </div>
                </div>
              </div>

              {/* Bottom action row */}
              <div className="flex items-center justify-between mt-3 pt-3 border-t border-gray-50">
                {res.status === 'confirmed' ? (
                  <>
                    <div>
                      <p className="text-[9px] text-gray-400">Teslimat Kodu</p>
                      <p className="text-base font-black text-[#0F5238] tracking-wider">{res.pickupCode}</p>
                    </div>
                    <button
                      onClick={() => setSelectedReservation(res)}
                      className="flex items-center gap-1.5 px-3 py-2 bg-[#0F5238] text-white text-[11px] font-bold rounded-xl shadow-sm"
                    >
                      <QrCode className="w-3.5 h-3.5 text-[#95D5B2]" />
                      <span>QR Göster</span>
                    </button>
                  </>
                ) : (
                  <button
                    onClick={() => {
                      setReviewListingTarget(res);
                      setIsReviewModalOpen(true);
                    }}
                    className="flex items-center gap-1.5 px-3 py-2 bg-[#F0FFF4] text-[#0F5238] border border-[#A8E7C5]/50 text-[11px] font-bold rounded-xl"
                  >
                    <Star className="w-3.5 h-3.5 text-amber-500 fill-amber-500" />
                    <span>Değerlendir</span>
                  </button>
                )}
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
};
