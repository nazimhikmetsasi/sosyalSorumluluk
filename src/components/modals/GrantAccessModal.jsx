import React, { useState, useEffect } from 'react';
import { useApp } from '../../context/AppContext';
import { X, Mail, KeyRound, ShieldCheck, UserCheck } from 'lucide-react';

export const GrantAccessModal = ({ organisation, onClose }) => {
  const { grantAccess, listOrganisationMembers } = useApp();
  const [email, setEmail] = useState('');
  const [saving, setSaving] = useState(false);
  // null while loading; an array once known. A failed lookup falls back to the plain form.
  const [members, setMembers] = useState(null);
  const [addingAnother, setAddingAnother] = useState(false);

  useEffect(() => {
    let cancelled = false;
    listOrganisationMembers(organisation.id).then(({ data, error }) => {
      if (cancelled) return;
      if (error) console.error('Yetkililer okunamadı', error);
      setMembers(error ? [] : data || []);
    });
    return () => {
      cancelled = true;
    };
  }, [organisation.id, listOrganisationMembers]);

  const hasMembers = Boolean(members?.length);
  const showForm = members !== null && (!hasMembers || addingAnother);

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!email.trim()) return;

    setSaving(true);
    const ok = await grantAccess(email, organisation.id, organisation.kind);
    setSaving(false);
    if (ok) onClose();
  };

  return (
    <div className="fixed inset-0 z-[2000] flex items-center justify-center p-3 sm:p-6 bg-black/60 backdrop-blur-sm animate-in fade-in duration-200">
      <div className="relative w-full max-w-md bg-white rounded-3xl shadow-2xl overflow-hidden animate-in zoom-in-95 duration-200">

        <div className="p-4 bg-[#F0FFF4] border-b border-[#A8E7C5]/40 flex items-center justify-between">
          <div className="flex items-center gap-2">
            <KeyRound className="w-4 h-4 text-[#0F5238]" />
            <h3 className="font-bold text-sm text-[#0F5238]">Kullanıcı Yetkilendir</h3>
          </div>
          <button
            onClick={onClose}
            className="w-8 h-8 rounded-full bg-white hover:bg-gray-100 flex items-center justify-center text-gray-500 transition shadow-sm"
          >
            <X className="w-4 h-4" />
          </button>
        </div>

        <form onSubmit={handleSubmit} className="p-5 space-y-4">
          <div className="p-3 rounded-2xl bg-[#F8FAFC] border border-gray-200">
            <p className="text-[10px] text-gray-500 font-bold uppercase tracking-wider">Kurum</p>
            <p className="text-sm font-bold text-[#0F5238] mt-0.5">{organisation.name}</p>
            <p className="text-[10px] text-gray-500 mt-0.5">
              Verilecek yetki: <strong>{organisation.kind === 'ngo' ? 'STK' : 'İşletme'}</strong>
            </p>
          </div>

          {members === null && <p className="text-[11px] text-gray-500 text-center">Yetkililer yükleniyor...</p>}

          {hasMembers && (
            <div className="p-3 rounded-2xl bg-[#F0FFF4] border border-[#A8E7C5]/60 space-y-1.5">
              <p className="text-[10px] text-[#0F5238] font-bold uppercase tracking-wider flex items-center gap-1">
                <UserCheck className="w-3.5 h-3.5" /> Yetkilendirilmiş hesaplar
              </p>
              {members.map(m => (
                <p key={m.email} className="text-xs font-semibold text-gray-800 flex justify-between gap-2">
                  <span className="truncate">{m.email}</span>
                  <span className="text-[10px] font-bold text-[#2D6A4F]">{m.role === 'ngo' ? 'STK' : 'İşletme'}</span>
                </p>
              ))}
              {!addingAnother && (
                <button
                  type="button"
                  onClick={() => setAddingAnother(true)}
                  className="text-[10px] font-bold text-[#0F5238] underline pt-1"
                >
                  Başka hesap yetkilendir
                </button>
              )}
            </div>
          )}

          {showForm && (<>
          <div>
            <label className="text-xs font-bold text-gray-700 block mb-1">
              Yetkilendirilecek Kullanıcının E-postası
            </label>
            <div className="relative">
              <Mail className="w-4 h-4 text-gray-400 absolute left-3 top-1/2 -translate-y-1/2" />
              <input
                type="email"
                required
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                placeholder="yetkili@eposta.com"
                className="w-full pl-9 pr-3 py-2.5 rounded-2xl bg-[#F8FAFC] border border-gray-200 focus:border-[#2D6A4F] text-xs font-semibold text-gray-800 outline-none transition"
              />
            </div>
          </div>

          <div className="flex items-start gap-2 p-3 rounded-2xl bg-amber-50 border border-amber-200">
            <ShieldCheck className="w-4 h-4 text-amber-600 flex-shrink-0 mt-0.5" />
            <p className="text-[10px] text-amber-900 leading-relaxed">
              Kullanıcının bu e-posta ile önceden kayıt olmuş olması gerekir. Yetki,
              kullanıcı çıkış yapıp yeniden giriş yaptığında etkinleşir.
            </p>
          </div>

          <button
            type="submit"
            disabled={saving}
            className="w-full py-3 bg-[#0F5238] hover:bg-[#2D6A4F] disabled:opacity-60 text-white font-bold text-xs rounded-2xl shadow-lg transition"
          >
            {saving ? 'Yetki veriliyor...' : 'Yetkiyi Ver'}
          </button>
          </>)}
        </form>

      </div>
    </div>
  );
};
