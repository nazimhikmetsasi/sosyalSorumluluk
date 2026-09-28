import React from 'react';
import { useApp } from '../../context/AppContext';
import { ShieldAlert, ArrowLeft, Lock } from 'lucide-react';

export const UnauthorizedView = () => {
  const { currentRole, setActiveTab } = useApp();

  const getHomeTab = () => {
    switch (currentRole) {
      case 'business':
        return 'business_dash';
      case 'ngo':
        return 'ngo_dash';
      case 'admin':
        return 'admin_dash';
      case 'buyer':
      default:
        return 'explore';
    }
  };

  return (
    <div className="min-h-[60vh] flex items-center justify-center p-4 animate-in fade-in">
      <div className="max-w-md w-full bg-white rounded-3xl p-6 sm:p-8 border border-red-100 shadow-xl text-center space-y-4">
        
        <div className="w-16 h-16 rounded-3xl bg-red-50 border border-red-100 flex items-center justify-center mx-auto text-red-600 shadow-inner">
          <ShieldAlert className="w-8 h-8" />
        </div>

        <div className="space-y-1.5">
          <div className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full bg-red-100 text-red-800 text-[10px] font-extrabold uppercase tracking-wider">
            <Lock className="w-3 h-3" />
            <span>403 Yetkisiz Erişim</span>
          </div>
          <h2 className="text-xl font-black text-gray-900">Bu Alana Erişim İzniniz Yok</h2>
          <p className="text-xs text-gray-500 leading-relaxed">
            Bulunduğunuz hesap yetkisi (<strong>{currentRole.toUpperCase()}</strong>) bu paneli görüntülemek için yetkilendirilmemiştir.
          </p>
        </div>

        <div className="pt-2">
          <button
            onClick={() => setActiveTab(getHomeTab())}
            className="w-full py-3 bg-[#0F5238] hover:bg-[#2D6A4F] text-white font-bold text-xs rounded-2xl shadow-lg shadow-[#0F5238]/20 transition flex items-center justify-center gap-2"
          >
            <ArrowLeft className="w-4 h-4 text-[#95D5B2]" />
            <span>Yetkili Ana Sayfama Dön</span>
          </button>
        </div>

      </div>
    </div>
  );
};
