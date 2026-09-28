import React, { useState } from 'react';
import { useApp } from '../../context/AppContext';
import {
  LayoutDashboard,
  PlusCircle,
  QrCode,
  TrendingUp,
  PackageCheck,
  Clock,
  ShieldCheck,
  CheckCircle2,
  AlertCircle,
  BarChart2,
  Store,
  ArrowUpRight
} from 'lucide-react';

export const BusinessDashboardView = () => {
  const {
    listings,
    reservations,
    setActiveTab,
    completeDelivery,
    currentUser,
    setSelectedListing
  } = useApp();

  const [inputCode, setInputCode] = useState('');
  const [isScanning, setIsScanning] = useState(false);

  // Filter listings belonging to this business
  const myListings = listings.filter(l => l.businessId === 'biz_01');
  const pendingOrders = reservations.filter(r => r.status === 'confirmed');
  const completedOrders = reservations.filter(r => r.status === 'completed');

  const handleCodeSubmit = (e) => {
    e.preventDefault();
    if (!inputCode.trim()) return;
    completeDelivery(inputCode);
    setInputCode('');
  };

  const handleSimulateScan = () => {
    setIsScanning(true);
    setTimeout(() => {
      setIsScanning(false);
      const target = pendingOrders[0];
      if (target) {
        completeDelivery(target.pickupCode);
      }
    }, 1500);
  };

  return (
    <div className="space-y-6 pb-20 lg:pb-10 max-w-6xl mx-auto animate-in fade-in duration-300">
      
      {/* Top Welcome Bar */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 bg-white p-6 rounded-3xl border border-gray-100 shadow-sm">
        <div className="flex items-center gap-4">
          <div className="w-14 h-14 rounded-2xl bg-gradient-to-tr from-[#0F5238] to-[#52B788] text-white flex items-center justify-center text-2xl shadow-md">
            🏪
          </div>
          <div>
            <div className="flex items-center gap-2">
              <h1 className="text-xl font-black text-[#0F5238]">{currentUser.name}</h1>
              <span className="px-2.5 py-0.5 rounded-full text-[10px] font-bold bg-[#D1FEE5] text-[#006C48] border border-[#52B788]/30 flex items-center gap-1">
                <ShieldCheck className="w-3.5 h-3.5 text-[#10B981]" />
                Onaylı İşletme
              </span>
            </div>
            <p className="text-xs text-gray-500 mt-0.5">
              Kadıköy / Moda • Güven Skoru: <strong>%98</strong> • Toplam 640 kg Gıda Kurtarıldı
            </p>
          </div>
        </div>

        <button
          onClick={() => setActiveTab('business_new_listing')}
          className="flex items-center justify-center gap-2 px-5 py-3 bg-[#0F5238] hover:bg-[#2D6A4F] text-white font-bold text-xs rounded-2xl shadow-lg shadow-[#0F5238]/20 transition hover:scale-105"
        >
          <PlusCircle className="w-4 h-4 text-[#95D5B2]" />
          <span>Yeni İlan Paylaş</span>
        </button>
      </div>

      {/* 4 Stat Cards */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
        
        <div className="bg-white p-5 rounded-3xl border border-gray-100 shadow-sm">
          <p className="text-xs font-bold text-gray-400">Aktif İlanlarım</p>
          <p className="text-2xl font-black text-[#0F5238] mt-1">{myListings.length}</p>
          <span className="text-[11px] text-[#52B788] font-bold flex items-center gap-1 mt-1">
            <PackageCheck className="w-3.5 h-3.5" />
            {myListings.reduce((acc, l) => acc + l.portionsAvailable, 0)} paket yayında
          </span>
        </div>

        <div className="bg-white p-5 rounded-3xl border border-gray-100 shadow-sm">
          <p className="text-xs font-bold text-gray-400">Bekleyen Teslimatlar</p>
          <p className="text-2xl font-black text-amber-600 mt-1">{pendingOrders.length}</p>
          <span className="text-[11px] text-amber-600 font-bold flex items-center gap-1 mt-1">
            <Clock className="w-3.5 h-3.5" />
            QR / Kod onayı bekliyor
          </span>
        </div>

        <div className="bg-white p-5 rounded-3xl border border-gray-100 shadow-sm">
          <p className="text-xs font-bold text-gray-400">Kurtarılan Toplam</p>
          <p className="text-2xl font-black text-[#0F5238] mt-1">640 kg</p>
          <span className="text-[11px] text-[#006C48] font-bold flex items-center gap-1 mt-1">
            🌿 1.600 kg CO₂ önlendi
          </span>
        </div>

        <div className="bg-white p-5 rounded-3xl border border-gray-100 shadow-sm">
          <p className="text-xs font-bold text-gray-400">Geri Kazanılan Gelir</p>
          <p className="text-2xl font-black text-[#0F5238] mt-1">14.250 ₺</p>
          <span className="text-[11px] text-[#10B981] font-bold flex items-center gap-1 mt-1">
            <TrendingUp className="w-3.5 h-3.5" />
            Atık maliyeti sıfırlandı
          </span>
        </div>

      </div>

      {/* Main Grid: Fast Delivery Confirmation & Active Listings */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        
        {/* Fast Delivery QR / 4-Digit Code Box */}
        <div className="bg-gradient-to-br from-[#0F5238] to-[#1B4332] text-white p-6 rounded-3xl shadow-xl space-y-4 flex flex-col justify-between">
          <div>
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-2">
                <QrCode className="w-6 h-6 text-[#95D5B2]" />
                <h3 className="font-bold text-base">Hızlı Teslimat Onayı</h3>
              </div>
              <span className="px-2 py-0.5 rounded-lg bg-white/20 text-[10px] font-bold">Personel Modu</span>
            </div>

            <p className="text-xs text-white/80 mt-2 leading-relaxed">
              Müşterinin cep telefonundaki 4 haneli teslimat kodunu girin veya kamerayla QR kodunu tarayın.
            </p>
          </div>

          <div className="space-y-3">
            <form onSubmit={handleCodeSubmit} className="space-y-2">
              <label className="text-[11px] font-bold text-[#B1F0CE] uppercase tracking-wider block">4 Haneli Kod Girişi</label>
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
                  className="px-4 py-3 bg-[#52B788] hover:bg-[#40916C] text-[#002114] font-black text-xs rounded-2xl transition"
                >
                  Onayla
                </button>
              </div>
            </form>

            <div className="text-center">
              <span className="text-xs text-white/50">veya</span>
            </div>

            <button
              onClick={handleSimulateScan}
              disabled={isScanning}
              className="w-full py-3 bg-white/10 hover:bg-white/20 border border-white/20 rounded-2xl text-xs font-bold text-white flex items-center justify-center gap-2 transition"
            >
              <QrCode className="w-4 h-4 text-[#92F7C3]" />
              <span>{isScanning ? 'Kamera Taranıyor...' : 'Kamerayla QR Tara (Simülasyon)'}</span>
            </button>
          </div>
        </div>

        {/* Active Listings in Store */}
        <div className="lg:col-span-2 bg-white p-6 rounded-3xl border border-gray-100 shadow-sm space-y-4">
          <div className="flex items-center justify-between">
            <div>
              <h3 className="font-bold text-base text-[#0F5238]">Yayındaki İlanlarınız</h3>
              <p className="text-xs text-gray-500">Müşterilerin şu an rezerve edebileceği aktif paketler</p>
            </div>
            <button
              onClick={() => setActiveTab('business_new_listing')}
              className="text-xs font-bold text-[#2D6A4F] hover:underline flex items-center gap-1"
            >
              <span>Yeni Ekle</span>
              <ArrowUpRight className="w-3.5 h-3.5" />
            </button>
          </div>

          <div className="space-y-3">
            {myListings.map((item) => (
              <div
                key={item.id}
                className="flex items-center justify-between p-3.5 rounded-2xl bg-[#F8FAFC] border border-gray-100 hover:border-[#52B788]/40 transition"
              >
                <div className="flex items-center gap-3">
                  <img
                    src={item.image}
                    alt={item.title}
                    className="w-14 h-14 rounded-xl object-cover"
                  />
                  <div>
                    <h4 className="font-bold text-xs sm:text-sm text-[#0F5238]">{item.title}</h4>
                    <p className="text-[11px] text-gray-500 mt-0.5">
                      Teslim: {item.pickupStartTime} - {item.pickupEndTime} • {item.portionsAvailable} / {item.portionsTotal} Paket
                    </p>
                  </div>
                </div>

                <div className="text-right">
                  <span className="text-sm font-black text-[#0F5238] block">{item.priceDiscounted} ₺</span>
                  <span className="text-[10px] text-gray-400 line-through">{item.priceOriginal} ₺</span>
                </div>
              </div>
            ))}
          </div>
        </div>

      </div>

    </div>
  );
};
