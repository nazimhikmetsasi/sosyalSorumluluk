import React, { useState, useRef } from 'react';
import { useApp } from '../../context/AppContext';
import { ImpactCertificateModal } from '../modals/ImpactCertificateModal';
import { ProfileEditModal } from '../modals/ProfileEditModal';
import {
  Award,
  Sparkles,
  Share2,
  Lock,
  CheckCircle2,
  FileCheck2,
  Pencil,
  Camera
} from 'lucide-react';

export const ProfileBadgesView = () => {
  const { currentUser, badges, showToast, resetDemoData, changeAvatar } = useApp();
  const [isCertOpen, setIsCertOpen] = useState(false);
  const [isEditOpen, setIsEditOpen] = useState(false);
  const [uploading, setUploading] = useState(false);
  const fileInputRef = useRef(null);

  const handleAvatarPick = async (e) => {
    const file = e.target.files?.[0];
    e.target.value = ''; // let the same file be picked again after a failure
    if (!file) return;

    setUploading(true);
    await changeAvatar(file);
    setUploading(false);
  };

  const handleShareImpact = () => {
    navigator.clipboard?.writeText(
      `sosyalSorumluluk ile ${currentUser.savedKg} kg gıda kurtardım ve ${currentUser.co2SavedKg} kg CO₂ salımını engelledim! 🌍🌱 Sen de katıl: https://sosyalsorumluluk.org`
    );
    showToast('Sosyal etki kartınız panoya kopyalandı! 🚀');
  };

  return (
    <div className="space-y-4 pb-20 lg:pb-10 animate-in fade-in duration-300">

      {/* Compact Profile Hero */}
      <div className="bg-white rounded-2xl p-4 border border-gray-100 shadow-sm relative overflow-hidden">
        <div className="absolute top-0 right-0 w-32 h-32 bg-gradient-to-bl from-[#D1FEE5]/50 to-transparent rounded-bl-full pointer-events-none"></div>

        <div className="flex items-center gap-3 relative z-10">
          <button
            type="button"
            onClick={() => fileInputRef.current?.click()}
            disabled={uploading}
            title="Profil fotoğrafını değiştir"
            className="relative w-16 h-16 rounded-2xl overflow-hidden border-2 border-white shadow-md flex-shrink-0 group"
          >
            <img
              src={currentUser.avatar}
              alt={currentUser.name}
              className="w-full h-full object-cover"
            />
            <span className="absolute inset-0 bg-black/45 flex items-center justify-center opacity-0 group-hover:opacity-100 focus-visible:opacity-100 transition">
              <Camera className="w-5 h-5 text-white" />
            </span>
            {uploading && (
              <span className="absolute inset-0 bg-black/55 flex items-center justify-center">
                <span className="w-5 h-5 rounded-full border-2 border-white/40 border-t-white animate-spin" />
              </span>
            )}
          </button>

          <input
            ref={fileInputRef}
            type="file"
            accept="image/jpeg,image/png,image/webp"
            onChange={handleAvatarPick}
            className="hidden"
          />

          <div className="flex-1 min-w-0">
            <div className="flex items-center gap-2 flex-wrap">
              <h1 className="text-base font-black text-[#0F5238] truncate">{currentUser.name}</h1>
              <span className="px-2 py-0.5 bg-[#D1FEE5] text-[#006C48] text-[10px] font-extrabold rounded-full whitespace-nowrap">
                Seviye {currentUser.level} Kurtarıcı
              </span>
              <button
                onClick={() => setIsEditOpen(true)}
                className="flex items-center gap-1 px-2 py-0.5 rounded-full border border-gray-200 text-gray-600 hover:border-[#52B788] hover:text-[#0F5238] text-[10px] font-bold transition"
              >
                <Pencil className="w-3 h-3" />
                Düzenle
              </button>
            </div>
            <p className="text-[10px] text-gray-400 font-medium mt-0.5">
              {[currentUser.city, currentUser.district].filter(Boolean).join(', ') || 'Konum belirtilmedi'}
              {currentUser.email ? ` • ${currentUser.email}` : ''}
            </p>
            {currentUser.bio && (
              <p className="text-[11px] text-gray-600 mt-1 line-clamp-2">{currentUser.bio}</p>
            )}

            <div className="flex items-center gap-2 mt-2 flex-wrap">
              <span className="flex items-center gap-1 bg-[#F0FFF4] px-2.5 py-1 rounded-lg border border-[#A8E7C5]/40 text-[#0F5238] text-[11px] font-bold">
                <Sparkles className="w-3 h-3 text-[#52B788]" />
                {currentUser.points} Puan
              </span>

              <button
                onClick={() => setIsCertOpen(true)}
                className="flex items-center gap-1 bg-[#0F5238] text-white px-2.5 py-1 rounded-lg text-[11px] font-bold"
              >
                <FileCheck2 className="w-3 h-3 text-[#95D5B2]" />
                Eko Sertifika
              </button>

              <button
                onClick={handleShareImpact}
                className="flex items-center gap-1 bg-white border border-gray-200 text-gray-700 px-2.5 py-1 rounded-lg text-[11px] font-bold"
              >
                <Share2 className="w-3 h-3 text-[#52B788]" />
                Paylaş
              </button>
            </div>
          </div>
        </div>
      </div>

      {/* 4 Environmental Metrics — 2x2 grid */}
      <div className="grid grid-cols-2 gap-2.5">
        <div className="bg-gradient-to-br from-[#E8FFF0] to-[#CCF8DF] p-3.5 rounded-2xl border border-[#95D5B2]/40 text-center">
          <span className="text-xl">🌿</span>
          <p className="text-xl font-black text-[#0F5238] mt-1">{currentUser.savedKg} kg</p>
          <p className="text-[10px] font-bold text-[#006C48] mt-0.5">Kurtarılan Gıda</p>
        </div>

        <div className="bg-gradient-to-br from-[#E0F2FE] to-[#BAE6FD] p-3.5 rounded-2xl border border-[#7DD3FC]/40 text-center">
          <span className="text-xl">🌍</span>
          <p className="text-xl font-black text-[#0369A1] mt-1">{currentUser.co2SavedKg} kg</p>
          <p className="text-[10px] font-bold text-[#0284C7] mt-0.5">Önlenen CO₂</p>
        </div>

        <div className="bg-gradient-to-br from-[#FEF3C7] to-[#FDE68A] p-3.5 rounded-2xl border border-[#FCD34D]/40 text-center">
          <span className="text-xl">🍽️</span>
          <p className="text-xl font-black text-[#B45309] mt-1">{currentUser.portionsCount}</p>
          <p className="text-[10px] font-bold text-[#D97706] mt-0.5">Porsiyon Dağıtıldı</p>
        </div>

        <div className="bg-gradient-to-br from-[#FEE2E2] to-[#FECACA] p-3.5 rounded-2xl border border-[#FCA5A5]/40 text-center">
          <span className="text-xl">💰</span>
          <p className="text-xl font-black text-[#B91C1C] mt-1">{currentUser.moneySavedTl} ₺</p>
          <p className="text-[10px] font-bold text-[#DC2626] mt-0.5">Tasarruf Edildi</p>
        </div>
      </div>

      {/* Badges — always 2 columns */}
      <div className="bg-white rounded-2xl p-4 border border-gray-100 shadow-sm space-y-3">
        <div className="flex items-center justify-between">
          <h2 className="text-sm font-black text-[#0F5238] flex items-center gap-2">
            <Award className="w-4 h-4 text-[#52B788]" />
            Rozetler &amp; Görevler
          </h2>
          <span className="px-2.5 py-0.5 rounded-xl bg-[#F0FFF4] text-[#0F5238] font-extrabold text-[11px] border border-[#A8E7C5]">
            3 / 5 Açıldı
          </span>
        </div>

        <div className="grid grid-cols-2 gap-2.5">
          {badges.map((badge) => (
            <div
              key={badge.id}
              className={`p-3 rounded-xl border transition-all ${
                badge.unlocked
                  ? 'bg-[#F0FFF4] border-[#A8E7C5]/70 shadow-sm'
                  : 'bg-gray-50 border-gray-200 opacity-60'
              }`}
            >
              <div className="flex items-start justify-between">
                <div className="w-9 h-9 rounded-xl bg-white shadow-sm flex items-center justify-center text-lg border border-gray-100">
                  {badge.emoji}
                </div>
                {badge.unlocked ? (
                  <span className="flex items-center gap-0.5 text-[9px] font-bold text-[#10B981] bg-white px-1.5 py-0.5 rounded-md border border-green-200">
                    <CheckCircle2 className="w-2.5 h-2.5" />
                    Kazanıldı
                  </span>
                ) : (
                  <span className="flex items-center gap-0.5 text-[9px] font-bold text-gray-500 bg-white px-1.5 py-0.5 rounded-md border border-gray-200">
                    <Lock className="w-2.5 h-2.5" />
                    %{badge.progress}
                  </span>
                )}
              </div>

              <h4 className="font-bold text-[11px] text-[#0F5238] mt-2 leading-tight">{badge.name}</h4>
              <p className="text-[10px] text-gray-500 mt-0.5 line-clamp-2">{badge.description}</p>

              {!badge.unlocked && (
                <div className="mt-2 w-full bg-gray-200 h-1.5 rounded-full overflow-hidden">
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

      {/* Reset demo */}
      <div className="p-3 bg-gray-50 rounded-xl border border-gray-200 flex items-center justify-between">
        <div>
          <p className="text-[11px] font-bold text-gray-700">Demo Verilerini Sıfırla</p>
          <p className="text-[10px] text-gray-400">LocalStorage'ı temizler.</p>
        </div>
        <button
          onClick={resetDemoData}
          className="px-3 py-1.5 bg-white border border-gray-300 text-gray-700 text-[11px] font-bold rounded-lg transition"
        >
          Sıfırla
        </button>
      </div>

      <ImpactCertificateModal
        isOpen={isCertOpen}
        onClose={() => setIsCertOpen(false)}
      />

      {/* Remounted on open so the form always starts from the saved values */}
      {isEditOpen && (
        <ProfileEditModal isOpen onClose={() => setIsEditOpen(false)} />
      )}
    </div>
  );
};
