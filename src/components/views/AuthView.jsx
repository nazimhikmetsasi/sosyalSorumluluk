import React, { useState, useRef, useEffect } from 'react';
import { useApp } from '../../context/AppContext';
import { randomDigits } from '../../utils/security';
import {
  Leaf,
  Mail,
  ArrowRight,
  CheckCircle2,
  User,
  Sparkles,
  Building2,
  HeartHandshake,
  ShieldCheck,
  Lock,
  Store,
  ChevronLeft
} from 'lucide-react';

// Vite inlines these at build time, so they are deployment configuration, not secrets:
// anyone holding the bundle can read them. The portal stays hidden until both are set,
// and this gate is not an authentication boundary until the server verifies the session.
const ADMIN_EMAIL = (import.meta.env.VITE_ADMIN_EMAIL || '').trim().toLowerCase();
const ADMIN_PASSCODE = import.meta.env.VITE_ADMIN_PASSCODE || '';
const ADMIN_PORTAL_ENABLED = Boolean(ADMIN_EMAIL && ADMIN_PASSCODE);

const OTP_TTL_MS = 3 * 60 * 1000;
const OTP_MAX_ATTEMPTS = 5;

const ORG_REJECTION_MESSAGE = {
  invalid: 'Lütfen geçerli bir kurum adı girin.',
  registered: 'Başvurunuz alındı. Yönetici onayından sonra giriş yapabilirsiniz.',
  pending: 'Bu kurum hesabı henüz yönetici onayı bekliyor.',
  suspended: 'Bu kurum hesabı askıya alınmış. Lütfen yönetici ile iletişime geçin.',
};

