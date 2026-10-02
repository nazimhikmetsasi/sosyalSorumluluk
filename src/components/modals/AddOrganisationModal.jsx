import React, { useState } from 'react';
import { useApp } from '../../context/AppContext';
import { X, Building2 } from 'lucide-react';

const inputClass =
  'w-full px-3 py-2.5 rounded-2xl bg-[#F8FAFC] border border-gray-200 focus:border-[#2D6A4F] text-xs font-semibold text-gray-800 outline-none transition';

// Defaults to Moda, where the seed data sits, so a new pin lands next to the rest.
const DEFAULT_LAT = '40.9835';
const DEFAULT_LNG = '29.0275';

export const AddOrganisationModal = ({ onClose }) => {
  const { addOrganisation } = useApp();
  const [form, setForm] = useState({
    name: '', kind: 'business', type: '', address: '', phone: '', lat: DEFAULT_LAT, lng: DEFAULT_LNG,
  });
  const [saving, setSaving] = useState(false);

  const set = (key) => (e) => setForm(prev => ({ ...prev, [key]: e.target.value }));

  const handleSubmit = async (e) => {
    e.preventDefault();
    setSaving(true);
    const ok = await addOrganisation(form);
    setSaving(false);
    if (ok) onClose();
  };

  return (
    <div className="fixed inset-0 z-[2000] flex items-center justify-center p-3 sm:p-6 bg-black/60 backdrop-blur-sm animate-in fade-in duration-200">
      <div className="relative w-full max-w-md max-h-[92vh] overflow-y-auto bg-white rounded-3xl shadow-2xl animate-in zoom-in-95 duration-200">

        <div className="p-4 bg-[#F0FFF4] border-b border-[#A8E7C5]/40 flex items-center justify-between">
          <div className="flex items-center gap-2">
            <Building2 className="w-4 h-4 text-[#0F5238]" />
            <h3 className="font-bold text-sm text-[#0F5238]">Yeni Kurum Ekle</h3>
          </div>
          <button
            onClick={onClose}
            className="w-8 h-8 rounded-full bg-white hover:bg-gray-100 flex items-center justify-center text-gray-500 transition shadow-sm"
          >
            <X className="w-4 h-4" />
          </button>
        </div>

        <form onSubmit={handleSubmit} className="p-5 space-y-3">
          <div>
            <label className="text-xs font-bold text-gray-700 block mb-1">Kurum Adı</label>
            <input required maxLength={80} value={form.name} onChange={set('name')} placeholder="Örn: Moda Fırını" className={inputClass} />
          </div>

          <div className="grid grid-cols-2 gap-2">
            <div>
              <label className="text-xs font-bold text-gray-700 block mb-1">Tür</label>
              <select value={form.kind} onChange={set('kind')} className={inputClass}>
                <option value="business">İşletme</option>
                <option value="ngo">STK</option>
              </select>
            </div>
            <div>
              <label className="text-xs font-bold text-gray-700 block mb-1">Kategori</label>
              <input maxLength={60} value={form.type} onChange={set('type')} placeholder="Fırın & Unlu Mamuller" className={inputClass} />
            </div>
          </div>

          <div>
            <label className="text-xs font-bold text-gray-700 block mb-1">Adres</label>
            <input maxLength={160} value={form.address} onChange={set('address')} placeholder="Mahalle, sokak, ilçe" className={inputClass} />
          </div>

          <div>
            <label className="text-xs font-bold text-gray-700 block mb-1">Telefon</label>
            <input maxLength={30} value={form.phone} onChange={set('phone')} placeholder="0216 000 00 00" className={inputClass} />
          </div>

          <div className="grid grid-cols-2 gap-2">
            <div>
              <label className="text-xs font-bold text-gray-700 block mb-1">Enlem</label>
              <input type="number" step="any" required value={form.lat} onChange={set('lat')} className={inputClass} />
            </div>
            <div>
              <label className="text-xs font-bold text-gray-700 block mb-1">Boylam</label>
              <input type="number" step="any" required value={form.lng} onChange={set('lng')} className={inputClass} />
            </div>
          </div>
          <p className="text-[10px] text-gray-500">
            Konum, kurumun ilanlarının haritadaki yeridir. Google Haritalar'da konuma sağ tıklayıp koordinatları kopyalayabilirsiniz.
          </p>

          <button
            type="submit"
            disabled={saving}
            className="w-full py-3 bg-[#0F5238] hover:bg-[#2D6A4F] disabled:opacity-60 text-white font-bold text-xs rounded-2xl shadow-lg transition"
          >
            {saving ? 'Ekleniyor...' : 'Kurumu Ekle'}
          </button>
        </form>

      </div>
    </div>
  );
};
