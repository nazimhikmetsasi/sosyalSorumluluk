import React, { useState } from 'react';
import { useApp } from '../../context/AppContext';
import { ScannerModal } from '../modals/ScannerModal';
import {
  QrCode,
  CheckCircle2,
  Clock,
  Search,
  Check,
  Smartphone,
  ShieldCheck,
  AlertCircle
} from 'lucide-react';

export const BusinessOrdersView = () => {
  const {
    reservations,
    completeDelivery,
    currentUser,
  } = useApp();

  const [inputCode, setInputCode] = useState('');
  const [isScannerOpen, setIsScannerOpen] = useState(false);
  const [orderFilter, setOrderFilter] = useState('pending'); // 'pending' | 'completed' | 'all'
  const [searchQuery, setSearchQuery] = useState('');

  const pendingOrders = reservations.filter(r => r.status === 'confirmed');
  const completedOrders = reservations.filter(r => r.status === 'completed');

  const filteredOrders = reservations.filter(ord => {
    if (orderFilter === 'pending' && ord.status !== 'confirmed') return false;
    if (orderFilter === 'completed' && ord.status !== 'completed') return false;
    if (searchQuery.trim()) {
      const q = searchQuery.toLowerCase();
      return (
        ord.pickupCode.toLowerCase().includes(q) ||
        ord.listingTitle.toLowerCase().includes(q)
      );
    }
    return true;
  });

  const handleCodeSubmit = (e) => {
    e.preventDefault();
    if (!inputCode.trim()) return;
    completeDelivery(inputCode);
    setInputCode('');
  };

  return (
    <div className="space-y-4 pb-20 lg:pb-10 animate-in fade-in duration-300 max-w-4xl mx-auto">
      
      {/* Top Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-sm sm:text-base font-black text-[#0F5238] flex items-center gap-1.5">
            <QrCode className="w-4 h-4 text-[#52B788]" />
            <span>Teslimat & QR Kod Doğrulama Masası</span>
          </h1>
          <p className="text-[10px] text-gray-500">Müşterilerin teslimat kodlarını doğrulayın ve siparişleri teslim edin</p>
        </div>
        <span className="px-2.5 py-1 rounded-full text-[10px] font-bold bg-[#D1FEE5] text-[#006C48]">
          {pendingOrders.length} Bekleyen Teslimat
        </span>
      </div>

      {/* Main Delivery Input Box */}
      <div className="bg-gradient-to-br from-[#0F5238] via-[#2D6A4F] to-[#1B4332] text-white p-5 rounded-3xl shadow-xl space-y-4">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-2">
            <div className="w-8 h-8 rounded-xl bg-white/15 flex items-center justify-center">
              <Smartphone className="w-4 h-4 text-[#92F7C3]" />
            </div>
            <div>
              <h3 className="font-bold text-sm">Hızlı Kod Doğrulama</h3>
              <p className="text-[10px] text-white/70">Müşterinin telefonundaki 4 haneli kodu girin</p>
            </div>
          </div>
          <span className="px-2 py-0.5 rounded-lg bg-white/20 text-[9px] font-bold">Personel Girişi</span>
        </div>

        <form onSubmit={handleCodeSubmit} className="space-y-2">
          <div className="flex gap-2">
            <input
              type="text"
              maxLength={7}
              value={inputCode}
              onChange={(e) => setInputCode(e.target.value.toUpperCase())}
              placeholder="Örn: GK-7482"
              className="flex-1 bg-white/15 border border-white/30 rounded-2xl px-4 py-3 text-center text-lg font-black tracking-widest text-white placeholder:text-white/40 focus:outline-none focus:border-[#52B788]"
            />
            <button
              type="submit"
              className="px-5 py-3 bg-[#52B788] hover:bg-[#40916C] text-[#002114] font-black text-xs rounded-2xl transition shadow-md"
            >
              Doğrula & Teslim Et
            </button>
          </div>
        </form>

        <button
          onClick={() => setIsScannerOpen(true)}
          className="w-full py-3 bg-white/10 hover:bg-white/20 border border-white/20 rounded-2xl text-xs font-bold text-white flex items-center justify-center gap-2 transition"
        >
          <QrCode className="w-4 h-4 text-[#92F7C3]" />
          <span>Kamerayla Canlı QR Kod Tara</span>
        </button>
      </div>

      {/* Filter Tabs & Search */}
      <div className="flex flex-col sm:flex-row items-center justify-between gap-2">
        <div className="grid grid-cols-3 gap-1 bg-white p-1 rounded-xl border border-gray-100 shadow-sm w-full sm:w-auto">
          {[
            { id: 'pending', label: `Bekleyen (${pendingOrders.length})` },
            { id: 'completed', label: `Tamamlanan (${completedOrders.length})` },
            { id: 'all', label: 'Tümü' },
          ].map(t => (
            <button
              key={t.id}
              onClick={() => setOrderFilter(t.id)}
              className={`py-1.5 px-3 rounded-lg text-[10px] font-bold transition ${
                orderFilter === t.id ? 'bg-[#0F5238] text-white shadow-sm' : 'text-gray-500 hover:text-gray-900'
              }`}
            >
              {t.label}
            </button>
          ))}
        </div>

        <div className="relative w-full sm:w-56">
          <Search className="w-3.5 h-3.5 text-gray-400 absolute left-3 top-1/2 -translate-y-1/2" />
          <input
            type="text"
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            placeholder="Kod veya paket ara..."
            className="w-full pl-8 pr-3 py-1.5 bg-white border border-gray-200 rounded-xl text-xs outline-none"
          />
        </div>
      </div>

      {/* Orders List */}
      <div className="space-y-2.5">
        {filteredOrders.length === 0 ? (
          <div className="bg-white rounded-2xl p-8 text-center border border-gray-100 space-y-2">
            <div className="w-10 h-10 rounded-full bg-[#F0FFF4] flex items-center justify-center mx-auto text-xl">
              📦
            </div>
            <h4 className="text-xs font-bold text-gray-700">Kayıt Bulunamadı</h4>
            <p className="text-[10px] text-gray-400">Seçili filtrede sipariş kaydı bulunmuyor.</p>
          </div>
        ) : (
          filteredOrders.map((ord) => (
            <div
              key={ord.id}
              className="bg-white p-3.5 rounded-2xl border border-gray-100 shadow-sm flex items-center justify-between gap-3"
            >
              <div className="flex items-center gap-3 min-w-0">
                <img
                  src={ord.image}
                  alt={ord.listingTitle}
                  className="w-12 h-12 rounded-xl object-cover flex-shrink-0"
                />
                <div className="min-w-0">
                  <div className="flex items-center gap-1.5 flex-wrap">
                    <span className="font-mono font-black text-xs px-2 py-0.5 bg-[#E8FFF0] text-[#0F5238] rounded-md border border-[#95D5B2]/60">
                      {ord.pickupCode}
                    </span>
                    <span className={`px-2 py-0.2 rounded text-[9px] font-bold ${
                      ord.status === 'confirmed' ? 'bg-amber-100 text-amber-800' : 'bg-[#D1FEE5] text-[#006C48]'
                    }`}>
                      {ord.status === 'confirmed' ? 'Teslim Bekliyor' : 'Teslim Edildi ✓'}
                    </span>
                  </div>
                  <h4 className="font-bold text-xs text-[#0F5238] truncate mt-1">{ord.listingTitle}</h4>
                  <p className="text-[10px] text-gray-400">
                    {ord.portionCount} Paket • {ord.paidAmount} ₺ • {ord.pickupStartTime}–{ord.pickupEndTime}
                  </p>
                </div>
              </div>

              <div className="flex-shrink-0">
                {ord.status === 'confirmed' ? (
                  <button
                    onClick={() => completeDelivery(ord.pickupCode)}
                    className="px-3 py-2 bg-[#0F5238] hover:bg-[#2D6A4F] text-white font-bold text-[10px] rounded-xl shadow transition flex items-center gap-1"
                  >
                    <CheckCircle2 className="w-3.5 h-3.5 text-[#95D5B2]" />
                    <span>Teslim Et</span>
                  </button>
                ) : (
                  <span className="text-[10px] font-bold text-[#10B981] flex items-center gap-0.5">
                    <Check className="w-3.5 h-3.5" />
                    Onaylandı
                  </span>
                )}
              </div>
            </div>
          ))
        )}
      </div>

      {/* QR Scanner Viewfinder Modal */}
      <ScannerModal
        isOpen={isScannerOpen}
        onClose={() => setIsScannerOpen(false)}
      />

    </div>
  );
};