export const AuthView = () => {
  const { login, showToast, resolveOrganisation } = useApp();
  
  // Auth Mode: 'standard' | 'admin'
  const [authMode, setAuthMode] = useState('standard');
  
  // Selected role for standard login: 'buyer' | 'business' | 'ngo'
  const [selectedRole, setSelectedRole] = useState('buyer');
  
  // Steps: 'input' | 'otp'
  const [step, setStep] = useState('input');
  
  // Form fields
  const [fullName, setFullName] = useState('');
  const [entityName, setEntityName] = useState(''); // For business / NGO name
  const [identifier, setIdentifier] = useState('');
  const [otpCodes, setOtpCodes] = useState(['', '', '', '', '', '']);
  const [otpChallenge, setOtpChallenge] = useState(null); // { code, expiresAt, attempts }
  const [secondsLeft, setSecondsLeft] = useState(0);

  // Admin form fields
  const [adminEmail, setAdminEmail] = useState('');
  const [adminPassword, setAdminPassword] = useState('');
  
  const inputRefs = useRef([]);

  useEffect(() => {
    if (!otpChallenge) return;
    const tick = () => setSecondsLeft(Math.max(0, Math.ceil((otpChallenge.expiresAt - Date.now()) / 1000)));
    tick();
    const id = setInterval(tick, 1000);
    return () => clearInterval(id);
  }, [otpChallenge]);

  // ponytail: no mail or SMS backend exists, so the demo surfaces the code in a toast.
  // Once delivery is server-side the code must never reach the client.
  const issueOtp = () => {
    const code = randomDigits(6);
    setOtpChallenge({ code, expiresAt: Date.now() + OTP_TTL_MS, attempts: 0 });
    setOtpCodes(['', '', '', '', '', '']);
    showToast(`${identifier} için doğrulama kodu (demo): ${code}`);
    setTimeout(() => {
      inputRefs.current[0]?.focus();
    }, 100);
  };

  const handleSendCode = (e) => {
    e.preventDefault();
    if (!identifier.trim()) return;
    setStep('otp');
    issueOtp();
  };

  const handleOtpChange = (index, value) => {
    if (!/^\d*$/.test(value)) return;
    const newCodes = [...otpCodes];
    newCodes[index] = value.slice(-1);
    setOtpCodes(newCodes);

    if (value && index < 5) {
      inputRefs.current[index + 1]?.focus();
    }
  };

  const handleKeyDown = (index, e) => {
    if (e.key === 'Backspace' && !otpCodes[index] && index > 0) {
      inputRefs.current[index - 1]?.focus();
    }
  };

  const handleVerifyOtp = (e) => {
    e.preventDefault();
    const entered = otpCodes.join('');
    if (entered.length < 6) {
      showToast('Lütfen 6 haneli doğrulama kodunu eksiksiz girin.', 'error');
      return;
    }

    if (!otpChallenge) {
      showToast('Önce doğrulama kodu isteyin.', 'error');
      setStep('input');
      return;
    }

    if (Date.now() > otpChallenge.expiresAt) {
      showToast('Doğrulama kodunun süresi doldu. Yeni kod isteyin.', 'error');
      setOtpChallenge(null);
      setStep('input');
      return;
    }

    if (entered !== otpChallenge.code) {
      const attempts = otpChallenge.attempts + 1;
      setOtpCodes(['', '', '', '', '', '']);
      if (attempts >= OTP_MAX_ATTEMPTS) {
        showToast('Çok fazla hatalı deneme. Lütfen yeni kod isteyin.', 'error');
        setOtpChallenge(null);
        setStep('input');
        return;
      }
      setOtpChallenge({ ...otpChallenge, attempts });
      showToast(`Hatalı kod. Kalan deneme hakkı: ${OTP_MAX_ATTEMPTS - attempts}`, 'error');
      inputRefs.current[0]?.focus();
      return;
    }

    let organisation = null;
    if (selectedRole === 'business' || selectedRole === 'ngo') {
      const outcome = resolveOrganisation(selectedRole, entityName);
      if (!outcome.ok) {
        setOtpChallenge(null);
        setStep('input');
        showToast(ORG_REJECTION_MESSAGE[outcome.reason], 'error');
        return;
      }
      organisation = outcome.organisation;
    }

    setOtpChallenge(null);

    let displayName = fullName.trim();
    if (organisation) {
      displayName = organisation.name;
    } else {
      if (!displayName && identifier.includes('@')) {
        const prefix = identifier.split('@')[0].replace(/[._-]/g, ' ');
        displayName = prefix
          .split(' ')
          .map(w => w.charAt(0).toUpperCase() + w.slice(1))
          .join(' ');
      }
      if (!displayName) displayName = 'Gıda Kurtarıcısı';
    }

    login({
      name: displayName,
      email: identifier.includes('@') ? identifier : `${displayName.toLowerCase().replace(/[^a-z0-9]/g, '')}@gmail.com`,
      phone: !identifier.includes('@') ? identifier : '0532 555 0199',
      avatar: organisation?.avatar || `https://api.dicebear.com/7.x/bottts/svg?seed=${encodeURIComponent(displayName)}`,
      organisationId: organisation?.id || null,
      role: selectedRole,
      level: selectedRole === 'buyer' ? 4 : 5,
      savedKg: selectedRole === 'buyer' ? 18.5 : 420.0,
      co2Saved: selectedRole === 'buyer' ? 46.25 : 1050.0,
      mealsDonated: selectedRole === 'buyer' ? 12 : 380,
      points: selectedRole === 'buyer' ? 420 : 2500,
    });

    showToast(`Giriş başarılı! Hoş geldiniz: ${displayName} 🌿`);
  };

  // Dedicated Admin Login Handler
  const handleAdminLogin = (e) => {
    e.preventDefault();
    if (!ADMIN_PORTAL_ENABLED) {
      showToast('Yönetici portalı bu ortamda yapılandırılmamış.', 'error');
      return;
    }
    if (!adminEmail.trim() || !adminPassword.trim()) {
      showToast('Lütfen yönetici e-posta ve şifrenizi girin.', 'error');
      return;
    }

    if (adminEmail.trim().toLowerCase() !== ADMIN_EMAIL || adminPassword !== ADMIN_PASSCODE) {
      showToast('Hatalı Yönetici Bilgileri! Yetkiniz bulunmuyor.', 'error');
      return;
    }

    login({
      name: 'Sistem Yöneticisi',
      email: adminEmail,
      phone: '0532 000 0000',
      avatar: 'https://images.unsplash.com/photo-1534528741775-53994a69daeb?w=150&auto=format&fit=crop&q=80',
      role: 'admin',
      level: 10,
      savedKg: 14850,
      co2Saved: 37125,
      mealsDonated: 42100,
      points: 99999,
    });

    showToast('🛡️ Yönetici Yetkisi ile Giriş Yapıldı.');
  };

  return (
    <div className="min-h-screen w-full flex flex-col lg:flex-row bg-white">
      
      {/* Left Form Panel */}
      <div className="w-full lg:w-1/2 flex items-center justify-center p-6 sm:p-12 overflow-y-auto">
        <div className="w-full max-w-md space-y-6">
          
          {/* Logo */}
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-3">
              <div className="w-11 h-11 rounded-2xl bg-gradient-to-tr from-[#0F5238] to-[#52B788] flex items-center justify-center text-white shadow-lg shadow-[#0F5238]/20">
                <Leaf className="w-6 h-6" />
              </div>
              <div>
                <span className="font-black text-2xl text-[#0F5238]">Gıda<span className="text-[#52B788]">Köprüsü</span></span>
                <p className="text-[11px] text-gray-500 font-medium">Sosyal Sorumluluk & Sıfır Atık</p>
              </div>
            </div>

            {/* Admin Portal Switcher Toggle */}
            {ADMIN_PORTAL_ENABLED && <button
              onClick={() => {
                setAuthMode(authMode === 'standard' ? 'admin' : 'standard');
                setStep('input');
              }}
              className={`px-2.5 py-1.5 rounded-xl text-[10px] font-bold border transition flex items-center gap-1 ${
                authMode === 'admin'
                  ? 'bg-red-50 text-red-700 border-red-200'
                  : 'bg-gray-50 text-gray-600 border-gray-200 hover:bg-gray-100'
              }`}
            >
              <ShieldCheck className="w-3.5 h-3.5" />
              <span>{authMode === 'admin' ? 'Normal Giriş' : 'Admin Girişi'}</span>
            </button>}
          </div>

          {/* ADMIN LOGIN PORTAL */}
          {authMode === 'admin' ? (
            <form onSubmit={handleAdminLogin} className="space-y-4 animate-in fade-in">
              <div className="p-3.5 bg-red-50/80 rounded-2xl border border-red-200 text-red-900 space-y-1">
                <div className="flex items-center gap-1.5 font-bold text-xs">
                  <Lock className="w-4 h-4 text-red-600" />
                  <span>Güvenli Yönetici (Admin) Portalı</span>
                </div>
                <p className="text-[10px] text-red-700 leading-tight">
                  Bu alana yalnızca sistem yöneticileri giriş yapabilir. Yetkisiz girişler loglanmaktadır.
                </p>
              </div>

              <div>
                <label className="text-xs font-bold text-gray-700 block mb-1">
                  Yönetici E-posta Adresi
                </label>
                <div className="relative">
                  <Mail className="w-4 h-4 text-gray-400 absolute left-3.5 top-1/2 -translate-y-1/2" />
                  <input
                    type="email"
                    required
                    value={adminEmail}
                    onChange={(e) => setAdminEmail(e.target.value)}
                    placeholder="Yetkili yönetici e-posta adresi"
                    className="w-full pl-10 pr-4 py-3 rounded-2xl bg-[#F8FAFC] border border-gray-200 focus:border-red-500 focus:ring-2 focus:ring-red-200 text-xs font-semibold text-gray-800 outline-none transition"
                  />
                </div>
              </div>

              <div>
                <label className="text-xs font-bold text-gray-700 block mb-1">
                  Yönetici Güvenlik Şifresi
                </label>
                <div className="relative">
                  <Lock className="w-4 h-4 text-gray-400 absolute left-3.5 top-1/2 -translate-y-1/2" />
                  <input
                    type="password"
                    required
                    value={adminPassword}
                    onChange={(e) => setAdminPassword(e.target.value)}
                    placeholder="Yönetici şifresi"
                    className="w-full pl-10 pr-4 py-3 rounded-2xl bg-[#F8FAFC] border border-gray-200 focus:border-red-500 focus:ring-2 focus:ring-red-200 text-xs font-semibold text-gray-800 outline-none transition"
                  />
                </div>
              </div>

              <button
                type="submit"
                className="w-full py-3.5 bg-red-600 hover:bg-red-700 text-white font-bold text-xs rounded-2xl shadow-xl shadow-red-600/20 transition flex items-center justify-center gap-2"
              >
                <ShieldCheck className="w-4 h-4" />
                <span>Yönetici Olarak Giriş Yap</span>
              </button>

              <button
                type="button"
                onClick={() => setAuthMode('standard')}
                className="w-full text-center text-xs font-semibold text-gray-500 hover:text-gray-800 flex items-center justify-center gap-1 pt-1"
              >
                <ChevronLeft className="w-4 h-4" />
                <span>Kullanıcı Girişine Geri Dön</span>
              </button>
            </form>
          ) : (
            /* STANDARD LOGIN & REGISTRATION (User / Business / NGO) */
            <div>
              {step === 'input' ? (
                <form onSubmit={handleSendCode} className="space-y-4 animate-in fade-in">
                  <div>
                    <h2 className="text-xl font-extrabold text-[#0F5238]">Hesabınıza Giriş Yapın</h2>
                    <p className="text-xs text-gray-500 mt-0.5">
                      Giriş yapmak istediğiniz hesap türünü ve bilgilerinizi belirleyin.
                    </p>
                  </div>

                  {/* Role Selection Grid */}
                  <div>
                    <label className="text-xs font-bold text-gray-700 block mb-2">
                      Giriş Yetkisi / Hesap Türü
                    </label>
                    <div className="grid grid-cols-3 gap-2">
                      
                      {/* Buyer */}
                      <button
                        type="button"
                        onClick={() => setSelectedRole('buyer')}
                        className={`p-2.5 rounded-2xl border-2 text-center transition flex flex-col items-center gap-1 ${
                          selectedRole === 'buyer'
                            ? 'border-[#0F5238] bg-[#E8FFF0] text-[#0F5238] font-bold shadow-sm'
                            : 'border-gray-200 text-gray-600 hover:border-[#52B788]'
                        }`}
                      >
                        <span className="text-xl">🌱</span>
                        <span className="text-[11px] leading-tight">Alıcı & Gönüllü</span>
                      </button>

                      {/* Business */}
                      <button
                        type="button"
                        onClick={() => setSelectedRole('business')}
                        className={`p-2.5 rounded-2xl border-2 text-center transition flex flex-col items-center gap-1 ${
                          selectedRole === 'business'
                            ? 'border-[#0F5238] bg-[#E8FFF0] text-[#0F5238] font-bold shadow-sm'
                            : 'border-gray-200 text-gray-600 hover:border-[#52B788]'
                        }`}
                      >
                        <span className="text-xl">🏪</span>
                        <span className="text-[11px] leading-tight">İşletme / Fırın</span>
                      </button>

                      {/* NGO */}
                      <button
                        type="button"
                        onClick={() => setSelectedRole('ngo')}
                        className={`p-2.5 rounded-2xl border-2 text-center transition flex flex-col items-center gap-1 ${
                          selectedRole === 'ngo'
                            ? 'border-[#0F5238] bg-[#E8FFF0] text-[#0F5238] font-bold shadow-sm'
                            : 'border-gray-200 text-gray-600 hover:border-[#52B788]'
                        }`}
                      >
                        <span className="text-xl">🤝</span>
                        <span className="text-[11px] leading-tight">STK & Aşevi</span>
                      </button>

                    </div>
                  </div>

                  {/* Conditional Entity / Name Inputs */}
                  {selectedRole === 'business' && (
                    <div className="animate-in fade-in">
                      <label className="text-xs font-bold text-gray-700 block mb-1">
                        İşletme / Dükkan Adı *
                      </label>
                      <div className="relative">
                        <Store className="w-4 h-4 text-gray-400 absolute left-3.5 top-1/2 -translate-y-1/2" />
                        <input
                          type="text"
                          required
                          value={entityName}
                          onChange={(e) => setEntityName(e.target.value)}
                          placeholder="Örn: Moda Fırını, Kadıköy Manavı..."
                          className="w-full pl-10 pr-4 py-2.5 rounded-2xl bg-[#F8FAFC] border border-gray-200 focus:border-[#2D6A4F] text-xs font-semibold text-gray-800 outline-none transition"
                        />
                      </div>
                    </div>
                  )}

                  {selectedRole === 'ngo' && (
                    <div className="animate-in fade-in">
                      <label className="text-xs font-bold text-gray-700 block mb-1">
                        STK / Aşevi Adı *
                      </label>
                      <div className="relative">
                        <HeartHandshake className="w-4 h-4 text-gray-400 absolute left-3.5 top-1/2 -translate-y-1/2" />
                        <input
                          type="text"
                          required
                          value={entityName}
                          onChange={(e) => setEntityName(e.target.value)}
                          placeholder="Örn: TİDER Aşevi, Kızılay Dayanışma..."
                          className="w-full pl-10 pr-4 py-2.5 rounded-2xl bg-[#F8FAFC] border border-gray-200 focus:border-[#2D6A4F] text-xs font-semibold text-gray-800 outline-none transition"
                        />
                      </div>
                    </div>
                  )}

                  <div>
                    <label className="text-xs font-bold text-gray-700 block mb-1">
                      {selectedRole === 'buyer' ? 'Adınız ve Soyadınız' : 'Yetkili Kişi Adı'}
                    </label>
                    <div className="relative">
                      <User className="w-4 h-4 text-gray-400 absolute left-3.5 top-1/2 -translate-y-1/2" />
                      <input
                        type="text"
                        value={fullName}
                        onChange={(e) => setFullName(e.target.value)}
                        placeholder="Örn: Nazım Hikmet Şaşı"
                        className="w-full pl-10 pr-4 py-2.5 rounded-2xl bg-[#F8FAFC] border border-gray-200 focus:border-[#2D6A4F] text-xs font-semibold text-gray-800 outline-none transition"
                      />
                    </div>
                  </div>

                  <div>
                    <label className="text-xs font-bold text-gray-700 block mb-1">
                      E-posta Adresi veya Telefon *
                    </label>
                    <div className="relative">
                      <Mail className="w-4 h-4 text-gray-400 absolute left-3.5 top-1/2 -translate-y-1/2" />
                      <input
                        type="text"
                        required
                        value={identifier}
                        onChange={(e) => setIdentifier(e.target.value)}
                        placeholder="ornek@eposta.com veya 0532..."
                        className="w-full pl-10 pr-4 py-2.5 rounded-2xl bg-[#F8FAFC] border border-gray-200 focus:border-[#2D6A4F] text-xs font-semibold text-gray-800 outline-none transition"
                      />
                    </div>
                  </div>

                  <button
                    type="submit"
                    className="w-full py-3.5 bg-[#0F5238] hover:bg-[#2D6A4F] text-white font-bold text-xs rounded-2xl shadow-xl shadow-[#0F5238]/20 transition flex items-center justify-center gap-2 mt-2"
                  >
                    <span>Doğrulama Kodu Gönder</span>
                    <ArrowRight className="w-4 h-4 text-[#95D5B2]" />
                  </button>

                  <p className="text-[10px] text-gray-400 text-center pt-1">
                    GıdaKöprüsü güvenli tek kullanımlık şifreleme (OTP) ile korunmaktadır.
                  </p>
                </form>
              ) : (
                /* OTP VERIFY STEP */
                <form onSubmit={handleVerifyOtp} className="space-y-4 animate-in fade-in">
                  <div>
                    <h2 className="text-xl font-extrabold text-[#0F5238]">Kodu Doğrulayın</h2>
                    <p className="text-xs text-gray-500 mt-0.5">
                      <strong>{identifier}</strong> adresine gönderilen 6 haneli doğrulama kodunu girin.
                    </p>
                  </div>

                  <div className="flex justify-between gap-1.5 sm:gap-2">
                    {[0, 1, 2, 3, 4, 5].map((idx) => (
                      <input
                        key={idx}
                        ref={(el) => (inputRefs.current[idx] = el)}
                        type="text"
                        inputMode="numeric"
                        maxLength={1}
                        value={otpCodes[idx]}
                        onChange={(e) => handleOtpChange(idx, e.target.value)}
                        onKeyDown={(e) => handleKeyDown(idx, e)}
                        className="w-11 h-13 sm:w-12 sm:h-14 text-center font-black text-xl rounded-2xl bg-[#F0FFF4] border-2 border-[#A8E7C5] focus:border-[#0F5238] text-[#0F5238] outline-none transition shadow-sm"
                      />
                    ))}
                  </div>

                  <div className="flex items-center justify-between text-xs">
                    <span className="text-gray-400 text-[11px]">
                      Kalan Süre:{' '}
                      <strong className={secondsLeft > 0 ? 'text-[#52B788]' : 'text-red-600'}>
                        {String(Math.floor(secondsLeft / 60)).padStart(2, '0')}:{String(secondsLeft % 60).padStart(2, '0')}
                      </strong>
                    </span>
                    <button
                      type="button"
                      onClick={issueOtp}
                      className="font-bold text-xs text-[#0F5238] hover:underline"
                    >
                      Tekrar Gönder
                    </button>
                  </div>

                  <button
                    type="submit"
                    className="w-full py-3.5 bg-[#0F5238] hover:bg-[#2D6A4F] text-white font-bold text-xs rounded-2xl shadow-xl shadow-[#0F5238]/20 transition flex items-center justify-center gap-2"
                  >
                    <CheckCircle2 className="w-4 h-4 text-[#95D5B2]" />
                    <span>
                      {selectedRole === 'business' ? 'İşletme Olarak Giriş Yap' : selectedRole === 'ngo' ? 'STK Paneline Giriş Yap' : 'Alıcı Olarak Giriş Yap'}
                    </span>
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
          )}

        </div>
      </div>

      {/* Right Presentation Side (Zero Waste Impact Presentation) */}
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
