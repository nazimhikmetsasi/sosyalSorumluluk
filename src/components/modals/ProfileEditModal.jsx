import React, { useState } from 'react';
import { useApp } from '../../context/AppContext';
import { X, User, MapPin, Phone, FileText, Save } from 'lucide-react';

const FIELD_LIMITS = { displayName: 60, city: 40, district: 40, phone: 20, bio: 200 };

export const ProfileEditModal = ({ isOpen, onClose }) => {
  const { currentUser, updateProfile } = useApp();

  const [form, setForm] = useState({
    displayName: currentUser.name || '',
    city: currentUser.city || '',
    district: currentUser.district || '',
    phone: currentUser.phone || '',
    bio: currentUser.bio || '',
  });
  const [saving, setSaving] = useState(false);

  if (!isOpen) return null;

  const set = (key) => (e) =>
    setForm(prev => ({ ...prev, [key]: e.target.value.slice(0, FIELD_LIMITS[key]) }));

  const handleSubmit = async (e) => {
    e.preventDefault();
    setSaving(true);
    const ok = await updateProfile({
      displayName: form.displayName.trim(),
      city: form.city.trim(),
      district: form.district.trim(),
      phone: form.phone.trim(),
      bio: form.bio.trim(),
    });
    setSaving(false);
    if (ok) onClose();
  };

  const inputClass =
    'w-full pl-9 pr-3 py-2.5 rounded-2xl bg-[#F8FAFC] border border-gray-200 focus:border-[#2D6A4F] text-xs font-semibold text-gray-800 outline-none transition';

  return (
    <div className="fixed inset-0 z-[2000] flex items-center justify-center p-3 sm:p-6 bg-black/60 backdrop-blur-sm animate-in fade-in duration-200">
      <div className="relative w-full max-w-md bg-white rounded-3xl shadow-2xl overflow-hidden animate-in zoom-in-95 duration-200">

        <div className="p-4 bg-[#F0FFF4] border-b border-[#A8E7C5]/40 flex items-center justify-between">
          <h3 className="font-bold text-sm text-[#0F5238]">Profilimi Düzenle</h3>
          <button
            onClick={onClose}
            className="w-8 h-8 rounded-full bg-white hover:bg-gray-100 flex items-center justify-center text-gray-500 transition shadow-sm"
          >
            <X className="w-4 h-4" />
          </button>
        </div>

        <form onSubmit={handleSubmit} className="p-5 space-y-3.5 max-h-[70vh] overflow-y-auto">
          <div>
            <label className="text-xs font-bold text-gray-700 block mb-1">Ad Soyad</label>
            <div className="relative">
              <User className="w-4 h-4 text-gray-400 absolute left-3 top-1/2 -translate-y-1/2" />
              <input type="text" value={form.displayName} onChange={set('displayName')}
                placeholder="Adınız ve soyadınız" className={inputClass} />
            </div>
          </div>

          <div className="grid grid-cols-2 gap-2">
            <div>
              <label className="text-xs font-bold text-gray-700 block mb-1">Şehir</label>
              <div className="relative">
                <MapPin className="w-4 h-4 text-gray-400 absolute left-3 top-1/2 -translate-y-1/2" />
                <input type="text" value={form.city} onChange={set('city')}
                  placeholder="İstanbul" className={inputClass} />
              </div>
            </div>
            <div>
              <label className="text-xs font-bold text-gray-700 block mb-1">İlçe</label>
              <div className="relative">
                <MapPin className="w-4 h-4 text-gray-400 absolute left-3 top-1/2 -translate-y-1/2" />
                <input type="text" value={form.district} onChange={set('district')}
                  placeholder="Kadıköy" className={inputClass} />
              </div>
            </div>
          </div>

          <div>
            <label className="text-xs font-bold text-gray-700 block mb-1">Telefon</label>
            <div className="relative">
              <Phone className="w-4 h-4 text-gray-400 absolute left-3 top-1/2 -translate-y-1/2" />
              <input type="tel" value={form.phone} onChange={set('phone')}
                placeholder="0532 000 0000" className={inputClass} />
            </div>
          </div>

          <div>
            <label className="text-xs font-bold text-gray-700 block mb-1">
              Hakkımda
              <span className="font-medium text-gray-400 ml-1">
                ({form.bio.length}/{FIELD_LIMITS.bio})
              </span>
            </label>
            <div className="relative">
              <FileText className="w-4 h-4 text-gray-400 absolute left-3 top-3" />
              <textarea rows={3} value={form.bio} onChange={set('bio')}
                placeholder="Kendinizden kısaca bahsedin..."
                className={`${inputClass} resize-none pt-2.5`} />
            </div>
          </div>

          <p className="text-[10px] text-gray-400 leading-relaxed">
            E-posta adresiniz ve hesap yetkiniz buradan değiştirilemez; yetki yalnızca
            yönetici tarafından verilir.
          </p>

          <button
            type="submit"
            disabled={saving}
            className="w-full py-3 bg-[#0F5238] hover:bg-[#2D6A4F] disabled:opacity-60 text-white font-bold text-xs rounded-2xl shadow-lg transition flex items-center justify-center gap-2"
          >
            <Save className="w-4 h-4 text-[#95D5B2]" />
            <span>{saving ? 'Kaydediliyor...' : 'Kaydet'}</span>
          </button>
        </form>

      </div>
    </div>
  );
};
