import { useState, useEffect } from 'react';
import { supabase } from '../supabase';
import { toast } from 'sonner';
import { Icon } from '@iconify/react';

interface AuthModalProps {
  isOpen: boolean;
  initialTab: 'login' | 'register';
  onClose: () => void;
}

export function AuthModal({ isOpen, initialTab, onClose }: AuthModalProps) {
  const [tab, setTab] = useState<'login' | 'register'>(initialTab);
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [passwordConfirm, setPasswordConfirm] = useState('');
  const [fullName, setFullName] = useState('');
  const [loading, setLoading] = useState(false);

  // Field-level error messages
  const [fieldErrors, setFieldErrors] = useState<{
    fullName?: string;
    email?: string;
    password?: string;
    passwordConfirm?: string;
  }>({});

  // Verification sent screen state
  const [verificationSent, setVerificationSent] = useState(false);

  useEffect(() => {
    setTab(initialTab);
    setFieldErrors({});
    setVerificationSent(false);
  }, [initialTab, isOpen]);

  if (!isOpen) return null;

  // Validation handler
  const validateForm = (): boolean => {
    const errors: typeof fieldErrors = {};

    // 1. Email format check
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    if (!email.trim()) {
      errors.email = "E-posta adresi zorunludur.";
    } else if (email.trim().toLowerCase() !== 'admin' && !emailRegex.test(email.trim())) {
      errors.email = "Geçerli bir e-posta adresi giriniz (örneğin: ad.soyad@email.com).";
    }

    // 2. Password validation
    if (!password) {
      errors.password = "Şifre alanı zorunludur.";
    } else {
      const hasLetter = /[A-Za-z]/.test(password);
      const hasDigit = /\d/.test(password);
      if (password.length < 6 || !hasLetter || !hasDigit) {
        errors.password = "Şifreniz en az 6 karakterden oluşmalı, en az 1 harf ve 1 rakam içermelidir.";
      }
    }

    if (tab === 'register') {
      // 3. Full name check
      if (!fullName.trim() || fullName.trim().length < 2) {
        errors.fullName = "Lütfen adınızı ve soyadınızı giriniz.";
      }

      // 4. Password confirm check
      if (!passwordConfirm) {
        errors.passwordConfirm = "Şifre tekrarı zorunludur.";
      } else if (password !== passwordConfirm) {
        errors.passwordConfirm = "Şifreler birbiriyle eşleşmiyor. Lütfen aynı şifreyi tekrar giriniz.";
      }
    }

    setFieldErrors(errors);
    return Object.keys(errors).length === 0;
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    let finalEmail = email.trim();
    if (finalEmail.toLowerCase() === 'admin') {
      finalEmail = 'admin@beautrics.com';
    }

    if (!validateForm()) {
      toast.error('Lütfen formdaki hataları düzelterek tekrar deneyin.');
      return;
    }

    setLoading(true);

    try {
      if (tab === 'login') {
        // --- GİRİŞ YAPMA ---
        const { data, error } = await supabase.auth.signInWithPassword({
          email: finalEmail,
          password,
        });

        if (error) throw error;

        const isUserAdmin = data.user?.email === 'admin@beautrics.com' || data.user?.user_metadata?.role === 'admin';
        if (isUserAdmin) {
          toast.success('Yönetici olarak giriş yapıldı! Admin Paneline yönlendiriliyorsunuz... 🚀');
          window.location.hash = '#admin';
        } else {
          toast.success('Başarıyla giriş yaptınız! ✓');
        }
        onClose();
      } else {
        // --- KAYIT OLMA ---
        const { data, error } = await supabase.auth.signUp({
          email: finalEmail,
          password,
          options: {
            data: { full_name: fullName.trim() }
          }
        });

        if (error) throw error;

        // E-posta doğrulama akışının kontrolü
        if (data.user && !data.session) {
          // E-posta aktivasyon bağlantısı gönderildi
          setVerificationSent(true);
          toast.info('Hesap oluşturuldu! Lütfen e-posta adresinizi doğrulayın.');
        } else {
          // Otomatik onaylı giriş yapıldı
          toast.success('Kayıt başarılı! Aramıza hoş geldiniz. ♥');
          onClose();
        }
      }
    } catch (error: any) {
      console.error("Auth error:", error);
      let errorMsg = error.message || 'Bir hata oluştu. Bilgilerinizi kontrol edin.';
      
      const lower = errorMsg.lowerCase ? errorMsg.lowerCase() : String(errorMsg).toLowerCase();
      if (lower.includes('already registered') || lower.includes('already exists')) {
        errorMsg = "Bu e-posta adresi ile zaten kayıtlı bir hesap var. Lütfen Giriş Yap sekmesini kullanın.";
        setFieldErrors(prev => ({ ...prev, email: "Bu e-posta adresi zaten kullanılıyor." }));
      } else if (lower.includes('invalid login credentials')) {
        errorMsg = "E-posta adresiniz veya şifreniz hatalı. Lütfen kontrol edin.";
      } else if (lower.includes('email not confirmed')) {
        errorMsg = "E-posta adresiniz henüz doğrulanmamış. Lütfen gelen kutunuzdaki onay bağlantısını tıklayın.";
      }

      toast.error(errorMsg);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div 
      className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 backdrop-blur-sm p-4 animate-fade-in font-sans"
      onClick={onClose}
    >
      <div 
        className="bg-white rounded-2xl shadow-2xl w-full max-w-md overflow-hidden relative border border-gray-100"
        onClick={(e) => e.stopPropagation()}
      >
        {/* Kapatma Butonu */}
        <button
          onClick={onClose}
          className="absolute top-4 right-4 text-gray-400 hover:text-gray-600 w-8 h-8 rounded-full flex items-center justify-center hover:bg-gray-100 transition-colors cursor-pointer z-10"
        >
          <Icon icon="lucide:x" className="w-5 h-5" />
        </button>

        {/* E-POSTA DOĞRULAMA BİLGİLENDİRME EKRANI */}
        {verificationSent ? (
          <div className="p-8 text-center flex flex-col items-center">
            <div className="w-16 h-16 rounded-full bg-[#EBF5F0] text-[#2D6A4F] flex items-center justify-center mb-4 border border-[#52B788]/30 shadow-sm">
              <Icon icon="lucide:mail-check" className="w-8 h-8" />
            </div>

            <h3 className="text-xl font-bold text-[#1B4332] mb-2">
              E-posta Adresinizi Doğrulayın
            </h3>

            <p className="text-xs text-gray-600 leading-relaxed mb-6">
              Hesabınız başarıyla oluşturuldu! <span className="font-semibold text-[#1B4332]">{email}</span> adresinize bir doğrulama bağlantısı gönderdik. Hesabınızı aktif hale getirmek için lütfen e-postanızdaki bağlantıya tıklayın.
            </p>

            <div className="w-full p-3 bg-[#F5F5F0] rounded-xl text-[11.5px] text-gray-500 mb-6 text-left border border-gray-200">
              <div className="font-semibold text-gray-700 mb-1 flex items-center gap-1.5">
                <Icon icon="lucide:info" className="w-4 h-4 text-[#2D6A4F]" /> E-posta gelmedi mi?
              </div>
              Spam veya Önemsiz (Junk) klasörünüzü kontrol etmeyi unutmayın.
            </div>

            <button
              onClick={() => {
                setVerificationSent(false);
                setTab('login');
              }}
              className="w-full py-3 px-4 bg-[#1B4332] hover:bg-[#153427] text-white font-semibold rounded-xl text-sm shadow-md transition-all cursor-pointer"
            >
              Anlaşıldı, Giriş Yap'a Dön
            </button>
          </div>
        ) : (
          <>
            {/* Başlık Bölümü */}
            <div className="p-6 pb-2">
              <div className="text-center mb-5">
                <h2 className="text-2xl font-bold text-[#1B4332]">
                  {tab === 'login' ? 'Tekrar Hoş Geldiniz' : 'Aramıza Katılın'}
                </h2>
                <p className="text-xs text-gray-500 mt-1">
                  {tab === 'login' 
                    ? 'Kişiselleştirilmiş güzellik rutininize erişin.' 
                    : 'Akıllı güzellik alışverişine başlamak için hesap oluşturun.'}
                </p>
              </div>

              {/* Sekme Değiştirici (Giriş Yap / Kayıt Ol) */}
              <div className="flex rounded-xl bg-gray-100 p-1 mb-5">
                <button
                  type="button"
                  onClick={() => {
                    setTab('login');
                    setFieldErrors({});
                  }}
                  className={`flex-1 py-2 text-sm font-semibold rounded-lg transition-all cursor-pointer ${
                    tab === 'login' 
                      ? 'bg-white text-[#1B4332] shadow-sm' 
                      : 'text-gray-500 hover:text-gray-800'
                  }`}
                >
                  Giriş Yap
                </button>
                <button
                  type="button"
                  onClick={() => {
                    setTab('register');
                    setFieldErrors({});
                  }}
                  className={`flex-1 py-2 text-sm font-semibold rounded-lg transition-all cursor-pointer ${
                    tab === 'register' 
                      ? 'bg-white text-[#1B4332] shadow-sm' 
                      : 'text-gray-500 hover:text-gray-800'
                  }`}
                >
                  Kayıt Ol
                </button>
              </div>
            </div>

            {/* Form Input Alanları */}
            <form onSubmit={handleSubmit} className="p-6 pt-0 space-y-3.5" noValidate>
              {tab === 'register' && (
                <div>
                  <label className="block text-xs font-semibold text-gray-700 mb-1">
                    Ad Soyad <span className="text-red-500">*</span>
                  </label>
                  <div className="relative">
                    <Icon icon="lucide:user" className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400 w-4 h-4" />
                    <input
                      type="text"
                      placeholder="Ayşe Kaya"
                      value={fullName}
                      onChange={(e) => {
                        setFullName(e.target.value);
                        if (fieldErrors.fullName) setFieldErrors(prev => ({ ...prev, fullName: undefined }));
                      }}
                      className={`w-full pl-9 pr-4 py-2.5 text-sm rounded-xl border outline-none transition-all ${
                        fieldErrors.fullName ? 'border-red-400 bg-red-50/30' : 'border-gray-200 focus:border-[#1B4332] focus:ring-2 focus:ring-[#1B4332]/20'
                      }`}
                    />
                  </div>
                  {fieldErrors.fullName && (
                    <p className="text-[11px] text-red-500 mt-1 flex items-center gap-1 font-medium">
                      <Icon icon="lucide:alert-circle" className="w-3.5 h-3.5 shrink-0" />
                      {fieldErrors.fullName}
                    </p>
                  )}
                </div>
              )}

              <div>
                <label className="block text-xs font-semibold text-gray-700 mb-1">
                  E-posta Adresi <span className="text-red-500">*</span>
                </label>
                <div className="relative">
                  <Icon icon="lucide:mail" className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400 w-4 h-4" />
                  <input
                    type="email"
                    placeholder="ornek@email.com"
                    value={email}
                    onChange={(e) => {
                      setEmail(e.target.value);
                      if (fieldErrors.email) setFieldErrors(prev => ({ ...prev, email: undefined }));
                    }}
                    className={`w-full pl-9 pr-4 py-2.5 text-sm rounded-xl border outline-none transition-all ${
                      fieldErrors.email ? 'border-red-400 bg-red-50/30' : 'border-gray-200 focus:border-[#1B4332] focus:ring-2 focus:ring-[#1B4332]/20'
                    }`}
                  />
                </div>
                {fieldErrors.email && (
                  <p className="text-[11px] text-red-500 mt-1 flex items-center gap-1 font-medium">
                    <Icon icon="lucide:alert-circle" className="w-3.5 h-3.5 shrink-0" />
                    {fieldErrors.email}
                  </p>
                )}
              </div>

              <div>
                <label className="block text-xs font-semibold text-gray-700 mb-1">
                  Şifre <span className="text-red-500">*</span>
                </label>
                <div className="relative">
                  <Icon icon="lucide:lock" className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400 w-4 h-4" />
                  <input
                    type="password"
                    placeholder="••••••••"
                    value={password}
                    onChange={(e) => {
                      setPassword(e.target.value);
                      if (fieldErrors.password) setFieldErrors(prev => ({ ...prev, password: undefined }));
                    }}
                    className={`w-full pl-9 pr-4 py-2.5 text-sm rounded-xl border outline-none transition-all ${
                      fieldErrors.password ? 'border-red-400 bg-red-50/30' : 'border-gray-200 focus:border-[#1B4332] focus:ring-2 focus:ring-[#1B4332]/20'
                    }`}
                  />
                </div>
                {tab === 'register' && (
                  <p className="text-[10.5px] text-gray-400 mt-1">
                    En az 6 karakter, 1 harf ve 1 rakam içermelidir.
                  </p>
                )}
                {fieldErrors.password && (
                  <p className="text-[11px] text-red-500 mt-1 flex items-center gap-1 font-medium">
                    <Icon icon="lucide:alert-circle" className="w-3.5 h-3.5 shrink-0 text-red-500" />
                    {fieldErrors.password}
                  </p>
                )}
              </div>

              {tab === 'register' && (
                <div>
                  <label className="block text-xs font-semibold text-gray-700 mb-1">
                    Şifre Tekrar <span className="text-red-500">*</span>
                  </label>
                  <div className="relative">
                    <Icon icon="lucide:check-circle2" className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400 w-4 h-4" />
                    <input
                      type="password"
                      placeholder="••••••••"
                      value={passwordConfirm}
                      onChange={(e) => {
                        setPasswordConfirm(e.target.value);
                        if (fieldErrors.passwordConfirm) setFieldErrors(prev => ({ ...prev, passwordConfirm: undefined }));
                      }}
                      className={`w-full pl-9 pr-4 py-2.5 text-sm rounded-xl border outline-none transition-all ${
                        fieldErrors.passwordConfirm ? 'border-red-400 bg-red-50/30' : 'border-gray-200 focus:border-[#1B4332] focus:ring-2 focus:ring-[#1B4332]/20'
                      }`}
                    />
                  </div>
                  {fieldErrors.passwordConfirm && (
                    <p className="text-[11px] text-red-500 mt-1 flex items-center gap-1 font-medium">
                      <Icon icon="lucide:alert-circle" className="w-3.5 h-3.5 shrink-0" />
                      {fieldErrors.passwordConfirm}
                    </p>
                  )}
                </div>
              )}

              <button
                type="submit"
                disabled={loading}
                className="w-full py-3 px-4 bg-[#1B4332] hover:bg-[#153427] text-white font-semibold rounded-xl text-sm shadow-lg shadow-[#1B4332]/20 transition-all flex items-center justify-center gap-2 mt-3 disabled:opacity-50 cursor-pointer"
              >
                {loading ? (
                  <>
                    <Icon icon="lucide:loader-2" className="w-5 h-5 animate-spin" />
                    Lütfen Bekleyin...
                  </>
                ) : tab === 'login' ? (
                  'Giriş Yap'
                ) : (
                  'Hesap Oluştur & Kaydol'
                )}
              </button>
            </form>
          </>
        )}
      </div>
    </div>
  );
}