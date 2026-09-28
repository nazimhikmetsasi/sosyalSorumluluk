import React from 'react';
import { useApp } from '../../context/AppContext';
import {
  Search,
  Filter,
  MapPin,
  Clock,
  Sparkles,
  ShoppingBag,
  Flame,
  CheckCircle2,
  TrendingDown,
  ArrowRight,
  ShieldCheck,
  ChevronRight
} from 'lucide-react';

export const ExploreView = () => {
  const {
    listings,
    searchQuery,
    setSearchQuery,
    selectedCategory,
    setSelectedCategory,
    selectedListingType,
    setSelectedListingType,
    setSelectedListing,
    setActiveTab,
    currentUser,
    stats
  } = useApp();

  const categories = [
    { name: 'Tümü', icon: '✨' },
    { name: 'Unlu Mamüller', icon: '🥖' },
    { name: 'Meyve & Sebze', icon: '🥑' },
    { name: 'Sıcak Yemek', icon: '🍲' },
    { name: 'Toplu Bağış', icon: '📦' },
  ];

  const filterTypes = [
    { id: 'all', label: 'Tüm İlanlar' },
    { id: 'free', label: '🌱 %100 Ücretsiz' },
    { id: 'discounted', label: '🏷️ İndirimli Paketler' },
    { id: 'bulk', label: '🤝 STK & Aşevi' },
  ];

  // Filter listings based on category, search, and type
  const filteredListings = listings.filter((item) => {
    const matchesSearch =
      item.title.toLowerCase().includes(searchQuery.toLowerCase()) ||
      item.businessName.toLowerCase().includes(searchQuery.toLowerCase()) ||
      item.category.toLowerCase().includes(searchQuery.toLowerCase());

    const matchesCategory =
      selectedCategory === 'Tümü' || item.category === selectedCategory;

    const matchesType =
      selectedListingType === 'all' || item.type === selectedListingType;

    return matchesSearch && matchesCategory && matchesType;
  });

  return (
    <div className="space-y-6 pb-20 lg:pb-10 animate-in fade-in duration-300">
      
      {/* Hero Banner with Impact stats */}
      <div className="relative overflow-hidden rounded-3xl bg-gradient-to-r from-[#0F5238] via-[#2D6A4F] to-[#1B4332] text-white p-6 sm:p-8 shadow-xl">
        <div className="absolute right-0 top-0 bottom-0 w-1/3 opacity-10 bg-[radial-gradient(#52B788_1px,transparent_1px)] [background-size:16px_16px]"></div>
        
        <div className="relative z-10 max-w-2xl space-y-4">
          <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-white/15 backdrop-blur-md border border-white/20 text-xs font-semibold text-[#B1F0CE]">
            <Sparkles className="w-3.5 h-3.5 text-[#92F7C3]" />
            <span>Bugün {stats.todayActiveListings} aktif kurtarma paketi sizi bekliyor</span>
          </div>

          <h1 className="text-2xl sm:text-4xl font-extrabold tracking-tight leading-tight">
            Gıda İsrafını Durdur, <br className="hidden sm:inline" />
            <span className="text-[#95D5B2]">Gezegeni ve Bütçeni Koru.</span>
          </h1>

          <p className="text-sm text-white/80 leading-relaxed max-w-lg">
            Mahallendeki fırın, manav ve restoranların gün sonunda kalan taze lezzetlerini %70'e varan indirimle veya ücretsiz sahiplenin.
          </p>

          <div className="pt-2 flex flex-wrap items-center gap-3">
            <button
              onClick={() => setActiveTab('map')}
              className="flex items-center gap-2 px-5 py-3 rounded-2xl bg-[#52B788] hover:bg-[#40916C] text-[#002114] font-bold text-xs transition shadow-lg hover:shadow-[#52B788]/30"
            >
              <MapPin className="w-4 h-4" />
              <span>Harita Üzerinde Keşfet</span>
            </button>

            <div className="flex items-center gap-2 px-4 py-2.5 rounded-2xl bg-white/10 backdrop-blur-md border border-white/15 text-xs text-white">
              <span className="text-base">🌍</span>
              <span>Kişisel Etkin: <strong>{currentUser.savedKg} kg</strong> gıda kurtardın</span>
            </div>
          </div>
        </div>
      </div>

      {/* Category Pills Slider */}
      <div className="flex items-center gap-2 overflow-x-auto pb-1 scrollbar-none">
        {categories.map((cat) => {
          const isSelected = selectedCategory === cat.name;
          return (
            <button
              key={cat.name}
              onClick={() => setSelectedCategory(cat.name)}
              className={`flex items-center gap-2 px-4 py-2.5 rounded-2xl text-xs font-bold transition-all whitespace-nowrap shadow-sm ${
                isSelected
                  ? 'bg-[#0F5238] text-white shadow-md shadow-[#0F5238]/20 scale-[1.02]'
                  : 'bg-white text-gray-700 hover:bg-[#F0FFF4] hover:text-[#0F5238] border border-gray-100'
              }`}
            >
              <span>{cat.icon}</span>
              <span>{cat.name}</span>
            </button>
          );
        })}
      </div>

      {/* Filter Type Bar */}
      <div className="flex flex-wrap items-center justify-between gap-3 bg-white p-3.5 rounded-2xl border border-gray-100 shadow-sm">
        <div className="flex flex-wrap items-center gap-2">
          {filterTypes.map((ft) => {
            const isSelected = selectedListingType === ft.id;
            return (
              <button
                key={ft.id}
                onClick={() => setSelectedListingType(ft.id)}
                className={`px-3 py-1.5 rounded-xl text-xs font-semibold transition ${
                  isSelected
                    ? 'bg-[#D1FEE5] text-[#006C48] border border-[#52B788]/40'
                    : 'text-gray-500 hover:text-gray-800 hover:bg-gray-50'
                }`}
              >
                {ft.label}
              </button>
            );
          })}
        </div>

        <div className="text-xs text-gray-500 font-medium">
          Toplam <strong>{filteredListings.length}</strong> ilan listeleniyor
        </div>
      </div>

      {/* Listings Grid */}
      {filteredListings.length === 0 ? (
        <div className="bg-white rounded-3xl p-12 text-center border border-gray-100 space-y-3">
          <div className="w-16 h-16 rounded-full bg-[#F0FFF4] text-[#2D6A4F] flex items-center justify-center mx-auto text-2xl">
            🔍
          </div>
          <h3 className="text-base font-bold text-gray-800">Aradığınız kriterde ilan bulunamadı</h3>
          <p className="text-xs text-gray-500 max-w-sm mx-auto">
            Filtreleri sıfırlayarak veya arama terimini değiştirerek tekrar deneyebilirsiniz.
          </p>
          <button
            onClick={() => {
              setSearchQuery('');
              setSelectedCategory('Tümü');
              setSelectedListingType('all');
            }}
            className="px-4 py-2 bg-[#2D6A4F] text-white text-xs font-bold rounded-xl"
          >
            Filtreleri Temizle
          </button>
        </div>
      ) : (
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-5">
          {filteredListings.map((item) => (
            <div
              key={item.id}
              onClick={() => setSelectedListing(item)}
              className="group bg-white rounded-3xl overflow-hidden border border-gray-100 shadow-sm hover:shadow-xl hover:border-[#52B788]/40 transition-all duration-300 cursor-pointer flex flex-col justify-between"
            >
              <div>
                {/* Card Top Image & Badges */}
                <div className="relative h-48 w-full overflow-hidden bg-gray-100">
                  <img
                    src={item.image}
                    alt={item.title}
                    className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-500"
                  />
                  <div className="absolute inset-0 bg-gradient-to-t from-black/60 via-transparent to-black/20"></div>

                  {/* Top Left Type Badge */}
                  <div className="absolute top-3 left-3 flex items-center gap-1.5">
                    {item.type === 'free' ? (
                      <span className="px-2.5 py-1 text-[11px] font-extrabold rounded-xl bg-[#10B981] text-white shadow-md">
                        🌱 Ücretsiz
                      </span>
                    ) : item.type === 'bulk' ? (
                      <span className="px-2.5 py-1 text-[11px] font-extrabold rounded-xl bg-[#3B82F6] text-white shadow-md">
                        🤝 STK Toplu
                      </span>
                    ) : (
                      <span className="px-2.5 py-1 text-[11px] font-extrabold rounded-xl bg-[#F59E0B] text-white shadow-md">
                        %{item.discountPercentage} İndirim
                      </span>
                    )}

                    <span className="px-2.5 py-1 text-[11px] font-bold rounded-xl bg-black/50 backdrop-blur-md text-white">
                      {item.category}
                    </span>
                  </div>

                  {/* Bottom Image Info: Distance & Portions */}
                  <div className="absolute bottom-3 left-3 right-3 flex items-center justify-between text-white text-xs font-semibold">
                    <span className="flex items-center gap-1 bg-black/40 backdrop-blur-md px-2 py-0.5 rounded-lg">
                      <MapPin className="w-3.5 h-3.5 text-[#95D5B2]" />
                      {item.distanceKm} km
                    </span>

                    <span className="bg-[#0F5238]/80 backdrop-blur-md px-2 py-0.5 rounded-lg text-[#B1F0CE] font-bold">
                      {item.portionsAvailable} paket kaldı
                    </span>
                  </div>
                </div>

                {/* Card Content Body */}
                <div className="p-4 space-y-3">
                  {/* Business Name */}
                  <div className="flex items-center gap-2">
                    <img
                      src={item.businessAvatar}
                      alt={item.businessName}
                      className="w-6 h-6 rounded-full object-cover border border-gray-200"
                    />
                    <span className="text-xs font-semibold text-gray-500 truncate">{item.businessName}</span>
                  </div>

                  {/* Title */}
                  <h3 className="font-bold text-sm text-[#0F5238] line-clamp-2 leading-snug group-hover:text-[#52B788] transition">
                    {item.title}
                  </h3>

                  {/* Pickup Time Window */}
                  <div className="flex items-center gap-1.5 text-xs text-gray-500 bg-[#F0FFF4] px-2.5 py-1.5 rounded-xl border border-[#A8E7C5]/30">
                    <Clock className="w-3.5 h-3.5 text-[#2D6A4F]" />
                    <span>Teslim: <strong>Bugün {item.pickupStartTime} - {item.pickupEndTime}</strong></span>
                  </div>
                </div>
              </div>

              {/* Card Footer: Pricing and Action */}
              <div className="p-4 pt-0 flex items-center justify-between border-t border-gray-50 mt-2">
                <div>
                  <p className="text-[10px] text-gray-400">Kurtarma Fiyatı</p>
                  <div className="flex items-baseline gap-1.5">
                    <span className="text-lg font-black text-[#0F5238]">
                      {item.priceDiscounted === 0 ? 'ÜCRETSİZ' : `${item.priceDiscounted} ₺`}
                    </span>
                    {item.priceOriginal > 0 && (
                      <span className="text-xs text-gray-400 line-through">
                        {item.priceOriginal} ₺
                      </span>
                    )}
                  </div>
                </div>

                <button
                  onClick={(e) => {
                    e.stopPropagation();
                    setSelectedListing(item);
                  }}
                  className="flex items-center gap-1 px-4 py-2 rounded-xl bg-[#0F5238] group-hover:bg-[#2D6A4F] text-white font-bold text-xs shadow-md shadow-[#0F5238]/20 transition"
                >
                  <span>Kurtar</span>
                  <ChevronRight className="w-3.5 h-3.5" />
                </button>
              </div>
            </div>
          ))}
        </div>
      )}

    </div>
  );
};
