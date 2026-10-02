import React, { useState } from 'react';
import { useApp } from '../../context/AppContext';
import { ScannerModal } from '../modals/ScannerModal';
import { OrganisationImagesModal } from '../modals/OrganisationImagesModal';
import { computeOrgStats } from '../../utils/orgStats';
import {
  PlusCircle,
  ImagePlus,
  QrCode,
  TrendingUp,
  PackageCheck,
  Clock,
  ShieldCheck,
  ArrowUpRight,
  Plus,
  Minus,
  Trash2
} from 'lucide-react';

export const BusinessDashboardView = () => {
  const {
    myListings,
    myReservations,
    setActiveTab,
    currentUser,
    updateListingPortions,
    deleteListing,
    businesses,
    myOrganisationId,
  } = useApp();

  const [isScannerOpen, setIsScannerOpen] = useState(false);
  const [isImagesOpen, setIsImagesOpen] = useState(false);
  const myOrganisation = businesses.find(b => b.id === myOrganisationId);
  const orgStats = computeOrgStats(myReservations);
  const [activeTabSub, setActiveTabSub] = useState('listings'); // 'listings' | 'orders'

  const pendingOrders = myReservations.filter(r => r.status === 'confirmed');

  return (
    <div className="space-y-3.5 pb-20 lg:pb-10 animate-in fade-in duration-300">
      
      {/* Top Welcome Card */}
      <div className="bg-white p-3.5 rounded-2xl border border-gray-100 shadow-sm flex items-center justify-between gap-3">
        <div className="flex items-center gap-2.5 min-w-0">
          {myOrganisation?.avatar ? (
            <img src={myOrganisation.avatar} alt={myOrganisation.name} className="w-10 h-10 rounded-xl object-cover shadow flex-shrink-0" />
          ) : (
            <div className="w-10 h-10 rounded-xl bg-gradient-to-tr from-[#0F5238] to-[#52B788] text-white flex items-center justify-center text-xl shadow flex-shrink-0">
              🏪
            </div>
          )}
          <div className="min-w-0">
            <div className="flex items-center gap-1.5 flex-wrap">
              <h1 className="text-xs font-black text-[#0F5238] truncate">{currentUser.name}</h1>
              <span className="px-1.5 py-0.5 rounded-md text-[9px] font-bold bg-[#D1FEE5] text-[#006C48] flex items-center gap-0.5 flex-shrink-0">
                <ShieldCheck className="w-2.5 h-2.5 text-[#10B981]" />
                Onaylı
              </span>
            </div>
            <p className="text-[10px] text-gray-500 truncate mt-0.5">
              {myOrganisation?.type || 'Kurum'} • Güven: <strong>%{myOrganisation?.trustScore ?? '—'}</strong> • {orgStats.savedKg} kg Kurtarıldı
            </p>
          </div>
        </div>

        <div className="flex items-center gap-1.5 flex-shrink-0">
        {myOrganisation && (
          <button
            onClick={() => setIsImagesOpen(true)}
            title="Logo ve kapak görselini düzenle"
            className="flex items-center gap-1 px-2.5 py-2 bg-white border border-gray-200 text-gray-700 font-bold text-[10px] rounded-xl hover:border-[#52B788] transition"
          >
            <ImagePlus className="w-3.5 h-3.5" />
            <span>Görseller</span>
          </button>
        )}
        <button
          onClick={() => setActiveTab('business_new_listing')}
          className="flex items-center gap-1 px-2.5 py-2 bg-[#0F5238] hover:bg-[#2D6A4F] text-white font-bold text-[10px] rounded-xl shadow transition flex-shrink-0"
        >
          <PlusCircle className="w-3.5 h-3.5 text-[#95D5B2]" />
          <span>Yeni İlan</span>
        </button>
        </div>
      </div>

      {isImagesOpen && myOrganisation && (
        <OrganisationImagesModal organisationId={myOrganisation.id} onClose={() => setIsImagesOpen(false)} />
      )}

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
          <p className="text-lg font-black text-[#0F5238] mt-0.5">{orgStats.savedKg} kg</p>
          <span className="text-[9px] text-[#006C48] font-bold flex items-center gap-0.5 mt-0.5">
            🌿 {orgStats.co2Kg} kg CO₂
          </span>
        </div>

        <div className="bg-white p-3 rounded-2xl border border-gray-100 shadow-sm">
          <p className="text-[10px] font-bold text-gray-400">Geri Kazanım</p>
          <p className="text-lg font-black text-[#0F5238] mt-0.5">{orgStats.revenue.toLocaleString('tr-TR')} ₺</p>
          <span className="text-[9px] text-[#10B981] font-bold flex items-center gap-0.5 mt-0.5">
            <TrendingUp className="w-3 h-3" />
            Sıfır atık geliri
          </span>
        </div>
      </div>

      {/* Fast Delivery Confirmation Box */}
      <div className="bg-gradient-to-br from-[#0F5238] to-[#1B4332] text-white p-4 rounded-2xl shadow-md space-y-3">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-1.5">
            <QrCode className="w-4 h-4 text-[#95D5B2]" />
            <h3 className="font-bold text-xs">Hızlı Teslimat Onayı</h3>
          </div>
          <span className="px-1.5 py-0.5 rounded-md bg-white/20 text-[9px] font-bold">Personel Girişi</span>
        </div>

        <button
          onClick={() => setIsScannerOpen(true)}
          className="w-full py-2 bg-white/10 hover:bg-white/20 border border-white/20 rounded-xl text-[11px] font-bold text-white flex items-center justify-center gap-1.5 transition"
        >
          <QrCode className="w-3.5 h-3.5 text-[#92F7C3]" />
          <span>Kamerayla QR Kod Tara</span>
        </button>
      </div>

      {/* Tabs: Yayındaki İlanlar / Bekleyen Siparişler */}
      <div className="grid grid-cols-2 gap-1 bg-white p-1 rounded-xl border border-gray-100 shadow-sm">
        <button
          onClick={() => setActiveTabSub('listings')}
          className={`py-1.5 text-center rounded-lg text-xs font-bold transition ${
            activeTabSub === 'listings' ? 'bg-[#0F5238] text-white shadow-sm' : 'text-gray-500'
          }`}
        >
          Yayındaki İlanlar ({myListings.length})
        </button>
        <button
          onClick={() => setActiveTabSub('orders')}
          className={`py-1.5 text-center rounded-lg text-xs font-bold transition ${
            activeTabSub === 'orders' ? 'bg-[#0F5238] text-white shadow-sm' : 'text-gray-500'
          }`}
        >
          Bekleyen Siparişler ({pendingOrders.length})
        </button>
      </div>

      {/* Tab Content */}
      {activeTabSub === 'listings' ? (
        <div className="bg-white p-3 rounded-2xl border border-gray-100 shadow-sm space-y-2.5">
          <div className="flex items-center justify-between">
            <h3 className="font-bold text-xs text-[#0F5238]">Stok ve Porsiyon Yönetimi</h3>
            <button
              onClick={() => setActiveTab('business_new_listing')}
              className="text-[10px] font-bold text-[#2D6A4F] hover:underline flex items-center gap-0.5"
            >
              <span>Yeni İlan</span>
              <ArrowUpRight className="w-3 h-3" />
            </button>
          </div>

          <div className="space-y-2">
            {myListings.length === 0 ? (
              <p className="text-center text-xs text-gray-400 py-4">Şu an aktif ilanınız yok.</p>
            ) : (
              myListings.map((item) => (
                <div
                  key={item.id}
                  className="p-2.5 rounded-xl bg-[#F8FAFC] border border-gray-100 space-y-2"
                >
                  <div className="flex items-center justify-between gap-2">
                    <div className="flex items-center gap-2 min-w-0">
                      <img
                        src={item.image}
                        alt={item.title}
                        className="w-10 h-10 rounded-lg object-cover flex-shrink-0"
                      />
                      <div className="min-w-0">
                        <h4 className="font-bold text-[11px] text-[#0F5238] truncate">{item.title}</h4>
                        <p className="text-[9px] text-gray-400">
                          {item.pickupStartTime}–{item.pickupEndTime} • {item.priceDiscounted} ₺
                        </p>
                      </div>
                    </div>

                    <button
                      onClick={() => deleteListing(item.id)}
                      className="text-gray-400 hover:text-red-500 p-1 flex-shrink-0"
                      title="İlanı Kaldır"
                    >
                      <Trash2 className="w-3.5 h-3.5" />
                    </button>
                  </div>

                  {/* Portion Quick Stepper */}
                  <div className="flex items-center justify-between pt-1 border-t border-gray-100 text-[10px]">
                    <span className="text-gray-500 font-medium">
                      Kalan Stok: <strong className="text-[#0F5238]">{item.portionsAvailable} Paket</strong>
                    </span>

                    <div className="flex items-center gap-1 bg-white border border-gray-200 rounded-lg p-0.5 shadow-sm">
                      <button
                        onClick={() => updateListingPortions(item.id, -1)}
                        className="w-6 h-6 flex items-center justify-center text-gray-600 hover:bg-gray-100 rounded"
                        title="1 Azalt"
                      >
                        <Minus className="w-3 h-3" />
                      </button>
                      <span className="w-5 text-center font-bold text-[#0F5238]">{item.portionsAvailable}</span>
                      <button
                        onClick={() => updateListingPortions(item.id, 1)}
                        className="w-6 h-6 flex items-center justify-center text-gray-600 hover:bg-gray-100 rounded"
                        title="1 Artır"
                      >
                        <Plus className="w-3 h-3" />
                      </button>
                    </div>
                  </div>
                </div>
              ))
            )}
          </div>
        </div>
      ) : (
        <div className="bg-white p-3 rounded-2xl border border-gray-100 shadow-sm space-y-2">
          <h3 className="font-bold text-xs text-[#0F5238]">Teslim Edilecek Müşteri Siparişleri</h3>
          {pendingOrders.length === 0 ? (
            <p className="text-center text-xs text-gray-400 py-4">Bekleyen sipariş bulunmuyor.</p>
          ) : (
            pendingOrders.map((ord) => (
              <div
                key={ord.id}
                className="p-2.5 rounded-xl bg-[#F8FAFC] border border-gray-100 flex items-center justify-between gap-2"
              >
                <div className="min-w-0">
                  <span className="text-[9px] font-bold text-gray-400 block truncate">{ord.createdAt}</span>
                  <h4 className="font-bold text-[11px] text-[#0F5238] truncate">{ord.listingTitle}</h4>
                  <p className="text-[9px] text-[#2D6A4F] font-semibold">
                    Kod: <strong>{ord.pickupCode}</strong> • {ord.portionCount} Paket ({ord.paidAmount} ₺)
                  </p>
                </div>

                <span className="px-2.5 py-1.5 bg-gray-100 text-gray-500 font-bold text-[9px] rounded-lg flex items-center gap-1 flex-shrink-0">
                  <QrCode className="w-3 h-3" />
                  <span>QR bekleniyor</span>
                </span>
              </div>
            ))
          )}
        </div>
      )}

      {/* QR Scanner Viewfinder Modal */}
      <ScannerModal
        isOpen={isScannerOpen}
        onClose={() => setIsScannerOpen(false)}
      />

    </div>
  );
};
