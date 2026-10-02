import React, { useState } from 'react';
import { useApp } from '../../context/AppContext';
import { GrantAccessModal } from '../modals/GrantAccessModal';
import { AddOrganisationModal } from '../modals/AddOrganisationModal';
import { OrganisationImagesModal } from '../modals/OrganisationImagesModal';
import {
  Building2,
  Plus,
  FileText,
  RotateCcw
} from 'lucide-react';

export const AdminDashboardView = () => {
  const {
    businesses,
    updateBusinessStatus,
    stats,
    setActiveTab,
    resetDemoData,
  } = useApp();

  const [filterStatus, setFilterStatus] = useState('all');
  const [grantTarget, setGrantTarget] = useState(null);
  const [addingOrganisation, setAddingOrganisation] = useState(false);
  const [imagesTargetId, setImagesTargetId] = useState(null);

  const filteredBusinesses = businesses.filter(
    b => filterStatus === 'all' || b.status === filterStatus
  );

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
          <p className="text-[9px] text-gray-400 mt-0.5">İşletme onayları & denetim</p>
        </div>

        <div className="flex items-center gap-1.5">
          <button
            onClick={() => setActiveTab('admin_reports')}
            className="flex items-center gap-1 px-2.5 py-1.5 bg-[#0F5238] text-white font-bold text-[10px] rounded-xl shadow transition flex-shrink-0"
          >
            <FileText className="w-3 h-3 text-[#95D5B2]" />
            <span>Raporlar</span>
          </button>
        </div>
      </div>

      {/* 4 Stats Cards in 2x2 Grid */}
      <div className="grid grid-cols-2 gap-2.5">
        <div className="bg-white p-3 rounded-2xl border border-gray-100 shadow-sm">
          <p className="text-[10px] font-bold text-gray-400">Toplam Kullanıcı</p>
          <p className="text-lg font-black text-[#0F5238] mt-0.5">{stats.totalUsers.toLocaleString()}</p>
          <span className="text-[9px] text-[#10B981] font-bold">{stats.activeNgos} aktif STK</span>
        </div>

        <div className="bg-white p-3 rounded-2xl border border-gray-100 shadow-sm">
          <p className="text-[10px] font-bold text-gray-400">Aktif İşletmeler</p>
          <p className="text-lg font-black text-[#0F5238] mt-0.5">{stats.activeBusinesses}</p>
          <span className="text-[9px] text-amber-600 font-bold">
            {businesses.filter(b => b.status === 'pending').length} onay bekliyor
          </span>
        </div>

        <div className="bg-white p-3 rounded-2xl border border-gray-100 shadow-sm">
          <p className="text-[10px] font-bold text-gray-400">Kurtarılan Gıda</p>
          <p className="text-lg font-black text-[#0F5238] mt-0.5">{stats.totalFoodSavedKg.toLocaleString()} kg</p>
          <span className="text-[9px] text-[#52B788] font-bold">
            {stats.totalCo2SavedKg.toLocaleString('tr-TR')} kg CO₂ önlendi
          </span>
        </div>

        <div className="bg-white p-3 rounded-2xl border border-gray-100 shadow-sm">
          <p className="text-[10px] font-bold text-gray-400">Kurtarılan Porsiyon</p>
          <p className="text-lg font-black text-emerald-600 mt-0.5">{stats.totalPortions.toLocaleString('tr-TR')}</p>
          <span className="text-[9px] text-emerald-600 font-medium">{stats.todayActiveListings} aktif ilan</span>
        </div>
      </div>

      {/* Business Moderation List */}
      <div className="bg-white rounded-2xl p-3 border border-gray-100 shadow-sm space-y-2.5">
        <div className="flex items-center justify-between gap-2">
          <h3 className="font-bold text-xs text-[#0F5238] flex items-center gap-1">
            <Building2 className="w-3.5 h-3.5 text-[#2D6A4F]" />
            İşletme Onayları & Güven Skorları
          </h3>

          <button
            onClick={() => setAddingOrganisation(true)}
            className="flex items-center gap-1 px-2 py-1 bg-[#0F5238] text-white font-bold text-[9px] rounded-lg shadow flex-shrink-0"
          >
            <Plus className="w-3 h-3" />
            <span>Kurum Ekle</span>
          </button>

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
              className="p-2.5 rounded-xl bg-[#F8FAFC] border border-gray-100 space-y-2"
            >
              <div className="flex items-center justify-between gap-2">
                <div className="flex items-center gap-2 min-w-0">
                  <img src={b.avatar} alt={b.name} className="w-8 h-8 rounded-lg object-cover flex-shrink-0" />
                  <div className="min-w-0">
                    <h4 className="text-[11px] font-bold text-[#0F5238] truncate">{b.name}</h4>
                    <p className="text-[9px] text-gray-400">
                      {b.type} • {b.totalDonatedKg}kg kurtarıldı
                    </p>
                  </div>
                </div>

                <div className="flex items-center gap-1 flex-shrink-0">
                  <button
                    onClick={() => setImagesTargetId(b.id)}
                    title="Logo ve kapak görselini düzenle"
                    className="px-2 py-1 bg-white border border-gray-200 text-gray-700 rounded-lg text-[9px] font-bold hover:border-[#52B788] hover:text-[#0F5238]"
                  >
                    Görseller
                  </button>
                  <button
                    onClick={() => setGrantTarget(b)}
                    title="Bir kullanıcıyı bu kuruma yetkilendir"
                    className="px-2 py-1 bg-white border border-gray-200 text-gray-700 rounded-lg text-[9px] font-bold hover:border-[#52B788] hover:text-[#0F5238]"
                  >
                    Yetkilendir
                  </button>
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

              {/* Computed from orders and reviews by the database; not editable here. */}
              <div className="flex items-center justify-between pt-1 border-t border-gray-100 text-[9px] text-gray-500">
                <span>
                  Güven Skoru: <strong className="text-[#10B981]">%{b.trustScore}</strong>
                </span>
                <span>
                  {b.rating ? <>★ <strong>{b.rating}</strong> ({b.reviewCount} değerlendirme)</> : 'Henüz değerlendirme yok'}
                </span>
              </div>
            </div>
          ))}
        </div>
      </div>

      {imagesTargetId && <OrganisationImagesModal organisationId={imagesTargetId} onClose={() => setImagesTargetId(null)} />}

      {addingOrganisation && <AddOrganisationModal onClose={() => setAddingOrganisation(false)} />}

      {grantTarget && (
        <GrantAccessModal organisation={grantTarget} onClose={() => setGrantTarget(null)} />
      )}

      {/* Demo Reset Bar */}
      <div className="bg-white p-3 rounded-2xl border border-gray-100 shadow-sm flex items-center justify-between">
        <div>
          <h4 className="text-[10px] font-bold text-gray-700">Yerel Tercihleri Sıfırla</h4>
          <p className="text-[9px] text-gray-400">
            Bu cihazdaki tercihleri temizler ve çıkış yapar. İlan, kurum ve rezervasyon
            verileri sunucuda tutulur, etkilenmez.
          </p>
        </div>
        <button
          onClick={resetDemoData}
          className="flex items-center gap-1 px-2.5 py-1.5 bg-gray-100 hover:bg-gray-200 text-gray-700 font-bold text-[10px] rounded-xl transition"
        >
          <RotateCcw className="w-3 h-3" />
          <span>Sıfırla</span>
        </button>
      </div>

    </div>
  );
};
