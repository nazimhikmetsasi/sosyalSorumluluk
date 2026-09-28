import React, { useState } from 'react';
import { useApp } from '../../context/AppContext';
import {
  Truck,
  MapPin,
  CheckCircle2,
  Clock,
  ArrowRight,
  ShieldCheck,
  Users,
  Navigation
} from 'lucide-react';

export const NgoDashboardView = () => {
  const { listings, showToast } = useApp();
  const [claimedRequests, setClaimedRequests] = useState([]);
  const [selectedVehicle, setSelectedVehicle] = useState('Soğuk Zincir Kamyoneti');
  const [activeNgoTab, setActiveNgoTab] = useState('requests'); // 'requests' | 'volunteers'

  // Filter bulk / STK level listings
  const bulkListings = listings.filter(l => l.type === 'bulk' || l.portionsAvailable >= 10);

  const handleClaim = (id) => {
    setClaimedRequests(prev => [...prev, id]);
    showToast(`Toplu bağış "${selectedVehicle}" aracı yönlendirilerek kabul edildi! 🚚`);
  };

  const volunteerList = [
    { name: 'Mert Aksoy', role: 'Saha Dağıtım Sorumlusu', location: 'Kadıköy Aşevi', status: 'Aktif Görevde' },
    { name: 'Zeynep Kaya', role: 'Soğuk Zincir Şoförü', location: 'Üsküdar Ring', status: 'Yolda (15 dk)' },
    { name: 'Deniz Eren', role: 'Erzak Paketleme', location: 'Merkez Depo', status: 'Hazırda' },
  ];

  return (
    <div className="space-y-3.5 pb-20 lg:pb-10 animate-in fade-in duration-300">
      
      {/* Top NGO Banner */}
      <div className="bg-gradient-to-r from-[#1E3A8A] to-[#3B82F6] text-white p-4 rounded-2xl shadow-md space-y-2.5">
        <div className="flex items-center justify-between">
          <span className="px-2 py-0.5 rounded-full bg-white/20 text-[9px] font-bold">STK & Aşevi Paneli</span>
          <span className="text-[10px] text-blue-100 flex items-center gap-1">
            <ShieldCheck className="w-3 h-3 text-blue-200" />
            TİDER Yetkili
          </span>
        </div>
        
        <div>
          <h1 className="text-sm font-black">Aşevi ve Dağıtım Lojistiği</h1>
          <p className="text-[10px] text-blue-100 mt-0.5 leading-tight">
            Restoran ve toptancılardan gelen büyük porsiyonlu fazla gıdaları teslim alın.
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

      {/* Tabs */}
      <div className="grid grid-cols-2 gap-1 bg-white p-1 rounded-xl border border-gray-100 shadow-sm">
        <button
          onClick={() => setActiveNgoTab('requests')}
          className={`py-1.5 text-center rounded-lg text-xs font-bold transition ${
            activeNgoTab === 'requests' ? 'bg-[#1E3A8A] text-white shadow-sm' : 'text-gray-500'
          }`}
        >
          Toplu Bağış Çağrıları ({bulkListings.length})
        </button>
        <button
          onClick={() => setActiveNgoTab('volunteers')}
          className={`py-1.5 text-center rounded-lg text-xs font-bold transition ${
            activeNgoTab === 'volunteers' ? 'bg-[#1E3A8A] text-white shadow-sm' : 'text-gray-500'
          }`}
        >
          Gönüllü & Araç Filosu
        </button>
      </div>

      {/* Requests Tab */}
      {activeNgoTab === 'requests' ? (
        <div className="space-y-2.5">
          {/* Vehicle selector */}
          <div className="bg-white p-3 rounded-2xl border border-gray-100 shadow-sm space-y-1.5">
            <label className="text-[10px] font-bold text-gray-500 uppercase tracking-wider block">
              Lojistik Araç Türü:
            </label>
            <div className="grid grid-cols-3 gap-1.5">
              {[
                { id: 'Soğuk Zincir Kamyoneti', label: '🚚 Soğuk Zincir' },
                { id: 'Panelvan', label: '🚐 Panelvan' },
                { id: 'Kurye', label: '🛵 Hızlı Kurye' },
              ].map(v => (
                <button
                  key={v.id}
                  onClick={() => setSelectedVehicle(v.id)}
                  className={`py-1 px-1 rounded-lg text-[9px] font-bold border transition ${
                    selectedVehicle === v.id ? 'bg-blue-50 border-blue-500 text-blue-800' : 'bg-gray-50 border-gray-200 text-gray-600'
                  }`}
                >
                  {v.label}
                </button>
              ))}
            </div>
          </div>

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
                      {selectedVehicle} ile Yolda
                    </span>
                  ) : (
                    <button
                      onClick={() => handleClaim(item.id)}
                      className="w-full py-2 bg-[#3B82F6] hover:bg-[#2563EB] text-white rounded-xl text-[10px] font-bold shadow transition flex items-center justify-center gap-1"
                    >
                      <span>{selectedVehicle} ile Teslim Al</span>
                      <ArrowRight className="w-3 h-3" />
                    </button>
                  )}
                </div>
              </div>
            );
          })}
        </div>
      ) : (
        <div className="bg-white p-3 rounded-2xl border border-gray-100 shadow-sm space-y-2">
          <h3 className="font-bold text-xs text-[#0F5238] flex items-center gap-1">
            <Users className="w-3.5 h-3.5 text-blue-600" />
            Aktif Saha Ekibi & Gönüllüler
          </h3>

          <div className="space-y-1.5">
            {volunteerList.map((vol, idx) => (
              <div
                key={idx}
                className="p-2.5 rounded-xl bg-[#F8FAFC] border border-gray-100 flex items-center justify-between text-xs"
              >
                <div>
                  <h4 className="font-bold text-[#0F5238] text-[11px]">{vol.name}</h4>
                  <p className="text-[9px] text-gray-400">{vol.role} • {vol.location}</p>
                </div>
                <span className="px-2 py-0.5 rounded-md text-[9px] font-bold bg-[#D1FEE5] text-[#006C48]">
                  {vol.status}
                </span>
              </div>
            ))}
          </div>
        </div>
      )}

    </div>
  );
};
