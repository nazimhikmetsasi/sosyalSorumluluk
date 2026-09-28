import React, { useState } from 'react';
import { useApp } from '../../context/AppContext';
import {
  Bell,
  Search,
  Smartphone,
  Monitor,
  Leaf,
  Sparkles,
  ChevronDown,
  User,
  LogOut
} from 'lucide-react';

export const Header = () => {
  const {
    currentUser,
    currentRole,
    handleRoleChange,
    viewMode,
    setViewMode,
    activeTab,
    setActiveTab,
    notifications,
    searchQuery,
    setSearchQuery,
    setIsAuthenticated
  } = useApp();

  const [isRoleMenuOpen, setIsRoleMenuOpen] = useState(false);
  const [isUserMenuOpen, setIsUserMenuOpen] = useState(false);

  const unreadCount = notifications.filter(n => !n.read).length;

  const roleLabels = {
    buyer: { name: 'Alıcı / Gönüllü', icon: '🌱', color: 'bg-[#52B788]/20 text-[#0F5238] border-[#52B788]/40' },
    business: { name: 'İşletme / Fırın', icon: '🏪', color: 'bg-[#F59E0B]/20 text-[#B45309] border-[#F59E0B]/40' },
    ngo: { name: 'STK & Aşevi', icon: '🤝', color: 'bg-[#3B82F6]/20 text-[#1D4ED8] border-[#3B82F6]/40' },
    admin: { name: 'Yönetici (Admin)', icon: '🛡️', color: 'bg-[#EF4444]/20 text-[#B91C1C] border-[#EF4444]/40' },
  };

  return (
    <header className="sticky top-0 z-40 bg-white/90 backdrop-blur-md border-b border-[#2D6A4F]/10 px-4 lg:px-8 py-3.5 transition-all">
      <div className="max-w-7xl mx-auto flex items-center justify-between gap-4">
        
        {/* Left: Brand Logo & Tagline */}
        <div className="flex items-center gap-3 cursor-pointer" onClick={() => setActiveTab(currentRole === 'business' ? 'business_dash' : currentRole === 'ngo' ? 'ngo_dash' : currentRole === 'admin' ? 'admin_dash' : 'explore')}>
          <div className="w-10 h-10 rounded-2xl bg-gradient-to-tr from-[#0F5238] to-[#52B788] flex items-center justify-center text-white shadow-md shadow-[#2D6A4F]/20 transition-transform hover:scale-105">
            <Leaf className="w-6 h-6" />
          </div>
          <div>
            <div className="flex items-center gap-1.5">
              <span className="font-bold text-xl tracking-tight text-[#0F5238]">Gıda<span className="text-[#52B788]">Köprüsü</span></span>
              <span className="hidden sm:inline-block px-2 py-0.5 text-[10px] font-semibold tracking-wide uppercase bg-[#D1FEE5] text-[#006C48] rounded-full">
                Sıfır İsraf
              </span>
            </div>
            <p className="text-[11px] text-[#404943] font-medium hidden md:block">Fazla gıdayı dayanışmayla buluştur</p>
          </div>
        </div>

        {/* Center: Search input (Visible in explore / map) */}
        {(activeTab === 'explore' || activeTab === 'map') && (
          <div className="hidden md:flex flex-1 max-w-md mx-4 relative">
            <Search className="w-4 h-4 text-gray-400 absolute left-3.5 top-1/2 -translate-y-1/2" />
            <input
              type="text"
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              placeholder="Fırın, sebze sepeti, mahalle veya yemek ara..."
              className="w-full bg-[#F0FFF4] border border-[#A8E7C5]/60 focus:border-[#2D6A4F] focus:ring-2 focus:ring-[#95D5B2]/30 rounded-full pl-10 pr-4 py-2 text-sm text-[#002114] placeholder:text-gray-400 outline-none transition"
            />
          </div>
        )}

        {/* Right Actions: Role Switcher, View Mode, Notifications, User */}
        <div className="flex items-center gap-2.5 sm:gap-3.5">
          
          {/* Active Role Selector Switch */}
          <div className="relative">
            <button
              onClick={() => setIsRoleMenuOpen(!isRoleMenuOpen)}
              className={`flex items-center gap-2 px-3 py-1.5 rounded-xl border text-xs font-semibold transition-all hover:shadow-sm ${roleLabels[currentRole]?.color}`}
            >
              <span>{roleLabels[currentRole]?.icon}</span>
              <span className="hidden sm:inline">{roleLabels[currentRole]?.name}</span>
              <ChevronDown className="w-3.5 h-3.5 opacity-70" />
            </button>

            {isRoleMenuOpen && (
              <div className="absolute right-0 mt-2 w-56 bg-white rounded-2xl shadow-xl border border-gray-100 py-2 z-50 animate-in fade-in zoom-in-95">
                <div className="px-3 py-1.5 text-[11px] font-bold text-gray-400 uppercase tracking-wider">
                  Rol Değiştir (Demo)
                </div>
                {Object.entries(roleLabels).map(([roleKey, item]) => (
                  <button
                    key={roleKey}
                    onClick={() => {
                      handleRoleChange(roleKey);
                      setIsRoleMenuOpen(false);
                    }}
                    className={`w-full flex items-center justify-between px-3.5 py-2.5 text-xs text-left transition hover:bg-[#F0FFF4] ${
                      currentRole === roleKey ? 'font-bold text-[#0F5238] bg-[#E8FFF0]' : 'text-gray-700'
                    }`}
                  >
                    <span className="flex items-center gap-2">
                      <span>{item.icon}</span>
                      <span>{item.name}</span>
                    </span>
                    {currentRole === roleKey && <span className="w-2 h-2 rounded-full bg-[#2D6A4F]"></span>}
                  </button>
                ))}
              </div>
            )}
          </div>

          {/* View Mode Toggle (Web vs Mobile Frame) */}
          <button
            onClick={() => setViewMode(viewMode === 'web' ? 'mobile' : 'web')}
            className={`flex items-center gap-1.5 px-3 py-1.5 rounded-xl text-xs font-medium border transition-all ${
              viewMode === 'mobile'
                ? 'bg-[#2D6A4F] text-white border-[#2D6A4F] shadow-sm'
                : 'bg-white text-[#404943] border-gray-200 hover:border-[#52B788]'
            }`}
            title="Mobil / Web Görünümü Değiştir"
          >
            {viewMode === 'mobile' ? (
              <>
                <Smartphone className="w-4 h-4 text-[#95D5B2]" />
                <span className="hidden md:inline">Mobil Mod</span>
              </>
            ) : (
              <>
                <Monitor className="w-4 h-4" />
                <span className="hidden md:inline">Web Modu</span>
              </>
            )}
          </button>

          {/* Notifications Bell */}
          <button
            onClick={() => setActiveTab('notifications')}
            className={`relative p-2 rounded-xl text-[#0F5238] hover:bg-[#F0FFF4] transition ${
              activeTab === 'notifications' ? 'bg-[#E8FFF0]' : ''
            }`}
            title="Bildirimler"
          >
            <Bell className="w-5 h-5" />
            {unreadCount > 0 && (
              <span className="absolute top-1 right-1 w-4 h-4 bg-[#EF4444] text-white text-[10px] font-bold rounded-full flex items-center justify-center animate-pulse">
                {unreadCount}
              </span>
            )}
          </button>

          {/* User Profile Mini Bar */}
          <div className="relative">
            <button
              onClick={() => setIsUserMenuOpen(!isUserMenuOpen)}
              className="flex items-center gap-2 p-1 pl-2 bg-[#F0FFF4] border border-[#A8E7C5]/40 rounded-full hover:border-[#52B788] transition"
            >
              <div className="text-right hidden xl:block pr-1">
                <p className="text-xs font-bold text-[#0F5238] leading-tight">{currentUser.name}</p>
                <p className="text-[10px] text-[#52B788] font-semibold">{currentUser.savedKg} kg kurtarıldı</p>
              </div>
              <img
                src={currentUser.avatar}
                alt={currentUser.name}
                className="w-8 h-8 rounded-full object-cover border-2 border-white shadow-sm"
              />
            </button>

            {isUserMenuOpen && (
              <div className="absolute right-0 mt-2 w-56 bg-white rounded-2xl shadow-xl border border-gray-100 py-2 z-50 animate-in fade-in">
                <div className="px-4 py-2 border-b border-gray-100">
                  <p className="text-sm font-bold text-[#0F5238]">{currentUser.name}</p>
                  <p className="text-xs text-gray-500">{currentUser.email}</p>
                  <div className="mt-2 flex items-center gap-2 text-xs font-semibold text-[#006C48] bg-[#D1FEE5] px-2.5 py-1 rounded-lg">
                    <Sparkles className="w-3.5 h-3.5 text-[#52B788]" />
                    <span>Seviye {currentUser.level} • {currentUser.points} Puan</span>
                  </div>
                </div>

                <button
                  onClick={() => {
                    setActiveTab('profile');
                    setIsUserMenuOpen(false);
                  }}
                  className="w-full flex items-center gap-2.5 px-4 py-2.5 text-xs text-gray-700 hover:bg-[#F0FFF4] transition"
                >
                  <User className="w-4 h-4 text-gray-400" />
                  Profil & Rozetler
                </button>

                <button
                  onClick={() => {
                    setIsAuthenticated(false);
                    setIsUserMenuOpen(false);
                  }}
                  className="w-full flex items-center gap-2.5 px-4 py-2.5 text-xs text-red-600 hover:bg-red-50 transition border-t border-gray-50"
                >
                  <LogOut className="w-4 h-4 text-red-500" />
                  Çıkış Yap
                </button>
              </div>
            )}
          </div>

        </div>
      </div>
    </header>
  );
};
