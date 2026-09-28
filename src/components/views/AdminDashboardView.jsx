import React, { useState } from 'react';
import { useApp } from '../../context/AppContext';
import {
  ShieldCheck,
  Building2,
  Users,
  AlertTriangle,
  CheckCircle2,
  XCircle,
  FileText,
  Activity,
  Layers,
  ArrowUpRight
} from 'lucide-react';

export const AdminDashboardView = () => {
  const { businesses, updateBusinessStatus, stats, setActiveTab } = useApp();
  const [filterStatus, setFilterStatus] = useState('all');

  const filteredBusinesses = businesses.filter(b => filterStatus === 'all' || b.status === filterStatus);

  return (
    <div className="space-y-6 pb-20 lg:pb-10 max-w-6xl mx-auto animate-in fade-in duration-300">
      
      {/* Top Admin Summary Bar */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 bg-white p-6 rounded-3xl border border-gray-100 shadow-sm">
        <div>
          <div className="flex items-center gap-2">
            <h1 className="text-xl font-black text-[#0F5238]">Sistem Yönetim & Moderasyon Masası</h1>
            <span className="px-2.5 py-0.5 rounded-full text-[10px] font-bold bg-red-100 text-red-700">
              Admin Yetkili
            </span>
          </div>
          <p className="text-xs text-gray-500 mt-0.5">
            Platform geneli işletme onayları, gıda güvenliği denetimleri ve canlı metrikler.
          </p>
        </div>

        <button
          onClick={() => setActiveTab('admin_reports')}
          className="px-4 py-2.5 bg-[#0F5238] hover:bg-[#2D6A4F] text-white font-bold text-xs rounded-2xl shadow-md transition"
        >
          Detaylı Raporlar & Analitik
        </button>
      </div>

      {/* 4 Stats Cards */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
        
        <div className="bg-white p-5 rounded-3xl border border-gray-100 shadow-sm">
          <p className="text-xs font-bold text-gray-400">Toplam Kullanıcı</p>
          <p className="text-2xl font-black text-[#0F5238] mt-1">{stats.totalUsers.toLocaleString()}</p>
          <span className="text-[11px] text-[#10B981] font-bold">↑ %14 bu ay</span>
        </div>

        <div className="bg-white p-5 rounded-3xl border border-gray-100 shadow-sm">
          <p className="text-xs font-bold text-gray-400">Aktif İşletmeler</p>
          <p className="text-2xl font-black text-[#0F5238] mt-1">{stats.activeBusinesses}</p>
          <span className="text-[11px] text-amber-600 font-bold">3 onay bekliyor</span>
        </div>

        <div className="bg-white p-5 rounded-3xl border border-gray-100 shadow-sm">
          <p className="text-xs font-bold text-gray-400">Kurtarılan Toplam Gıda</p>
          <p className="text-2xl font-black text-[#0F5238] mt-1">{stats.totalFoodSavedKg.toLocaleString()} kg</p>
          <span className="text-[11px] text-[#52B788] font-bold">37.1 ton CO₂ önlendi</span>
        </div>

        <div className="bg-white p-5 rounded-3xl border border-gray-100 shadow-sm">
          <p className="text-xs font-bold text-gray-400">SLA İhlal & Uyarı</p>
          <p className="text-2xl font-black text-emerald-600 mt-1">0</p>
          <span className="text-[11px] text-gray-400 font-medium">Sistem Sağlıklı 🟢</span>
        </div>

      </div>

      {/* Business Moderation Table */}
      <div className="bg-white rounded-3xl p-6 border border-gray-100 shadow-sm space-y-4">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
          <div>
            <h3 className="font-bold text-base text-[#0F5238] flex items-center gap-2">
              <Building2 className="w-5 h-5 text-[#2D6A4F]" />
              İşletme Onay & Denetim Listesi
            </h3>
            <p className="text-xs text-gray-500">Kayıt olan işletmelerin ruhsat, hijyen ve güven puanı yönetimi</p>
          </div>

          <div className="flex items-center gap-1.5 bg-[#F8FAFC] p-1 rounded-xl border border-gray-200">
            {[
              { id: 'all', label: 'Tümü' },
              { id: 'active', label: 'Aktifler' },
              { id: 'pending', label: 'Onay Bekleyen' },
            ].map((st) => (
              <button
                key={st.id}
                onClick={() => setFilterStatus(st.id)}
                className={`px-3 py-1 rounded-lg text-xs font-bold transition ${
                  filterStatus === st.id ? 'bg-[#2D6A4F] text-white shadow-sm' : 'text-gray-600 hover:text-gray-900'
                }`}
              >
                {st.label}
              </button>
            ))}
          </div>
        </div>

        {/* Table */}
        <div className="overflow-x-auto">
          <table className="w-full text-left text-xs">
            <thead>
              <tr className="border-b border-gray-100 text-gray-400 uppercase tracking-wider font-semibold">
                <th className="py-3 px-3">İşletme Adı</th>
                <th className="py-3 px-3">Tür</th>
                <th className="py-3 px-3">Güven Skoru</th>
                <th className="py-3 px-3">Kurtarılan</th>
                <th className="py-3 px-3">Durum</th>
                <th className="py-3 px-3 text-right">İşlemler</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-50">
              {filteredBusinesses.map((b) => (
                <tr key={b.id} className="hover:bg-[#F0FFF4] transition">
                  <td className="py-3 px-3 flex items-center gap-3 font-bold text-[#0F5238]">
                    <img src={b.avatar} alt={b.name} className="w-8 h-8 rounded-xl object-cover" />
                    <span>{b.name}</span>
                  </td>
                  <td className="py-3 px-3 text-gray-600">{b.type}</td>
                  <td className="py-3 px-3 font-bold text-[#10B981]">%{b.trustScore}</td>
                  <td className="py-3 px-3 font-bold text-[#0F5238]">{b.totalDonatedKg} kg</td>
                  <td className="py-3 px-3">
                    <span className={`px-2.5 py-1 rounded-xl text-[10px] font-extrabold ${
                      b.status === 'active'
                        ? 'bg-[#D1FEE5] text-[#006C48]'
                        : b.status === 'pending'
                        ? 'bg-amber-100 text-amber-800'
                        : 'bg-red-100 text-red-800'
                    }`}>
                      {b.status === 'active' ? 'Aktif Onaylı' : b.status === 'pending' ? 'Onay Bekliyor' : 'Askıda'}
                    </span>
                  </td>
                  <td className="py-3 px-3 text-right space-x-2">
                    {b.status !== 'active' ? (
                      <button
                        onClick={() => updateBusinessStatus(b.id, 'active')}
                        className="px-2.5 py-1 bg-[#2D6A4F] text-white rounded-lg text-[11px] font-bold hover:bg-[#1B4332]"
                      >
                        Onayla
                      </button>
                    ) : (
                      <button
                        onClick={() => updateBusinessStatus(b.id, 'suspended')}
                        className="px-2.5 py-1 bg-red-50 text-red-700 border border-red-200 rounded-lg text-[11px] font-bold hover:bg-red-100"
                      >
                        Askıya Al
                      </button>
                    )}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>

    </div>
  );
};
