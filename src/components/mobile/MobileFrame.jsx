import React from 'react';
import { useApp } from '../../context/AppContext';
import {
  Wifi,
  Battery,
  Signal,
  Bell
} from 'lucide-react';

export const MobileFrame = ({ children }) => {
  const {
    activeTab,
    setActiveTab,
    currentUser,
    notifications,
    setViewMode
  } = useApp();

  const unreadCount = notifications.filter(n => !n.read).length;

  return (
    <div className="py-8 flex flex-col items-center justify-center min-h-[calc(100vh-80px)] animate-in fade-in">
      
      {/* Viewport helper info */}
      <div className="mb-4 flex items-center gap-3">
        <span className="text-xs font-bold text-[#0F5238] bg-white px-3 py-1.5 rounded-full border border-gray-200 shadow-sm">
          📱 Mobil Deneyim Simülatörü (iOS / Android)
        </span>
        <button
          onClick={() => setViewMode('web')}
          className="text-xs font-bold text-[#52B788] hover:underline"
        >
          Tam Ekran Web'e Dön ↗
        </button>
      </div>

      {/* Phone Mockup Frame */}
      <div className="w-[390px] h-[810px] bg-white rounded-[50px] shadow-[0_25px_60px_-15px_rgba(0,0,0,0.3)] border-[10px] border-gray-900 overflow-hidden relative flex flex-col">
        
        {/* Dynamic Island / Notch */}
        <div className="absolute top-0 left-1/2 -translate-x-1/2 w-32 h-6 bg-gray-900 rounded-b-2xl z-50 flex items-center justify-center">
          <div className="w-3 h-3 rounded-full bg-gray-800 mr-2"></div>
          <div className="w-2 h-2 rounded-full bg-blue-900"></div>
        </div>

        {/* Mobile Status Bar */}
        <div className="pt-2 px-6 pb-2 flex items-center justify-between text-xs font-bold text-gray-800 select-none z-40 bg-white/90 backdrop-blur-md">
          <span>09:41</span>
          <div className="flex items-center gap-1.5">
            <Signal className="w-3.5 h-3.5" />
            <Wifi className="w-3.5 h-3.5" />
            <Battery className="w-4 h-4" />
          </div>
        </div>

        {/* Mobile Header Bar */}
        <div className="px-4 py-2.5 bg-white border-b border-gray-100 flex items-center justify-between z-30">
          <div className="flex items-center gap-2">
            <span className="font-black text-base text-[#0F5238]">Gıda<span className="text-[#52B788]">Köprüsü</span></span>
          </div>

          <div className="flex items-center gap-2">
            <button
              onClick={() => setActiveTab('notifications')}
              className="relative p-1.5 rounded-xl text-[#0F5238]"
            >
              <Bell className="w-4 h-4" />
              {unreadCount > 0 && (
                <span className="absolute top-0 right-0 w-3 h-3 bg-red-500 text-white text-[8px] font-black rounded-full flex items-center justify-center">
                  {unreadCount}
                </span>
              )}
            </button>
            <img
              src={currentUser.avatar}
              alt={currentUser.name}
              className="w-7 h-7 rounded-full object-cover border border-[#52B788]"
            />
          </div>
        </div>

        {/* Mobile Inner Scrollable Screen */}
        <div className="flex-1 overflow-y-auto p-4 pb-24 bg-[#F0FFF4]/40">
          {children}
        </div>

        {/* Native Bottom Bar embedded inside phone */}
        <div className="absolute bottom-0 left-0 right-0 bg-white/95 backdrop-blur-md border-t border-gray-100 py-2.5 px-4 flex items-center justify-around z-40">
          {[
            { id: 'explore', label: 'Keşfet', icon: '🧭' },
            { id: 'map', label: 'Harita', icon: '📍' },
            { id: 'reservations', label: 'Kuponlar', icon: '🎟️' },
            { id: 'badges', label: 'Rozetler', icon: '🏆' },
            { id: 'profile', label: 'Profil', icon: '👤' },
          ].map((tab) => {
            const isActive = activeTab === tab.id;
            return (
              <button
                key={tab.id}
                onClick={() => setActiveTab(tab.id)}
                className={`flex flex-col items-center gap-0.5 text-[10px] font-bold transition ${
                  isActive ? 'text-[#0F5238] scale-105' : 'text-gray-400'
                }`}
              >
                <span className="text-base">{tab.icon}</span>
                <span>{tab.label}</span>
              </button>
            );
          })}
        </div>

        {/* Home Indicator Bar */}
        <div className="absolute bottom-1 left-1/2 -translate-x-1/2 w-28 h-1 bg-gray-300 rounded-full z-50 pointer-events-none"></div>

      </div>
    </div>
  );
};
