import React, { useState } from 'react';
import { useApp } from '../../context/AppContext';
import { X, ImagePlus } from 'lucide-react';

const SLOTS = [
  { kind: 'avatar', label: 'Logo', field: 'avatar', box: 'w-20 h-20 rounded-2xl' },
  { kind: 'cover', label: 'Kapak Görseli', field: 'cover', box: 'w-full h-32 rounded-2xl' },
];

export const OrganisationImagesModal = ({ organisationId, onClose }) => {
  const { businesses, changeOrganisationImage } = useApp();
  const [busyKind, setBusyKind] = useState(null);
  // Read from context rather than a prop so the preview updates once the upload is saved.
  const organisation = businesses.find(b => b.id === organisationId);
  if (!organisation) return null;

  const handleFile = async (kind, e) => {
    const file = e.target.files?.[0];
    e.target.value = '';
    if (!file) return;
    setBusyKind(kind);
    await changeOrganisationImage(organisationId, kind, file);
    setBusyKind(null);
  };

  return (
    <div className="fixed inset-0 z-[2000] flex items-center justify-center p-3 sm:p-6 bg-black/60 backdrop-blur-sm animate-in fade-in duration-200">
      <div className="relative w-full max-w-md max-h-[92vh] overflow-y-auto bg-white rounded-3xl shadow-2xl animate-in zoom-in-95 duration-200">

        <div className="p-4 bg-[#F0FFF4] border-b border-[#A8E7C5]/40 flex items-center justify-between">
          <div className="flex items-center gap-2 min-w-0">
            <ImagePlus className="w-4 h-4 text-[#0F5238] flex-shrink-0" />
            <h3 className="font-bold text-sm text-[#0F5238] truncate">Görseller · {organisation.name}</h3>
          </div>
          <button
            onClick={onClose}
            className="w-8 h-8 rounded-full bg-white hover:bg-gray-100 flex items-center justify-center text-gray-500 transition shadow-sm"
          >
            <X className="w-4 h-4" />
          </button>
        </div>

        <div className="p-5 space-y-5">
          {SLOTS.map(({ kind, label, field, box }) => (
            <div key={kind} className="space-y-2">
              <p className="text-xs font-bold text-gray-700">{label}</p>
              <div className={`${box} bg-gray-100 border border-gray-200 overflow-hidden flex items-center justify-center`}>
                {organisation[field]
                  ? <img src={organisation[field]} alt={label} className="w-full h-full object-cover" />
                  : <span className="text-[10px] text-gray-400 font-semibold">Görsel yok</span>}
              </div>
              <label className="inline-flex items-center gap-1.5 px-3 py-2 bg-[#0F5238] hover:bg-[#2D6A4F] text-white text-[11px] font-bold rounded-xl cursor-pointer transition">
                <ImagePlus className="w-3.5 h-3.5" />
                {busyKind === kind ? 'Yükleniyor...' : organisation[field] ? 'Değiştir' : 'Görsel Seç'}
                <input
                  type="file"
                  accept="image/jpeg,image/png,image/webp"
                  className="hidden"
                  disabled={busyKind !== null}
                  onChange={(e) => handleFile(kind, e)}
                />
              </label>
            </div>
          ))}
          <p className="text-[10px] text-gray-500">JPG, PNG veya WebP · en fazla 2 MB.</p>
        </div>

      </div>
    </div>
  );
};
