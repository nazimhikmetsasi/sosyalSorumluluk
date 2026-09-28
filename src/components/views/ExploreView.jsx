import React from 'react';
import { useApp } from '../../context/AppContext';
import {
  SlidersHorizontal,
  MapPin,
  Clock,
  Sparkles,
  ChevronRight,
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
    stats,
    sortBy,
    maxDistance,
    dietaryFilters,
    setIsFilterModalOpen
  } = useApp();

  const categories = [
    { name: 'Tümü', icon: '✨' },
    { name: 'Unlu Mamüller', icon: '🥖' },
    { name: 'Meyve & Sebze', icon: '🥑' },
    { name: 'Sıcak Yemek', icon: '🍲' },
    { name: 'Toplu Bağış', icon: '📦' },
  ];

  const filterTypes = [
    { id: 'all', label: 'Tümü' },
    { id: 'free', label: '🌱 Ücretsiz' },
    { id: 'discounted', label: '🏷️ İndirimli' },
    { id: 'bulk', label: '🤝 STK' },
  ];

  const activeDietaryCount = Object.values(dietaryFilters).filter(Boolean).length;

  let filteredListings = listings.filter((item) => {
    const matchesSearch =
      item.title.toLowerCase().includes(searchQuery.toLowerCase()) ||
      item.businessName.toLowerCase().includes(searchQuery.toLowerCase()) ||
      item.category.toLowerCase().includes(searchQuery.toLowerCase());

    const matchesCategory =
      selectedCategory === 'Tümü' || item.category === selectedCategory;

    const matchesType =
      selectedListingType === 'all' || item.type === selectedListingType;

    const matchesDistance = item.distanceKm <= maxDistance;

    if (dietaryFilters.glutenFree && item.allergens?.includes('Gluten')) return false;
    if (dietaryFilters.dairyFree && item.allergens?.includes('Süt Ürünleri')) return false;

    return matchesSearch && matchesCategory && matchesType && matchesDistance;
  });

  filteredListings = [...filteredListings].sort((a, b) => {
    if (sortBy === 'distance') return a.distanceKm - b.distanceKm;
    if (sortBy === 'discount') return b.discountPercentage - a.discountPercentage;
    if (sortBy === 'price') return a.priceDiscounted - b.priceDiscounted;
    if (sortBy === 'co2') return b.co2ReductionKg - a.co2ReductionKg;
    return 0;
  });

  return (
    <div className="space-y-3 pb-20 lg:pb-10 animate-in fade-in duration-300">

      {/* Compact Hero Banner */}
      <div className="relative overflow-hidden rounded-2xl bg-gradient-to-r from-[#0F5238] via-[#2D6A4F] to-[#1B4332] text-white p-4 shadow-lg">
        <div className="absolute right-0 top-0 bottom-0 w-1/3 opacity-10 bg-[radial-gradient(#52B788_1px,transparent_1px)] [background-size:12px_12px]"></div>

        <div className="relative z-10 space-y-2.5">
          <div className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full bg-white/15 border border-white/20 text-[10px] font-semibold text-[#B1F0CE]">
            <Sparkles className="w-3 h-3 text-[#92F7C3]" />
            <span>Bugün {stats.todayActiveListings} aktif kurtarma paketi var</span>
          </div>

          <h1 className="text-base font-extrabold tracking-tight leading-snug">
            Gıda İsrafını Durdur, <span className="text-[#95D5B2]">Bütçeni Koru.</span>
          </h1>

          <div className="flex items-center gap-2">
            <button
              onClick={() => setActiveTab('map')}
              className="flex items-center gap-1.5 px-3 py-2 rounded-xl bg-[#52B788] hover:bg-[#40916C] text-[#002114] font-bold text-[11px] transition shadow-md"
            >
              <MapPin className="w-3.5 h-3.5" />
              <span>Haritada Bul</span>
            </button>

            <div className="flex items-center gap-1.5 px-3 py-2 rounded-xl bg-white/10 border border-white/15 text-[11px] text-white">
              <span>🌍</span>
              <span><strong>{currentUser.savedKg} kg</strong> kurtardın</span>
            </div>
          </div>
        </div>
      </div>

      {/* Category Pills - horizontal scroll */}
      <div className="flex items-center gap-2 overflow-x-auto pb-0.5 scrollbar-none -mx-0.5 px-0.5">
        {categories.map((cat) => {
          const isSelected = selectedCategory === cat.name;
          return (
            <button
              key={cat.name}
              onClick={() => setSelectedCategory(cat.name)}
              className={`flex items-center gap-1.5 px-3 py-2 rounded-xl text-[11px] font-bold transition-all whitespace-nowrap flex-shrink-0 ${
                isSelected
                  ? 'bg-[#0F5238] text-white shadow-md'
                  : 'bg-white text-gray-600 hover:bg-[#F0FFF4] border border-gray-100'
              }`}
            >
              <span>{cat.icon}</span>
              <span>{cat.name}</span>
            </button>
          );
        })}
      </div>

      {/* Filter type pills + filter button */}
      <div className="flex items-center justify-between gap-2 bg-white px-3 py-2.5 rounded-xl border border-gray-100 shadow-sm">
        <div className="flex items-center gap-1.5 overflow-x-auto scrollbar-none">
          {filterTypes.map((ft) => {
            const isSelected = selectedListingType === ft.id;
            return (
              <button
                key={ft.id}
                onClick={() => setSelectedListingType(ft.id)}
                className={`px-2.5 py-1 rounded-lg text-[11px] font-semibold transition whitespace-nowrap flex-shrink-0 ${
                  isSelected
                    ? 'bg-[#D1FEE5] text-[#006C48] border border-[#52B788]/40'
                    : 'text-gray-500 hover:bg-gray-50'
                }`}
              >
                {ft.label}
              </button>
            );
          })}
        </div>

        <button
          onClick={() => setIsFilterModalOpen(true)}
          className="flex items-center gap-1 px-2.5 py-1.5 rounded-lg border border-gray-200 text-[11px] font-bold text-gray-700 hover:bg-[#F0FFF4] hover:border-[#52B788] transition flex-shrink-0"
        >
          <SlidersHorizontal className="w-3.5 h-3.5 text-[#52B788]" />
          {activeDietaryCount > 0 && (
            <span className="w-4 h-4 rounded-full bg-[#0F5238] text-white text-[9px] font-bold flex items-center justify-center">
              {activeDietaryCount}
            </span>
          )}
        </button>
      </div>

      {/* Listings Grid — always 2 columns */}
      {filteredListings.length === 0 ? (
        <div className="bg-white rounded-2xl p-8 text-center border border-gray-100 space-y-3">
          <div className="w-12 h-12 rounded-full bg-[#F0FFF4] flex items-center justify-center mx-auto text-xl">🔍</div>
          <h3 className="text-sm font-bold text-gray-800">İlan bulunamadı</h3>
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
        <div className="grid grid-cols-2 gap-2.5">
          {filteredListings.map((item) => (
            <div
              key={item.id}
              onClick={() => setSelectedListing(item)}
              className="group bg-white rounded-2xl overflow-hidden border border-gray-100 shadow-sm hover:shadow-lg hover:border-[#52B788]/40 transition-all duration-200 cursor-pointer flex flex-col"
            >
              {/* Image */}
              <div className="relative h-[110px] w-full overflow-hidden bg-gray-100 flex-shrink-0">
                <img
                  src={item.image}
                  alt={item.title}
                  className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-500"
                />
                <div className="absolute inset-0 bg-gradient-to-t from-black/70 via-black/10 to-transparent"></div>

                {/* Type badge — top left */}
                <div className="absolute top-1.5 left-1.5">
                  {item.type === 'free' ? (
                    <span className="px-1.5 py-0.5 text-[9px] font-extrabold rounded-md bg-[#10B981] text-white shadow">
                      🌱 Ücretsiz
                    </span>
                  ) : item.type === 'bulk' ? (
                    <span className="px-1.5 py-0.5 text-[9px] font-extrabold rounded-md bg-[#3B82F6] text-white shadow">
                      🤝 Toplu
                    </span>
                  ) : (
                    <span className="px-1.5 py-0.5 text-[9px] font-extrabold rounded-md bg-[#F59E0B] text-white shadow">
                      %{item.discountPercentage}
                    </span>
                  )}
                </div>

                {/* Distance + portions bottom */}
                <div className="absolute bottom-1.5 left-1.5 right-1.5 flex items-center justify-between text-[9px] font-bold text-white">
                  <span className="bg-black/50 backdrop-blur-sm px-1.5 py-0.5 rounded-md flex items-center gap-0.5">
                    <MapPin className="w-2.5 h-2.5 text-[#95D5B2]" />
                    {item.distanceKm}km
                  </span>
                  <span className="bg-[#0F5238]/80 px-1.5 py-0.5 rounded-md text-[#B1F0CE]">
                    {item.portionsAvailable} kaldı
                  </span>
                </div>
              </div>

              {/* Card Body */}
              <div className="p-2.5 flex flex-col flex-1 gap-1.5">
                {/* Business name */}
                <div className="flex items-center gap-1.5">
                  <img
                    src={item.businessAvatar}
                    alt={item.businessName}
                    className="w-4 h-4 rounded-full object-cover border border-gray-200 flex-shrink-0"
                  />
                  <span className="text-[10px] font-medium text-gray-400 truncate">{item.businessName}</span>
                </div>

                {/* Title */}
                <h3 className="font-bold text-[11px] text-[#0F5238] line-clamp-2 leading-tight group-hover:text-[#52B788] transition">
                  {item.title}
                </h3>

                {/* Pickup time */}
                <div className="flex items-center gap-1 text-[10px] text-gray-500 bg-[#F0FFF4] px-2 py-1 rounded-lg border border-[#A8E7C5]/30">
                  <Clock className="w-2.5 h-2.5 text-[#2D6A4F] flex-shrink-0" />
                  <span className="truncate">{item.pickupStartTime}–{item.pickupEndTime}</span>
                </div>

                {/* Price + action */}
                <div className="flex items-center justify-between mt-auto pt-1 border-t border-gray-50">
                  <div>
                    <span className="text-sm font-black text-[#0F5238]">
                      {item.priceDiscounted === 0 ? 'ÜCRETSİZ' : `${item.priceDiscounted}₺`}
                    </span>
                    {item.priceOriginal > 0 && item.priceDiscounted > 0 && (
                      <span className="text-[10px] text-gray-400 line-through ml-1">
                        {item.priceOriginal}₺
                      </span>
                    )}
                  </div>

                  <button
                    onClick={(e) => {
                      e.stopPropagation();
                      setSelectedListing(item);
                    }}
                    className="flex items-center gap-0.5 px-2 py-1.5 rounded-lg bg-[#0F5238] text-white font-bold text-[10px] shadow-sm transition"
                  >
                    <span>Kurtar</span>
                    <ChevronRight className="w-3 h-3" />
                  </button>
                </div>
              </div>
            </div>
          ))}
        </div>
      )}

    </div>
  );
};
