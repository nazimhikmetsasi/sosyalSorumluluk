import React, { useState } from 'react';
import { useApp } from '../../context/AppContext';
import {
  Download,
  Calendar,
  ChevronLeft
} from 'lucide-react';

export const AdminReportsView = () => {
  const { setActiveTab, showToast } = useApp();
  const [dateRange] = useState('Eylül 2026');

  const handleExport = (reportName) => {
    showToast(`"${reportName}" dışa aktarıldı! 📊`);
  };

  const reports = [
    { title: 'Kurtarılan Gıda', desc: 'Kg & porsiyon analizi', metric: '14.850 kg', change: '+18%' },
    { title: 'Karbon Salımı', desc: 'CO₂ & ağaç eşdeğeri', metric: '37.1 Ton', change: '+22%' },
    { title: 'İşletme Güveni', desc: 'Teslimat başarı oranı', metric: '%98.4', change: '+1.2%' },
    { title: 'Kullanıcı Büyüme', desc: 'Yeni kayıt & sipariş', metric: '18.920', change: '+14%' },
    { title: 'İsraf Dağılımı', desc: '5 Ana kategori analizi', metric: 'Dengeli', change: 'OK' },
    { title: 'Aşevi Dağıtımı', desc: 'Yönlendirilen erzak', metric: '42.100 P.', change: '+30%' },
  ];

  return (
    <div className="space-y-3.5 pb-20 lg:pb-10 animate-in fade-in duration-300">
      
      {/* Header */}
      <div className="flex items-center justify-between gap-2">
        <div className="flex items-center gap-2">
          <button
            onClick={() => setActiveTab('admin_dash')}
            className="p-1.5 rounded-xl bg-white border border-gray-200 text-gray-700"
          >
            <ChevronLeft className="w-4 h-4" />
          </button>
          <div>
            <h1 className="text-xs font-black text-[#0F5238]">Raporlar & Analitik</h1>
            <p className="text-[9px] text-gray-400">Çevre ve etki metrikleri</p>
          </div>
        </div>

        <div className="flex items-center gap-1 bg-white px-2 py-1 rounded-xl border border-gray-200 text-[10px] font-bold text-gray-700 shadow-sm">
          <Calendar className="w-3 h-3 text-[#52B788]" />
          <span>{dateRange}</span>
        </div>
      </div>

      {/* Report Cards Grid - 2 columns */}
      <div className="grid grid-cols-2 gap-2.5">
        {reports.map((rep, idx) => (
          <div
            key={idx}
            className="bg-white rounded-2xl p-2.5 border border-gray-100 shadow-sm flex flex-col justify-between space-y-2"
          >
            <div>
              <div className="flex items-center justify-between">
                <span className="w-6 h-6 rounded-lg bg-[#F0FFF4] text-[#0F5238] flex items-center justify-center font-bold text-xs">
                  {idx === 0 ? '🥖' : idx === 1 ? '🌍' : idx === 2 ? '🏪' : idx === 3 ? '👥' : idx === 4 ? '📂' : '🤝'}
                </span>
                <span className="px-1.5 py-0.2 rounded-md text-[8px] font-extrabold bg-[#D1FEE5] text-[#006C48]">
                  {rep.change}
                </span>
              </div>

              <h3 className="font-bold text-[11px] text-[#0F5238] mt-1.5 truncate">{rep.title}</h3>
              <p className="text-[9px] text-gray-400 truncate">{rep.desc}</p>
            </div>

            <div className="pt-1.5 border-t border-gray-50 flex items-center justify-between">
              <span className="text-xs font-black text-[#0F5238]">{rep.metric}</span>
              <button
                onClick={() => handleExport(rep.title)}
                className="p-1 rounded-lg bg-[#F0FFF4] text-[#0F5238] border border-[#A8E7C5]/50 hover:bg-[#E8FFF0]"
              >
                <Download className="w-3 h-3 text-[#52B788]" />
              </button>
            </div>
          </div>
        ))}
      </div>

    </div>
  );
};
