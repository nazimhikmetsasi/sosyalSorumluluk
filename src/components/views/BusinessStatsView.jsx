import React from 'react';
import { useApp } from '../../context/AppContext';
import { computeOrgStats, treeEquivalent } from '../../utils/orgStats';
import { downloadCsv } from '../../utils/csv';
import {
  TrendingUp,
  PackageCheck,
  Calendar,
  Download
} from 'lucide-react';

export const BusinessStatsView = () => {
  const { showToast, myReservations, businesses, myOrganisationId } = useApp();

  const organisation = businesses.find(b => b.id === myOrganisationId);
  const stats = computeOrgStats(myReservations);
  const monthlyBreakdown = stats.monthly;
  const peakKg = Math.max(1, ...monthlyBreakdown.map(m => m.savedKg));

  const handleDownloadImpactReport = () => {
    downloadCsv('isletme_etki_raporu.csv', [
      ['Ay', 'Kurtarilan_Kg', 'Gelir_TL', 'Onlenen_CO2_Kg', 'Porsiyon'],
      ...monthlyBreakdown.map(m => [m.month, m.savedKg, m.revenue, m.co2Kg, m.portions]),
      ['Toplam', stats.savedKg, stats.revenue, stats.co2Kg, stats.portions],
    ]);
    showToast('İşletme etki raporu indirildi! 📊');
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
          <p className="text-xl font-black text-[#0F5238] mt-1">{stats.revenue.toLocaleString('tr-TR')} ₺</p>
          <span className="text-[9px] text-[#10B981] font-bold flex items-center gap-0.5 mt-0.5">
            <TrendingUp className="w-3 h-3" />
            Teslim edilen siparişler
          </span>
        </div>

        <div className="bg-white p-3.5 rounded-2xl border border-gray-100 shadow-sm">
          <p className="text-[10px] font-bold text-gray-400 uppercase">Kurtarılan Gıda</p>
          <p className="text-xl font-black text-[#0F5238] mt-1">{stats.savedKg.toLocaleString('tr-TR')} kg</p>
          <span className="text-[9px] text-[#52B788] font-bold flex items-center gap-0.5 mt-0.5">
            <PackageCheck className="w-3 h-3" />
            {stats.portions} Porsiyon
          </span>
        </div>

        <div className="bg-white p-3.5 rounded-2xl border border-gray-100 shadow-sm">
          <p className="text-[10px] font-bold text-gray-400 uppercase">Önlenen CO₂</p>
          <p className="text-xl font-black text-[#0284C7] mt-1">{stats.co2Kg.toLocaleString('tr-TR')} kg</p>
          <span className="text-[9px] text-blue-600 font-bold flex items-center gap-0.5 mt-0.5">
            🌳 {treeEquivalent(stats.co2Kg)} Ağaç Eşdeğeri
          </span>
        </div>

        <div className="bg-white p-3.5 rounded-2xl border border-gray-100 shadow-sm">
          <p className="text-[10px] font-bold text-gray-400 uppercase">İşletme Güven Skoru</p>
          <p className="text-xl font-black text-amber-600 mt-1">%{organisation?.trustScore ?? '—'}</p>
          <span className="text-[9px] text-amber-600 font-bold flex items-center gap-0.5 mt-0.5">
            {organisation?.rating ? `★ ${organisation.rating} (${organisation.reviewCount} Yorum)` : 'Henüz yorum yok'}
          </span>
        </div>
      </div>

      {/* Monthly Breakdown Chart & Table */}
      <div className="bg-white rounded-2xl p-4 border border-gray-100 shadow-sm space-y-3">
        <div className="flex items-center justify-between">
          <h3 className="font-bold text-xs text-[#0F5238] flex items-center gap-1.5">
            <Calendar className="w-3.5 h-3.5 text-[#2D6A4F]" />
            <span>Aylık Kurtarma & Ciro Trendi</span>
          </h3>
          <span className="text-[10px] text-gray-400">Son {monthlyBreakdown.length} Ay</span>
        </div>

        <div className="space-y-2.5 pt-2">
          {monthlyBreakdown.map((item) => (
            <div key={item.month} className="space-y-1">
              <div className="flex items-center justify-between text-[10px]">
                <span className="font-bold text-[#0F5238]">{item.month}</span>
                <span className="text-gray-500 font-semibold">
                  <strong>{item.savedKg} kg</strong> ({item.revenue.toLocaleString('tr-TR')} ₺) • <span className="text-blue-600">{item.co2Kg}kg CO₂</span>
                </span>
              </div>
              <div className="w-full bg-gray-100 h-2 rounded-full overflow-hidden flex">
                <div
                  style={{ width: `${(item.savedKg / peakKg) * 100}%` }}
                  className="bg-[#2D6A4F] h-full rounded-full transition-all duration-500"
                ></div>
              </div>
            </div>
          ))}
        </div>

        {stats.portions === 0 && (
          <p className="text-[10px] text-gray-400 text-center pt-1">
            Henüz teslim edilmiş sipariş yok. Teslimatlar onaylandıkça burada görünür.
          </p>
        )}
      </div>

    </div>
  );
};
