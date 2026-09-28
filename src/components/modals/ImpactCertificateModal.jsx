import React from 'react';
import { useApp } from '../../context/AppContext';
import { X, Award, Download, Share2, Sparkles, Leaf, CheckCircle2 } from 'lucide-react';

export const ImpactCertificateModal = ({ isOpen, onClose }) => {
  const { currentUser, showToast } = useApp();

  if (!isOpen) return null;

  const handleDownload = () => {
    showToast('Sosyal Etki Sertifikanız başarıyla indirildi! 🏆');
    onClose();
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-3 sm:p-6 bg-black/60 backdrop-blur-sm animate-in fade-in duration-200">
      <div className="relative w-full max-w-lg bg-white rounded-3xl shadow-2xl overflow-hidden animate-in zoom-in-95 duration-200 border-4 border-[#2D6A4F]/20">
        
        {/* Header close */}
        <button
          onClick={onClose}
          className="absolute top-4 right-4 z-20 w-8 h-8 rounded-full bg-white/80 hover:bg-white text-gray-700 flex items-center justify-center shadow-md transition"
        >
          <X className="w-4 h-4" />
        </button>

        {/* Certificate Printable Canvas Box */}
        <div className="p-8 bg-gradient-to-b from-[#F0FFF4] via-white to-[#E8FFF0] text-center relative overflow-hidden border-8 border-double border-[#52B788]/40 m-3 rounded-2xl">
          <div className="absolute top-0 right-0 w-32 h-32 bg-[#52B788]/10 rounded-full blur-2xl"></div>
          
          <div className="flex items-center justify-center gap-2 mb-2">
            <div className="w-8 h-8 rounded-xl bg-[#0F5238] text-white flex items-center justify-center text-sm shadow">
              🌿
            </div>
            <span className="text-xs font-black tracking-widest uppercase text-[#0F5238]">GıdaKöprüsü</span>
          </div>

          <h2 className="text-xl sm:text-2xl font-black text-[#0F5238] tracking-tight">
            SIFIR İSRAF VE SÜRDÜRÜLEBİLİRLİK SERTİFİKASI
          </h2>
          <p className="text-[11px] text-gray-400 mt-1">Bu belge, gezegenimize ve topluma sağlanan değerli katkı adına düzenlenmiştir.</p>

          <div className="my-6 py-4 border-y border-dashed border-[#52B788]/50">
            <p className="text-xs text-gray-500 font-medium">Sayın Kurtarıcımız,</p>
            <h3 className="text-2xl font-black text-[#0F5238] mt-1">{currentUser.name}</h3>
            <p className="text-xs text-[#006C48] font-bold mt-1">
              Seviye {currentUser.level} Gıda Elçisi & Çevre Kahramanı
            </p>
          </div>

          {/* Metrics summary */}
          <div className="grid grid-cols-3 gap-2 text-center my-4">
            <div className="p-2.5 bg-white rounded-xl shadow-sm border border-gray-100">
              <p className="text-lg font-black text-[#0F5238]">{currentUser.savedKg} kg</p>
              <p className="text-[9px] text-gray-500 font-bold uppercase">Kurtarılan Gıda</p>
            </div>
            <div className="p-2.5 bg-white rounded-xl shadow-sm border border-gray-100">
              <p className="text-lg font-black text-[#0284C7]">{currentUser.co2SavedKg} kg</p>
              <p className="text-[9px] text-gray-500 font-bold uppercase">Önlenen CO₂</p>
            </div>
            <div className="p-2.5 bg-white rounded-xl shadow-sm border border-gray-100">
              <p className="text-lg font-black text-amber-600">{currentUser.portionsCount}</p>
              <p className="text-[9px] text-gray-500 font-bold uppercase">Porsiyon Dağıtıldı</p>
            </div>
          </div>

          <div className="flex items-center justify-between pt-4 text-[10px] text-gray-400">
            <span>Tarih: 28 Eylül 2026</span>
            <span className="font-bold text-[#0F5238] flex items-center gap-1">
              <CheckCircle2 className="w-3.5 h-3.5 text-[#10B981]" />
              Doğrulanmış Dijital Belge
            </span>
          </div>
        </div>

        {/* Footer Actions */}
        <div className="p-4 bg-white border-t border-gray-100 flex items-center justify-end gap-3">
          <button
            onClick={onClose}
            className="px-4 py-2.5 text-xs font-bold text-gray-600 hover:bg-gray-100 rounded-xl"
          >
            Kapat
          </button>
          <button
            onClick={handleDownload}
            className="flex items-center gap-2 px-5 py-2.5 bg-[#0F5238] hover:bg-[#2D6A4F] text-white font-bold text-xs rounded-xl shadow-md transition"
          >
            <Download className="w-4 h-4 text-[#95D5B2]" />
            <span>Sertifikayı İndir (PDF / PNG)</span>
          </button>
        </div>

      </div>
    </div>
  );
};
