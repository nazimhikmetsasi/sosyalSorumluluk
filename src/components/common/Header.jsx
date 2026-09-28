import React, { useState, useEffect } from 'react';
import { useApp } from '../../context/AppContext';
import { getHomeTab } from '../../utils/security';
import {
  Bell,
  Search,
  Smartphone,
  Monitor,
  Leaf,
  ChevronDown,
  User,
  LogOut,
  Globe,
  Download
} from 'lucide-react';

export const Header = () => {
  const {
    currentUser,
    currentRole,
    viewMode,
    setViewMode,
    activeTab,
    setActiveTab,
    notifications,
    searchQuery,
    setSearchQuery,
    logout,
    language,
    toggleLanguage,
    t,
    showToast
  } = useApp();

  const [isRoleMenuOpen, setIsRoleMenuOpen] = useState(false);
  const [isUserMenuOpen, setIsUserMenuOpen] = useState(false);
  const [deferredPrompt, setDeferredPrompt] = useState(null);

  useEffect(() => {
    const handler = (e) => {
      e.preventDefault();
      setDeferredPrompt(e);
    };
    window.addEventListener('beforeinstallprompt', handler);
    return () => window.removeEventListener('beforeinstallprompt', handler);
  }, []);

  const handleInstallApp = async () => {
    if (deferredPrompt) {
      deferredPrompt.prompt();
      const { outcome } = await deferredPrompt.userChoice;
      if (outcome === 'accepted') {
        showToast('GıdaKöprüsü ana ekrana eklendi! 🎉');
      }
      setDeferredPrompt(null);
    } else {
      showToast('PWA: Tarayıcınızın "Ana Ekrana Ekle" seçeneğiyle yükleyebilirsiniz 📱', 'info');
    }
  };

  const unreadCount = notifications.filter(n => !n.read).length;

  const roleLabels = {
    buyer: { name: t('buyer'), icon: '🌱', color: 'bg-[#52B788]/20 text-[#0F5238] border-[#52B788]/40' },
    business: { name: t('business'), icon: '🏪', color: 'bg-[#F59E0B]/20 text-[#B45309] border-[#F59E0B]/40' },
    ngo: { name: t('ngo'), icon: '🤝', color: 'bg-[#3B82F6]/20 text-[#1D4ED8] border-[#3B82F6]/40' },
    admin: { name: t('admin'), icon: '🛡️', color: 'bg-[#EF4444]/20 text-[#B91C1C] border-[#EF4444]/40' },
  };

  return (
    <header className="sticky top-0 z-40 bg-white/95 backdrop-blur-md border-b border-[#2D6A4F]/10 px-4 lg:px-8 py-3 transition-colors shadow-sm">
      <div className="max-w-7xl mx-auto flex items-center justify-between gap-3">
        
        {/* Left: Brand Logo & Tagline */}
        <div
          className="flex items-center gap-2.5 cursor-pointer flex-shrink-0"
          onClick={() => setActiveTab(getHomeTab(currentRole))}
        >
          <div className="w-9 h-9 rounded-2xl bg-gradient-to-tr from-[#0F5238] to-[#52B788] flex items-center justify-center text-white shadow-md shadow-[#2D6A4F]/20 transition-transform hover:scale-105">
            <Leaf className="w-5 h-5" />
          </div>
          <div>
            <div className="flex items-center gap-1.5">
              <span className="font-extrabold text-lg tracking-tight text-[#0F5238]">
                Gıda<span className="text-[#52B788]">Köprüsü</span>
              </span>
              <span className="hidden sm:inline-block px-2 py-0.5 text-[9px] font-semibold tracking-wide uppercase bg-[#D1FEE5] text-[#006C48] rounded-full">
                {t('zeroWaste')}
              </span>
            </div>
          </div>
        </div>

        {/* Center: Search input */}
        {(activeTab === 'explore' || activeTab === 'map') && (
          <div className="hidden md:flex flex-1 max-w-sm mx-2 relative">
            <Search className="w-4 h-4 text-gray-400 absolute left-3.5 top-1/2 -translate-y-1/2" />
            <input
              type="text"
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              placeholder="Fırın, manav veya yemek ara..."
              className="w-full bg-[#F0FFF4] border border-[#A8E7C5]/60 focus:border-[#2D6A4F] rounded-full pl-9 pr-3 py-1.5 text-xs text-[#002114] placeholder:text-gray-400 outline-none transition"
            />
          </div>
        )}

        {/* Right Actions */}
        <div className="flex items-center gap-1.5 sm:gap-2">
          
          {/* PWA Install Button */}
          <button
            onClick={handleInstallApp}
            className="hidden sm:flex items-center gap-1 px-2.5 py-1.5 bg-[#F0FFF4] border border-[#A8E7C5]/60 text-[#0F5238] rounded-xl text-[11px] font-bold hover:bg-[#E8FFF0] transition"
            title={t('installApp')}
          >
            <Download className="w-3.5 h-3.5 text-[#52B788]" />
            <span className="hidden lg:inline">Yükle</span>
          </button>

          {/* Language Switcher */}
          <button
            onClick={toggleLanguage}
            className="flex items-center gap-1 px-2 py-1.5 rounded-xl border border-gray-200 text-[11px] font-bold text-gray-700 hover:bg-gray-50 transition"
            title="Dili Değiştir (TR / EN)"
          >
            <Globe className="w-3.5 h-3.5 text-[#52B788]" />
            <span>{language.toUpperCase()}</span>
          </button>

          {/* Role Authority Badge (Fixed / Secure) */}
          <div
            className={`flex items-center gap-1.5 px-3 py-1.5 rounded-xl border text-[11px] font-bold ${roleLabels[currentRole]?.color}`}
            title={`Yetki Alanı: ${roleLabels[currentRole]?.name}`}
          >
            <span>{roleLabels[currentRole]?.icon}</span>
            <span className="hidden sm:inline">{roleLabels[currentRole]?.name}</span>
          </div>

          {/* View Mode Toggle (Mobile / Web) */}
          <button
            onClick={() => setViewMode(viewMode === 'web' ? 'mobile' : 'web')}
            className={`flex items-center gap-1 px-2.5 py-1.5 rounded-xl text-xs font-medium border transition ${
              viewMode === 'mobile'
                ? 'bg-[#2D6A4F] text-white border-[#2D6A4F] shadow-sm'
                : 'bg-white text-[#404943] border-gray-200 hover:border-[#52B788]'
            }`}
            title="Mobil / Web Görünümü"
          >
            {viewMode === 'mobile' ? (
              <>
                <Smartphone className="w-3.5 h-3.5 text-[#95D5B2]" />
                <span className="hidden md:inline text-[11px] font-bold">Mobil</span>
              </>
            ) : (
              <>
                <Monitor className="w-3.5 h-3.5" />
                <span className="hidden md:inline text-[11px] font-bold">Web</span>
              </>
            )}
          </button>

          {/* Notifications */}
          <button
            onClick={() => setActiveTab('notifications')}
            className={`relative p-2 rounded-xl text-[#0F5238] hover:bg-[#F0FFF4] transition ${
              activeTab === 'notifications' ? 'bg-[#E8FFF0]' : ''
            }`}
          >
            <Bell className="w-4 h-4" />
            {unreadCount > 0 && (
              <span className="absolute top-1 right-1 w-3.5 h-3.5 bg-red-500 text-white text-[8px] font-black rounded-full flex items-center justify-center">
                {unreadCount}
              </span>
            )}
          </button>

          {/* User Profile */}
          <div className="relative">
            <button
              onClick={() => setIsUserMenuOpen(!isUserMenuOpen)}
              className="flex items-center gap-1.5 p-0.5 pl-1.5 bg-[#F0FFF4] border border-[#A8E7C5]/40 rounded-full hover:border-[#52B788] transition"
            >
              <img
                src={currentUser.avatar}
                alt={currentUser.name}
                className="w-7 h-7 rounded-full object-cover border border-white shadow-sm"
              />
            </button>

            {isUserMenuOpen && (
              <div className="absolute right-0 mt-2 w-52 bg-white rounded-2xl shadow-xl border border-gray-100 py-2 z-50 animate-in fade-in">
                <div className="px-3 py-1.5 border-b border-gray-100">
                  <p className="text-xs font-bold text-[#0F5238]">{currentUser.name}</p>
                  <p className="text-[10px] text-[#52B788] font-semibold">{currentUser.savedKg} kg {t('savedTotal')}</p>
                </div>

                <button
                  onClick={() => {
                    setActiveTab('profile');
                    setIsUserMenuOpen(false);
                  }}
                  className="w-full flex items-center gap-2 px-3 py-2 text-xs text-gray-700 hover:bg-[#F0FFF4] transition"
                >
                  <User className="w-3.5 h-3.5 text-gray-400" />
                  <span>{t('profile')}</span>
                </button>

                <button
                  onClick={() => {
                    logout();
                    setIsUserMenuOpen(false);
                  }}
                  className="w-full flex items-center gap-2 px-3 py-2 text-xs text-red-600 hover:bg-red-50 transition border-t border-gray-50"
                >
                  <LogOut className="w-3.5 h-3.5" />
                  <span>{t('logout')}</span>
                </button>
              </div>
            )}
          </div>

        </div>
      </div>
    </header>
  );
};
