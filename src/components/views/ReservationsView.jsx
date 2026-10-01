import React, { useState } from 'react';
import { useApp } from '../../context/AppContext';
import {
  QrCode,
  Clock,
  Star,
  ChevronRight,
  ShoppingBag,
  XCircle,
  AlertCircle
} from 'lucide-react';

export const ReservationsView = () => {
  const {
    myPurchases,
    setSelectedReservation,
    cancelReservation,
    setActiveTab,
    setIsReviewModalOpen,
    setReviewListingTarget,
  } = useApp();

  const [activeTabFilter, setActiveTabFilter] = useState('active'); // 'active' | 'completed'
  const [cancellingId, setCancellingId] = useState(null);

  const activeReservations = myPurchases.filter(
    (r) => r.status === 'confirmed'
  );
  const pastReservations = myPurchases.filter(
    (r) => r.status === 'completed' || r.status === 'cancelled'
  );

  const displayList =
    activeTabFilter === 'active' ? activeReservations : pastReservations;

  return (
    <div className="space-y-3.5 pb-20 lg:pb-10 animate-in fade-in duration-300">

      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-sm font-black text-[#0F5238]">Rezervasyonlarım</h1>
          <p className="text-[10px] text-gray-500">Kupon ve teslimat kodlarınız</p>
        </div>
        <span className="px-2 py-0.5 rounded-full text-[10px] font-bold bg-[#D1FEE5] text-[#006C48]">
          {activeReservations.length} Aktif
        </span>
      </div>

      {/* Tabs Switcher (2 Tabs) */}
      <div className="grid grid-cols-2 gap-1 bg-white p-1 rounded-xl border border-gray-100 shadow-sm">
        <button
          onClick={() => setActiveTabFilter('active')}
          className={`py-2 text-center rounded-lg text-xs font-bold transition ${
            activeTabFilter === 'active'
              ? 'bg-[#0F5238] text-white shadow-sm'
              : 'text-gray-500 hover:text-gray-800'
          }`}
        >
          Aktif Kuponlar ({activeReservations.length})
        </button>

        <button
          onClick={() => setActiveTabFilter('completed')}
          className={`py-2 text-center rounded-lg text-xs font-bold transition ${
            activeTabFilter === 'completed'
              ? 'bg-[#0F5238] text-white shadow-sm'
              : 'text-gray-500 hover:text-gray-800'
          }`}
        >
          Geçmiş ({pastReservations.length})
        </button>
      </div>

      {/* List */}
      {displayList.length === 0 ? (
        <div className="bg-white rounded-2xl p-8 text-center border border-gray-100 space-y-3">
          <div className="w-12 h-12 rounded-full bg-[#F0FFF4] flex items-center justify-center mx-auto text-2xl">
            🎟️
          </div>
          <h3 className="text-sm font-bold text-gray-800">
            {activeTabFilter === 'active'
              ? 'Aktif kuponunuz bulunmuyor'
              : 'Geçmiş rezervasyonunuz yok'}
          </h3>
          <p className="text-xs text-gray-400">
            {activeTabFilter === 'active'
              ? 'Hemen yakınınızdaki indirimli sürpriz paketleri keşfedin!'
              : 'Tamamlanan siparişleriniz burada listelenir.'}
          </p>
          {activeTabFilter === 'active' && (
            <button
              onClick={() => setActiveTab('explore')}
              className="px-4 py-2.5 bg-[#0F5238] text-white text-xs font-bold rounded-xl shadow-md transition"
            >
              Fırsatları Keşfet
            </button>
          )}
        </div>
      ) : (
        <div className="space-y-2.5">
          {displayList.map((res) => (
            <div
              key={res.id}
              className="bg-white rounded-2xl p-3 border border-gray-100 shadow-sm space-y-2.5"
            >
              {/* Top row: Business info + status */}
              <div className="flex items-center justify-between">
                <div className="min-w-0">
                  <span className="text-[10px] font-bold text-gray-400 block truncate">
                    {res.businessName}
                  </span>
                  <h3 className="font-bold text-xs text-[#0F5238] truncate">
                    {res.listingTitle}
                  </h3>
                </div>

                <span
                  className={`px-2 py-0.5 rounded-md text-[9px] font-black flex-shrink-0 ml-2 ${
                    res.status === 'confirmed'
                      ? 'bg-[#D1FEE5] text-[#006C48] animate-pulse'
                      : res.status === 'completed'
                      ? 'bg-blue-50 text-blue-700'
                      : 'bg-red-50 text-red-600'
                  }`}
                >
                  {res.status === 'confirmed'
                    ? 'Hazır / Bekliyor'
                    : res.status === 'completed'
                    ? 'Teslim Alındı'
                    : 'İptal Edildi'}
                </span>
              </div>

              {/* Middle row: Image + Details */}
              <div className="flex items-center gap-2.5 p-2 bg-[#F8FAFC] rounded-xl border border-gray-100">
                <img
                  src={res.image}
                  alt={res.listingTitle}
                  className="w-12 h-12 rounded-lg object-cover flex-shrink-0"
                />
                <div className="min-w-0 flex-1 text-[10px] text-gray-600 space-y-0.5">
                  <div className="flex items-center justify-between">
                    <span>{res.portionCount} Porsiyon Paket</span>
                    <strong className="text-xs text-[#0F5238]">
                      {res.paidAmount === 0 ? 'Ücretsiz' : `${res.paidAmount} ₺`}
                    </strong>
                  </div>
                  <div className="flex items-center gap-1 text-[#2D6A4F] font-semibold">
                    <Clock className="w-3 h-3 flex-shrink-0" />
                    <span>Bugün {res.pickupStartTime}–{res.pickupEndTime}</span>
                  </div>
                </div>
              </div>

              {/* Action row */}
              <div className="flex items-center justify-between pt-1 border-t border-gray-50 gap-2">
                {res.status === 'confirmed' ? (
                  <>
                    <div className="flex items-center gap-1.5">
                      <span className="text-[9px] text-gray-400">Kod:</span>
                      <span className="px-2 py-0.5 bg-[#E8FFF0] text-[#0F5238] font-black text-xs rounded border border-[#95D5B2]/60 tracking-wider">
                        {res.pickupCode}
                      </span>
                    </div>

                    <div className="flex items-center gap-1.5">
                      {cancellingId === res.id ? (
                        <div className="flex items-center gap-1">
                          <button
                            onClick={() => {
                              cancelReservation(res.id);
                              setCancellingId(null);
                            }}
                            className="px-2 py-1 bg-red-600 text-white font-bold text-[9px] rounded-lg shadow"
                          >
                            Evet, İptal Et
                          </button>
                          <button
                            onClick={() => setCancellingId(null)}
                            className="px-2 py-1 bg-gray-100 text-gray-600 font-bold text-[9px] rounded-lg"
                          >
                            Vazgeç
                          </button>
                        </div>
                      ) : (
                        <button
                          onClick={() => setCancellingId(res.id)}
                          className="text-[9px] text-red-500 hover:text-red-700 font-semibold px-1.5 py-1"
                          title="Rezervasyonu İptal Et"
                        >
                          İptal
                        </button>
                      )}

                      <button
                        onClick={() => setSelectedReservation(res)}
                        className="flex items-center gap-1 px-3 py-1.5 bg-[#0F5238] hover:bg-[#2D6A4F] text-white font-bold text-[10px] rounded-xl shadow transition"
                      >
                        <QrCode className="w-3 h-3 text-[#95D5B2]" />
                        <span>QR Göster</span>
                      </button>
                    </div>
                  </>
                ) : res.status === 'completed' ? (
                  <>
                    <span className="text-[10px] text-[#10B981] font-bold">
                      🌱 Gıda Kurtarıldı
                    </span>
                    <button
                      onClick={() => {
                        setReviewListingTarget(res);
                        setIsReviewModalOpen(true);
                      }}
                      className="flex items-center gap-1 px-3 py-1.5 bg-amber-50 text-amber-700 border border-amber-200 font-bold text-[10px] rounded-xl transition"
                    >
                      <Star className="w-3 h-3 text-amber-500 fill-amber-500" />
                      <span>Değerlendir</span>
                    </button>
                  </>
                ) : (
                  <span className="text-[10px] text-red-400 font-medium">
                    İade tamamlandı
                  </span>
                )}
              </div>
            </div>
          ))}
        </div>
      )}

    </div>
  );
};
