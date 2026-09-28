import React, { useState } from 'react';
import { useApp } from '../../context/AppContext';
import { ScannerModal } from '../modals/ScannerModal';
import {
  PlusCircle,
  QrCode,
  TrendingUp,
  PackageCheck,
  Clock,
  ShieldCheck,
  ArrowUpRight
} from 'lucide-react';

export const BusinessDashboardView = () => {
  const {
    listings,
    reservations,
    setActiveTab,
    completeDelivery,
    currentUser,
  } = useApp();

  const [inputCode, setInputCode] = useState('');
  const [isScannerOpen, setIsScannerOpen] = useState(false);

  // Filter listings belonging to this business
  const myListings = listings.filter(l => l.businessId === 'biz_01');
  const pendingOrders = reservations.filter(r => r.status === 'confirmed');

  const handleCodeSubmit = (e) => {
    e.preventDefault();
    if (!inputCode.trim()) return;
    completeDelivery(inputCode);
    setInputCode('');
  };

  return (
    <div className="space-y-3.5 pb-20 lg:pb-10 animate-in fade-in duration-300">
      
      {/* Top Welcome Card */}
      <div className="bg-white p-3.5 rounded-2xl border border-gray-100 shadow-sm flex items-center justify-between gap-3">
        <div className="flex items-center gap-2.5 min-w-0">
          <div className="w-10 h-10 rounded-xl bg-gradient-to-tr from-[#0F5238] to-[#52B788] text-white flex items-center justify-center text-xl shadow flex-shrink-0">
            🏪
          </div>
          <div className="min-w-0">
            <div className="flex items-center gap-1.5 flex-wrap">
              <h1 className="text-xs font-black text-[#0F5238] truncate">{currentUser.name}</h1>
              <span className="px-1.5 py-0.5 rounded-md text-[9px] font-bold bg-[#D1FEE5] text-[#006C48] flex items-center gap-0.5 flex-shrink-0">
                <ShieldCheck className="w-2.5 h-2.5 text-[#10B981]" />
                Onaylı
              </span>
            </div>
            <p className="text-[10px] text-gray-500 truncate mt-0.5">
              Kadıköy • Güven: <strong>%98</strong> • 640 kg Kurtarıldı
            </p>
          </div>
        </div>

        <button
          onClick={() => setActiveTab('business_new_listing')}
          className="flex items-center gap-1 px-2.5 py-2 bg-[#0F5238] hover:bg-[#2D6A4F] text-white font-bold text-[10px] rounded-xl shadow transition flex-shrink-0"
        >
          <PlusCircle className="w-3.5 h-3.5 text-[#95D5B2]" />
          <span>Yeni İlan</span>
        </button>
      </div>

      {/* 4 Stat Cards in 2x2 Grid */}
      <div className="grid grid-cols-2 gap-2.5">
        <div className="bg-white p-3 rounded-2xl border border-gray-100 shadow-sm">
          <p className="text-[10px] font-bold text-gray-400">Aktif İlanlar</p>
          <p className="text-lg font-black text-[#0F5238] mt-0.5">{myListings.length}</p>
          <span className="text-[9px] text-[#52B788] font-bold flex items-center gap-0.5 mt-0.5">
            <PackageCheck className="w-3 h-3" />
            {myListings.reduce((acc, l) => acc + l.portionsAvailable, 0)} paket yayında
          </span>
        </div>

        <div className="bg-white p-3 rounded-2xl border border-gray-100 shadow-sm">
          <p className="text-[10px] font-bold text-gray-400">Bekleyen Teslimat</p>
          <p className="text-lg font-black text-amber-600 mt-0.5">{pendingOrders.length}</p>
          <span className="text-[9px] text-amber-600 font-bold flex items-center gap-0.5 mt-0.5">
            <Clock className="w-3 h-3" />
            QR onay bekliyor
          </span>
        </div>

        <div className="bg-white p-3 rounded-2xl border border-gray-100 shadow-sm">
          <p className="text-[10px] font-bold text-gray-400">Kurtarılan Toplam</p>
          <p className="text-lg font-black text-[#0F5238] mt-0.5">640 kg</p>
          <span className="text-[9px] text-[#006C48] font-bold flex items-center gap-0.5 mt-0.5">
            🌿 1.600 kg CO₂
          </span>
        </div>

        <div className="bg-white p-3 rounded-2xl border border-gray-100 shadow-sm">
          <p className="text-[10px] font-bold text-gray-400">Geri Kazanım</p>
          <p className="text-lg font-black text-[#0F5238] mt-0.5">14.250 ₺</p>
          <span className="text-[9px] text-[#10B981] font-bold flex items-center gap-0.5 mt-0.5">
            <TrendingUp className="w-3 h-3" />
            Sıfır atık geliri
          </span>
        </div>
      </div>

      {/* Delivery Confirmation Box */}
      <div className="bg-gradient-to-br from-[#0F5238] to-[#1B4332] text-white p-4 rounded-2xl shadow-md space-y-3">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-1.5">
            <QrCode className="w-4 h-4 text-[#95D5B2]" />
            <h3 className="font-bold text-xs">Hızlı Teslimat Onayı</h3>
          </div>
          <span className="px-1.5 py-0.5 rounded-md bg-white/20 text-[9px] font-bold">Personel Modu</span>
        </div>

        <form onSubmit={handleCodeSubmit} className="space-y-2">
          <div className="flex gap-2">
            <input
              type="text"
              maxLength={7}
              value={inputCode}
              onChange={(e) => setInputCode(e.target.value.toUpperCase())}
              placeholder="Örn: GK-7482"
              className="flex-1 bg-white/15 border border-white/30 rounded-xl px-3 py-2 text-center text-sm font-black tracking-widest text-white placeholder:text-white/40 focus:outline-none focus:border-[#52B788]"
            />
            <button
              type="submit"
              className="px-3 py-2 bg-[#52B788] hover:bg-[#40916C] text-[#002114] font-black text-xs rounded-xl transition shadow"
            >
              Onayla
            </button>
          </div>
        </form>

        <button
          onClick={() => setIsScannerOpen(true)}
          className="w-full py-2.5 bg-white/10 hover:bg-white/20 border border-white/20 rounded-xl text-[11px] font-bold text-white flex items-center justify-center gap-1.5 transition"
        >
          <QrCode className="w-3.5 h-3.5 text-[#92F7C3]" />
          <span>Kamerayla QR Kod Tara</span>
        </button>
      </div>

      {/* Active Listings in Store */}
      <div className="bg-white p-3.5 rounded-2xl border border-gray-100 shadow-sm space-y-2.5">
        <div className="flex items-center justify-between">
          <div>
            <h3 className="font-bold text-xs text-[#0F5238]">Yayındaki İlanlarınız</h3>
            <p className="text-[10px] text-gray-500">Müşterilerin sipariş verebileceği paketler</p>
          </div>
          <button
            onClick={() => setActiveTab('business_new_listing')}
            className="text-[10px] font-bold text-[#2D6A4F] hover:underline flex items-center gap-0.5"
          >
            <span>Yeni Ekle</span>
            <ArrowUpRight className="w-3 h-3" />
          </button>
        </div>

        <div className="space-y-2">
          {myListings.map((item) => (
            <div
              key={item.id}
              className="flex items-center justify-between p-2.5 rounded-xl bg-[#F8FAFC] border border-gray-100"
            >
              <div className="flex items-center gap-2.5 min-w-0">
                <img
                  src={item.image}
                  alt={item.title}
                  className="w-10 h-10 rounded-lg object-cover flex-shrink-0"
                />
                <div className="min-w-0">
                  <h4 className="font-bold text-[11px] text-[#0F5238] truncate">{item.title}</h4>
                  <p className="text-[9px] text-gray-500 mt-0.5 truncate">
                    {item.pickupStartTime}–{item.pickupEndTime} • {item.portionsAvailable}/{item.portionsTotal} paket
                  </p>
                </div>
              </div>

              <div className="text-right flex-shrink-0 ml-2">
                <span className="text-xs font-black text-[#0F5238] block">{item.priceDiscounted} ₺</span>
                <span className="text-[9px] text-gray-400 line-through">{item.priceOriginal} ₺</span>
              </div>
            </div>
          ))}
        </div>
      </div>

      {/* QR Scanner Viewfinder Modal */}
      <ScannerModal
        isOpen={isScannerOpen}
        onClose={() => setIsScannerOpen(false)}
      />

    </div>
  );
};
