import React from 'react';
import { useApp } from '../../context/AppContext';
import { Bell, CheckCheck, Clock, CheckCircle2, Tag, Award, ArrowRight } from 'lucide-react';

export const NotificationsView = () => {
  const { notifications, setNotifications, setActiveTab, showToast } = useApp();

  const markAllAsRead = () => {
    setNotifications(prev => prev.map(n => ({ ...n, read: true })));
    showToast('Tüm bildirimler okundu olarak işaretlendi.');
  };

  return (
    <div className="space-y-6 pb-20 lg:pb-10 max-w-3xl mx-auto animate-in fade-in duration-300">
      
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-black text-[#0F5238] flex items-center gap-2">
            <Bell className="w-6 h-6 text-[#52B788]" />
            Bildirimler
          </h1>
          <p className="text-xs text-gray-500 mt-0.5">
            Sipariş durumları, yeni kurtarma fırsatları ve başarı rozetleriniz.
          </p>
        </div>

        {notifications.some(n => !n.read) && (
          <button
            onClick={markAllAsRead}
            className="flex items-center gap-1.5 px-3 py-1.5 rounded-xl bg-white border border-gray-200 text-xs font-bold text-[#0F5238] hover:bg-[#F0FFF4] transition shadow-sm"
          >
            <CheckCheck className="w-4 h-4 text-[#52B788]" />
            Tümünü Oku
          </button>
        )}
      </div>

      <div className="space-y-3">
        {notifications.map((notif) => (
          <div
            key={notif.id}
            className={`p-4 rounded-3xl border transition-all flex items-start justify-between gap-4 ${
              notif.read
                ? 'bg-white border-gray-100 opacity-80'
                : 'bg-[#F0FFF4] border-[#A8E7C5]/60 shadow-sm'
            }`}
          >
            <div className="flex items-start gap-3.5">
              <div className={`w-10 h-10 rounded-2xl flex items-center justify-center flex-shrink-0 ${
                notif.type === 'order'
                  ? 'bg-[#2D6A4F] text-white'
                  : notif.type === 'badge'
                  ? 'bg-amber-400 text-[#002114]'
                  : 'bg-[#52B788] text-white'
              }`}>
                {notif.type === 'order' && <CheckCircle2 className="w-5 h-5" />}
                {notif.type === 'badge' && <Award className="w-5 h-5" />}
                {notif.type === 'listing' && <Tag className="w-5 h-5" />}
              </div>

              <div>
                <h4 className="text-xs sm:text-sm font-bold text-[#0F5238]">{notif.title}</h4>
                <p className="text-xs text-gray-600 mt-0.5 leading-relaxed">{notif.message}</p>
                <span className="text-[10px] text-gray-400 mt-2 block font-medium">{notif.time}</span>
              </div>
            </div>

            <button
              onClick={() => {
                if (notif.type === 'order') setActiveTab('reservations');
                if (notif.type === 'badge') setActiveTab('badges');
                if (notif.type === 'listing') setActiveTab('explore');
              }}
              className="px-3 py-1.5 rounded-xl bg-white text-xs font-bold text-[#0F5238] border border-gray-200 hover:border-[#52B788] transition shadow-sm flex items-center gap-1 flex-shrink-0"
            >
              <span>Git</span>
              <ArrowRight className="w-3.5 h-3.5" />
            </button>
          </div>
        ))}
      </div>

    </div>
  );
};
