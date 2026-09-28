import React, { useState } from 'react';
import { useApp } from '../../context/AppContext';
import {
  FileSpreadsheet,
  Download,
  Calendar,
  TrendingUp,
  Leaf,
  Users,
  Building2,
  ChevronLeft
} from 'lucide-react';

export const AdminReportsView = () => {
  const { setActiveTab, showToast } = useApp();
  const [dateRange, setDateRange] = useState('Bu Ay (Eylül 2026)');

  const handleExport = (reportName) => {
    showToast(`"${reportName}" CSV / Excel formatında dışa aktarıldı! 📊`);
  };

  const reports = [
    { title: 'Kurtarılan Gıda Raporu', desc: 'Kg, porsiyon ve parasal karşılık analizi', metric: '14.850 kg', change: '+18%' },
    { title: 'Karbon Ayak İzi & Eko Rapor', desc: 'Önlenen sera gazı salımı ve ağaç eşdeğeri', metric: '37.1 Ton CO₂', change: '+22%' },
    { title: 'İşletme Performans & Güven Skoru', desc: 'Fırın, manav ve restoran teslimat başarı oranları', metric: '%98.4 Başarı', change: '+1.2%' },
    { title: 'Kullanıcı Büyüme & Etkileşim', desc: 'Yeni kayıtlar, aktif rezervasyon ve no-show oranları', metric: '18.920 Kullanıcı', change: '+14%' },
    { title: 'Kategori Bazlı İsraf Dağılımı', desc: 'En çok kurtarılan gıda türlerinin haritası', metric: '5 Ana Kategori', change: 'Dengeli' },
    { title: 'STK & Aşevi Toplu Dağıtım Raporu', desc: 'Aşevlerine yönlendirilen sıcak yemek ve erzak hacmi', metric: '42.100 Porsiyon', change: '+30%' },
  ];

  return (
    <div className="space-y-6 pb-20 lg:pb-10 max-w-6xl mx-auto animate-in fade-in duration-300">
      
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div className="flex items-center gap-3">
          <button
            onClick={() => setActiveTab('admin_dash')}
            className="p-2 rounded-xl bg-white border border-gray-200 hover:bg-gray-50 text-gray-700"
          >
            <ChevronLeft className="w-5 h-5" />
          </button>
          <div>
            <h1 className="text-2xl font-black text-[#0F5238]">Platform Raporları & Analitik</h1>
            <p className="text-xs text-gray-500 mt-0.5">
              Tüm çevre, sosyal etki ve operasyonel verilerin analitik özeti.
            </p>
          </div>
        </div>

        <div className="flex items-center gap-2">
          <div className="flex items-center gap-2 bg-white px-3.5 py-2 rounded-xl border border-gray-200 text-xs font-bold text-gray-700 shadow-sm">
            <Calendar className="w-4 h-4 text-[#52B788]" />
            <span>{dateRange}</span>
          </div>
        </div>
      </div>

      {/* Report Cards Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-5">
        {reports.map((rep, idx) => (
          <div
            key={idx}
            className="bg-white rounded-3xl p-6 border border-gray-100 shadow-sm hover:shadow-md transition flex flex-col justify-between space-y-4"
          >
            <div>
              <div className="flex items-center justify-between">
                <span className="w-10 h-10 rounded-2xl bg-[#F0FFF4] text-[#0F5238] flex items-center justify-center font-bold text-lg">
                  {idx === 0 ? '🥖' : idx === 1 ? '🌍' : idx === 2 ? '🏪' : idx === 3 ? '👥' : idx === 4 ? '📂' : '🤝'}
                </span>
                <span className="px-2.5 py-0.5 rounded-full text-[10px] font-extrabold bg-[#D1FEE5] text-[#006C48]">
                  {rep.change}
                </span>
              </div>

              <h3 className="font-bold text-base text-[#0F5238] mt-3">{rep.title}</h3>
              <p className="text-xs text-gray-500 mt-1">{rep.desc}</p>
            </div>

            <div className="pt-3 border-t border-gray-50 flex items-center justify-between">
              <div>
                <p className="text-[10px] text-gray-400">Dönem Toplamı</p>
                <p className="text-base font-black text-[#0F5238]">{rep.metric}</p>
              </div>

              <button
                onClick={() => handleExport(rep.title)}
                className="flex items-center gap-1.5 px-3.5 py-2 rounded-xl bg-[#F0FFF4] hover:bg-[#E8FFF0] text-[#0F5238] border border-[#A8E7C5]/50 text-xs font-bold transition"
              >
                <Download className="w-3.5 h-3.5 text-[#52B788]" />
                <span>İndir</span>
              </button>
            </div>
          </div>
        ))}
      </div>

    </div>
  );
};
