import React, { useState, useRef, useEffect } from 'react';
import { useApp } from '../../context/AppContext';
import { sendOtp, verifyOtp, isSupabaseConfigured } from '../../lib/supabase';
import {
  Leaf,
  Mail,
  ArrowRight,
  CheckCircle2,
  Sparkles,
  ShieldCheck,
  ChevronLeft
} from 'lucide-react';

// Supabase throttles one OTP mail per minute per address.
const RESEND_COOLDOWN_SECONDS = 60;

// Must match Authentication > Sign In / Providers > Email > "Email OTP Length" in the
// Supabase dashboard. A mismatch silently rejects every correct code.
const OTP_LENGTH = 8;
const EMPTY_OTP = Array(OTP_LENGTH).fill('');

export const AuthView = () => {
  const { showToast } = useApp();

  const [step, setStep] = useState('input'); // 'input' | 'otp'
  const [email, setEmail] = useState('');
  const [otpCodes, setOtpCodes] = useState(EMPTY_OTP);
  const [busy, setBusy] = useState(false);
  const [cooldown, setCooldown] = useState(0);

  const inputRefs = useRef([]);

  useEffect(() => {
    if (cooldown <= 0) return;
    const id = setInterval(() => setCooldown(s => Math.max(0, s - 1)), 1000);
    return () => clearInterval(id);
  }, [cooldown]);

  const issueOtp = async () => {
    if (!isSupabaseConfigured) {
      showToast('Supabase yapılandırılmamış: .env dosyasındaki VITE_SUPABASE_* değerlerini doldurun.', 'error');
      return false;
    }

    setBusy(true);
    const { error } = await sendOtp(email.trim());
    setBusy(false);

    if (error) {
      showToast(error.message || 'Kod gönderilemedi. Lütfen tekrar deneyin.', 'error');
      return false;
    }

    setOtpCodes(EMPTY_OTP);
    setCooldown(RESEND_COOLDOWN_SECONDS);
    showToast(`${email.trim()} adresine ${OTP_LENGTH} haneli doğrulama kodu gönderildi 📩`);
    setTimeout(() => inputRefs.current[0]?.focus(), 100);
    return true;
  };

  const handleSendCode = async (e) => {
    e.preventDefault();
    if (!email.trim() || busy) return;
    if (await issueOtp()) setStep('otp');
  };

  const handleOtpChange = (index, value) => {
    if (!/^\d*$/.test(value)) return;
    const next = [...otpCodes];
    next[index] = value.slice(-1);
    setOtpCodes(next);
    if (value && index < OTP_LENGTH - 1) inputRefs.current[index + 1]?.focus();
  };

  const handleKeyDown = (index, e) => {
    if (e.key === 'Backspace' && !otpCodes[index] && index > 0) {
      inputRefs.current[index - 1]?.focus();
    }
  };

  const handlePaste = (e) => {
    const digits = e.clipboardData.getData('text').replace(/\D/g, '').slice(0, OTP_LENGTH);
    if (!digits) return;
    e.preventDefault();
    const next = [...EMPTY_OTP];
    for (let i = 0; i < digits.length; i += 1) next[i] = digits[i];
    setOtpCodes(next);
    inputRefs.current[Math.min(digits.length, OTP_LENGTH - 1)]?.focus();
  };

  // The server decides whether the code is right, and the session it returns carries the
  // role. Nothing here can grant privilege, which is the whole point of the rewrite.
  const handleVerifyOtp = async (e) => {
    e.preventDefault();
    const entered = otpCodes.join('');
    if (entered.length < OTP_LENGTH) {
      showToast(`Lütfen ${OTP_LENGTH} haneli doğrulama kodunu eksiksiz girin.`, 'error');
      return;
    }

    setBusy(true);
    const { error } = await verifyOtp(email.trim(), entered);
    setBusy(false);

    if (error) {
      setOtpCodes(EMPTY_OTP);
      inputRefs.current[0]?.focus();
      showToast('Kod hatalı veya süresi dolmuş. Lütfen tekrar deneyin.', 'error');
      return;
    }

    // AppContext is subscribed to the auth state and picks the session up from here.
    showToast('Giriş başarılı! Hoş geldiniz 🌿');
  };

  return (
    <div className="min-h-screen w-full flex flex-col lg:flex-row bg-white">

      {/* Left Form Panel */}
      <div className="w-full lg:w-1/2 flex items-center justify-center p-6 sm:p-12 overflow-y-auto">
        <div className="w-full max-w-md space-y-6">

          {/* Logo */}
          <div className="flex items-center gap-3">
            <div className="w-11 h-11 rounded-2xl bg-gradient-to-tr from-[#0F5238] to-[#52B788] flex items-center justify-center text-white shadow-lg shadow-[#0F5238]/20">
              <Leaf className="w-6 h-6" />
            </div>
            <div>
              <span className="font-black text-2xl text-[#0F5238]">Gıda<span className="text-[#52B788]">Köprüsü</span></span>
              <p className="text-[11px] text-gray-500 font-medium">Sosyal Sorumluluk & Sıfır Atık</p>
            </div>
          </div>

          {step === 'input' ? (
            <form onSubmit={handleSendCode} className="space-y-4 animate-in fade-in">
              <div>
                <h2 className="text-xl font-extrabold text-[#0F5238]">Hesabınıza Giriş Yapın</h2>
                <p className="text-xs text-gray-500 mt-0.5">
                  E-posta adresinizi girin, size tek kullanımlık bir kod gönderelim.
                </p>
              </div>

              <div>
                <label className="text-xs font-bold text-gray-700 block mb-1">E-posta Adresi</label>
                <div className="relative">
                  <Mail className="w-4 h-4 text-gray-400 absolute left-3.5 top-1/2 -translate-y-1/2" />
                  <input
                    type="email"
                    required
                    autoComplete="email"
                    value={email}
                    onChange={(e) => setEmail(e.target.value)}
                    placeholder="ornek@eposta.com"
                    className="w-full pl-10 pr-4 py-2.5 rounded-2xl bg-[#F8FAFC] border border-gray-200 focus:border-[#2D6A4F] text-xs font-semibold text-gray-800 outline-none transition"
                  />
                </div>
              </div>

              <button
                type="submit"
                disabled={busy}
                className="w-full py-3.5 bg-[#0F5238] hover:bg-[#2D6A4F] disabled:opacity-60 text-white font-bold text-xs rounded-2xl shadow-xl shadow-[#0F5238]/20 transition flex items-center justify-center gap-2 mt-2"
              >
                <span>{busy ? 'Gönderiliyor...' : 'Doğrulama Kodu Gönder'}</span>
                <ArrowRight className="w-4 h-4 text-[#95D5B2]" />
              </button>

              <div className="flex items-start gap-2 p-3 rounded-2xl bg-[#F0FFF4] border border-[#A8E7C5]/60">
                <ShieldCheck className="w-4 h-4 text-[#52B788] flex-shrink-0 mt-0.5" />
                <p className="text-[10px] text-[#006C48] leading-relaxed">
                  Her yeni hesap alıcı olarak açılır. İşletme veya STK yetkisi yalnızca
                  yönetici onayıyla verilir.
                </p>
              </div>
            </form>
          ) : (
            <form onSubmit={handleVerifyOtp} className="space-y-4 animate-in fade-in">
              <div>
                <h2 className="text-xl font-extrabold text-[#0F5238]">Kodu Doğrulayın</h2>
                <p className="text-xs text-gray-500 mt-0.5">
                  <strong>{email}</strong> adresine gönderilen {OTP_LENGTH} haneli kodu girin.
                </p>
              </div>

              <div className="flex gap-1 sm:gap-1.5">
                {EMPTY_OTP.map((_, idx) => (
                  <input
                    key={idx}
                    ref={(el) => (inputRefs.current[idx] = el)}
                    type="text"
                    inputMode="numeric"
                    autoComplete={idx === 0 ? 'one-time-code' : 'off'}
                    maxLength={1}
                    value={otpCodes[idx]}
                    onChange={(e) => handleOtpChange(idx, e.target.value)}
                    onKeyDown={(e) => handleKeyDown(idx, e)}
                    onPaste={handlePaste}
                    className="flex-1 min-w-0 h-12 sm:h-14 text-center font-black text-lg sm:text-xl rounded-xl sm:rounded-2xl bg-[#F0FFF4] border-2 border-[#A8E7C5] focus:border-[#0F5238] text-[#0F5238] outline-none transition shadow-sm"
                  />
                ))}
              </div>

              <div className="flex items-center justify-between text-xs">
                <span className="text-gray-400 text-[11px]">
                  {cooldown > 0 ? `Yeni kod ${cooldown} sn sonra istenebilir` : 'Kod gelmediyse tekrar gönderin'}
                </span>
                <button
                  type="button"
                  disabled={cooldown > 0 || busy}
                  onClick={issueOtp}
                  className="font-bold text-xs text-[#0F5238] hover:underline disabled:text-gray-300 disabled:no-underline"
                >
                  Tekrar Gönder
                </button>
              </div>

              <button
                type="submit"
                disabled={busy}
                className="w-full py-3.5 bg-[#0F5238] hover:bg-[#2D6A4F] disabled:opacity-60 text-white font-bold text-xs rounded-2xl shadow-xl shadow-[#0F5238]/20 transition flex items-center justify-center gap-2"
              >
                <CheckCircle2 className="w-4 h-4 text-[#95D5B2]" />
                <span>{busy ? 'Doğrulanıyor...' : 'Giriş Yap'}</span>
              </button>

              <button
                type="button"
                onClick={() => setStep('input')}
                className="w-full text-center text-xs font-semibold text-gray-500 hover:text-gray-800 flex items-center justify-center gap-1"
              >
                <ChevronLeft className="w-4 h-4" />
                <span>E-posta Adresini Değiştir</span>
              </button>
            </form>
          )}

        </div>
      </div>

      {/* Right Presentation Side */}
      <div className="hidden lg:flex w-1/2 bg-gradient-to-br from-[#E8FFF0] via-[#CCF8DF] to-[#B8E4CC] p-12 items-center justify-center relative overflow-hidden">
        <div className="absolute top-10 right-10 w-72 h-72 rounded-full bg-[#52B788]/20 blur-3xl pointer-events-none"></div>
        <div className="relative z-10 max-w-lg space-y-6">

          <div className="inline-flex items-center gap-2 px-3.5 py-1.5 rounded-full bg-white/70 backdrop-blur-md border border-[#52B788]/40 text-xs font-bold text-[#0F5238]">
            <Sparkles className="w-4 h-4 text-[#52B788]" />
            <span>Türkiye'nin İlk Bütünleşik Gıda Kurtarma Platformu</span>
          </div>

          <h2 className="text-3xl sm:text-4xl font-black text-[#0F5238] leading-tight">
            Her gün tonlarca taze gıda çöpe gitmesin, sofralar bereketlensin.
          </h2>

          <div className="space-y-3 pt-2">
            {[
              { icon: '🌿', val: '14.850 kg', label: 'Gıda Kurtarıldı' },
              { icon: '🌍', val: '37.125 kg', label: 'CO₂ Salımı Önlendi' },
              { icon: '🍽️', val: '42.100', label: 'Porsiyon İhtiyaç Sahibine Ulaştırıldı' },
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
