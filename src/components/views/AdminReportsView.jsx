import React from 'react';
import { useApp } from '../../context/AppContext';
import { treeEquivalent } from '../../utils/orgStats';
import { downloadCsv } from '../../utils/csv';
import {
  Download,
  ChevronLeft,
  FileSpreadsheet
} from 'lucide-react';

// Everything here comes from platform_stats and the organisations and listings the admin can
// read. Per-order figures are not used: row level security (rightly) hides other people's
// orders from the admin, so only the aggregates the database computes are reliable.
export const AdminReportsView = () => {
  const { setActiveTab, showToast, stats, businesses, listings } = useApp();

  const orgs = businesses.filter(b => b.kind === 'business');
  const ngos = businesses.filter(b => b.kind === 'ngo');
  const averageTrust = orgs.length
    ? Math.round(orgs.reduce((sum, b) => sum + b.trustScore, 0) / orgs.length)
    : 0;

  const byCategory = Object.entries(
    listings.reduce((acc, l) => {
      const key = l.category || 'Diğer';
      acc[key] = acc[key] || { listings: 0, portions: 0 };
      acc[key].listings += 1;
      acc[key].portions += l.portionsAvailable;
      return acc;
    }, {})
  );

  const reports = [
    {
      icon: '🥖',
      title: 'Kurtarılan Gıda',
      desc: 'Teslim edilen toplam',
      metric: `${stats.totalFoodSavedKg.toLocaleString('tr-TR')} kg`,
      rows: [
        ['Kurtarilan_Kg', 'Kurtarilan_Porsiyon'],
        [stats.totalFoodSavedKg, stats.totalPortions],
      ],
    },
    {
      icon: '🌍',
      title: 'Karbon Salımı',
      desc: 'CO₂ & ağaç eşdeğeri',
      metric: `${stats.totalCo2SavedKg.toLocaleString('tr-TR')} kg`,
      rows: [
        ['Onlenen_CO2_Kg', 'Esdeger_Agac'],
        [stats.totalCo2SavedKg, treeEquivalent(stats.totalCo2SavedKg)],
      ],
    },
    {
      icon: '🏪',
      title: 'İşletme Güveni',
      desc: 'Ortalama güven skoru',
      metric: orgs.length ? `%${averageTrust}` : '—',
      rows: [
        ['Isletme', 'Durum', 'Guven_Skoru', 'Puan', 'Yorum_Sayisi'],
        ...orgs.map(b => [b.name, b.status, b.trustScore, b.rating ?? '', b.reviewCount]),
      ],
    },
    {
      icon: '👥',
      title: 'Kullanıcılar',
      desc: 'Kayıtlı hesap sayısı',
      metric: stats.totalUsers.toLocaleString('tr-TR'),
      rows: [
        ['Toplam_Uye', 'Aktif_Isletme', 'Aktif_STK'],
        [stats.totalUsers, stats.activeBusinesses, stats.activeNgos],
      ],
    },
    {
      icon: '📂',
      title: 'İlan Dağılımı',
      desc: 'Aktif ilanların kategorisi',
      metric: `${byCategory.length} kategori`,
      rows: [
        ['Kategori', 'Aktif_Ilan', 'Yayindaki_Porsiyon'],
        ...byCategory.map(([name, v]) => [name, v.listings, v.portions]),
      ],
    },
    {
      icon: '🤝',
      title: 'STK & Aşevleri',
      desc: 'Kayıtlı kurumlar',
      metric: `${ngos.length} kurum`,
      rows: [
        ['Kurum', 'Durum', 'Guven_Skoru'],
        ...ngos.map(b => [b.name, b.status, b.trustScore]),
      ],
    },
  ];

  const handleExportCSV = (rep) => {
    downloadCsv(`${rep.title.toLowerCase().replace(/\s+/g, '_')}_raporu.csv`, rep.rows);
    showToast(`"${rep.title}" CSV dosyası indirildi! 📊`);
  };

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
            <p className="text-[9px] text-gray-400">Platformun anlık durumu, CSV olarak indirilebilir</p>
          </div>
        </div>

        <button
          onClick={() => {
            reports.forEach(r => downloadCsv(`${r.title.toLowerCase().replace(/\s+/g, '_')}_raporu.csv`, r.rows));
            showToast('Tüm raporlar CSV olarak indirildi! 📦');
          }}
          className="flex items-center gap-1 px-2.5 py-1.5 bg-[#0F5238] text-white text-[10px] font-bold rounded-xl shadow"
        >
          <FileSpreadsheet className="w-3 h-3 text-[#95D5B2]" />
          <span>Tümünü İndir</span>
        </button>
      </div>

      {/* Report Cards Grid - 2 columns */}
      <div className="grid grid-cols-2 gap-2.5">
        {reports.map((rep) => (
          <div
            key={rep.title}
            className="bg-white rounded-2xl p-2.5 border border-gray-100 shadow-sm flex flex-col justify-between space-y-2"
          >
            <div>
              <span className="w-6 h-6 rounded-lg bg-[#F0FFF4] text-[#0F5238] flex items-center justify-center font-bold text-xs">
                {rep.icon}
              </span>

              <h3 className="font-bold text-[11px] text-[#0F5238] mt-1.5 truncate">{rep.title}</h3>
              <p className="text-[9px] text-gray-400 truncate">{rep.desc}</p>
            </div>

            <div className="pt-1.5 border-t border-gray-50 flex items-center justify-between">
              <span className="text-xs font-black text-[#0F5238]">{rep.metric}</span>
              <button
                onClick={() => handleExportCSV(rep)}
                className="p-1 rounded-lg bg-[#F0FFF4] text-[#0F5238] border border-[#A8E7C5]/50 hover:bg-[#E8FFF0]"
                title="CSV İndir"
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
