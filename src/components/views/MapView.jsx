import React, { useState } from 'react';
import { useApp } from '../../context/AppContext';
import {
  MapPin,
  Navigation,
  Clock,
  Layers,
  Sparkles,
  ShoppingBag,
  SlidersHorizontal,
  ChevronRight,
  Info
} from 'lucide-react';

export const MapView = () => {
  const { listings, setSelectedListing, maxDistance, setMaxDistance } = useApp();
  const [selectedPin, setSelectedPin] = useState(listings[0] || null);
  const [filterType, setFilterType] = useState('all');

  const filteredMapListings = listings.filter(item => {
    if (filterType !== 'all' && item.type !== filterType) return false;
    return item.distanceKm <= maxDistance;
  });

  return (
    <div className="relative h-[calc(100vh-140px)] w-full rounded-3xl overflow-hidden shadow-xl border border-[#2D6A4F]/20 flex flex-col md:flex-row bg-[#E8FFF0]">
      
      {/* Interactive Map Visual Stage */}
      <div className="relative flex-1 bg-[#D8F3DC] overflow-hidden flex items-center justify-center">
        
        {/* Stylized Vector Map Background (OpenStreetMap Aesthetic) */}
        <div className="absolute inset-0 opacity-40 bg-[radial-gradient(#2D6A4F_1px,transparent_1px)] [background-size:24px_24px]"></div>
        
        {/* Simulated Map Road Grid Lines */}
        <svg className="absolute inset-0 w-full h-full stroke-[#52B788]/30 stroke-[3]" xmlns="http://www.w3.org/2000/svg">
          <path d="M 0 150 Q 300 200 600 120 T 1200 300" fill="none" />
          <path d="M 100 0 Q 200 400 350 800" fill="none" />
          <path d="M 500 0 Q 550 300 800 900" fill="none" />
          <path d="M 0 450 Q 400 400 900 600" fill="none" />
          <circle cx="45%" cy="50%" r="180" fill="none" stroke="#2D6A4F" strokeWidth="1.5" strokeDasharray="6 6" opacity="0.3" />
        </svg>

        {/* User Location Radar Pulse */}
        <div className="absolute top-1/2 left-[45%] -translate-x-1/2 -translate-y-1/2 z-20 flex flex-col items-center">
          <div className="relative flex items-center justify-center">
            <div className="w-8 h-8 rounded-full bg-[#0F5238] text-white flex items-center justify-center shadow-lg border-2 border-white z-10">
              <Navigation className="w-4 h-4 fill-white" />
            </div>
            <div className="absolute w-12 h-12 rounded-full bg-[#52B788]/40 animate-ping"></div>
          </div>
          <span className="mt-1 px-2 py-0.5 rounded-full bg-white/90 text-[#0F5238] text-[10px] font-extrabold shadow-sm">
            Konumunuz (Kadıköy)
          </span>
        </div>

        {/* Dynamic Map Pins */}
        {filteredMapListings.map((item, idx) => {
          const isSelected = selectedPin?.id === item.id;
          // Offset coordinates for simulation display
          const topOffsets = ['35%', '65%', '40%', '75%'];
          const leftOffsets = ['30%', '60%', '75%', '25%'];

          return (
            <button
              key={item.id}
              onClick={() => setSelectedPin(item)}
              style={{
                top: topOffsets[idx % topOffsets.length],
                left: leftOffsets[idx % leftOffsets.length],
              }}
              className={`absolute z-30 transform -translate-x-1/2 -translate-y-full transition-all duration-300 hover:scale-110 focus:outline-none ${
                isSelected ? 'scale-125 z-40' : ''
              }`}
            >
              <div className="relative flex flex-col items-center group">
                <div
                  className={`flex items-center gap-1 px-2.5 py-1 rounded-2xl shadow-xl border text-xs font-bold transition-all ${
                    isSelected
                      ? 'bg-[#0F5238] text-white border-white scale-105'
                      : item.type === 'free'
                      ? 'bg-[#10B981] text-white border-white'
                      : 'bg-white text-[#0F5238] border-[#52B788]'
                  }`}
                >
                  <span>{item.type === 'free' ? '🌱 Ücretsiz' : `${item.priceDiscounted} ₺`}</span>
                </div>

                <div
                  className={`w-3.5 h-3.5 rotate-45 -mt-1.5 border-r border-b ${
                    isSelected
                      ? 'bg-[#0F5238] border-white'
                      : item.type === 'free'
                      ? 'bg-[#10B981] border-white'
                      : 'bg-white border-[#52B788]'
                  }`}
                ></div>
              </div>
            </button>
          );
        })}

        {/* Floating Map Controls */}
        <div className="absolute top-4 left-4 z-30 bg-white/90 backdrop-blur-md p-3 rounded-2xl shadow-lg border border-gray-100 space-y-2">
          <div className="flex items-center gap-2 text-xs font-bold text-[#0F5238]">
            <SlidersHorizontal className="w-4 h-4 text-[#52B788]" />
            <span>Mesafe Çapı: {maxDistance} km</span>
          </div>
          <input
            type="range"
            min="1"
            max="15"
            value={maxDistance}
            onChange={(e) => setMaxDistance(Number(e.target.value))}
            className="w-36 accent-[#2D6A4F] cursor-pointer"
          />
        </div>

        {/* Map Type quick selector */}
        <div className="absolute top-4 right-4 z-30 flex items-center gap-1.5 bg-white/90 backdrop-blur-md p-1.5 rounded-2xl shadow-lg border border-gray-100">
          {[
            { id: 'all', label: 'Tümü' },
            { id: 'free', label: 'Ücretsiz' },
            { id: 'discounted', label: 'İndirimli' },
          ].map((type) => (
            <button
              key={type.id}
              onClick={() => setFilterType(type.id)}
              className={`px-2.5 py-1 rounded-xl text-xs font-bold transition ${
                filterType === type.id
                  ? 'bg-[#2D6A4F] text-white'
                  : 'text-gray-600 hover:bg-gray-100'
              }`}
            >
              {type.label}
            </button>
          ))}
        </div>

      </div>

      {/* Side / Bottom Active Pin Drawer Card */}
      {selectedPin && (
        <div className="w-full md:w-80 lg:w-96 bg-white p-5 flex flex-col justify-between border-t md:border-t-0 md:border-l border-gray-200 z-30 animate-in slide-in-from-right duration-200">
          <div className="space-y-4">
            <div className="flex items-center justify-between">
              <span className="px-2.5 py-0.5 rounded-lg text-xs font-bold bg-[#D1FEE5] text-[#006C48]">
                {selectedPin.category}
              </span>
              <span className="text-xs text-gray-500 font-semibold flex items-center gap-1">
                <MapPin className="w-3.5 h-3.5 text-[#52B788]" />
                {selectedPin.distanceKm} km uzakta
              </span>
            </div>

            <div className="relative h-36 rounded-2xl overflow-hidden">
              <img
                src={selectedPin.image}
                alt={selectedPin.title}
                className="w-full h-full object-cover"
              />
              <div className="absolute top-2 left-2 px-2 py-0.5 rounded-lg bg-black/60 text-white text-[11px] font-bold">
                {selectedPin.portionsAvailable} paket kaldı
              </div>
            </div>

            <div>
              <p className="text-xs font-semibold text-gray-500">{selectedPin.businessName}</p>
              <h3 className="text-base font-bold text-[#0F5238] leading-snug mt-0.5">
                {selectedPin.title}
              </h3>
            </div>

            <div className="p-3 bg-[#F0FFF4] rounded-2xl border border-[#A8E7C5]/40 flex items-center gap-2.5 text-xs text-[#006C48]">
              <Clock className="w-4 h-4 text-[#2D6A4F]" />
              <span>Teslim: <strong>Bugün {selectedPin.pickupStartTime} - {selectedPin.pickupEndTime}</strong></span>
            </div>
          </div>

          <div className="pt-4 border-t border-gray-100 flex items-center justify-between gap-3">
            <div>
              <p className="text-[10px] text-gray-400">Kurtarma Fiyatı</p>
              <p className="text-xl font-black text-[#0F5238]">
                {selectedPin.priceDiscounted === 0 ? 'ÜCRETSİZ' : `${selectedPin.priceDiscounted} ₺`}
              </p>
            </div>

            <button
              onClick={() => setSelectedListing(selectedPin)}
              className="flex-1 flex items-center justify-center gap-1.5 py-3 px-4 bg-[#0F5238] hover:bg-[#2D6A4F] text-white font-bold text-xs rounded-2xl shadow-md transition"
            >
              <ShoppingBag className="w-4 h-4 text-[#95D5B2]" />
              <span>İncele & Kurtar</span>
            </button>
          </div>
        </div>
      )}

    </div>
  );
};
