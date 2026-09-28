import React, { useState } from 'react';
import { useApp } from '../../context/AppContext';
import {
  Truck,
  MapPin,
  CheckCircle2,
  Clock,
  ArrowRight
} from 'lucide-react';

export const NgoDashboardView = () => {
  const { listings, showToast } = useApp();
  const [claimedRequests, setClaimedRequests] = useState([]);

  // Filter bulk / STK level listings
  const bulkListings = listings.filter(l => l.type === 'bulk' || l.portionsAvailable >= 20);

  const handleClaim = (id) => {
    setClaimedRequests(prev => [...prev, id]);
    showToast('Toplu bağış talebi aşeviniz adına başarıyla kabul edildi! 🚚');
  };

  return (
    <div className="space-y-3.5 pb-20 lg:pb-10 animate-in fade-in duration-300">
      
      {/* Top NGO Banner */}
      <div className="bg-gradient-to-r from-[#1E3A8A] to-[#3B82F6] text-white p-4 rounded-2xl shadow-md space-y-2.5">
        <div className="flex items-center justify-between">
          <span className="px-2 py-0.5 rounded-full bg-white/20 text-[9px] font-bold">STK & Aşevi Paneli</span>
          <span className="text-[10px] text-blue-100">TİDER Aşevi</span>
        </div>
        
        <div>
          <h1 className="text-sm font-black">Toplu Dağıtım Merkezi</h1>
          <p className="text-[10px] text-blue-100 mt-0.5 leading-tight">
            Restoran ve otellerden gelen büyük porsiyonlu fazla gıdaları teslim alın.
          </p>
        </div>

        <div className="grid grid-cols-2 gap-2 bg-white/10 backdrop-blur-sm p-2 rounded-xl border border-white/15">
          <div className="text-center">
            <p className="text-base font-black text-white">4.250</p>
            <p className="text-[9px] text-blue-200">Dağıtılan Porsiyon</p>
          </div>
          <div className="text-center border-l border-white/20">
            <p className="text-base font-black text-white">18</p>
            <p className="text-[9px] text-blue-200">Aktif Gönüllü</p>
          </div>
        </div>
      </div>

      {/* Bulk Available Donation Requests */}
      <div className="space-y-2.5">
        <div className="flex items-center justify-between px-0.5">
          <h3 className="text-xs font-bold text-[#0F5238] flex items-center gap-1.5">
            <Truck className="w-3.5 h-3.5 text-[#3B82F6]" />
            Bekleyen Toplu Bağışlar
          </h3>
          <span className="px-2 py-0.5 bg-blue-50 text-blue-700 rounded-lg text-[10px] font-bold">
            {bulkListings.length} Çağrı
          </span>
        </div>

        <div className="space-y-2.5">
          {bulkListings.map((item) => {
            const isClaimed = claimedRequests.includes(item.id);

            return (
              <div
                key={item.id}
                className="bg-white rounded-2xl p-3 border border-gray-100 shadow-sm space-y-2.5"
              >
                <div className="flex items-start justify-between gap-2">
                  <div className="flex items-center gap-2 min-w-0">
                    <img
                      src={item.businessAvatar}
                      alt={item.businessName}
                      className="w-8 h-8 rounded-lg object-cover flex-shrink-0"
                    />
                    <div className="min-w-0">
                      <h4 className="text-[10px] font-bold text-gray-400 truncate">{item.businessName}</h4>
                      <p className="text-[11px] font-bold text-[#0F5238] truncate">{item.title}</p>
                    </div>
                  </div>
                  <span className="px-2 py-0.5 rounded-lg text-[10px] font-extrabold bg-[#3B82F6] text-white flex-shrink-0">
                    {item.portionsAvailable} Porsiyon
                  </span>
                </div>

                <p className="text-[10px] text-gray-600 bg-[#F8FAFC] p-2 rounded-xl border border-gray-100 line-clamp-2">
                  {item.description}
                </p>

                <div className="flex items-center justify-between text-[9px] text-gray-500">
                  <span className="flex items-center gap-0.5 text-[#0F5238] font-bold">
                    <Clock className="w-2.5 h-2.5 text-[#2D6A4F]" />
                    {item.pickupStartTime}–{item.pickupEndTime}
                  </span>
                  <span className="flex items-center gap-0.5">
                    <MapPin className="w-2.5 h-2.5 text-gray-400" />
                    {item.distanceKm} km
                  </span>
                  <span className="text-[#10B981] font-bold">🌱 {item.co2ReductionKg}kg CO₂</span>
                </div>

                <div className="pt-2 border-t border-gray-100">
                  {isClaimed ? (
                    <span className="w-full flex items-center justify-center gap-1 py-2 bg-[#D1FEE5] text-[#006C48] rounded-xl text-[10px] font-bold">
                      <CheckCircle2 className="w-3.5 h-3.5 text-[#10B981]" />
                      Aşevi Adına Kabul Edildi
                    </span>
                  ) : (
                    <button
                      onClick={() => handleClaim(item.id)}
                      className="w-full py-2 bg-[#3B82F6] hover:bg-[#2563EB] text-white rounded-xl text-[10px] font-bold shadow transition flex items-center justify-center gap-1"
                    >
                      <span>Aşevi Adına Kabul Et</span>
                      <ArrowRight className="w-3 h-3" />
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
