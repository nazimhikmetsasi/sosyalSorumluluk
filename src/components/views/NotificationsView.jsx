import React from 'react';
import { useApp } from '../../context/AppContext';
import { Bell, CheckCheck, CheckCircle2, Tag, Award, ArrowRight, Sparkles, Trash2 } from 'lucide-react';

export const NotificationsView = () => {
  const { notifications, setNotifications, setActiveTab, showToast } = useApp();

  const markAllAsRead = () => {
    setNotifications(prev => prev.map(n => ({ ...n, read: true })));
    showToast('Tüm bildirimler okundu olarak işaretlendi.');
  };

  const simulateNewOpportunity = () => {
    const opportunities = [
      { title: '⚡ Flaş İndirim: Kadıköy Fırını', message: 'Son 3 adet ekşi mayalı ekmek sepeti %70 indirimle satışta!', type: 'listing' },
      { title: '🎉 Yeni Başarı: Haftalık Süper Kahraman!', message: 'Bu hafta 5 kg gıda kurtardınız ve +100 puan kazandınız.', type: 'badge' },
      { title: '🤝 Aşevi Çağrısı: Sıcak Çorba', message: 'Moda Aşevine 25 porsiyon sıcak yemek bağışı teslim alındı.', type: 'order' }
    ];
    const picked = opportunities[Math.floor(Math.random() * opportunities.length)];
    const newNotif = {
      id: `notif_${Date.now()}`,
      title: picked.title,
      message: picked.message,
      time: 'Şimdi',
      read: false,
      type: picked.type
    };
    setNotifications(prev => [newNotif, ...prev]);
    showToast(`Yeni Canlı Bildirim: ${picked.title} 🔔`);
  };

  const removeNotification = (id) => {
    setNotifications(prev => prev.filter(n => n.id !== id));
  };

  return (
    <div className="space-y-3.5 pb-20 lg:pb-10 animate-in fade-in duration-300">
      
      <div className="flex items-center justify-between">
        <h1 className="text-xs font-black text-[#0F5238] flex items-center gap-1.5">
          <Bell className="w-3.5 h-3.5 text-[#52B788]" />
          Bildirimler
        </h1>

        <div className="flex items-center gap-1.5">
          <button
            onClick={simulateNewOpportunity}
            className="flex items-center gap-1 px-2 py-1 rounded-xl bg-[#0F5238] text-[9px] font-bold text-white hover:bg-[#2D6A4F] transition shadow-sm"
          >
            <Sparkles className="w-3 h-3 text-[#95D5B2]" />
            <span>Flaş Simüle Et</span>
          </button>

          {notifications.some(n => !n.read) && (
            <button
              onClick={markAllAsRead}
              className="flex items-center gap-1 px-2 py-1 rounded-xl bg-white border border-gray-200 text-[9px] font-bold text-[#0F5238] hover:bg-[#F0FFF4] transition shadow-sm"
            >
              <CheckCheck className="w-3 h-3 text-[#52B788]" />
              <span>Tümü Oku</span>
            </button>
          )}
        </div>
      </div>

      <div className="space-y-2">
        {notifications.length === 0 ? (
          <div className="bg-white rounded-2xl p-6 text-center border border-gray-100 text-gray-400 text-xs">
            Henüz bildiriminiz bulunmuyor.
          </div>
        ) : (
          notifications.map((notif) => (
            <div
              key={notif.id}
              className={`p-3 rounded-2xl border transition-all flex items-start justify-between gap-2.5 ${
                notif.read
                  ? 'bg-white border-gray-100 opacity-80'
                  : 'bg-[#F0FFF4] border-[#A8E7C5]/60 shadow-sm'
              }`}
            >
              <div className="flex items-start gap-2.5 min-w-0">
                <div className={`w-8 h-8 rounded-xl flex items-center justify-center flex-shrink-0 ${
                  notif.type === 'order'
                    ? 'bg-[#2D6A4F] text-white'
                    : notif.type === 'badge'
                    ? 'bg-amber-400 text-[#002114]'
                    : 'bg-[#52B788] text-white'
                }`}>
                  {notif.type === 'order' && <CheckCircle2 className="w-4 h-4" />}
                  {notif.type === 'badge' && <Award className="w-4 h-4" />}
                  {notif.type === 'listing' && <Tag className="w-4 h-4" />}
                </div>

                <div className="min-w-0">
                  <h4 className="text-[11px] font-bold text-[#0F5238] truncate">{notif.title}</h4>
                  <p className="text-[10px] text-gray-600 mt-0.5 leading-snug line-clamp-2">{notif.message}</p>
                  <span className="text-[8px] text-gray-400 mt-1 block font-medium">{notif.time}</span>
                </div>
              </div>

              <div className="flex items-center gap-1 flex-shrink-0">
                <button
                  onClick={() => {
                    if (notif.type === 'order') setActiveTab('reservations');
                    if (notif.type === 'badge') setActiveTab('badges');
                    if (notif.type === 'listing') setActiveTab('explore');
                  }}
                  className="p-1.5 rounded-xl bg-white text-[10px] font-bold text-[#0F5238] border border-gray-200 hover:border-[#52B788] transition shadow-sm flex items-center gap-0.5"
                >
                  <ArrowRight className="w-3 h-3" />
                </button>
                <button
                  onClick={() => removeNotification(notif.id)}
                  className="p-1.5 rounded-xl text-gray-400 hover:text-red-500 transition"
                  title="Sil"
                >
                  <Trash2 className="w-3 h-3" />
                </button>
              </div>
            </div>
          ))
        )}
      </div>

    </div>
  );
};
