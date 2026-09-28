import React, { useState, useEffect } from 'react';
import { useApp } from '../../context/AppContext';
import { X, QrCode, Camera, CheckCircle2, AlertTriangle, Sparkles, RefreshCw } from 'lucide-react';

export const ScannerModal = ({ isOpen, onClose }) => {
  const { completeDelivery, myReservations } = useApp();
  const [manualCode, setManualCode] = useState('');
  const [isScanning, setIsScanning] = useState(true);

  if (!isOpen) return null;

  const pendingList = myReservations.filter(r => r.status === 'confirmed');

  const handleSimulateScan = (code) => {
    setIsScanning(false);
    completeDelivery(code);
    setTimeout(() => {
      onClose();
      setIsScanning(true);
    }, 1200);
  };

  const handleSubmitManual = (e) => {
    e.preventDefault();
    if (!manualCode.trim()) return;
    const res = completeDelivery(manualCode);
    if (res) {
      setTimeout(() => onClose(), 800);
    }
  };

  return (
    <div className="fixed inset-0 z-[2000] flex items-center justify-center p-3 sm:p-6 bg-black/70 backdrop-blur-md animate-in fade-in duration-200">
      <div className="relative w-full max-w-md bg-gray-900 text-white rounded-3xl shadow-2xl overflow-hidden animate-in zoom-in-95 duration-200 border border-gray-700">
        
        {/* Header */}
        <div className="p-4 bg-gray-800/80 border-b border-gray-700 flex items-center justify-between">
          <div className="flex items-center gap-2">
            <Camera className="w-5 h-5 text-[#52B788]" />
            <h3 className="font-bold text-sm">Canlı QR Kod Tarayıcı</h3>
          </div>
          <button
            onClick={onClose}
            className="w-8 h-8 rounded-full bg-gray-700 hover:bg-gray-600 flex items-center justify-center text-gray-300 transition"
          >
            <X className="w-4 h-4" />
          </button>
        </div>

        {/* Viewfinder Camera Stage */}
        <div className="p-6 flex flex-col items-center space-y-5">
          
          <div className="relative w-64 h-64 bg-black rounded-3xl border-2 border-[#52B788]/60 overflow-hidden flex items-center justify-center shadow-inner">
            
            {/* Viewfinder Target corners */}
            <div className="absolute top-3 left-3 w-6 h-6 border-t-4 border-l-4 border-[#52B788] rounded-tl-lg"></div>
            <div className="absolute top-3 right-3 w-6 h-6 border-t-4 border-r-4 border-[#52B788] rounded-tr-lg"></div>
            <div className="absolute bottom-3 left-3 w-6 h-6 border-b-4 border-l-4 border-[#52B788] rounded-bl-lg"></div>
            <div className="absolute bottom-3 right-3 w-6 h-6 border-b-4 border-r-4 border-[#52B788] rounded-br-lg"></div>

            {/* Moving Laser Scanner Line */}
            <div className="absolute left-4 right-4 h-1 bg-gradient-to-r from-transparent via-[#52B788] to-transparent shadow-[0_0_15px_#52B788] animate-bounce"></div>

            <QrCode className="w-28 h-28 text-gray-700 opacity-40 animate-pulse" />

            <div className="absolute bottom-3 bg-black/60 px-3 py-1 rounded-full text-[10px] text-[#95D5B2] font-semibold">
              Kamerayı alıcının QR koduna tutun
            </div>
          </div>

          {/* Quick Simulation Trigger for testing */}
          {pendingList.length > 0 && (
            <div className="w-full bg-gray-800/80 p-3 rounded-2xl border border-gray-700 space-y-2 text-left">
              <p className="text-[11px] text-gray-400 font-bold uppercase tracking-wider">Hızlı Test: Bekleyen Müşteri QR'ı Algıla</p>
              <div className="flex flex-wrap gap-2">
                {pendingList.map(p => (
                  <button
                    key={p.id}
                    onClick={() => handleSimulateScan(p.pickupCode)}
                    className="px-3 py-1.5 bg-[#0F5238] hover:bg-[#2D6A4F] text-white rounded-xl text-xs font-bold transition flex items-center gap-1.5"
                  >
                    <Sparkles className="w-3.5 h-3.5 text-[#95D5B2]" />
                    <span>{p.pickupCode} ({p.listingTitle.slice(0, 16)}...)</span>
                  </button>
                ))}
              </div>
            </div>
          )}

          {/* Manual Code Input Form */}
          <form onSubmit={handleSubmitManual} className="w-full space-y-2">
            <label className="text-xs text-gray-400 font-semibold block text-left">Veya Teslimat Kodunu Manuel Girin:</label>
            <div className="flex gap-2">
              <input
                type="text"
                placeholder="Örn: GK-482193"
                value={manualCode}
                onChange={(e) => setManualCode(e.target.value.toUpperCase())}
                className="flex-1 bg-gray-800 border border-gray-700 rounded-xl px-3 py-2 text-center text-sm font-bold text-white uppercase outline-none focus:border-[#52B788]"
              />
              <button
                type="submit"
                className="px-4 py-2 bg-[#52B788] hover:bg-[#40916C] text-[#002114] text-xs font-bold rounded-xl transition"
              >
                Onayla
              </button>
            </div>
          </form>

        </div>

      </div>
    </div>
  );
};
