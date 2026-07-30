import { useState } from "react";
import {
  Home,
  MessageCircle,
  ShoppingBag,
  Heart,
  LogOut,
  User as UserIcon,
  Sparkles,
  LogIn,
  Plus,
  ChevronDown,
  ChevronUp,
  Edit2,
  Trash2,
  Check,
  X,
  MessageSquare,
  ShieldCheck,
} from "lucide-react";
import { User } from "@supabase/supabase-js"; 

export type ActiveTab =
  | "home"
  | "chat"
  | "cart"
  | "favorites"
  | "profile"
  | "admin";

export interface ChatSession {
  id: string;
  title: string;
  createdAt: number;
}

interface SidebarProps {
  activeTab: ActiveTab;
  onTabChange: (tab: ActiveTab) => void;
  cartCount: number;
  user: User | null;
  isAdminUnlocked?: boolean;
  onOpenLogin: () => void;
  onOpenRegister: () => void;
  onSignOut: () => void;
  // Session management props
  sessions: ChatSession[];
  currentSessionId: string;
  onSelectSession: (sessionId: string) => void;
  onCreateNewSession: () => void;
  onRenameSession: (sessionId: string, newTitle: string) => void;
  onDeleteSession: (sessionId: string) => void;
}

export function Sidebar({
  activeTab,
  onTabChange,
  cartCount,
  user,
  isAdminUnlocked,
  onOpenLogin,
  onOpenRegister,
  onSignOut,
  sessions,
  currentSessionId,
  onSelectSession,
  onCreateNewSession,
  onRenameSession,
  onDeleteSession,
}: SidebarProps) {
  // Dropdown state for AI Asistanım history list
  const [isChatDropdownOpen, setIsChatDropdownOpen] = useState<boolean>(true);
  
  // State for inline session title editing
  const [editingSessionId, setEditingSessionId] = useState<string | null>(null);
  const [editTitleInput, setEditTitleInput] = useState<string>("");

  const handleStartRename = (e: React.MouseEvent, session: ChatSession) => {
    e.stopPropagation();
    setEditingSessionId(session.id);
    setEditTitleInput(session.title);
  };

  const handleSaveRename = (e: React.MouseEvent | React.FormEvent, sessionId: string) => {
    e.stopPropagation();
    e.preventDefault();
    if (editTitleInput.trim()) {
      onRenameSession(sessionId, editTitleInput.trim());
    }
    setEditingSessionId(null);
  };

  const handleCancelRename = (e: React.MouseEvent) => {
    e.stopPropagation();
    setEditingSessionId(null);
  };

  const handleDelete = (e: React.MouseEvent, sessionId: string) => {
    e.stopPropagation();
    onDeleteSession(sessionId);
  };

  return (
    <aside className="w-[280px] min-w-[280px] bg-[#1B4332] flex flex-col h-screen sticky top-0 font-sans border-r border-white/5">
      
      {/* --- LOGO ALANI --- */}
      <div className="pt-7 px-6 pb-6">
        <div className="font-serif text-2xl text-white tracking-tight select-none">
          beau<span className="italic text-[#FFB7B2]">trics</span>
        </div>
        <div className="mt-1 text-[11px] text-white/45 tracking-[0.8px]">
          Akıllı Güzellik & Bakım Alışverişi
        </div>
      </div>

      {/* --- AYIRICI --- */}
      <div className="h-px bg-white/10 mb-2" />

      {/* --- MENÜ (NAVİGASYON) --- */}
      <nav className="flex-1 py-2 px-3.5 flex flex-col gap-1 overflow-y-auto custom-sidebar-scroll">
        
        {/* 1. ANASAYFA */}
        <button
          onClick={() => onTabChange("home")}
          className={`flex items-center gap-3 py-2.5 px-3.5 rounded-[10px] w-full text-left transition-all duration-150 ${
            activeTab === "home"
              ? "bg-[#2D6A4F] text-white shadow-sm font-medium"
              : "bg-transparent text-white/65 hover:bg-white/5 hover:text-white"
          }`}
        >
          <Home size={18} strokeWidth={activeTab === "home" ? 2.2 : 1.8} className="shrink-0" />
          <span className="text-[13.5px] flex-1">Anasayfa</span>
        </button>

        {/* 2. SEPETİM */}
        <button
          onClick={() => onTabChange("cart")}
          className={`flex items-center gap-3 py-2.5 px-3.5 rounded-[10px] w-full text-left transition-all duration-150 ${
            activeTab === "cart"
              ? "bg-[#2D6A4F] text-white shadow-sm font-medium"
              : "bg-transparent text-white/65 hover:bg-white/5 hover:text-white"
          }`}
        >
          <ShoppingBag size={18} strokeWidth={activeTab === "cart" ? 2.2 : 1.8} className="shrink-0" />
          <span className="text-[13.5px] flex-1">Sepetim</span>
          {cartCount > 0 && (
            <span className="bg-[#FFB7B2] text-[#1B4332] rounded-full text-[10px] font-bold min-w-[18px] h-[18px] flex items-center justify-center px-1.5 shadow-sm">
              {cartCount}
            </span>
          )}
        </button>

        {/* 3. FAVORİLERİM */}
        <button
          onClick={() => onTabChange("favorites")}
          className={`flex items-center gap-3 py-2.5 px-3.5 rounded-[10px] w-full text-left transition-all duration-150 ${
            activeTab === "favorites"
              ? "bg-[#2D6A4F] text-white shadow-sm font-medium"
              : "bg-transparent text-white/65 hover:bg-white/5 hover:text-white"
          }`}
        >
          <Heart size={18} strokeWidth={activeTab === "favorites" ? 2.2 : 1.8} className="shrink-0" />
          <span className="text-[13.5px] flex-1">Favorilerim</span>
        </button>

        {/* 4. YÖNETİM PANELİ (ADMİN PANELİ GEÇİŞİ) */}
        {(isAdminUnlocked || user?.email?.includes('admin')) && (
          <button
            onClick={() => onTabChange("admin")}
            className={`flex items-center gap-3 py-2.5 px-3.5 rounded-[10px] w-full text-left transition-all duration-200 ${
              activeTab === "admin"
                ? "bg-purple-900/90 text-white shadow-md font-semibold border border-purple-400/50"
                : "bg-purple-950/40 text-purple-200 hover:bg-purple-900/50 border border-purple-500/30"
            }`}
          >
            <ShieldCheck size={18} className="shrink-0 text-purple-300 animate-pulse" />
            <span className="text-[13.5px] flex-1 font-semibold flex items-center justify-between">
              Yönetim Paneli
              <span className="bg-purple-400/20 text-purple-200 text-[9.5px] font-bold px-1.5 py-0.5 rounded border border-purple-400/30 uppercase tracking-wider">
                Admin
              </span>
            </span>
          </button>
        )}

        {/* --- AYIRICI ÇİZGİ --- */}
        <div className="h-px bg-white/10 my-2 mx-1" />

        {/* 4. BEAUTRICS AI ASİSTANUM (EN ALTA ALINDI & DROPDOWN MENÜSÜ HALİNE GETİRİLDİ) */}
        <div className="flex flex-col gap-1">
          {/* Main AI Button Header */}
          <div
            onClick={() => {
              onTabChange("chat");
              setIsChatDropdownOpen(true);
            }}
            className={`flex items-center gap-2.5 py-2.5 px-3.5 rounded-[10px] w-full text-left cursor-pointer transition-all duration-150 ${
              activeTab === "chat"
                ? "bg-[#2D6A4F] text-white shadow-sm font-semibold border border-[#52B788]/30"
                : "bg-white/5 text-white/90 hover:bg-white/10"
            }`}
          >
            <MessageCircle size={18} strokeWidth={activeTab === "chat" ? 2.2 : 1.8} className="shrink-0 text-[#FFB7B2]" />
            <span className="text-[13.5px] flex-1 font-semibold flex items-center gap-1.5">
              AI Asistanım
              <Sparkles size={12} className="animate-pulse text-[#FFB7B2]" />
            </span>

            <button
              onClick={(e) => {
                e.stopPropagation();
                setIsChatDropdownOpen(!isChatDropdownOpen);
              }}
              className="p-1 rounded-md hover:bg-white/10 text-white/70 hover:text-white transition-colors"
              title="Sohbet geçmişini göster/gizle"
            >
              {isChatDropdownOpen ? <ChevronUp size={15} /> : <ChevronDown size={15} />}
            </button>
          </div>

          {/* Collapsible Dropdown Content */}
          {isChatDropdownOpen && (
            <div className="ml-2 pl-2.5 border-l-2 border-[#52B788]/40 pt-1.5 pb-1 flex flex-col gap-1.5 transition-all">
              
              {/* + Yeni Sohbet Butonu */}
              <button
                onClick={() => {
                  onCreateNewSession();
                  onTabChange("chat");
                }}
                className="w-full py-2 px-3 rounded-lg border border-[#FFB7B2]/30 bg-[#FFB7B2]/10 text-[#FFB7B2] hover:bg-[#FFB7B2]/20 font-semibold text-[12px] flex items-center justify-center gap-1.5 transition-all shadow-sm cursor-pointer"
              >
                <Plus size={14} className="stroke-[2.5px]" />
                Yeni Sohbet Başlat
              </button>

              {/* Sohbet Geçmişi Listesi */}
              <div className="max-h-48 overflow-y-auto custom-sidebar-scroll space-y-0.5 pr-1.5 text-xs">
                {sessions.length === 0 ? (
                  <div className="text-[11px] text-white/40 text-center py-2 italic">
                    Henüz kayıtlı sohbet yok
                  </div>
                ) : (
                  sessions.map((s) => {
                    const isSelected = activeTab === "chat" && currentSessionId === s.id;
                    const isEditing = editingSessionId === s.id;

                    if (isEditing) {
                      return (
                        <form
                          key={s.id}
                          onSubmit={(e) => handleSaveRename(e, s.id)}
                          className="flex items-center gap-1 p-1 bg-black/40 rounded-lg border border-[#FFB7B2]/50"
                        >
                          <input
                            type="text"
                            value={editTitleInput}
                            onChange={(e) => setEditTitleInput(e.target.value)}
                            className="bg-transparent text-white text-[11.5px] px-1.5 py-0.5 outline-none flex-1 min-w-0"
                            autoFocus
                          />
                          <button
                            type="submit"
                            onClick={(e) => handleSaveRename(e, s.id)}
                            className="p-1 text-green-300 hover:text-green-100"
                            title="Kaydet"
                          >
                            <Check size={13} />
                          </button>
                          <button
                            type="button"
                            onClick={handleCancelRename}
                            className="p-1 text-red-400 hover:text-red-200"
                            title="İptal"
                          >
                            <X size={13} />
                          </button>
                        </form>
                      );
                    }

                    return (
                      <div
                        key={s.id}
                        onClick={() => {
                          onSelectSession(s.id);
                          onTabChange("chat");
                        }}
                        className={`group flex items-center justify-between py-1.5 px-2.5 rounded-lg text-left transition-all cursor-pointer ${
                          isSelected
                            ? "bg-[#2D6A4F] text-white font-semibold shadow-xs"
                            : "text-white/70 hover:bg-white/10 hover:text-white"
                        }`}
                      >
                        <div className="flex items-center gap-2 min-w-0 flex-1">
                          <MessageSquare size={13} className={isSelected ? "text-[#FFB7B2]" : "text-white/40 group-hover:text-white/70"} />
                          <span className="text-[12px] truncate">{s.title || "Sohbet"}</span>
                        </div>

                        {/* Düzenle ve Sil İkonları (Hover Durumunda Görünür) */}
                        <div className="flex items-center gap-1 opacity-0 group-hover:opacity-100 transition-opacity shrink-0">
                          <button
                            onClick={(e) => handleStartRename(e, s)}
                            className="p-1 rounded text-white/60 hover:text-white hover:bg-white/10"
                            title="Sohbet adını değiştir"
                          >
                            <Edit2 size={12} />
                          </button>
                          
                          {sessions.length > 1 && (
                            <button
                              onClick={(e) => handleDelete(e, s.id)}
                              className="p-1 rounded text-white/60 hover:text-red-300 hover:bg-red-500/20"
                              title="Sohbeti sil"
                            >
                              <Trash2 size={12} />
                            </button>
                          )}
                        </div>
                      </div>
                    );
                  })
                )}
              </div>
            </div>
          )}
        </div>
      </nav>

      {/* --- AYIRICI --- */}
      <div className="h-px bg-white/10 mx-4" />

      {/* --- KULLANICI PROFİLİ VEYA GİRİŞ ALANI --- */}
      <div className="p-4 pb-6">
        {user ? (
          <>
            {/* Canlı Kullanıcı Bilgisi */}
            <div className="flex items-center gap-2.5 mb-3">
              <div className="w-[36px] h-[36px] rounded-full bg-gradient-to-br from-[#FFB7B2] to-[#E8C5CA] flex items-center justify-center text-[12.5px] font-bold text-[#1B4332] shrink-0 shadow-sm">
                {user.email ? user.email.substring(0, 2).toUpperCase() : "AK"}
              </div>
              
              <div className="flex-1 min-w-0">
                <div className="text-[13px] font-medium text-white whitespace-nowrap overflow-hidden text-ellipsis">
                  {user.user_metadata?.full_name || user.email?.split('@')[0]}
                </div>
                <div className="text-[10.5px] text-white/40 whitespace-nowrap overflow-hidden text-ellipsis">
                  {user.email}
                </div>
              </div>
            </div>

            {/* Profil ve Çıkış Butonları */}
            <div className="flex gap-1.5">
              <button
                onClick={() => onTabChange("profile")}
                className={`flex-1 flex items-center justify-center gap-1.5 py-1.5 px-2 rounded-lg text-xs transition-colors duration-150 cursor-pointer ${
                  activeTab === "profile"
                    ? "border border-white bg-white/15 text-white font-medium"
                    : "border border-white/15 bg-transparent text-white/60 hover:bg-white/10"
                }`}
              >
                <UserIcon size={13} /> Profil
              </button>
              
              <button
                onClick={onSignOut}
                className="flex items-center justify-center gap-1.5 py-1.5 px-2.5 rounded-lg border border-red-500/30 bg-red-500/10 text-red-300 text-xs hover:bg-red-500/20 transition-colors duration-150 cursor-pointer"
              >
                <LogOut size={13} /> Çıkış
              </button>
            </div>
          </>
        ) : (
          /* Ziyaretçi Ekranı (Giriş Yap / Kayıt Ol) */
          <div className="flex flex-col gap-2">
            <div className="text-[11px] text-white/60 text-center mb-0.5">
              Kişiselleştirilmiş deneyim için
            </div>

            <button
              onClick={onOpenLogin}
              className="w-full py-2 px-3.5 rounded-[10px] bg-white text-[#1B4332] font-semibold text-[12.5px] flex items-center justify-center gap-2 shadow-[0_4px_12px_rgba(0,0,0,0.1)] hover:bg-gray-50 transition-colors duration-150 cursor-pointer"
            >
              <LogIn size={15} /> Giriş Yap
            </button>

            <button
              onClick={onOpenRegister}
              className="w-full py-1.5 rounded-lg border border-white/15 bg-transparent text-white/80 text-[11.5px] text-center hover:bg-white/5 transition-colors duration-150 cursor-pointer"
            >
              Hesabın yok mu? <span className="text-[#FFB7B2] font-semibold">Kayıt Ol</span>
            </button>
          </div>
        )}
      </div>
    </aside>
  );
}