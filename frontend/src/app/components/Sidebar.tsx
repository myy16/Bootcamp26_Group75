import {
  Home,
  MessageCircle,
  ShoppingBag,
  Heart,
  LogOut,
  User as UserIcon,
  Sparkles,
  LogIn,
} from "lucide-react";
import { User } from "@supabase/supabase-js"; 

export type ActiveTab =
  | "home"
  | "chat"
  | "cart"
  | "favorites"
  | "profile";

interface SidebarProps {
  activeTab: ActiveTab;
  onTabChange: (tab: ActiveTab) => void;
  cartCount: number;
  user: User | null;
  onOpenLogin: () => void;
  onOpenRegister: () => void;
  onSignOut: () => void;
}

const NAV_ITEMS = [
  { id: "home" as ActiveTab, label: "Anasayfa", icon: Home },
  {
    id: "chat" as ActiveTab,
    label: "AI Asistan",
    icon: MessageCircle,
    isAI: true,
  },
  {
    id: "cart" as ActiveTab,
    label: "Sepet Optimizasyonu",
    icon: ShoppingBag,
  },
  {
    id: "favorites" as ActiveTab,
    label: "Favorilerim",
    icon: Heart,
  },
];

export function Sidebar({
  activeTab,
  onTabChange,
  cartCount,
  user,
  onOpenLogin,
  onOpenRegister,
  onSignOut,
}: SidebarProps) {
  return (
    <aside className="w-[280px] min-w-[280px] bg-[#1B4332] flex flex-col h-screen sticky top-0 font-sans">
      
      {/* --- LOGO ALANI --- */}
      <div className="pt-8 px-6 pb-7">
        <div className="font-serif text-2xl text-white tracking-tight select-none">
          beau<span className="italic text-[#FFB7B2]">trics</span>
        </div>
        <div className="mt-1.5 text-[11px] text-white/45 tracking-[0.8px] ">
          Akıllı Güzellik Alışverişi
        </div>
      </div>

      {/* --- AYIRICI --- */}
      <div className="h-px bg-white/10 mb-2" />

      {/* --- MENÜ (NAVİGASYON) --- */}
      <nav className="flex-1 py-3 px-4 flex flex-col gap-1">
        {NAV_ITEMS.map((item) => {
          const IconComponent = item.icon;
          const isActive = activeTab === item.id;

          return (
            <button
              key={item.id}
              onClick={() => onTabChange(item.id)}
              className={`flex items-center gap-3 py-2.5 px-3.5 rounded-[10px] w-full text-left relative transition-colors duration-150 ${
                isActive 
                  ? "bg-[#2D6A4F] text-white" 
                  : "bg-transparent text-white/60 hover:bg-white/5"
              }`}
            >
              <IconComponent
                size={18}
                strokeWidth={isActive ? 2.2 : 1.8}
                className="shrink-0"
              />
              <span className={`text-[14px] flex-1 whitespace-nowrap ${isActive ? 'font-medium' : 'font-normal'}`}>
                {item.label}
              </span>

              {/* AI Sparkle Efekti */}
              {item.isAI && (
                <Sparkles
                  size={12}
                  className={`animate-pulse ${isActive ? "text-[#FFB7B2]" : "text-[#FFB7B2]/50"}`}
                />
              )}

              {/* Sepet Sayısı Rozeti */}
              {item.id === "cart" && cartCount > 0 && (
                <span className="bg-[#FFB7B2] text-[#1B4332] rounded-full text-[10px] font-bold min-w-[18px] h-[18px] flex items-center justify-center px-1.5">
                  {cartCount}
                </span>
              )}
            </button>
          );
        })}
      </nav>

      {/* --- AYIRICI --- */}
      <div className="h-px bg-white/10 mx-4" />

      {/* --- KULLANICI PROFİLİ VEYA GİRİŞ ALANI --- */}
      <div className="p-5 pb-7">
        {user ? (
          <>
            {/* Canlı Kullanıcı Bilgisi */}
            <div className="flex items-center gap-2.5 mb-3.5">
              <div className="w-[38px] h-[38px] rounded-full bg-gradient-to-br from-[#FFB7B2] to-[#E8C5CA] flex items-center justify-center text-[13px] font-bold text-[#1B4332] shrink-0">
                {user.email ? user.email.substring(0, 2).toUpperCase() : "AK"}
              </div>
              
              <div className="flex-1 min-w-0">
                <div className="text-[13.5px] font-medium text-white whitespace-nowrap overflow-hidden text-ellipsis">
                  {user.user_metadata?.full_name || user.email?.split('@')[0]}
                </div>
                <div className="text-[11px] text-white/40 whitespace-nowrap overflow-hidden text-ellipsis">
                  {user.email}
                </div>
              </div>
            </div>

            {/* Profil ve Çıkış Butonları */}
            <div className="flex gap-1.5">
              <button
                onClick={() => onTabChange("profile")}
                className={`flex-1 flex items-center justify-center gap-1.5 py-2 px-2.5 rounded-lg text-xs transition-colors duration-150 ${
                  activeTab === "profile"
                    ? "border border-white bg-white/15 text-white"
                    : "border border-white/15 bg-transparent text-white/60 hover:bg-white/10"
                }`}
              >
                <UserIcon size={13} /> Profil
              </button>
              
              <button
                onClick={onSignOut}
                className="flex items-center justify-center gap-1.5 py-2 px-3 rounded-lg border border-red-500/30 bg-red-500/10 text-red-300 text-xs hover:bg-red-500/20 transition-colors duration-150"
              >
                <LogOut size={13} /> Çıkış
              </button>
            </div>
          </>
        ) : (
          /* Ziyaretçi Ekranı (Giriş Yap / Kayıt Ol) */
          <div className="flex flex-col gap-2">
            <div className="text-[11.5px] text-white/60 text-center mb-0.5">
              Kişiselleştirilmiş deneyim için
            </div>

            <button
              onClick={onOpenLogin}
              className="w-full py-2.5 px-3.5 rounded-[10px] bg-white text-[#1B4332] font-semibold text-[13px] flex items-center justify-center gap-2 shadow-[0_4px_12px_rgba(0,0,0,0.1)] hover:bg-gray-50 transition-colors duration-150"
            >
              <LogIn size={15} /> Giriş Yap
            </button>

            <button
              onClick={onOpenRegister}
              className="w-full p-2 rounded-lg border border-white/15 bg-transparent text-white/80 text-xs text-center hover:bg-white/5 transition-colors duration-150"
            >
              Hesabın yok mu? <span className="text-[#FFB7B2] font-semibold">Kayıt Ol</span>
            </button>
          </div>
        )}
      </div>
    </aside>
  );
}