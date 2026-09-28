import React, { useState } from 'react';
import { useApp } from '../../context/AppContext';
import { Leaf, Mail, ShieldCheck, ArrowRight, Smartphone, Sparkles, CheckCircle2 } from 'lucide-react';

export const AuthView = () => {
  const { setIsAuthenticated, showToast } = useApp();
  const [step, setStep] = useState('input'); // 'input' | 'otp'
  const [identifier, setIdentifier] = useState('selin.yilmaz@gmail.com');
  const [otpCodes, setOtpCodes] = useState(['5', '4', '8', '2', '', '']);

  const handleSendCode = (e) => {
    e.preventDefault();
    if (!identifier.trim()) return;
    setStep('otp');
    showToast(`${identifier} adresine 6 haneli doğrulama kodu gönderildi!`);
  };

  const handleVerifyOtp = (e) => {
    e.preventDefault();
    setIsAuthenticated(true);
    showToast('Giriş başarılı! GıdaKöprüsü\'ne hoş geldiniz. 🌿');
  };

  return (
    <div className="min-h-screen w-full flex flex-col lg:flex-row bg-white">
      
      {/* Left Form Panel */}
      <div className="w-full lg:w-1/2 flex items-center justify-center p-6 sm:p-12">
        <div className="w-full max-w-md space-y-8">
          
          {/* Logo */}
          <div className="flex items-center gap-3">
            <div className="w-12 h-12 rounded-2xl bg-gradient-to-tr from-[#0F5238] to-[#52B788] flex items-center justify-center text-white shadow-lg shadow-[#0F5238]/20">
              <Leaf className="w-7 h-7" />
            </div>
            <div>
              <span className="font-black text-2xl text-[#0F5238]">Gıda<span className="text-[#52B788]">Köprüsü</span></span>
              <p className="text-xs text-gray-500">Gıda israfına birlikte son verelim</p>
            </div>
          </div>

          {step === 'input' ? (
            <form onSubmit={handleSendCode} className="space-y-5 animate-in fade-in">
              <div>
                <h2 className="text-2xl font-extrabold text-[#0F5238]">Giriş Yap veya Kaydol</h2>
                <p className="text-xs text-gray-500 mt-1">
                  Şifresiz, tek kullanımlık güvenli kod (OTP) ile saniyeler içinde bağlanın.
                </p>
              </div>

              <div>
                <label className="text-xs font-bold text-gray-700 block mb-1.5">
                  E-posta Adresiniz veya Telefon Numaranız
                </label>
                <div className="relative">
                  <Mail className="w-5 h-5 text-gray-400 absolute left-3.5 top-1/2 -translate-y-1/2" />
                  <input
                    type="text"
                    required
                    value={identifier}
                    onChange={(e) => setIdentifier(e.target.value)}
                    placeholder="ornek@email.com veya 0532..."
                    className="w-full pl-11 pr-4 py-3.5 rounded-2xl bg-[#F8FAFC] border border-gray-200 focus:border-[#2D6A4F] focus:ring-2 focus:ring-[#95D5B2]/30 text-xs font-semibold text-gray-800 outline-none transition"
                  />
                </div>
              </div>

              <button
                type="submit"
                className="w-full py-4 bg-[#0F5238] hover:bg-[#2D6A4F] text-white font-bold text-xs rounded-2xl shadow-xl shadow-[#0F5238]/20 transition flex items-center justify-center gap-2"
              >
                <span>Doğrulama Kodu Gönder</span>
                <ArrowRight className="w-4 h-4 text-[#95D5B2]" />
              </button>

              <p className="text-[11px] text-gray-400 text-center">
                Devam ederek GıdaKöprüsü Kullanım Koşulları ve KVKK Aydınlatma Metnini kabul etmiş olursunuz.
              </p>
            </form>
          ) : (
            <form onSubmit={handleVerifyOtp} className="space-y-6 animate-in fade-in">
              <div>
                <h2 className="text-2xl font-extrabold text-[#0F5238]">Kodu Doğrulayın</h2>
                <p className="text-xs text-gray-500 mt-1">
                  <strong>{identifier}</strong> adresine gönderilen 6 haneli kodu girin.
                </p>
              </div>

              <div className="flex justify-between gap-2">
                {[0, 1, 2, 3, 4, 5].map((idx) => (
                  <input
                    key={idx}
                    type="text"
                    maxLength={1}
                    value={otpCodes[idx] || ''}
                    onChange={(e) => {
                      const val = e.target.value;
                      const nextCodes = [...otpCodes];
                      nextCodes[idx] = val;
                      setOtpCodes(nextCodes);
                    }}
                    className="w-12 h-14 text-center font-black text-xl rounded-2xl bg-[#F0FFF4] border-2 border-[#A8E7C5] focus:border-[#0F5238] text-[#0F5238] outline-none transition shadow-sm"
                  />
                ))}
              </div>

              <div className="flex items-center justify-between text-xs">
                <span className="text-gray-400">Kalan Süre: <strong className="text-[#52B788]">02:45</strong></span>
                <button
                  type="button"
                  onClick={() => showToast('Yeni kod başarıyla gönderildi!')}
                  className="font-bold text-[#0F5238] hover:underline"
                >
                  Tekrar Gönder
                </button>
              </div>

              <button
                type="submit"
                className="w-full py-4 bg-[#0F5238] hover:bg-[#2D6A4F] text-white font-bold text-xs rounded-2xl shadow-xl shadow-[#0F5238]/20 transition flex items-center justify-center gap-2"
              >
                <CheckCircle2 className="w-4 h-4 text-[#95D5B2]" />
                <span>Doğrula ve Giriş Yap</span>
              </button>

              <button
                type="button"
                onClick={() => setStep('input')}
                className="w-full text-center text-xs font-semibold text-gray-500 hover:text-gray-800"
              >
                Numarayı / E-postayı Değiştir
              </button>
            </form>
          )}

        </div>
      </div>

      {/* Right Presentation Side (Impact stats) */}
      <div className="hidden lg:flex w-1/2 bg-gradient-to-br from-[#E8FFF0] via-[#CCF8DF] to-[#B8E4CC] p-12 items-center justify-center relative overflow-hidden">
        <div className="absolute top-10 right-10 w-72 h-72 rounded-full bg-[#52B788]/20 blur-3xl pointer-events-none"></div>
        <div className="relative z-10 max-w-lg space-y-6">
          
          <div className="inline-flex items-center gap-2 px-3.5 py-1.5 rounded-full bg-white/60 backdrop-blur-md border border-[#52B788]/40 text-xs font-bold text-[#0F5238]">
            <Sparkles className="w-4 h-4 text-[#52B788]" />
            <span>Türkiye'nin İlk Bütünleşik Gıda Kurtarma Ağı</span>
          </div>

          <h2 className="text-3xl sm:text-4xl font-black text-[#0F5238] leading-tight">
            Her gün tonlarca taze gıda çöpe gitmesin, sofralar bereketlensin.
          </h2>

          <div className="space-y-3 pt-2">
            {[
              { icon: '🌿', val: '14.850 kg', label: 'Gıda Kurtarıldı' },
              { icon: '🌍', val: '37.125 kg', label: 'CO₂ Salımı Önlendi' },
              { icon: '🍽️', val: '42.100', label: 'Porsiyon İhtiyaç Sahibine Dağıtıldı' },
            ].map((stat, i) => (
              <div key={i} className="flex items-center gap-3.5 p-3.5 bg-white/80 backdrop-blur-md rounded-2xl border border-white shadow-sm">
                <span className="text-2xl">{stat.icon}</span>
                <div>
                  <p className="text-base font-black text-[#0F5238]">{stat.val}</p>
                  <p className="text-xs text-[#404943] font-medium">{stat.label}</p>
                </div>
              </div>
            ))}
          </div>

          <p className="text-xs text-[#006C48] font-medium">
            💡 "Türkiye'de yılda yaklaşık 26 milyon ton gıda israf ediliyor."
          </p>
        </div>
      </div>

    </div>
  );
};
