import React from 'react';
import { useApp } from '../../context/AppContext';
import {
  Compass,
  MapPin,
  ShoppingBag,
  User,
  PlusCircle,
  LayoutDashboard,
  QrCode,
  ShieldCheck,
  Award,
  BarChart3,
  FileSpreadsheet,
  HeartHandshake,
  Truck,
  Users
} from 'lucide-react';

export const BottomNav = () => {
  const { currentRole, activeTab, setActiveTab, myPurchases } = useApp();

  const activeResCount = myPurchases.filter(r => r.status === 'confirmed').length;

  const getMobileTabs = () => {
    if (currentRole === 'business') {
      return [
        { id: 'business_dash', label: 'Özet', icon: LayoutDashboard },
        { id: 'business_orders', label: 'QR Onay', icon: QrCode },
        { id: 'business_new_listing', label: 'Yeni İlan', icon: PlusCircle, isMain: true },
        { id: 'business_stats', label: 'İstatistik', icon: BarChart3 },
        { id: 'profile', label: 'Profil', icon: User },
      ];
    }
    if (currentRole === 'ngo') {
      return [
        { id: 'ngo_dash', label: 'STK Panel', icon: HeartHandshake },
        { id: 'ngo_bulk_requests', label: 'Talepler', icon: Truck },
        { id: 'ngo_distribution', label: 'Dağıtım', icon: MapPin, isMain: true },
        { id: 'ngo_volunteers', label: 'Gönüllüler', icon: Users },
        { id: 'profile', label: 'Profil', icon: User },
      ];
    }
    if (currentRole === 'admin') {
      return [
        { id: 'admin_dash', label: 'Admin', icon: ShieldCheck },
        { id: 'admin_businesses', label: 'İşletmeler', icon: LayoutDashboard },
        { id: 'explore', label: 'Keşfet', icon: Compass },
        { id: 'admin_reports', label: 'Raporlar', icon: FileSpreadsheet },
        { id: 'profile', label: 'Profil', icon: User },
      ];
    }
    // Buyer
    return [
      { id: 'explore', label: 'Keşfet', icon: Compass },
      { id: 'map', label: 'Harita', icon: MapPin },
      { id: 'reservations', label: 'Kuponlarım', icon: ShoppingBag, badge: activeResCount > 0 ? activeResCount : null },
      { id: 'badges', label: 'Rozetler', icon: Award },
      { id: 'profile', label: 'Profil', icon: User },
    ];
  };

  const tabs = getMobileTabs();

  return (
    <div className="fixed bottom-0 left-0 right-0 z-40 bg-white/95 backdrop-blur-lg border-t border-[#2D6A4F]/10 px-2 py-2 flex items-center justify-around lg:hidden shadow-lg">
      {tabs.map((tab) => {
        const Icon = tab.icon;
        const isActive = activeTab === tab.id;

        if (tab.isMain) {
          return (
            <button
              key={tab.id}
              onClick={() => setActiveTab(tab.id)}
              className="relative -top-4 w-13 h-13 rounded-full bg-[#0F5238] text-white flex flex-col items-center justify-center shadow-lg shadow-[#0F5238]/40 border-4 border-white transition-transform active:scale-95"
            >
              <Icon className="w-6 h-6" />
            </button>
          );
        }

        return (
          <button
            key={tab.id}
            onClick={() => setActiveTab(tab.id)}
            className={`relative flex flex-col items-center gap-1 py-1 px-3 rounded-xl transition ${
              isActive ? 'text-[#0F5238] font-bold' : 'text-gray-400 hover:text-gray-600'
            }`}
          >
            <Icon className={`w-5 h-5 ${isActive ? 'stroke-[2.5]' : 'stroke-[1.8]'}`} />
            <span className="text-[10px]">{tab.label}</span>
            {tab.badge && (
              <span className="absolute top-0 right-2 w-4 h-4 bg-[#EF4444] text-white text-[9px] font-extrabold rounded-full flex items-center justify-center">
                {tab.badge}
              </span>
            )}
          </button>
        );
      })}
    </div>
  );
};
