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
  const [fullName, setFullName] = useState('');
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    setTab(initialTab);
  }, [initialTab]);

  if (!isOpen) return null;

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);

    try {
      if (tab === 'login') {
        // --- GİRİŞ YAPMA FONKSİYONU ---
        const { error } = await supabase.auth.signInWithPassword({
          email,
          password,
        });
        if (error) throw error;
        toast.success('Başarıyla giriş yaptınız! ✓');
        onClose();
      } else {
        // --- KAYIT OLMA FONKSİYONU ---
        const { error } = await supabase.auth.signUp({
          email,
          password,
          options: {
            data: { full_name: fullName } // Kullanıcı adını metadata olarak kaydeder
          }
        });
        if (error) throw error;
        toast.success('Kayıt başarılı! Aramıza hoş geldiniz. ♥');
        onClose();
      }
    } catch (error: any) {
      toast.error(error.message || 'Bir hata oluştu. Bilgilerinizi kontrol edin.');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div 
      className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 backdrop-blur-sm p-4 animate-fade-in"
      onClick={onClose}
    >
      <div 
        className="bg-white rounded-2xl shadow-2xl w-full max-w-md overflow-hidden relative border border-gray-100"
        onClick={(e) => e.stopPropagation()}
      >
        {/* Kapatma Butonu */}
        <button
          onClick={onClose}
          className="absolute top-4 right-4 text-gray-400 hover:text-gray-600 w-8 h-8 rounded-full flex items-center justify-center hover:bg-gray-100 transition-colors"
        >
          <Icon icon="lucide:x" className="w-5 h-5" />
        </button>

        {/* Başlık Bölümü */}
        <div className="p-6 pb-2">
          <div className="text-center mb-6">
            <h2 className="text-2xl font-bold text-[#1B4332]">
              {tab === 'login' ? 'Tekrar Hoş Geldiniz' : 'Aramıza Katılın'}
            </h2>
            <p className="text-xs text-gray-500 mt-1">
              {tab === 'login' 
                ? 'Kişiselleştirilmiş güzellik rutinize erişin.' 
                : 'Akıllı güzellik alışverişine başlamak için hesap oluşturun.'}
            </p>
          </div>

          {/* Sekme Değiştirici (Giriş Yap / Kayıt Ol) */}
          <div className="flex rounded-xl bg-gray-100 p-1 mb-6">
            <button
              type="button"
              onClick={() => setTab('login')}
              className={`flex-1 py-2 text-sm font-semibold rounded-lg transition-all ${
                tab === 'login' 
                  ? 'bg-white text-[#1B4332] shadow-sm' 
                  : 'text-gray-500 hover:text-gray-800'
              }`}
            >
              Giriş Yap
            </button>
            <button
              type="button"
              onClick={() => setTab('register')}
              className={`flex-1 py-2 text-sm font-semibold rounded-lg transition-all ${
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
        <form onSubmit={handleSubmit} className="p-6 pt-0 space-y-4">
          {tab === 'register' && (
            <div>
              <label className="block text-xs font-semibold text-gray-700 mb-1">Ad Soyad</label>
              <div className="relative">
                <Icon icon="lucide:user" className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400 w-4 h-4" />
                <input
                  type="text"
                  required
                  placeholder="Ayşe Kaya"
                  value={fullName}
                  onChange={(e) => setFullName(e.target.value)}
                  className="w-full pl-9 pr-4 py-2.5 text-sm rounded-xl border border-gray-200 focus:border-[#1B4332] focus:ring-2 focus:ring-[#1B4332]/20 outline-none transition-all"
                />
              </div>
            </div>
          )}

          <div>
            <label className="block text-xs font-semibold text-gray-700 mb-1">E-posta Adresi</label>
            <div className="relative">
              <Icon icon="lucide:mail" className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400 w-4 h-4" />
              <input
                type="email"
                required
                placeholder="ornek@email.com"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                className="w-full pl-9 pr-4 py-2.5 text-sm rounded-xl border border-gray-200 focus:border-[#1B4332] focus:ring-2 focus:ring-[#1B4332]/20 outline-none transition-all"
              />
            </div>
          </div>

          <div>
            <label className="block text-xs font-semibold text-gray-700 mb-1">Şifre</label>
            <div className="relative">
              <Icon icon="lucide:lock" className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400 w-4 h-4" />
              <input
                type="password"
                required
                minLength={6}
                placeholder="••••••••"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                className="w-full pl-9 pr-4 py-2.5 text-sm rounded-xl border border-gray-200 focus:border-[#1B4332] focus:ring-2 focus:ring-[#1B4332]/20 outline-none transition-all"
              />
            </div>
          </div>

          <button
            type="submit"
            disabled={loading}
            className="w-full py-3 px-4 bg-[#1B4332] hover:bg-[#153427] text-white font-semibold rounded-xl text-sm shadow-lg shadow-[#1B4332]/20 transition-all flex items-center justify-center gap-2 mt-2 disabled:opacity-50"
          >
            {loading ? (
              <Icon icon="lucide:loader-2" className="w-5 h-5 animate-spin" />
            ) : tab === 'login' ? (
              'Giriş Yap'
            ) : (
              'Hesap Oluştur'
            )}
          </button>
        </form>
      </div>
    </div>
  );
}