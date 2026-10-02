import React from 'react';
import { useApp } from '../../context/AppContext';
import { QRCodeSVG } from 'qrcode.react';
import {
  X,
  MapPin,
  Clock,
  CheckCircle2,
  Share2,
  Navigation,
  Info
} from 'lucide-react';

export const ReservationModal = () => {
  const { selectedReservation, setSelectedReservation, showToast } = useApp();

  if (!selectedReservation) return null;

  return (
    <div className="fixed inset-0 z-[2000] flex items-center justify-center p-3 sm:p-6 bg-black/60 backdrop-blur-sm animate-in fade-in duration-200">
      <div className="relative w-full max-w-md bg-white rounded-3xl shadow-2xl overflow-hidden animate-in zoom-in-95 duration-200">
        
        {/* Header Bar */}
        <div className="p-4 bg-gradient-to-r from-[#0F5238] to-[#2D6A4F] text-white flex items-center justify-between">
          <div className="flex items-center gap-2">
            <CheckCircle2 className="w-5 h-5 text-[#95D5B2]" />
            <h3 className="font-bold text-sm">Teslimat Kuponu & QR Kod</h3>
          </div>
          <button
            onClick={() => setSelectedReservation(null)}
            className="w-8 h-8 rounded-full bg-white/20 hover:bg-white/30 flex items-center justify-center text-white transition"
          >
            <X className="w-4 h-4" />
          </button>
        </div>

        {/* QR & Code Box */}
        <div className="p-6 text-center space-y-4">
          <div className="inline-block p-4 bg-white rounded-3xl shadow-inner border-2 border-dashed border-[#52B788]/50">
            <QRCodeSVG
              value={selectedReservation.qrToken || selectedReservation.pickupCode}
              size={180}
              fgColor="#0F5238"
              bgColor="#ffffff"
              level="H"
              includeMargin={true}
            />
          </div>

          <div>
            <p className="text-xs text-gray-500 font-medium">İşletmeye göstereceğiniz 4 haneli kod:</p>
            <div className="mt-1 inline-flex items-center justify-center px-6 py-2 bg-[#E8FFF0] text-[#0F5238] font-black text-2xl tracking-widest rounded-2xl border border-[#95D5B2]/60">
              {selectedReservation.pickupCode}
            </div>
          </div>

          {/* Business & Pickup details */}
          <div className="bg-[#F8FAFC] p-4 rounded-2xl text-left space-y-2.5 border border-gray-100">
            <div className="flex items-start justify-between">
              <div>
                <h4 className="font-bold text-sm text-[#0F5238]">{selectedReservation.listingTitle}</h4>
                <p className="text-xs text-gray-500">{selectedReservation.businessName}</p>
              </div>
              <span className="px-2 py-0.5 rounded-lg text-xs font-bold bg-[#D1FEE5] text-[#006C48]">
                {selectedReservation.portionCount} Porsiyon
              </span>
            </div>

            <div className="flex items-center gap-2 text-xs text-gray-600">
              <Clock className="w-4 h-4 text-[#2D6A4F] flex-shrink-0" />
              <span>Teslim: <strong>Bugün {selectedReservation.pickupStartTime} - {selectedReservation.pickupEndTime}</strong></span>
            </div>

            <div className="flex items-center gap-2 text-xs text-gray-600">
              <MapPin className="w-4 h-4 text-[#2D6A4F] flex-shrink-0" />
              <span className="truncate">{selectedReservation.businessAddress || 'Moda Cad. No:44, Kadıköy'}</span>
            </div>
          </div>

          {/* Action Buttons */}
          <div className="grid grid-cols-2 gap-3 pt-2">
            <a
              href={`https://www.google.com/maps/search/?api=1&query=${encodeURIComponent(selectedReservation.businessName + ' ' + (selectedReservation.businessAddress || 'Kadıköy'))}`}
              target="_blank"
              rel="noreferrer"
              className="flex items-center justify-center gap-1.5 py-3 px-4 bg-[#F0FFF4] hover:bg-[#E8FFF0] text-[#0F5238] font-bold text-xs rounded-xl border border-[#95D5B2]/50 transition"
            >
              <Navigation className="w-4 h-4 text-[#52B788]" />
              Yol Tarifi Al
            </a>

            <button
              onClick={() => {
                navigator.clipboard?.writeText(`sosyalSorumluluk Teslimat Kodum: ${selectedReservation.pickupCode}`);
                showToast('Teslimat kodu panoya kopyalandı! 📋');
              }}
              className="flex items-center justify-center gap-1.5 py-3 px-4 bg-[#0F5238] hover:bg-[#2D6A4F] text-white font-bold text-xs rounded-xl transition shadow-md shadow-[#0F5238]/20"
            >
              <Share2 className="w-4 h-4 text-[#95D5B2]" />
              Kodu Paylaş
            </button>
          </div>

          <p className="text-[11px] text-gray-400 flex items-center justify-center gap-1">
            <Info className="w-3.5 h-3.5" />
            Lütfen teslim alma saati bitmeden işletmeye uğrayınız.
          </p>
        </div>

      </div>
    </div>
  );
};
