import React, { useState } from 'react';
import { useApp } from '../../context/AppContext';
import {
  Camera,
  Upload,
  Clock,
  Tag,
  AlertTriangle,
  CheckCircle2,
  ChevronLeft,
  Sparkles
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

  const allergenOptions = ['Gluten', 'Süt Ürünleri', 'Yumurta', 'Fındık/Fıstık', 'Susam', 'Alerjen Yok'];

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
    <div className="space-y-6 pb-20 lg:pb-10 max-w-3xl mx-auto animate-in fade-in duration-300">
      
      {/* Top Header */}
      <div className="flex items-center gap-3">
        <button
          onClick={() => setActiveTab('business_dash')}
          className="p-2 rounded-xl bg-white border border-gray-200 hover:bg-gray-50 text-gray-700"
        >
          <ChevronLeft className="w-5 h-5" />
        </button>
        <div>
          <h1 className="text-2xl font-black text-[#0F5238]">Yeni Kurtarma İlanı Oluştur</h1>
          <p className="text-xs text-gray-500 mt-0.5">
            Günün sonunda kalan taze ürünlerinizi dakikalar içinde listeleyin ve israfı önleyin.
          </p>
        </div>
      </div>

      {/* Form Container */}
      <form onSubmit={handleSubmit} className="bg-white rounded-3xl p-6 sm:p-8 border border-gray-100 shadow-sm space-y-6">
        
        {/* Listing Type Segment Selector */}
        <div>
          <label className="text-xs font-bold text-gray-400 uppercase tracking-wider block mb-2">İlan Türü</label>
          <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
            {[
              { id: 'discounted', title: '🏷️ İndirimli Paket', desc: '%50 - %70 İndirimli Satış' },
              { id: 'free', title: '🌱 %100 Ücretsiz', desc: 'İhtiyaç Sahiplerine Doğrudan' },
              { id: 'bulk', title: '🤝 STK & Aşevi', desc: 'Toplu Fazla Yemek Bağışı' },
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
                className={`p-3.5 rounded-2xl text-left border transition-all ${
                  formData.type === t.id
                    ? 'bg-[#E8FFF0] border-[#52B788] text-[#0F5238] shadow-sm'
                    : 'bg-white border-gray-200 text-gray-600 hover:bg-gray-50'
                }`}
              >
                <p className="font-bold text-xs">{t.title}</p>
                <p className="text-[10px] text-gray-400 mt-0.5">{t.desc}</p>
              </button>
            ))}
          </div>
        </div>

        {/* Title & Category */}
        <div className="grid grid-cols-1 gap-4">
          <div className="sm:col-span-2">
            <label className="text-xs font-bold text-gray-700 block mb-1.5">İlan Başlığı *</label>
            <input
              type="text"
              required
              placeholder="Örn: Günlük Ekşi Mayalı Ekmek & Börek Sürpriz Paketi"
              value={formData.title}
              onChange={(e) => setFormData({ ...formData, title: e.target.value })}
              className="w-full text-xs p-3.5 rounded-xl bg-[#F8FAFC] border border-gray-200 focus:border-[#2D6A4F] outline-none transition"
            />
          </div>

          <div>
            <label className="text-xs font-bold text-gray-700 block mb-1.5">Kategori</label>
            <select
              value={formData.category}
              onChange={(e) => setFormData({ ...formData, category: e.target.value })}
              className="w-full text-xs p-3.5 rounded-xl bg-[#F8FAFC] border border-gray-200 focus:border-[#2D6A4F] outline-none transition"
            >
              <option>Unlu Mamüller</option>
              <option>Meyve & Sebze</option>
              <option>Sıcak Yemek</option>
              <option>Kahvaltılık & Şarküteri</option>
              <option>Toplu Bağış</option>
            </select>
          </div>
        </div>

        {/* Pricing & Portions */}
        <div className="grid grid-cols-2 sm:grid-cols-4 gap-4">
          {formData.type === 'discounted' && (
            <>
              <div>
                <label className="text-xs font-bold text-gray-700 block mb-1.5">Normal Fiyat (₺)</label>
                <input
                  type="number"
                  placeholder="150"
                  value={formData.priceOriginal}
                  onChange={(e) => setFormData({ ...formData, priceOriginal: e.target.value })}
                  className="w-full text-xs p-3.5 rounded-xl bg-[#F8FAFC] border border-gray-200 focus:border-[#2D6A4F] outline-none transition"
                />
              </div>
              <div>
                <label className="text-xs font-bold text-gray-700 block mb-1.5">Kurtarma Fiyatı (₺)</label>
                <input
                  type="number"
                  placeholder="45"
                  value={formData.priceDiscounted}
                  onChange={(e) => setFormData({ ...formData, priceDiscounted: e.target.value })}
                  className="w-full text-xs p-3.5 rounded-xl bg-[#F8FAFC] border border-gray-200 focus:border-[#2D6A4F] outline-none transition font-bold text-[#0F5238]"
                />
              </div>
            </>
          )}

          <div>
            <label className="text-xs font-bold text-gray-700 block mb-1.5">Porsiyon / Paket Sayısı</label>
            <input
              type="number"
              min="1"
              value={formData.portions}
              onChange={(e) => setFormData({ ...formData, portions: e.target.value })}
              className="w-full text-xs p-3.5 rounded-xl bg-[#F8FAFC] border border-gray-200 focus:border-[#2D6A4F] outline-none transition"
            />
          </div>

          <div>
            <label className="text-xs font-bold text-gray-700 block mb-1.5">Tahmini Ağırlık (kg)</label>
            <input
              type="number"
              step="0.5"
              value={formData.weightKg}
              onChange={(e) => setFormData({ ...formData, weightKg: e.target.value })}
              className="w-full text-xs p-3.5 rounded-xl bg-[#F8FAFC] border border-gray-200 focus:border-[#2D6A4F] outline-none transition"
            />
          </div>
        </div>

        {/* Pickup Hours */}
        <div className="grid grid-cols-2 gap-4">
          <div>
            <label className="text-xs font-bold text-gray-700 block mb-1.5">Teslim Başlangıç Saati</label>
            <input
              type="time"
              value={formData.pickupStartTime}
              onChange={(e) => setFormData({ ...formData, pickupStartTime: e.target.value })}
              className="w-full text-xs p-3.5 rounded-xl bg-[#F8FAFC] border border-gray-200 focus:border-[#2D6A4F] outline-none transition"
            />
          </div>
          <div>
            <label className="text-xs font-bold text-gray-700 block mb-1.5">Teslim Bitiş Saati</label>
            <input
              type="time"
              value={formData.pickupEndTime}
              onChange={(e) => setFormData({ ...formData, pickupEndTime: e.target.value })}
              className="w-full text-xs p-3.5 rounded-xl bg-[#F8FAFC] border border-gray-200 focus:border-[#2D6A4F] outline-none transition"
            />
          </div>
        </div>

        {/* Description */}
        <div>
          <label className="text-xs font-bold text-gray-700 block mb-1.5">Paket İçeriği & Açıklama</label>
          <textarea
            rows={3}
            placeholder="Paketin içinde hangi ürünler olduğunu ve tazelik durumunu kısaca açıklayın..."
            value={formData.description}
            onChange={(e) => setFormData({ ...formData, description: e.target.value })}
            className="w-full text-xs p-3.5 rounded-xl bg-[#F8FAFC] border border-gray-200 focus:border-[#2D6A4F] outline-none transition resize-none"
          ></textarea>
        </div>

        {/* Allergens Selection */}
        <div>
          <label className="text-xs font-bold text-gray-700 block mb-2">Alerjenler</label>
          <div className="flex flex-wrap gap-2">
            {allergenOptions.map((alg) => {
              const isSelected = formData.allergens.includes(alg);
              return (
                <button
                  type="button"
                  key={alg}
                  onClick={() => toggleAllergen(alg)}
                  className={`px-3 py-1.5 rounded-xl text-xs font-semibold transition ${
                    isSelected
                      ? 'bg-[#2D6A4F] text-white'
                      : 'bg-gray-100 text-gray-600 hover:bg-gray-200'
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
          className="w-full py-4 bg-[#0F5238] hover:bg-[#2D6A4F] text-white font-black text-sm rounded-2xl shadow-xl shadow-[#0F5238]/30 transition hover:scale-[1.01]"
        >
          🚀 İlanı Hemen Yayınla
        </button>

      </form>

    </div>
  );
};
