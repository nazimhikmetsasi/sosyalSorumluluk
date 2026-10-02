import React, { useState } from 'react';
import { X, CreditCard, Lock, ShieldCheck } from 'lucide-react';
import { cardNumberValid, expiryValid } from '../../utils/payment';

// A stand-in checkout. Nothing here is sent anywhere or stored: the card fields live in this
// component's state and vanish when it closes. The amount actually recorded on the order is
// computed by the database from the listing, never from this screen.

const digitsOnly = (value) => value.replace(/\D/g, '');
const formatCard = (value) => digitsOnly(value).slice(0, 16).replace(/(.{4})/g, '$1 ').trim();
const formatExpiry = (value) => {
  const digits = digitsOnly(value).slice(0, 4);
  return digits.length > 2 ? `${digits.slice(0, 2)}/${digits.slice(2)}` : digits;
};

const inputClass =
  'w-full px-3 py-2.5 rounded-2xl bg-[#F8FAFC] border border-gray-200 focus:border-[#2D6A4F] text-sm font-semibold text-gray-800 outline-none transition';

export const PaymentModal = ({ title, portionCount, total, onPay, onClose }) => {
  const [card, setCard] = useState({ name: '', number: '', expiry: '', cvc: '' });
  const [error, setError] = useState('');
  const [processing, setProcessing] = useState(false);

  const set = (key, format) => (e) =>
    setCard(prev => ({ ...prev, [key]: format ? format(e.target.value) : e.target.value }));

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!card.name.trim()) return setError('Kart üzerindeki adı girin.');
    if (!cardNumberValid(card.number)) return setError('Kart numarası 16 haneli olmalı.');
    if (!expiryValid(card.expiry)) return setError('Son kullanma tarihi geçersiz ya da geçmiş.');
    if (!/^\d{3}$/.test(card.cvc)) return setError('CVC 3 haneli olmalı.');

    setError('');
    setProcessing(true);
    // A short pause so the screen behaves like a real authorisation.
    await new Promise(resolve => setTimeout(resolve, 1400));
    const ok = await onPay();
    setProcessing(false);
    if (!ok) setError('Ödeme tamamlanamadı. Rezervasyon oluşturulamadı, kartınızdan çekim yapılmadı.');
  };

  return (
    <div className="fixed inset-0 z-[2100] flex items-center justify-center p-3 sm:p-6 bg-black/70 backdrop-blur-sm animate-in fade-in duration-200">
      <div className="relative w-full max-w-md max-h-[94vh] overflow-y-auto bg-white rounded-3xl shadow-2xl animate-in zoom-in-95 duration-200">

        <div className="p-4 bg-[#F0FFF4] border-b border-[#A8E7C5]/40 flex items-center justify-between">
          <div className="flex items-center gap-2">
            <CreditCard className="w-4 h-4 text-[#0F5238]" />
            <h3 className="font-bold text-sm text-[#0F5238]">Ödeme</h3>
          </div>
          <button
            onClick={onClose}
            disabled={processing}
            className="w-8 h-8 rounded-full bg-white hover:bg-gray-100 disabled:opacity-50 flex items-center justify-center text-gray-500 transition shadow-sm"
          >
            <X className="w-4 h-4" />
          </button>
        </div>

        <form onSubmit={handleSubmit} className="p-5 space-y-3.5">
          <div className="p-3 rounded-2xl bg-[#F8FAFC] border border-gray-200 flex items-center justify-between gap-3">
            <div className="min-w-0">
              <p className="text-xs font-bold text-[#0F5238] truncate">{title}</p>
              <p className="text-[10px] text-gray-500">{portionCount} paket</p>
            </div>
            <p className="text-lg font-black text-[#0F5238] flex-shrink-0">{total} ₺</p>
          </div>

          <div className="flex items-start gap-2 p-3 rounded-2xl bg-amber-50 border border-amber-200">
            <ShieldCheck className="w-4 h-4 text-amber-600 flex-shrink-0 mt-0.5" />
            <p className="text-[10px] text-amber-900 leading-relaxed">
              <strong>Demo ödeme ekranı.</strong> Gerçek bir ödeme alınmaz, bilgiler kaydedilmez.
              Gerçek kart bilgisi girmeyin. Herhangi 16 haneli bir numara, gelecekte
              bir tarih ve 3 haneli bir CVC yeterli (örn. <strong>4242 4242 4242 4242</strong>).
            </p>
          </div>

          <div>
            <label className="text-xs font-bold text-gray-700 block mb-1">Kart Üzerindeki Ad</label>
            <input
              value={card.name}
              onChange={set('name')}
              autoComplete="off"
              maxLength={60}
              placeholder="AD SOYAD"
              className={`${inputClass} uppercase`}
            />
          </div>

          <div>
            <label className="text-xs font-bold text-gray-700 block mb-1">Kart Numarası</label>
            <input
              value={card.number}
              onChange={set('number', formatCard)}
              inputMode="numeric"
              autoComplete="off"
              placeholder="0000 0000 0000 0000"
              className={inputClass}
            />
          </div>

          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className="text-xs font-bold text-gray-700 block mb-1">Son Kullanma</label>
              <input
                value={card.expiry}
                onChange={set('expiry', formatExpiry)}
                inputMode="numeric"
                autoComplete="off"
                placeholder="AA/YY"
                className={inputClass}
              />
            </div>
            <div>
              <label className="text-xs font-bold text-gray-700 block mb-1">CVC</label>
              <input
                value={card.cvc}
                onChange={(e) => setCard(prev => ({ ...prev, cvc: digitsOnly(e.target.value).slice(0, 3) }))}
                inputMode="numeric"
                autoComplete="off"
                placeholder="123"
                className={inputClass}
              />
            </div>
          </div>

          {error && <p className="text-xs font-bold text-red-600">{error}</p>}

          <button
            type="submit"
            disabled={processing}
            className="w-full py-3.5 bg-[#0F5238] hover:bg-[#2D6A4F] disabled:opacity-70 text-white font-bold text-sm rounded-2xl shadow-lg transition flex items-center justify-center gap-2"
          >
            <Lock className="w-4 h-4 text-[#95D5B2]" />
            {processing ? 'Ödeme işleniyor...' : `${total} ₺ Öde`}
          </button>
        </form>

      </div>
    </div>
  );
};
