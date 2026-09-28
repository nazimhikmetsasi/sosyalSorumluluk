import React from 'react';
import { useApp } from '../../context/AppContext';
import { X, SlidersHorizontal, Check, ArrowDownUp, ShieldCheck, Sparkles } from 'lucide-react';

export const FilterModal = () => {
  const {
    isFilterModalOpen,
    setIsFilterModalOpen,
    sortBy,
    setSortBy,
    maxDistance,
    setMaxDistance,
    dietaryFilters,
    setDietaryFilters,
    showToast
  } = useApp();

  if (!isFilterModalOpen) return null;

  const sortOptions = [
    { id: 'distance', label: '📍 En Yakın Mesafedekiler' },
    { id: 'discount', label: '🏷️ En Yüksek İndirim Oranı' },
    { id: 'price', label: '💰 En Düşük Fiyat' },
    { id: 'co2', label: '🌍 En Çok CO₂ Kurtaran' },
  ];

  const handleDietaryToggle = (key) => {
    setDietaryFilters(prev => ({ ...prev, [key]: !prev[key] }));
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-3 sm:p-6 bg-black/60 backdrop-blur-sm animate-in fade-in duration-200">
      <div className="relative w-full max-w-md bg-white rounded-3xl shadow-2xl overflow-hidden animate-in zoom-in-95 duration-200">
        
        {/* Header */}
        <div className="p-4 bg-[#F0FFF4] border-b border-[#A8E7C5]/40 flex items-center justify-between">
          <div className="flex items-center gap-2">
            <SlidersHorizontal className="w-5 h-5 text-[#2D6A4F]" />
            <h3 className="font-bold text-sm text-[#0F5238]">Filtrele ve Sırala</h3>
          </div>
          <button
            onClick={() => setIsFilterModalOpen(false)}
            className="w-8 h-8 rounded-full bg-white hover:bg-gray-100 flex items-center justify-center text-gray-500 transition shadow-sm"
          >
            <X className="w-4 h-4" />
          </button>
        </div>

        <div className="p-6 space-y-6">
          
          {/* Sorting radio list */}
          <div>
            <label className="text-xs font-bold text-gray-400 uppercase tracking-wider block mb-2.5">Sıralama Ölçütü</label>
            <div className="space-y-2">
              {sortOptions.map((opt) => (
                <button
                  key={opt.id}
                  onClick={() => setSortBy(opt.id)}
                  className={`w-full flex items-center justify-between p-3 rounded-2xl border text-xs font-bold transition text-left ${
                    sortBy === opt.id
                      ? 'bg-[#E8FFF0] border-[#52B788] text-[#0F5238]'
                      : 'bg-[#F8FAFC] border-gray-200 text-gray-700 hover:bg-gray-50'
                  }`}
                >
                  <span>{opt.label}</span>
                  {sortBy === opt.id && <Check className="w-4 h-4 text-[#2D6A4F]" />}
                </button>
              ))}
            </div>
          </div>

          {/* Max Distance Slider */}
          <div>
            <div className="flex items-center justify-between text-xs font-bold text-gray-700 mb-2">
              <span>Maksimum Arama Mesafesi</span>
              <span className="text-[#2D6A4F]">{maxDistance} km</span>
            </div>
            <input
              type="range"
              min="1"
              max="20"
              value={maxDistance}
              onChange={(e) => setMaxDistance(Number(e.target.value))}
              className="w-full accent-[#2D6A4F] cursor-pointer"
            />
            <div className="flex justify-between text-[10px] text-gray-400 mt-1">
              <span>1 km (Yürüme)</span>
              <span>10 km</span>
              <span>20 km (Şehir Çapı)</span>
            </div>
          </div>

          {/* Dietary Checkboxes */}
          <div>
            <label className="text-xs font-bold text-gray-400 uppercase tracking-wider block mb-2.5">Beslenme Tercihleri & Alerjen</label>
            <div className="grid grid-cols-2 gap-2.5">
              {[
                { key: 'vegan', label: '🌱 Vegan' },
                { key: 'vegetarian', label: '🧀 Vejetaryen' },
                { key: 'glutenFree', label: '🌾 Glutensiz' },
                { key: 'dairyFree', label: '🥛 Laktozsuz' },
              ].map((diet) => (
                <button
                  type="button"
                  key={diet.key}
                  onClick={() => handleDietaryToggle(diet.key)}
                  className={`p-2.5 rounded-xl text-xs font-semibold border transition text-left flex items-center justify-between ${
                    dietaryFilters[diet.key]
                      ? 'bg-[#D1FEE5] border-[#52B788] text-[#006C48]'
                      : 'bg-[#F8FAFC] border-gray-200 text-gray-600'
                  }`}
                >
                  <span>{diet.label}</span>
                  {dietaryFilters[diet.key] && <Check className="w-3.5 h-3.5" />}
                </button>
              ))}
            </div>
          </div>

          <button
            onClick={() => {
              setIsFilterModalOpen(false);
              showToast('Filtreler başarıyla uygulandı!');
            }}
            className="w-full py-3.5 bg-[#0F5238] hover:bg-[#2D6A4F] text-white font-bold text-xs rounded-2xl shadow-lg transition"
          >
            Sonuçları Göster
          </button>

        </div>

      </div>
    </div>
  );
};
