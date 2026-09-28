import React, { useState } from 'react';
import { useApp } from '../../context/AppContext';
import {
  ChevronLeft
} from 'lucide-react';

export const NewListingView = () => {
  const { addNewListing, setActiveTab } = useApp();

  const [formData, setFormData] = useState({
    title: '',
    category: 'Unlu Mamüller',
    type: 'discounted', // 'free' | 'discounted' | 'bulk'
    priceOriginal: '',
    priceDiscounted: '',
    portions: 4,
    weightKg: 2.0,
    pickupStartTime: '19:30',
    pickupEndTime: '21:00',
    description: '',
    allergens: ['Gluten'],
    image: 'https://images.unsplash.com/photo-1509440159596-0249088772ff?w=600&auto=format&fit=crop&q=80',
  });

  const allergenOptions = ['Gluten', 'Süt Ürünleri', 'Yumurta', 'Fındık', 'Susam'];

  const toggleAllergen = (item) => {
    setFormData(prev => ({
      ...prev,
      allergens: prev.allergens.includes(item)
        ? prev.allergens.filter(a => a !== item)
        : [...prev.allergens, item]
    }));
  };

  const handleSubmit = (e) => {
    e.preventDefault();
    addNewListing(formData);
  };

  return (
    <div className="space-y-3.5 pb-20 lg:pb-10 animate-in fade-in duration-300">
      
      {/* Top Header */}
      <div className="flex items-center gap-2">
        <button
          onClick={() => setActiveTab('business_dash')}
          className="p-1.5 rounded-xl bg-white border border-gray-200 text-gray-700"
        >
          <ChevronLeft className="w-4 h-4" />
        </button>
        <div>
          <h1 className="text-xs font-black text-[#0F5238]">Yeni Kurtarma İlanı</h1>
          <p className="text-[9px] text-gray-400">Günün sonunda kalan taze ürünleri listeleyin</p>
        </div>
      </div>

      {/* Form Container */}
      <form onSubmit={handleSubmit} className="bg-white rounded-2xl p-3.5 border border-gray-100 shadow-sm space-y-3">
        
        {/* Listing Type Selector */}
        <div>
          <label className="text-[10px] font-bold text-gray-400 uppercase tracking-wider block mb-1.5">İlan Türü</label>
          <div className="grid grid-cols-3 gap-1.5">
            {[
              { id: 'discounted', title: '🏷️ İndirimli' },
              { id: 'free', title: '🌱 Ücretsiz' },
              { id: 'bulk', title: '🤝 STK' },
            ].map((t) => (
              <button
                type="button"
                key={t.id}
                onClick={() => {
                  setFormData(prev => ({
                    ...prev,
                    type: t.id,
                    priceDiscounted: t.id === 'free' || t.id === 'bulk' ? 0 : prev.priceDiscounted
                  }));
                }}
                className={`py-2 px-1 text-center rounded-xl border text-[10px] font-bold transition-all ${
                  formData.type === t.id
                    ? 'bg-[#E8FFF0] border-[#52B788] text-[#0F5238] shadow-sm'
                    : 'bg-white border-gray-200 text-gray-600'
                }`}
              >
                {t.title}
              </button>
            ))}
          </div>
        </div>

        {/* Title */}
        <div>
          <label className="text-[10px] font-bold text-gray-700 block mb-1">İlan Başlığı *</label>
          <input
            type="text"
            required
            placeholder="Örn: Günlük Ekşi Mayalı Ekmek Paketi"
            value={formData.title}
            onChange={(e) => setFormData({ ...formData, title: e.target.value })}
            className="w-full text-[11px] p-2.5 rounded-xl bg-[#F8FAFC] border border-gray-200 focus:border-[#2D6A4F] outline-none"
          />
        </div>

        {/* Category */}
        <div>
          <label className="text-[10px] font-bold text-gray-700 block mb-1">Kategori</label>
          <select
            value={formData.category}
            onChange={(e) => setFormData({ ...formData, category: e.target.value })}
            className="w-full text-[11px] p-2.5 rounded-xl bg-[#F8FAFC] border border-gray-200 focus:border-[#2D6A4F] outline-none"
          >
            <option>Unlu Mamüller</option>
            <option>Meyve & Sebze</option>
            <option>Sıcak Yemek</option>
            <option>Kahvaltılık & Şarküteri</option>
            <option>Toplu Bağış</option>
          </select>
        </div>

        {/* Pricing & Portions in 2-column grid */}
        <div className="grid grid-cols-2 gap-2">
          {formData.type === 'discounted' && (
            <>
              <div>
                <label className="text-[10px] font-bold text-gray-700 block mb-1">Normal (₺)</label>
                <input
                  type="number"
                  placeholder="150"
                  value={formData.priceOriginal}
                  onChange={(e) => setFormData({ ...formData, priceOriginal: e.target.value })}
                  className="w-full text-[11px] p-2.5 rounded-xl bg-[#F8FAFC] border border-gray-200 focus:border-[#2D6A4F] outline-none"
                />
              </div>
              <div>
                <label className="text-[10px] font-bold text-gray-700 block mb-1">İndirimli (₺)</label>
                <input
                  type="number"
                  placeholder="45"
                  value={formData.priceDiscounted}
                  onChange={(e) => setFormData({ ...formData, priceDiscounted: e.target.value })}
                  className="w-full text-[11px] p-2.5 rounded-xl bg-[#F8FAFC] border border-gray-200 focus:border-[#2D6A4F] outline-none font-bold text-[#0F5238]"
                />
              </div>
            </>
          )}

          <div>
            <label className="text-[10px] font-bold text-gray-700 block mb-1">Paket Adedi</label>
            <input
              type="number"
              min="1"
              value={formData.portions}
              onChange={(e) => setFormData({ ...formData, portions: e.target.value })}
              className="w-full text-[11px] p-2.5 rounded-xl bg-[#F8FAFC] border border-gray-200 focus:border-[#2D6A4F] outline-none"
            />
          </div>

          <div>
            <label className="text-[10px] font-bold text-gray-700 block mb-1">Ağırlık (kg)</label>
            <input
              type="number"
              step="0.5"
              value={formData.weightKg}
              onChange={(e) => setFormData({ ...formData, weightKg: e.target.value })}
              className="w-full text-[11px] p-2.5 rounded-xl bg-[#F8FAFC] border border-gray-200 focus:border-[#2D6A4F] outline-none"
            />
          </div>
        </div>

        {/* Pickup Hours */}
        <div className="grid grid-cols-2 gap-2">
          <div>
            <label className="text-[10px] font-bold text-gray-700 block mb-1">Teslim Başlangıç</label>
            <input
              type="time"
              value={formData.pickupStartTime}
              onChange={(e) => setFormData({ ...formData, pickupStartTime: e.target.value })}
              className="w-full text-[11px] p-2.5 rounded-xl bg-[#F8FAFC] border border-gray-200 focus:border-[#2D6A4F] outline-none"
            />
          </div>
          <div>
            <label className="text-[10px] font-bold text-gray-700 block mb-1">Teslim Bitiş</label>
            <input
              type="time"
              value={formData.pickupEndTime}
              onChange={(e) => setFormData({ ...formData, pickupEndTime: e.target.value })}
              className="w-full text-[11px] p-2.5 rounded-xl bg-[#F8FAFC] border border-gray-200 focus:border-[#2D6A4F] outline-none"
            />
          </div>
        </div>

        {/* Description */}
        <div>
          <label className="text-[10px] font-bold text-gray-700 block mb-1">Açıklama</label>
          <textarea
            rows={2}
            placeholder="Paket içeriğini ve tazelik durumunu yazın..."
            value={formData.description}
            onChange={(e) => setFormData({ ...formData, description: e.target.value })}
            className="w-full text-[11px] p-2.5 rounded-xl bg-[#F8FAFC] border border-gray-200 focus:border-[#2D6A4F] outline-none resize-none"
          ></textarea>
        </div>

        {/* Allergens Selection */}
        <div>
          <label className="text-[10px] font-bold text-gray-700 block mb-1.5">Alerjenler</label>
          <div className="flex flex-wrap gap-1.5">
            {allergenOptions.map((alg) => {
              const isSelected = formData.allergens.includes(alg);
              return (
                <button
                  type="button"
                  key={alg}
                  onClick={() => toggleAllergen(alg)}
                  className={`px-2 py-1 rounded-lg text-[9px] font-semibold transition ${
                    isSelected
                      ? 'bg-[#2D6A4F] text-white'
                      : 'bg-gray-100 text-gray-600'
                  }`}
                >
                  {alg}
                </button>
              );
            })}
          </div>
        </div>

        {/* Submit Button */}
        <button
          type="submit"
          className="w-full py-3 bg-[#0F5238] hover:bg-[#2D6A4F] text-white font-black text-xs rounded-xl shadow-lg transition"
        >
          🚀 İlanı Hemen Yayınla
        </button>

      </form>

    </div>
  );
};
