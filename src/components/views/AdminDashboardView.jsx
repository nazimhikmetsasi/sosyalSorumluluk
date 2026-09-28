import React, { useState } from 'react';
import { useApp } from '../../context/AppContext';
import {
  Building2,
  FileText
} from 'lucide-react';

export const AdminDashboardView = () => {
  const { businesses, updateBusinessStatus, stats, setActiveTab } = useApp();
  const [filterStatus, setFilterStatus] = useState('all');

  const filteredBusinesses = businesses.filter(b => filterStatus === 'all' || b.status === filterStatus);

  return (
    <div className="space-y-3.5 pb-20 lg:pb-10 animate-in fade-in duration-300">
      
      {/* Top Admin Summary Bar */}
      <div className="bg-white p-3 rounded-2xl border border-gray-100 shadow-sm flex items-center justify-between gap-2">
        <div>
          <div className="flex items-center gap-1.5">
            <h1 className="text-xs font-black text-[#0F5238]">Yönetim Masası</h1>
            <span className="px-1.5 py-0.2 rounded text-[8px] font-bold bg-red-100 text-red-700">
              Admin
            </span>
          </div>
          <p className="text-[9px] text-gray-400 mt-0.5">İşletme onayları & sistem denetimi</p>
        </div>

        <button
          onClick={() => setActiveTab('admin_reports')}
          className="flex items-center gap-1 px-2.5 py-1.5 bg-[#0F5238] text-white font-bold text-[10px] rounded-xl shadow transition flex-shrink-0"
        >
          <FileText className="w-3 h-3 text-[#95D5B2]" />
          <span>Raporlar</span>
        </button>
      </div>

      {/* 4 Stats Cards in 2x2 Grid */}
      <div className="grid grid-cols-2 gap-2.5">
        <div className="bg-white p-3 rounded-2xl border border-gray-100 shadow-sm">
          <p className="text-[10px] font-bold text-gray-400">Toplam Kullanıcı</p>
          <p className="text-lg font-black text-[#0F5238] mt-0.5">{stats.totalUsers.toLocaleString()}</p>
          <span className="text-[9px] text-[#10B981] font-bold">↑ %14 bu ay</span>
        </div>

        <div className="bg-white p-3 rounded-2xl border border-gray-100 shadow-sm">
          <p className="text-[10px] font-bold text-gray-400">Aktif İşletmeler</p>
          <p className="text-lg font-black text-[#0F5238] mt-0.5">{stats.activeBusinesses}</p>
          <span className="text-[9px] text-amber-600 font-bold">3 onay bekliyor</span>
        </div>

        <div className="bg-white p-3 rounded-2xl border border-gray-100 shadow-sm">
          <p className="text-[10px] font-bold text-gray-400">Kurtarılan Gıda</p>
          <p className="text-lg font-black text-[#0F5238] mt-0.5">{stats.totalFoodSavedKg.toLocaleString()} kg</p>
          <span className="text-[9px] text-[#52B788] font-bold">37.1t CO₂ önlendi</span>
        </div>

        <div className="bg-white p-3 rounded-2xl border border-gray-100 shadow-sm">
          <p className="text-[10px] font-bold text-gray-400">SLA & Güvenlik</p>
          <p className="text-lg font-black text-emerald-600 mt-0.5">%99.8</p>
          <span className="text-[9px] text-emerald-600 font-medium">Sistem Sağlıklı 🟢</span>
        </div>
      </div>

      {/* Business Moderation List */}
      <div className="bg-white rounded-2xl p-3 border border-gray-100 shadow-sm space-y-2.5">
        <div className="flex items-center justify-between gap-2">
          <h3 className="font-bold text-xs text-[#0F5238] flex items-center gap-1">
            <Building2 className="w-3.5 h-3.5 text-[#2D6A4F]" />
            İşletme Onayları
          </h3>

          <div className="flex items-center gap-1 bg-[#F8FAFC] p-0.5 rounded-lg border border-gray-200">
            {[
              { id: 'all', label: 'Tümü' },
              { id: 'active', label: 'Aktif' },
              { id: 'pending', label: 'Bekleyen' },
            ].map((st) => (
              <button
                key={st.id}
                onClick={() => setFilterStatus(st.id)}
                className={`px-2 py-0.5 rounded-md text-[9px] font-bold transition ${
                  filterStatus === st.id ? 'bg-[#2D6A4F] text-white shadow-sm' : 'text-gray-500'
                }`}
              >
                {st.label}
              </button>
            ))}
          </div>
        </div>

        {/* Business Cards for Mobile */}
        <div className="space-y-2">
          {filteredBusinesses.map((b) => (
            <div
              key={b.id}
              className="p-2.5 rounded-xl bg-[#F8FAFC] border border-gray-100 flex items-center justify-between gap-2"
            >
              <div className="flex items-center gap-2 min-w-0">
                <img src={b.avatar} alt={b.name} className="w-8 h-8 rounded-lg object-cover flex-shrink-0" />
                <div className="min-w-0">
                  <h4 className="text-[11px] font-bold text-[#0F5238] truncate">{b.name}</h4>
                  <p className="text-[9px] text-gray-400">
                    {b.type} • <span className="text-[#10B981] font-bold">%{b.trustScore}</span> • {b.totalDonatedKg}kg
                  </p>
                </div>
              </div>

              <div className="flex items-center gap-1.5 flex-shrink-0">
                {b.status !== 'active' ? (
                  <button
                    onClick={() => updateBusinessStatus(b.id, 'active')}
                    className="px-2 py-1 bg-[#2D6A4F] text-white rounded-lg text-[9px] font-bold hover:bg-[#1B4332]"
                  >
                    Onayla
                  </button>
                ) : (
                  <button
                    onClick={() => updateBusinessStatus(b.id, 'suspended')}
                    className="px-2 py-1 bg-red-50 text-red-700 border border-red-200 rounded-lg text-[9px] font-bold hover:bg-red-100"
                  >
                    Askıya Al
                  </button>
                )}
              </div>
            </div>
          ))}
        </div>
      </div>

    </div>
  );
};
