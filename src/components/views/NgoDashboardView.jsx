import React, { useState } from 'react';
import { useApp } from '../../context/AppContext';
import {
  HeartHandshake,
  Truck,
  MapPin,
  Users,
  CheckCircle2,
  Clock,
  Building2,
  Sparkles,
  ArrowRight
} from 'lucide-react';

export const NgoDashboardView = () => {
  const { listings, showToast } = useApp();
  const [claimedRequests, setClaimedRequests] = useState([]);

  // Filter bulk / STK level listings
  const bulkListings = listings.filter(l => l.type === 'bulk' || l.portionsAvailable >= 20);

  const handleClaim = (id) => {
    setClaimedRequests(prev => [...prev, id]);
    showToast('Toplu bağış talebi aşeviniz adına başarıyla kabul edildi! Lojistik ekibine bildirim iletildi. 🚚');
  };

  return (
    <div className="space-y-6 pb-20 lg:pb-10 max-w-6xl mx-auto animate-in fade-in duration-300">
      
      {/* Top NGO Banner */}
      <div className="bg-gradient-to-r from-[#1E3A8A] to-[#3B82F6] text-white p-6 sm:p-8 rounded-3xl shadow-xl flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <div className="flex items-center gap-2">
            <span className="px-3 py-1 rounded-full bg-white/20 text-xs font-bold">STK & Dayanışma Paneli</span>
            <span className="text-xs text-blue-100">Temel İhtiyaç Derneği (TİDER)</span>
          </div>
          <h1 className="text-2xl sm:text-3xl font-black mt-2">Aşevi ve Toplu Gıda Dağıtım Merkezi</h1>
          <p className="text-xs text-blue-100 mt-1 max-w-lg">
            Otel, restoran ve catering firmalarından gelen büyük porsiyonlu fazla gıdaları teslim alıp ihtiyaç sahiplerine ulaştırın.
          </p>
        </div>

        <div className="flex items-center gap-3 bg-white/10 backdrop-blur-md p-3 rounded-2xl border border-white/20">
          <div className="text-center px-2">
            <p className="text-xl font-black text-white">4.250</p>
            <p className="text-[10px] text-blue-200">Bu Ay Dağıtılan Porsiyon</p>
          </div>
          <div className="w-px h-8 bg-white/20"></div>
          <div className="text-center px-2">
            <p className="text-xl font-black text-white">18</p>
            <p className="text-[10px] text-blue-200">Aktif Gönüllü</p>
          </div>
        </div>
      </div>

      {/* Bulk Available Donation Requests */}
      <div className="space-y-4">
        <div className="flex items-center justify-between">
          <div>
            <h3 className="text-lg font-bold text-[#0F5238] flex items-center gap-2">
              <Truck className="w-5 h-5 text-[#3B82F6]" />
              Bekleyen Toplu Bağış Çağrıları
            </h3>
            <p className="text-xs text-gray-500">Soğuk zincir veya sıcak servis araçlarıyla teslim alınmaya hazır bağışlar</p>
          </div>
          <span className="px-3 py-1 bg-blue-50 text-blue-700 rounded-xl text-xs font-bold">
            {bulkListings.length} Aktif Çağrı
          </span>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          {bulkListings.map((item) => {
            const isClaimed = claimedRequests.includes(item.id);

            return (
              <div
                key={item.id}
                className="bg-white rounded-3xl p-5 border border-gray-100 shadow-sm flex flex-col justify-between space-y-4"
              >
                <div>
                  <div className="flex items-start justify-between gap-3">
                    <div className="flex items-center gap-2.5">
                      <img
                        src={item.businessAvatar}
                        alt={item.businessName}
                        className="w-10 h-10 rounded-xl object-cover"
                      />
                      <div>
                        <h4 className="text-xs font-bold text-gray-500">{item.businessName}</h4>
                        <p className="text-sm font-bold text-[#0F5238]">{item.title}</p>
                      </div>
                    </div>
                    <span className="px-2.5 py-1 rounded-xl text-xs font-extrabold bg-[#3B82F6] text-white">
                      {item.portionsAvailable} Porsiyon
                    </span>
                  </div>

                  <p className="text-xs text-gray-600 mt-3 bg-[#F8FAFC] p-3 rounded-xl border border-gray-100">
                    {item.description}
                  </p>

                  <div className="flex flex-wrap items-center gap-3 text-xs text-gray-500 mt-3">
                    <span className="flex items-center gap-1 font-semibold text-[#0F5238]">
                      <Clock className="w-3.5 h-3.5 text-[#2D6A4F]" />
                      Teslim: Bugün {item.pickupStartTime} - {item.pickupEndTime}
                    </span>
                    <span>•</span>
                    <span className="flex items-center gap-1">
                      <MapPin className="w-3.5 h-3.5 text-gray-400" />
                      {item.distanceKm} km
                    </span>
                    <span>•</span>
                    <span>~{item.weightKg} kg</span>
                  </div>
                </div>

                <div className="pt-3 border-t border-gray-100 flex items-center justify-between">
                  <span className="text-xs font-bold text-[#10B981]">
                    🌱 {item.co2ReductionKg} kg CO₂ Tasarrufu
                  </span>

                  {isClaimed ? (
                    <span className="flex items-center gap-1 px-4 py-2 bg-[#D1FEE5] text-[#006C48] rounded-xl text-xs font-bold">
                      <CheckCircle2 className="w-4 h-4 text-[#10B981]" />
                      Kabul Edildi
                    </span>
                  ) : (
                    <button
                      onClick={() => handleClaim(item.id)}
                      className="px-5 py-2.5 bg-[#3B82F6] hover:bg-[#2563EB] text-white rounded-xl text-xs font-bold shadow-md transition flex items-center gap-1.5"
                    >
                      <span>Aşevi Adına Kabul Et</span>
                      <ArrowRight className="w-3.5 h-3.5" />
                    </button>
                  )}
                </div>
              </div>
            );
          })}
        </div>
      </div>

    </div>
  );
};
