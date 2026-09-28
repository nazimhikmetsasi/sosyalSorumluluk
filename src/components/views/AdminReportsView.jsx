import React, { useState } from 'react';
import { useApp } from '../../context/AppContext';
import {
  Download,
  Calendar,
  ChevronLeft,
  FileSpreadsheet
} from 'lucide-react';

export const AdminReportsView = () => {
  const { setActiveTab, showToast } = useApp();
  const [dateRange, setDateRange] = useState('Bu Ay (Eylül 2026)');

  const ranges = ['Bugün', 'Bu Hafta', 'Bu Ay', 'Bu Yıl'];

  const reports = [
    { title: 'Kurtarılan Gıda', desc: 'Kg & porsiyon analizi', metric: '14.850 kg', change: '+18%', csv: 'Tarih,Kategori,Kurtarilan_Kg,Tasarruf_TL\n2026-09-01,Unlu Mamuller,4500,45000\n2026-09-15,Meyve Sebze,6200,62000\n2026-09-28,Sicak Yemek,4150,83000' },
    { title: 'Karbon Salımı', desc: 'CO₂ & ağaç eşdeğeri', metric: '37.1 Ton', change: '+22%', csv: 'Tarih,Onlenen_CO2_Kg,Esdeger_Agac\n2026-09-01,11250,562\n2026-09-15,15500,775\n2026-09-28,10375,518' },
    { title: 'İşletme Güveni', desc: 'Teslimat başarı oranı', metric: '%98.4', change: '+1.2%', csv: 'Isletme,Guven_Skoru,Teslimat_Orani,Iptal_Sayisi\nModa Firini,98,99.2,1\nKarakoy Corbaci,95,97.5,2\nBesiktas Manav,99,100,0' },
    { title: 'Kullanıcı Büyüme', desc: 'Yeni kayıt & sipariş', metric: '18.920', change: '+14%', csv: 'Ay,Yeni_Uye,Aktif_Rezervasyon\nTemmuz,14200,8900\nAgustos,16500,11200\nEylul,18920,14850' },
    { title: 'İsraf Dağılımı', desc: '5 Ana kategori analizi', metric: 'Dengeli', change: 'OK', csv: 'Kategori,Pay_Yuzde,Porsiyon\nUnlu Mamuller,35,15000\nSicak Yemek,28,12000\nMeyve Sebze,22,9500\nSarkuteri,15,5600' },
    { title: 'Aşevi Dağıtımı', desc: 'Yönlendirilen erzak', metric: '42.100 P.', change: '+30%', csv: 'Asevi,Teslim_Porsiyon,Gonullu_Sayisi\nTIDER Kadikoy,24000,12\nKizilay As Evi,12500,8\nBesiktas Dayanisma,5600,4' },
  ];

  const handleExportCSV = (rep) => {
    try {
      const blob = new Blob([rep.csv], { type: 'text/csv;charset=utf-8;' });
      const url = URL.createObjectURL(blob);
      const link = document.createElement('a');
      link.setAttribute('href', url);
      link.setAttribute('download', `${rep.title.toLowerCase().replace(/\s+/g, '_')}_raporu.csv`);
      document.body.appendChild(link);
      link.click();
      document.body.removeChild(link);
      showToast(`"${rep.title}" CSV dosyası indirildi! 📊`);
    } catch (e) {
      showToast(`Dışa aktarıldı: ${rep.title}`, 'info');
    }
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
            <p className="text-[9px] text-gray-400">Çevre ve etki analizi</p>
          </div>
        </div>

        <button
          onClick={() => {
            reports.forEach(r => handleExportCSV(r));
            showToast('Tüm raporlar CSV olarak indirildi! 📦');
          }}
          className="flex items-center gap-1 px-2.5 py-1.5 bg-[#0F5238] text-white text-[10px] font-bold rounded-xl shadow"
        >
          <FileSpreadsheet className="w-3 h-3 text-[#95D5B2]" />
          <span>Tümünü İndir</span>
        </button>
      </div>

      {/* Date Range Selector Pills */}
      <div className="grid grid-cols-4 gap-1 bg-white p-1 rounded-xl border border-gray-100 shadow-sm">
        {ranges.map(r => (
          <button
            key={r}
            onClick={() => setDateRange(r)}
            className={`py-1 text-center rounded-lg text-[10px] font-bold transition ${
              dateRange === r ? 'bg-[#2D6A4F] text-white shadow-sm' : 'text-gray-500'
            }`}
          >
            {r}
          </button>
        ))}
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
