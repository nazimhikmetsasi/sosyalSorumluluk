import React, { useState } from 'react';
import { useApp } from '../../context/AppContext';
import {
  MapPin,
  Navigation,
  Clock,
  ShoppingBag,
  SlidersHorizontal,
  X
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
    <div className="relative h-[650px] w-full rounded-2xl overflow-hidden shadow-lg border border-[#2D6A4F]/20 flex flex-col bg-[#E8FFF0]">
      
      {/* Interactive Map Visual Stage */}
      <div className="relative flex-1 bg-[#D8F3DC] overflow-hidden flex items-center justify-center">
        
        {/* Stylized Vector Map Background */}
        <div className="absolute inset-0 opacity-40 bg-[radial-gradient(#2D6A4F_1px,transparent_1px)] [background-size:20px_20px]"></div>
        
        {/* Simulated Map Road Grid Lines */}
        <svg className="absolute inset-0 w-full h-full stroke-[#52B788]/30 stroke-[2.5]" xmlns="http://www.w3.org/2000/svg">
          <path d="M 0 150 Q 150 200 300 120 T 400 300" fill="none" />
          <path d="M 50 0 Q 120 250 200 600" fill="none" />
          <path d="M 280 0 Q 300 200 380 600" fill="none" />
          <path d="M 0 350 Q 200 300 400 450" fill="none" />
          <circle cx="50%" cy="45%" r="100" fill="none" stroke="#2D6A4F" strokeWidth="1" strokeDasharray="4 4" opacity="0.3" />
        </svg>

        {/* User Location Radar Pulse */}
        <div className="absolute top-[45%] left-1/2 -translate-x-1/2 -translate-y-1/2 z-20 flex flex-col items-center">
          <div className="relative flex items-center justify-center">
            <div className="w-6 h-6 rounded-full bg-[#0F5238] text-white flex items-center justify-center shadow-lg border-2 border-white z-10">
              <Navigation className="w-3 h-3 fill-white" />
            </div>
            <div className="absolute w-10 h-10 rounded-full bg-[#52B788]/40 animate-ping"></div>
          </div>
          <span className="mt-0.5 px-1.5 py-0.2 rounded-full bg-white/95 text-[#0F5238] text-[8px] font-black shadow-sm">
            Konumunuz
          </span>
        </div>

        {/* Dynamic Map Pins */}
        {filteredMapListings.map((item, idx) => {
          const isSelected = selectedPin?.id === item.id;
          const topOffsets = ['30%', '58%', '36%', '68%'];
          const leftOffsets = ['25%', '55%', '72%', '28%'];

          return (
            <button
              key={item.id}
              onClick={() => setSelectedPin(item)}
              style={{
                top: topOffsets[idx % topOffsets.length],
                left: leftOffsets[idx % leftOffsets.length],
              }}
              className={`absolute z-30 transform -translate-x-1/2 -translate-y-full transition-all duration-300 ${
                isSelected ? 'scale-115 z-40' : ''
              }`}
            >
              <div className="relative flex flex-col items-center">
                <div
                  className={`flex items-center gap-0.5 px-1.5 py-0.5 rounded-xl shadow-lg border text-[9px] font-extrabold transition-all ${
                    isSelected
                      ? 'bg-[#0F5238] text-white border-white scale-105'
                      : item.type === 'free'
                      ? 'bg-[#10B981] text-white border-white'
                      : 'bg-white text-[#0F5238] border-[#52B788]'
                  }`}
                >
                  <span>{item.type === 'free' ? '🌱 Ücretsiz' : `${item.priceDiscounted}₺`}</span>
                </div>

                <div
                  className={`w-2.5 h-2.5 rotate-45 -mt-1 border-r border-b ${
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

        {/* Floating Map Distance Controls */}
        <div className="absolute top-2.5 left-2.5 z-30 bg-white/95 backdrop-blur-md p-2 rounded-xl shadow-md border border-gray-100 space-y-1">
          <div className="flex items-center gap-1 text-[9px] font-bold text-[#0F5238]">
            <SlidersHorizontal className="w-2.5 h-2.5 text-[#52B788]" />
            <span>Çap: {maxDistance} km</span>
          </div>
          <input
            type="range"
            min="1"
            max="15"
            value={maxDistance}
            onChange={(e) => setMaxDistance(Number(e.target.value))}
            className="w-24 accent-[#2D6A4F] cursor-pointer h-1"
          />
        </div>

        {/* Map Type quick selector */}
        <div className="absolute top-2.5 right-2.5 z-30 flex items-center gap-1 bg-white/95 backdrop-blur-md p-1 rounded-xl shadow-md border border-gray-100">
          {[
            { id: 'all', label: 'Tümü' },
            { id: 'free', label: 'Ücretsiz' },
            { id: 'discounted', label: 'İndirimli' },
          ].map((type) => (
            <button
              key={type.id}
              onClick={() => setFilterType(type.id)}
              className={`px-1.5 py-0.5 rounded-lg text-[9px] font-bold transition ${
                filterType === type.id
                  ? 'bg-[#2D6A4F] text-white'
                  : 'text-gray-500 hover:bg-gray-100'
              }`}
            >
              {type.label}
            </button>
          ))}
        </div>

      </div>

      {/* Bottom Pin Drawer Card */}
      {selectedPin && (
        <div className="bg-white p-3 border-t border-gray-100 z-30 animate-in slide-in-from-bottom duration-200">
          <div className="flex items-start justify-between gap-2">
            <div className="flex items-center gap-2 min-w-0">
              <img
                src={selectedPin.image}
                alt={selectedPin.title}
                className="w-12 h-12 rounded-xl object-cover flex-shrink-0"
              />
              <div className="min-w-0">
                <div className="flex items-center gap-1">
                  <span className="px-1.5 py-0.2 rounded text-[8px] font-bold bg-[#D1FEE5] text-[#006C48]">
                    {selectedPin.category}
                  </span>
                  <span className="text-[9px] text-gray-400 font-semibold flex items-center gap-0.5">
                    <MapPin className="w-2.5 h-2.5 text-[#52B788]" />
                    {selectedPin.distanceKm}km
                  </span>
                </div>
                <h3 className="text-[11px] font-bold text-[#0F5238] truncate mt-0.5">
                  {selectedPin.title}
                </h3>
                <div className="flex items-center gap-1 text-[9px] text-[#006C48]">
                  <Clock className="w-2.5 h-2.5 text-[#2D6A4F]" />
                  <span>{selectedPin.pickupStartTime}–{selectedPin.pickupEndTime}</span>
                </div>
              </div>
            </div>

            <button
              onClick={() => setSelectedPin(null)}
              className="text-gray-400 hover:text-gray-600 p-0.5"
            >
              <X className="w-3.5 h-3.5" />
            </button>
          </div>

          <div className="mt-2 pt-2 border-t border-gray-100 flex items-center justify-between gap-2">
            <div>
              <span className="text-xs font-black text-[#0F5238]">
                {selectedPin.priceDiscounted === 0 ? 'ÜCRETSİZ' : `${selectedPin.priceDiscounted} ₺`}
              </span>
            </div>

            <button
              onClick={() => setSelectedListing(selectedPin)}
              className="flex items-center gap-1 py-1.5 px-3 bg-[#0F5238] hover:bg-[#2D6A4F] text-white font-bold text-[10px] rounded-xl shadow transition"
            >
              <ShoppingBag className="w-3 h-3 text-[#95D5B2]" />
              <span>Kurtar</span>
            </button>
          </div>
        </div>
      )}

    </div>
  );
};
