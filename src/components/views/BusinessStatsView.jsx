import React, { useState } from 'react';
import { useApp } from '../../context/AppContext';
import {
  TrendingUp,
  Leaf,
  DollarSign,
  PackageCheck,
  Calendar,
  Download,
  Award,
  Sparkles,
  ArrowUpRight
} from 'lucide-react';

export const BusinessStatsView = () => {
  const { currentUser, showToast } = useApp();
  const [timeRange, setTimeRange] = useState('Bu Ay (Eylül 2026)');

  const monthlyBreakdown = [
    { month: 'Haziran', savedKg: 120, revenue: 2800, co2: 300 },
    { month: 'Temmuz', savedKg: 165, revenue: 3650, co2: 412 },
    { month: 'Ağustos', savedKg: 185, revenue: 4100, co2: 462 },
    { month: 'Eylül (Aktif)', savedKg: 170, revenue: 3700, co2: 425 },
  ];

  const handleDownloadImpactReport = () => {
    showToast('İşletme Çevre & Gelir Raporu başarıyla indirildi! 📊');
  };

  return (
    <div className="space-y-4 pb-20 lg:pb-10 animate-in fade-in duration-300 max-w-4xl mx-auto">
      
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-sm sm:text-base font-black text-[#0F5238] flex items-center gap-1.5">
            <TrendingUp className="w-4 h-4 text-[#52B788]" />
            <span>İşletme Etki & İstatistik Analizi</span>
          </h1>
          <p className="text-[10px] text-gray-500">Geri kazanılan gelir, önlenen gıda atığı ve karbon tasarrufunuz</p>
        </div>

        <button
          onClick={handleDownloadImpactReport}
          className="flex items-center gap-1 px-3 py-1.5 bg-[#0F5238] text-white text-[10px] font-bold rounded-xl shadow hover:bg-[#2D6A4F] transition"
        >
          <Download className="w-3 h-3 text-[#95D5B2]" />
          <span>Raporu İndir</span>
        </button>
      </div>

      {/* 4 Core Financial & Eco Metrics */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-2.5">
        <div className="bg-white p-3.5 rounded-2xl border border-gray-100 shadow-sm">
          <p className="text-[10px] font-bold text-gray-400 uppercase">Kazanılan Gelir</p>
          <p className="text-xl font-black text-[#0F5238] mt-1">14.250 ₺</p>
          <span className="text-[9px] text-[#10B981] font-bold flex items-center gap-0.5 mt-0.5">
            <TrendingUp className="w-3 h-3" />
            + %24 bu dönem
          </span>
        </div>

        <div className="bg-white p-3.5 rounded-2xl border border-gray-100 shadow-sm">
          <p className="text-[10px] font-bold text-gray-400 uppercase">Kurtarılan Gıda</p>
          <p className="text-xl font-black text-[#0F5238] mt-1">640 kg</p>
          <span className="text-[9px] text-[#52B788] font-bold flex items-center gap-0.5 mt-0.5">
            <PackageCheck className="w-3 h-3" />
            1.280 Porsiyon
          </span>
        </div>

        <div className="bg-white p-3.5 rounded-2xl border border-gray-100 shadow-sm">
          <p className="text-[10px] font-bold text-gray-400 uppercase">Önlenen CO₂</p>
          <p className="text-xl font-black text-[#0284C7] mt-1">1.600 kg</p>
          <span className="text-[9px] text-blue-600 font-bold flex items-center gap-0.5 mt-0.5">
            🌳 64 Ağaç Eşdeğeri
          </span>
        </div>

        <div className="bg-white p-3.5 rounded-2xl border border-gray-100 shadow-sm">
          <p className="text-[10px] font-bold text-gray-400 uppercase">İşletme Güven Skoru</p>
          <p className="text-xl font-black text-amber-600 mt-1">%98</p>
          <span className="text-[9px] text-amber-600 font-bold flex items-center gap-0.5 mt-0.5">
            ★ 4.9 (142 Yorum)
          </span>
        </div>
      </div>

      {/* Monthly Breakdown Chart & Table */}
      <div className="bg-white rounded-2xl p-4 border border-gray-100 shadow-sm space-y-3">
        <div className="flex items-center justify-between">
          <h3 className="font-bold text-xs text-[#0F5238] flex items-center gap-1.5">
            <Calendar className="w-3.5 h-3.5 text-[#2D6A4F]" />
            <span>Aylık Kurtarma & Ciro Trendi (2026)</span>
          </h3>
          <span className="text-[10px] text-gray-400">Son 4 Ay</span>
        </div>

        {/* Visual Bar Graph */}
        <div className="space-y-2.5 pt-2">
          {monthlyBreakdown.map((item, idx) => (
            <div key={idx} className="space-y-1">
              <div className="flex items-center justify-between text-[10px]">
                <span className="font-bold text-[#0F5238]">{item.month}</span>
                <span className="text-gray-500 font-semibold">
                  <strong>{item.savedKg} kg</strong> ({item.revenue.toLocaleString()} ₺) • <span className="text-blue-600">{item.co2}kg CO₂</span>
                </span>
              </div>
              <div className="w-full bg-gray-100 h-2 rounded-full overflow-hidden flex">
                <div
                  style={{ width: `${(item.savedKg / 200) * 100}%` }}
                  className="bg-[#2D6A4F] h-full rounded-full transition-all duration-500"
                ></div>
              </div>
            </div>
          ))}
        </div>
      </div>

      {/* Sustainable Business Certificate Banner */}
      <div className="bg-gradient-to-r from-[#0F5238] to-[#1B4332] text-white p-4 rounded-2xl shadow-lg flex items-center justify-between gap-3">
        <div className="flex items-center gap-3">
          <div className="w-10 h-10 rounded-xl bg-white/20 flex items-center justify-center text-xl shadow">
            🏆
          </div>
          <div>
            <h4 className="text-xs font-black">Yeşil İşletme Sürdürülebilirlik Rozeti</h4>
            <p className="text-[10px] text-white/80 mt-0.5">
              İşletmeniz bu ay sıfır israf hedeflerini aşarak Altın Çevre Sertifikası kazandı.
            </p>
          </div>
        </div>

        <button
          onClick={handleDownloadImpactReport}
          className="px-3 py-2 bg-[#52B788] hover:bg-[#40916C] text-[#002114] font-black text-[10px] rounded-xl shadow transition flex-shrink-0"
        >
          Sertifikayı İndir
        </button>
      </div>

    </div>
  );
};
