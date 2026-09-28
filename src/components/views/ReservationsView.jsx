import React, { useState } from 'react';
import { useApp } from '../../context/AppContext';
import {
  QrCode,
  Clock,
  MapPin,
  CheckCircle2,
  Star,
  ChevronRight,
  ShoppingBag,
  ExternalLink,
  ShieldCheck
} from 'lucide-react';

export const ReservationsView = () => {
  const {
    reservations,
    setSelectedReservation,
    setIsReviewModalOpen,
    setReviewListingTarget,
    setActiveTab
  } = useApp();

  const [activeSubTab, setActiveSubTab] = useState('active'); // 'active' | 'completed'

  const activeReservations = reservations.filter(r => r.status === 'confirmed' || r.status === 'ready');
  const pastReservations = reservations.filter(r => r.status === 'completed' || r.status === 'cancelled');

  const currentList = activeSubTab === 'active' ? activeReservations : pastReservations;

  return (
    <div className="space-y-6 pb-20 lg:pb-10 max-w-4xl mx-auto animate-in fade-in duration-300">
      
      {/* Title & SubTab Switcher */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl font-black text-[#0F5238]">Rezervasyonlarım & Kuponlar</h1>
          <p className="text-xs text-gray-500 mt-0.5">
            Kurtardığınız gıdaları teslim almak için QR kodunuzu veya 4 haneli teslimat kodunu gösterin.
          </p>
        </div>

        <div className="flex items-center p-1 bg-white rounded-2xl border border-gray-200 shadow-sm">
          <button
            onClick={() => setActiveSubTab('active')}
            className={`flex items-center gap-2 px-4 py-2 rounded-xl text-xs font-bold transition ${
              activeSubTab === 'active'
                ? 'bg-[#0F5238] text-white shadow-sm'
                : 'text-gray-500 hover:text-gray-800'
            }`}
          >
            <span>Aktif Kuponlar</span>
            <span className="px-1.5 py-0.2 rounded-full text-[10px] bg-white/20">
              {activeReservations.length}
            </span>
          </button>

          <button
            onClick={() => setActiveSubTab('completed')}
            className={`flex items-center gap-2 px-4 py-2 rounded-xl text-xs font-bold transition ${
              activeSubTab === 'completed'
                ? 'bg-[#0F5238] text-white shadow-sm'
                : 'text-gray-500 hover:text-gray-800'
            }`}
          >
            <span>Geçmiş Kurtarmalar</span>
            <span className="px-1.5 py-0.2 rounded-full text-[10px] bg-white/20">
              {pastReservations.length}
            </span>
          </button>
        </div>
      </div>

      {/* List content */}
      {currentList.length === 0 ? (
        <div className="bg-white rounded-3xl p-12 text-center border border-gray-100 space-y-4">
          <div className="w-16 h-16 rounded-full bg-[#F0FFF4] text-[#2D6A4F] flex items-center justify-center mx-auto text-2xl">
            🛍️
          </div>
          <h3 className="text-base font-bold text-gray-800">
            {activeSubTab === 'active' ? 'Henüz aktif bir rezervasyonunuz yok' : 'Geçmiş rezervasyon kaydı bulunamadı'}
          </h3>
          <p className="text-xs text-gray-500 max-w-sm mx-auto">
            Gıda israfına dur demek ve taze paketleri kurtarmak için ilanları keşfedin.
          </p>
          <button
            onClick={() => setActiveTab('explore')}
            className="px-5 py-2.5 bg-[#0F5238] text-white text-xs font-bold rounded-2xl shadow-md transition hover:bg-[#2D6A4F]"
          >
            İlanları Keşfet
          </button>
        </div>
      ) : (
        <div className="space-y-4">
          {currentList.map((res) => (
            <div
              key={res.id}
              className="bg-white rounded-3xl p-5 border border-gray-100 shadow-sm hover:shadow-md transition-all flex flex-col sm:flex-row items-start sm:items-center justify-between gap-5"
            >
              <div className="flex items-start gap-4">
                <img
                  src={res.image}
                  alt={res.listingTitle}
                  className="w-20 h-20 sm:w-24 sm:h-24 rounded-2xl object-cover flex-shrink-0"
                />

                <div className="space-y-1.5">
                  <div className="flex items-center gap-2">
                    <span className="text-xs font-bold text-gray-500">{res.businessName}</span>
                    <span className={`px-2 py-0.5 rounded-lg text-[10px] font-extrabold ${
                      res.status === 'confirmed'
                        ? 'bg-[#D1FEE5] text-[#006C48]'
                        : 'bg-gray-100 text-gray-600'
                    }`}>
                      {res.status === 'confirmed' ? 'Teslim Alınmayı Bekliyor' : 'Tamamlandı ✅'}
                    </span>
                  </div>

                  <h3 className="text-sm sm:text-base font-bold text-[#0F5238]">
                    {res.listingTitle}
                  </h3>

                  <div className="flex flex-wrap items-center gap-3 text-xs text-gray-500 pt-1">
                    <span className="flex items-center gap-1">
                      <Clock className="w-3.5 h-3.5 text-[#2D6A4F]" />
                      {res.pickupDate} ({res.pickupStartTime} - {res.pickupEndTime})
                    </span>
                    <span>•</span>
                    <span>{res.portionCount} Porsiyon</span>
                    <span>•</span>
                    <span className="font-bold text-[#0F5238]">{res.paidAmount === 0 ? 'Ücretsiz' : `${res.paidAmount} ₺`}</span>
                  </div>
                </div>
              </div>

              {/* Action Column */}
              <div className="flex sm:flex-col items-center sm:items-end justify-between w-full sm:w-auto gap-3 pt-3 sm:pt-0 border-t sm:border-t-0 border-gray-100">
                {res.status === 'confirmed' ? (
                  <>
                    <div className="text-left sm:text-right">
                      <p className="text-[10px] text-gray-400">Teslimat Kodu</p>
                      <p className="text-lg font-black text-[#0F5238] tracking-wider">{res.pickupCode}</p>
                    </div>

                    <button
                      onClick={() => setSelectedReservation(res)}
                      className="flex items-center gap-2 px-4 py-2.5 bg-[#0F5238] hover:bg-[#2D6A4F] text-white text-xs font-bold rounded-xl shadow-md transition"
                    >
                      <QrCode className="w-4 h-4 text-[#95D5B2]" />
                      <span>QR Kodu Göster</span>
                    </button>
                  </>
                ) : (
                  <button
                    onClick={() => {
                      setReviewListingTarget(res);
                      setIsReviewModalOpen(true);
                    }}
                    className="flex items-center gap-1.5 px-4 py-2.5 bg-[#F0FFF4] hover:bg-[#E8FFF0] text-[#0F5238] border border-[#A8E7C5]/50 text-xs font-bold rounded-xl transition"
                  >
                    <Star className="w-4 h-4 text-amber-500 fill-amber-500" />
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
