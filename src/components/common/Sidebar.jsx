import React from 'react';
import { useApp } from '../../context/AppContext';
import {
  Compass,
  MapPin,
  ShoppingBag,
  Award,
  Trophy,
  Bell,
  User,
  LayoutDashboard,
  PlusCircle,
  QrCode,
  BarChart3,
  Building2,
  ShieldCheck,
  FolderTree,
  FileSpreadsheet,
  HeartHandshake,
  Truck,
  Users
} from 'lucide-react';

export const Sidebar = () => {
  const { currentRole, activeTab, setActiveTab, reservations, notifications } = useApp();

  const unreadCount = notifications.filter(n => !n.read).length;
  const activeResCount = reservations.filter(r => r.status === 'confirmed').length;

  const getMenuItems = () => {
    switch (currentRole) {
      case 'business':
        return [
          { id: 'business_dash', label: 'İşletme Özeti', icon: LayoutDashboard },
          { id: 'business_new_listing', label: 'Yeni İlan Paylaş', icon: PlusCircle, highlight: true },
          { id: 'business_orders', label: 'Teslimat & QR Onay', icon: QrCode, badge: 'Canlı' },
          { id: 'business_stats', label: 'Etki & İstatistikler', icon: BarChart3 },
          { id: 'profile', label: 'İşletme Profili', icon: Building2 },
        ];
      case 'ngo':
        return [
          { id: 'ngo_dash', label: 'STK Ana Panel', icon: HeartHandshake },
          { id: 'ngo_bulk_requests', label: 'Toplu Bağış Talepleri', icon: Truck, badge: '4 Yeni' },
          { id: 'ngo_distribution', label: 'Dağıtım & Aşevleri', icon: MapPin },
          { id: 'ngo_volunteers', label: 'Gönüllü Yönetimi', icon: Users },
          { id: 'leaderboard', label: 'Etki Tablosu', icon: Trophy },
        ];
      case 'admin':
        return [
          { id: 'admin_dash', label: 'Admin Dashboard', icon: ShieldCheck },
          { id: 'admin_businesses', label: 'İşletme Yönetimi', icon: Building2, badge: '3 Bekleyen' },
          { id: 'admin_categories', label: 'Kategori Yönetimi', icon: FolderTree },
          { id: 'admin_reports', label: 'Platform Raporları', icon: FileSpreadsheet },
          { id: 'explore', label: 'Kullanıcı Görünümü', icon: Compass },
        ];
      case 'buyer':
      default:
        return [
          { id: 'explore', label: 'İlanları Keşfet', icon: Compass },
          { id: 'map', label: 'Haritada Bul', icon: MapPin },
          { id: 'reservations', label: 'Rezervasyonlarım', icon: ShoppingBag, badge: activeResCount > 0 ? activeResCount : null },
          { id: 'badges', label: 'Rozetlerim & Seviye', icon: Award },
          { id: 'leaderboard', label: 'Liderlik Tablosu', icon: Trophy },
          { id: 'notifications', label: 'Bildirimler', icon: Bell, badge: unreadCount > 0 ? unreadCount : null },
          { id: 'profile', label: 'Profil & Ayarlar', icon: User },
        ];
    }
  };

  const menuItems = getMenuItems();

  return (
    <aside className="w-64 flex-shrink-0 bg-white border-r border-[#2D6A4F]/10 min-h-[calc(100vh-65px)] p-4 flex flex-col justify-between hidden lg:flex">
      <div className="space-y-6">
        
        {/* Role Badge Indicator */}
        <div className="px-3 py-2 bg-[#F0FFF4] rounded-2xl border border-[#A8E7C5]/50 flex items-center gap-2.5">
          <div className="w-2.5 h-2.5 rounded-full bg-[#10B981] animate-ping"></div>
          <div>
            <p className="text-[10px] uppercase tracking-wider font-bold text-[#006C48]">Aktif Görünüm</p>
            <p className="text-xs font-bold text-[#0F5238]">
              {currentRole === 'buyer' && '🌱 Alıcı & Gönüllü'}
              {currentRole === 'business' && '🏪 Bağışçı İşletme'}
              {currentRole === 'ngo' && '🤝 STK & Aşevi'}
              {currentRole === 'admin' && '🛡️ Sistem Yöneticisi'}
            </p>
          </div>
        </div>

        {/* Navigation List */}
        <nav className="space-y-1.5">
          {menuItems.map((item) => {
            const Icon = item.icon;
            const isActive = activeTab === item.id;

            return (
              <button
                key={item.id}
                onClick={() => setActiveTab(item.id)}
                className={`w-full flex items-center justify-between px-3.5 py-3 rounded-2xl text-xs font-semibold transition-all duration-200 ${
                  isActive
                    ? 'bg-[#2D6A4F] text-white shadow-md shadow-[#2D6A4F]/25 font-bold'
                    : item.highlight
                    ? 'bg-[#D1FEE5] text-[#006C48] hover:bg-[#A8E7C5]/50'
                    : 'text-[#404943] hover:bg-[#F0FFF4] hover:text-[#0F5238]'
                }`}
              >
                <div className="flex items-center gap-3">
                  <Icon className={`w-4 h-4 ${isActive ? 'text-white' : item.highlight ? 'text-[#006C48]' : 'text-gray-400'}`} />
                  <span>{item.label}</span>
                </div>

                {item.badge && (
                  <span
                    className={`px-2 py-0.5 rounded-full text-[10px] font-bold ${
                      isActive
                        ? 'bg-white/20 text-white'
                        : 'bg-[#EF4444] text-white'
                    }`}
                  >
                    {item.badge}
                  </span>
                )}
              </button>
            );
          })}
        </nav>
      </div>

      {/* Sustainability Quick Impact widget in sidebar */}
      <div className="p-4 bg-gradient-to-br from-[#E8FFF0] to-[#CCF8DF] rounded-3xl border border-[#95D5B2]/40 text-center relative overflow-hidden">
        <div className="absolute -right-3 -bottom-3 opacity-15">
          <Award className="w-20 h-20 text-[#0F5238]" />
        </div>
        <div className="relative z-10">
          <span className="text-xl">🌍</span>
          <h4 className="text-xs font-bold text-[#0F5238] mt-1">Platform Etkisi</h4>
          <p className="text-[11px] text-[#006C48] mt-0.5">Bugün kurtarılan:</p>
          <p className="text-base font-extrabold text-[#0F5238]">14.850 kg Gıda</p>
          <div className="mt-2 w-full bg-white/70 h-1.5 rounded-full overflow-hidden">
            <div className="bg-[#52B788] h-full rounded-full w-[78%]"></div>
          </div>
          <p className="text-[9px] text-gray-500 mt-1.5 font-medium">%78 Günlük Hedef Tamamlandı</p>
        </div>
      </div>
    </aside>
  );
};
