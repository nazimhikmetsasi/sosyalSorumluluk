import React, { useState } from 'react';
import { useApp } from '../../context/AppContext';
import { ImpactCertificateModal } from '../modals/ImpactCertificateModal';
import {
  Award,
  Leaf,
  Sparkles,
  Share2,
  Lock,
  CheckCircle2,
  TrendingUp,
  Droplet,
  Globe2,
  Utensils,
  FileCheck2
} from 'lucide-react';

export const ProfileBadgesView = () => {
  const { currentUser, badges, showToast, resetDemoData } = useApp();
  const [isCertOpen, setIsCertOpen] = useState(false);

  const handleShareImpact = () => {
    navigator.clipboard?.writeText(
      `GıdaKöprüsü ile ${currentUser.savedKg} kg gıda kurtardım ve ${currentUser.co2SavedKg} kg CO₂ salımını engelledim! 🌍🌱 Sen de katıl: https://gidakoprusu.org`
    );
    showToast('Sosyal etki kartınız panoya kopyalandı! 🚀');
  };

  return (
    <div className="space-y-6 pb-20 lg:pb-10 max-w-4xl mx-auto animate-in fade-in duration-300">
      
      {/* Profile Header Hero Card */}
      <div className="bg-white rounded-3xl p-6 sm:p-8 border border-gray-100 shadow-sm relative overflow-hidden">
        <div className="absolute top-0 right-0 w-64 h-64 bg-gradient-to-bl from-[#D1FEE5]/60 to-transparent rounded-bl-full pointer-events-none"></div>

        <div className="flex flex-col sm:flex-row items-center sm:items-start gap-6 relative z-10">
          <img
            src={currentUser.avatar}
            alt={currentUser.name}
            className="w-24 h-24 sm:w-28 sm:h-28 rounded-3xl object-cover border-4 border-white shadow-xl"
          />

          <div className="space-y-2 text-center sm:text-left flex-1">
            <div className="flex flex-wrap items-center justify-center sm:justify-start gap-2">
              <h1 className="text-2xl font-black text-[#0F5238]">{currentUser.name}</h1>
              <span className="px-3 py-1 bg-[#D1FEE5] text-[#006C48] text-xs font-extrabold rounded-full">
                Seviye {currentUser.level} Kurtarıcı
              </span>
            </div>

            <p className="text-xs text-gray-500 font-medium">
              {currentUser.city}, {currentUser.district} • Kasım 2025'ten beri platform üyesi
            </p>

            <div className="pt-2 flex flex-wrap items-center justify-center sm:justify-start gap-3 text-xs font-semibold text-gray-600">
              <span className="flex items-center gap-1.5 bg-[#F0FFF4] px-3 py-1.5 rounded-xl border border-[#A8E7C5]/40 text-[#0F5238]">
                <Sparkles className="w-4 h-4 text-[#52B788]" />
                {currentUser.points} Topluluk Puanı
              </span>

              <button
                onClick={() => setIsCertOpen(true)}
                className="flex items-center gap-1.5 bg-[#0F5238] hover:bg-[#2D6A4F] text-white px-3.5 py-1.5 rounded-xl transition shadow-sm font-bold text-xs"
              >
                <FileCheck2 className="w-3.5 h-3.5 text-[#95D5B2]" />
                Eko Sertifikam
              </button>

              <button
                onClick={handleShareImpact}
                className="flex items-center gap-1.5 bg-white border border-gray-200 hover:bg-gray-50 text-gray-700 px-3.5 py-1.5 rounded-xl transition shadow-sm font-bold text-xs"
              >
                <Share2 className="w-3.5 h-3.5 text-[#52B788]" />
                Etkini Paylaş
              </button>
            </div>
          </div>
        </div>
      </div>

      {/* 4 Environmental Metrics Grid */}
      <div className="grid grid-cols-2 sm:grid-cols-4 gap-4">
        
        <div className="bg-gradient-to-br from-[#E8FFF0] to-[#CCF8DF] p-5 rounded-3xl border border-[#95D5B2]/40 text-center">
          <span className="text-2xl">🌿</span>
          <p className="text-2xl font-black text-[#0F5238] mt-1">{currentUser.savedKg} kg</p>
          <p className="text-xs font-bold text-[#006C48] mt-0.5">Kurtarılan Gıda</p>
        </div>

        <div className="bg-gradient-to-br from-[#E0F2FE] to-[#BAE6FD] p-5 rounded-3xl border border-[#7DD3FC]/40 text-center">
          <span className="text-2xl">🌍</span>
          <p className="text-2xl font-black text-[#0369A1] mt-1">{currentUser.co2SavedKg} kg</p>
          <p className="text-xs font-bold text-[#0284C7] mt-0.5">Önlenen CO₂ Salımı</p>
        </div>

        <div className="bg-gradient-to-br from-[#FEF3C7] to-[#FDE68A] p-5 rounded-3xl border border-[#FCD34D]/40 text-center">
          <span className="text-2xl">🍽️</span>
          <p className="text-2xl font-black text-[#B45309] mt-1">{currentUser.portionsCount}</p>
          <p className="text-xs font-bold text-[#D97706] mt-0.5">Porsiyon Dağıtıldı</p>
        </div>

        <div className="bg-gradient-to-br from-[#FEE2E2] to-[#FECACA] p-5 rounded-3xl border border-[#FCA5A5]/40 text-center">
          <span className="text-2xl">💰</span>
          <p className="text-2xl font-black text-[#B91C1C] mt-1">{currentUser.moneySavedTl} ₺</p>
          <p className="text-xs font-bold text-[#DC2626] mt-0.5">Tasarruf Edildi</p>
        </div>

      </div>

      {/* Badges and Gamification */}
      <div className="bg-white rounded-3xl p-6 sm:p-8 border border-gray-100 shadow-sm space-y-5">
        <div className="flex items-center justify-between">
          <div>
            <h2 className="text-lg font-black text-[#0F5238] flex items-center gap-2">
              <Award className="w-5 h-5 text-[#52B788]" />
              Kazanılan Rozetler & Görevler
            </h2>
            <p className="text-xs text-gray-500">
              Gıda israfına karşı başarılarınızla yeni rozetler ve topluluk unvanları kazanın.
            </p>
          </div>
          <span className="px-3 py-1 rounded-xl bg-[#F0FFF4] text-[#0F5238] font-extrabold text-xs border border-[#A8E7C5]">
            3 / 5 Açıldı
          </span>
        </div>

        <div className="grid grid-cols-2 lg:grid-cols-3 gap-3 sm:gap-4">
          {badges.map((badge) => (
            <div
              key={badge.id}
              className={`p-4 rounded-2xl border transition-all ${
                badge.unlocked
                  ? 'bg-[#F0FFF4] border-[#A8E7C5]/70 shadow-sm'
                  : 'bg-gray-50 border-gray-200 opacity-60'
              }`}
            >
              <div className="flex items-start justify-between">
                <div className="w-12 h-12 rounded-2xl bg-white shadow-sm flex items-center justify-center text-2xl border border-gray-100">
                  {badge.emoji}
                </div>
                {badge.unlocked ? (
                  <span className="flex items-center gap-1 text-[11px] font-bold text-[#10B981] bg-white px-2 py-0.5 rounded-lg border border-green-200">
                    <CheckCircle2 className="w-3.5 h-3.5" />
                    Kazanıldı
                  </span>
                ) : (
                  <span className="flex items-center gap-1 text-[11px] font-bold text-gray-500 bg-white px-2 py-0.5 rounded-lg border border-gray-200">
                    <Lock className="w-3.5 h-3.5" />
                    %{badge.progress}
                  </span>
                )}
              </div>

              <h4 className="font-bold text-sm text-[#0F5238] mt-3">{badge.name}</h4>
              <p className="text-xs text-gray-600 mt-0.5">{badge.description}</p>

              {!badge.unlocked && (
                <div className="mt-3 w-full bg-gray-200 h-2 rounded-full overflow-hidden">
                  <div
                    className="bg-[#2D6A4F] h-full rounded-full transition-all duration-500"
                    style={{ width: `${badge.progress}%` }}
                  ></div>
                </div>
              )}
            </div>
          ))}
        </div>
      </div>

      {/* Reset demo data option */}
      <div className="p-4 bg-gray-50 rounded-2xl border border-gray-200 flex items-center justify-between">
        <div>
          <p className="text-xs font-bold text-gray-700">Demo Verilerini Sıfırla</p>
          <p className="text-[11px] text-gray-400">LocalStorage belleğini temizleyip başlangıç ayarlarına döndürür.</p>
        </div>
        <button
          onClick={resetDemoData}
          className="px-3.5 py-1.5 bg-white border border-gray-300 hover:bg-gray-100 text-gray-700 text-xs font-bold rounded-xl transition"
        >
          Sıfırla
        </button>
      </div>

      {/* Impact Certificate Modal */}
      <ImpactCertificateModal
        isOpen={isCertOpen}
        onClose={() => setIsCertOpen(false)}
      />

    </div>
  );
};
