import React, { useState } from 'react';
import { useApp } from '../../context/AppContext';
import { X, Download, Share2, CheckCircle2, Smartphone, FileCheck2 } from 'lucide-react';
import confetti from 'canvas-confetti';

export const ImpactCertificateModal = ({ isOpen, onClose }) => {
  const { currentUser, showToast } = useApp();
  const [format, setFormat] = useState('certificate'); // 'certificate' | 'story'

  if (!isOpen) return null;

  const handleDownload = () => {
    confetti({
      particleCount: 60,
      spread: 60,
      origin: { y: 0.6 }
    });
    showToast(format === 'story' ? 'Instagram Story kartınız indirildi! 📸' : 'Sosyal Etki Sertifikanız başarıyla indirildi! 🏆');
    onClose();
  };

  const handleShare = () => {
    navigator.clipboard?.writeText(`sosyalSorumluluk ile bugüne kadar tam ${currentUser.savedKg} kg gıda kurtardım ve ${currentUser.co2SavedKg} kg CO₂ salımını engelledim! 🌿 Sen de katıl: https://sosyalsorumluluk.org`);
    showToast('Paylaşım metni panoya kopyalandı! 📋');
  };

  return (
    <div className="fixed inset-0 z-[2000] flex items-center justify-center p-3 sm:p-6 bg-black/70 backdrop-blur-sm animate-in fade-in duration-200">
      <div className="relative w-full max-w-md bg-white rounded-3xl shadow-2xl overflow-hidden animate-in zoom-in-95 duration-200 flex flex-col max-h-[92vh]">
        
        {/* Header & Format Toggle */}
        <div className="p-3 bg-[#F0FFF4] border-b border-[#A8E7C5]/40 flex items-center justify-between">
          <div className="flex items-center gap-1 bg-white p-0.5 rounded-xl border border-gray-200 shadow-sm">
            <button
              onClick={() => setFormat('certificate')}
              className={`flex items-center gap-1 px-2.5 py-1 rounded-lg text-[10px] font-bold transition ${
                format === 'certificate' ? 'bg-[#0F5238] text-white shadow' : 'text-gray-600'
              }`}
            >
              <FileCheck2 className="w-3 h-3" />
              <span>Resmi Sertifika</span>
            </button>
            <button
              onClick={() => setFormat('story')}
              className={`flex items-center gap-1 px-2.5 py-1 rounded-lg text-[10px] font-bold transition ${
                format === 'story' ? 'bg-[#0F5238] text-white shadow' : 'text-gray-600'
              }`}
            >
              <Smartphone className="w-3 h-3" />
              <span>Instagram Story</span>
            </button>
          </div>

          <button
            onClick={onClose}
            className="w-7 h-7 rounded-full bg-white hover:bg-gray-100 flex items-center justify-center text-gray-500 shadow-sm transition"
          >
            <X className="w-4 h-4" />
          </button>
        </div>

        {/* Scrollable Canvas Box */}
        <div className="p-4 overflow-y-auto flex-1 flex flex-col items-center justify-center">
          
          {format === 'certificate' ? (
            /* Traditional Certificate View */
            <div className="w-full bg-gradient-to-b from-[#F0FFF4] via-white to-[#E8FFF0] text-center relative overflow-hidden border-4 border-double border-[#52B788]/60 p-5 rounded-2xl shadow-inner">
              <div className="flex items-center justify-center gap-1.5 mb-1">
                <div className="w-6 h-6 rounded-lg bg-[#0F5238] text-white flex items-center justify-center text-xs shadow">
                  🌿
                </div>
                <span className="text-[10px] font-black tracking-widest uppercase text-[#0F5238]">sosyalSorumluluk</span>
              </div>

              <h2 className="text-xs font-black text-[#0F5238] tracking-tight uppercase">
                Sıfır İsraf ve Çevre Sertifikası
              </h2>

              <div className="my-3 py-2 border-y border-dashed border-[#52B788]/40">
                <p className="text-[9px] text-gray-400">Sayın Kurtarıcımız,</p>
                <h3 className="text-sm font-black text-[#0F5238] mt-0.5">{currentUser.name}</h3>
                <p className="text-[9px] text-[#006C48] font-bold">
                  Seviye {currentUser.level} Gıda Elçisi & Çevre Kahramanı
                </p>
              </div>

              {/* Metrics */}
              <div className="grid grid-cols-3 gap-1.5 text-center my-3">
                <div className="p-2 bg-white rounded-xl shadow-sm border border-gray-100">
                  <p className="text-xs font-black text-[#0F5238]">{currentUser.savedKg} kg</p>
                  <p className="text-[8px] text-gray-400 uppercase font-bold">Kurtarılan Gıda</p>
                </div>
                <div className="p-2 bg-white rounded-xl shadow-sm border border-gray-100">
                  <p className="text-xs font-black text-[#0284C7]">{currentUser.co2SavedKg} kg</p>
                  <p className="text-[8px] text-gray-400 uppercase font-bold">Önlenen CO₂</p>
                </div>
                <div className="p-2 bg-white rounded-xl shadow-sm border border-gray-100">
                  <p className="text-xs font-black text-amber-600">{currentUser.portionsCount}</p>
                  <p className="text-[8px] text-gray-400 uppercase font-bold">Porsiyon Dağıtıldı</p>
                </div>
              </div>

              <div className="flex items-center justify-between text-[8px] text-gray-400 pt-2 border-t border-gray-100">
                <span>Tarih: 28 Eylül 2026</span>
                <span className="font-bold text-[#0F5238] flex items-center gap-0.5">
                  <CheckCircle2 className="w-2.5 h-2.5 text-[#10B981]" />
                  Doğrulanmış Belge
                </span>
              </div>
            </div>
          ) : (
            /* Modern 9:16 Instagram Story Card */
            <div className="w-64 h-96 rounded-3xl bg-gradient-to-br from-[#0F5238] via-[#2D6A4F] to-[#1B4332] text-white p-5 flex flex-col justify-between shadow-2xl relative overflow-hidden border border-white/20">
              <div className="absolute top-0 right-0 w-32 h-32 bg-[#52B788]/20 rounded-full blur-2xl pointer-events-none"></div>

              <div>
                <div className="flex items-center justify-between">
                  <span className="px-2 py-0.5 rounded-full bg-white/20 text-[9px] font-bold">#Sıfırİsraf</span>
                  <span className="text-xs">🌿</span>
                </div>
                <h3 className="text-sm font-black mt-3 leading-snug">
                  Gıda İsrafını Durdurdum! 🌍
                </h3>
              </div>

              <div className="space-y-2 bg-white/10 backdrop-blur-md p-3 rounded-2xl border border-white/20 text-center">
                <p className="text-xl font-black text-[#92F7C3]">{currentUser.savedKg} KG</p>
                <p className="text-[9px] text-white/80">Taze gıda sofralarla buluştu</p>
                <div className="pt-2 border-t border-white/20 flex justify-around text-[9px] font-bold">
                  <span>🌳 ~{Math.round(currentUser.savedKg * 0.4)} Ağaç Eşdeğeri</span>
                  <span>🌿 {currentUser.co2SavedKg}kg CO₂</span>
                </div>
              </div>

              <div className="flex items-center justify-between text-[9px] text-white/70">
                <span className="font-bold">@{currentUser.name.toLowerCase().replace(/\s+/g, '')}</span>
                <span className="text-[#95D5B2] font-black">sosyalsorumluluk.org</span>
              </div>
            </div>
          )}

        </div>

        {/* Footer Actions */}
        <div className="p-3 bg-white border-t border-gray-100 flex items-center justify-between gap-2">
          <button
            onClick={handleShare}
            className="flex items-center gap-1 px-3 py-2 bg-gray-100 hover:bg-gray-200 text-gray-700 text-[10px] font-bold rounded-xl transition"
          >
            <Share2 className="w-3.5 h-3.5 text-gray-600" />
            <span>Paylaşım Linki</span>
          </button>

          <button
            onClick={handleDownload}
            className="flex-1 flex items-center justify-center gap-1 px-4 py-2 bg-[#0F5238] hover:bg-[#2D6A4F] text-white font-bold text-[10px] rounded-xl shadow-md transition"
          >
            <Download className="w-3.5 h-3.5 text-[#95D5B2]" />
            <span>{format === 'story' ? 'Story Olarak İndir (PNG)' : 'Sertifikayı İndir (PDF)'}</span>
          </button>
        </div>

      </div>
    </div>
  );
};
