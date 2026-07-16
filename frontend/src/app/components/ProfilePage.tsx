import { useEffect, useState } from "react";
import {
  User,
  Sparkles,
  Shield,
  Mail,
  Lock,
  Save,
  Leaf,
  Heart,
  ShoppingBag,
  RefreshCw,
} from "lucide-react";
import { toast } from "sonner";
import { User as SupabaseUser } from "@supabase/supabase-js";
import {
  loadProfileEditorData,
  ProfileOption,
  saveUserProfile,
} from "../profileApi";

interface ProfilePageProps {
  user: SupabaseUser | null;
  onOpenLogin: () => void;
  onSignOut: () => void;
  favoriteCount: number;
  cartCount: number;
  productCount: number;
}

const EMPTY_FORM = {
  fullName: "",
  newEmail: "",
  skinTypeName: "",
  hairTypeName: "",
  skinConcernNames: [] as string[],
  minBudget: "",
  maxBudget: "",
  newPassword: "",
  confirmPassword: "",
};

function InfoChip({ label, value }: { label: string; value: string }) {
  return (
    <div className="rounded-2xl border border-[#E8E8E2] bg-white px-4 py-3 shadow-sm">
      <div className="text-[10px] font-semibold uppercase tracking-[0.18em] text-[#8C8C84]">{label}</div>
      <div className="mt-1 text-[15px] font-semibold text-[#1A1A1A]">{value}</div>
    </div>
  );
}

function SelectField({
  label,
  value,
  options,
  onChange,
}: {
  label: string;
  value: string;
  options: ProfileOption[];
  onChange: (value: string) => void;
}) {
  return (
    <label className="block">
      <div className="mb-2 text-xs font-semibold uppercase tracking-[0.16em] text-[#6F6F67]">{label}</div>
      <select
        value={value}
        onChange={(e) => onChange(e.target.value)}
        className="w-full rounded-xl border border-[#DDDAD3] bg-white px-3.5 py-3 text-[14px] text-[#1A1A1A] outline-none transition-colors focus:border-[#2D6A4F]"
      >
        <option value="">Seçiniz</option>
        {options.map((option) => (
          <option key={option.id} value={option.name}>
            {option.name}
          </option>
        ))}
      </select>
    </label>
  );
}

export function ProfilePage({
  user,
  onOpenLogin,
  onSignOut,
  favoriteCount,
  cartCount,
  productCount,
}: ProfilePageProps) {
  const [loading, setLoading] = useState(true);
  const [savingProfile, setSavingProfile] = useState(false);
  const [savingSecurity, setSavingSecurity] = useState(false);
  const [skinTypes, setSkinTypes] = useState<ProfileOption[]>([]);
  const [hairTypes, setHairTypes] = useState<ProfileOption[]>([]);
  const [skinConcerns, setSkinConcerns] = useState<ProfileOption[]>([]);
  const [form, setForm] = useState(EMPTY_FORM);

  useEffect(() => {
    if (!user) {
      setLoading(false);
      setForm(EMPTY_FORM);
      return;
    }

    let cancelled = false;

    async function loadProfile() {
      setLoading(true);

      try {
        const { skinTypes: skinTypeOptions, hairTypes: hairTypeOptions, skinConcerns: skinConcernOptions, profile } =
          await loadProfileEditorData(user.id);

        if (cancelled) return;

        setSkinTypes(skinTypeOptions);
        setHairTypes(hairTypeOptions);
        setSkinConcerns(skinConcernOptions);
        setForm({
          fullName: user.user_metadata?.full_name || "",
          newEmail: user.email || "",
          skinTypeName: profile.skinTypeName,
          hairTypeName: profile.hairTypeName,
          skinConcernNames: profile.skinConcernNames,
          minBudget: profile.minBudget,
          maxBudget: profile.maxBudget,
          newPassword: "",
          confirmPassword: "",
        });
      } catch (error: any) {
        console.error("Profil yüklenemedi:", error);
        toast.error(error.message || "Profil bilgileri yüklenemedi.");
      } finally {
        if (!cancelled) {
          setLoading(false);
        }
      }
    }

    loadProfile();

    return () => {
      cancelled = true;
    };
  }, [user]);

  if (!user) {
    return (
      <div className="min-h-full bg-[#F5F5F0] px-4 py-10 sm:px-6 lg:px-8">
        <div className="mx-auto flex max-w-3xl flex-col items-center justify-center rounded-[28px] border border-[#E8E8E2] bg-white px-6 py-14 text-center shadow-[0_20px_60px_rgba(27,67,50,0.08)]">
          <div className="flex h-16 w-16 items-center justify-center rounded-full bg-[#EBF5F0] text-[#2D6A4F]">
            <User size={28} />
          </div>
          <h1 className="mt-5 text-2xl font-bold text-[#1A1A1A]">Profilinizi görmek için giriş yapın</h1>
          <p className="mt-3 max-w-xl text-sm leading-6 text-[#666]">
            Cilt tipi, saç tipi, sorunlar, bütçe, e-posta ve şifre değişiklikleri yalnızca giriş yapan kullanıcıya özel olarak yönetilir.
          </p>
          <div className="mt-8 flex flex-wrap justify-center gap-3">
            <button
              onClick={onOpenLogin}
              className="rounded-xl bg-[#1B4332] px-5 py-3 text-sm font-semibold text-white transition-colors hover:bg-[#153427]"
            >
              Giriş Yap
            </button>
            <button
              onClick={onSignOut}
              className="rounded-xl border border-[#DCD8CF] bg-white px-5 py-3 text-sm font-semibold text-[#444] transition-colors hover:bg-[#FAF9F5]"
            >
              Çıkış
            </button>
          </div>
        </div>
      </div>
    );
  }

  const selectedConcernNames = form.skinConcernNames;
  const profileReady = Boolean(form.skinTypeName && form.hairTypeName);

  const toggleConcern = (name: string) => {
    setForm((current) => {
      const next = new Set(current.skinConcernNames);
      if (next.has(name)) next.delete(name);
      else next.add(name);
      return { ...current, skinConcernNames: Array.from(next) };
    });
  };

  const handleSaveProfile = async () => {
    if (!user) return;

    setSavingProfile(true);

    try {
      await saveUserProfile(user.id, {
        fullName: form.fullName.trim(),
        currentEmail: user.email || undefined,
        skinTypeName: form.skinTypeName || null,
        hairTypeName: form.hairTypeName || null,
        skinConcernNames: form.skinConcernNames,
        minBudget: form.minBudget ? Number(form.minBudget) : null,
        maxBudget: form.maxBudget ? Number(form.maxBudget) : null,
        onboardingCompleted: true,
      });

      toast.success("Profil tercihleri kaydedildi.");
    } catch (error: any) {
      console.error("Profil kaydı başarısız:", error);
      toast.error(error.message || "Profil kaydedilemedi.");
    } finally {
      setSavingProfile(false);
    }
  };

  const handleSaveSecurity = async () => {
    if (!user) return;

    if (form.newPassword && form.newPassword.length < 6) {
      toast.error("Şifre en az 6 karakter olmalı.");
      return;
    }

    if (form.newPassword && form.newPassword !== form.confirmPassword) {
      toast.error("Şifreler eşleşmiyor.");
      return;
    }

    const emailChanged = form.newEmail.trim() && form.newEmail.trim() !== (user.email || "");
    const passwordChanged = Boolean(form.newPassword);

    if (!emailChanged && !passwordChanged) {
      toast.info("Güncellenecek yeni e-posta veya şifre yok.");
      return;
    }

    setSavingSecurity(true);

    try {
      await saveUserProfile(user.id, {
        fullName: form.fullName.trim(),
        currentEmail: user.email || undefined,
        email: emailChanged ? form.newEmail.trim() : undefined,
        password: passwordChanged ? form.newPassword : undefined,
      });

      toast.success(
        emailChanged
          ? "E-posta güncellemesi için doğrulama gerekiyorsa mailinize bakın."
          : "Şifre başarıyla güncellendi."
      );

      setForm((current) => ({
        ...current,
        newPassword: "",
        confirmPassword: "",
      }));
    } catch (error: any) {
      console.error("Güvenlik güncellemesi başarısız:", error);
      toast.error(error.message || "E-posta veya şifre güncellenemedi.");
    } finally {
      setSavingSecurity(false);
    }
  };

  return (
    <div className="min-h-full bg-[#F5F5F0] px-4 py-6 sm:px-6 lg:px-8">
      <div className="mx-auto max-w-7xl space-y-6">
        <section className="overflow-hidden rounded-[32px] border border-[#E8E8E2] bg-gradient-to-br from-[#1B4332] via-[#214F3B] to-[#2D6A4F] text-white shadow-[0_24px_80px_rgba(27,67,50,0.22)]">
          <div className="flex flex-col gap-6 p-6 lg:flex-row lg:items-center lg:justify-between lg:p-8">
            <div className="max-w-2xl">
              <div className="inline-flex items-center gap-2 rounded-full border border-white/15 bg-white/10 px-3 py-1 text-[11px] font-semibold uppercase tracking-[0.22em] text-[#FFB7B2]">
                <Sparkles size={12} /> Kişisel profil merkezi
              </div>
              <h1 className="mt-4 text-3xl font-bold tracking-tight sm:text-4xl">Profilinizi ve bakım tercihlerinizi tek yerde yönetin.</h1>
              <p className="mt-3 max-w-2xl text-sm leading-6 text-white/70 sm:text-[15px]">
                Chatbot üzerinden girilen cilt ve saç verileri burada düzenlenebilir. E-posta, şifre, bütçe ve bakım tercihleri aynı kayıt altında tutulur.
              </p>
            </div>

            <div className="grid min-w-0 grid-cols-2 gap-3 sm:grid-cols-4 lg:w-[420px]">
              <div className="rounded-2xl border border-white/12 bg-white/8 p-4 backdrop-blur-sm">
                <div className="text-[10px] uppercase tracking-[0.18em] text-white/55">Katalog</div>
                <div className="mt-1 text-2xl font-bold">{productCount}</div>
              </div>
              <div className="rounded-2xl border border-white/12 bg-white/8 p-4 backdrop-blur-sm">
                <div className="text-[10px] uppercase tracking-[0.18em] text-white/55">Favori</div>
                <div className="mt-1 text-2xl font-bold">{favoriteCount}</div>
              </div>
              <div className="rounded-2xl border border-white/12 bg-white/8 p-4 backdrop-blur-sm">
                <div className="text-[10px] uppercase tracking-[0.18em] text-white/55">Sepet</div>
                <div className="mt-1 text-2xl font-bold">{cartCount}</div>
              </div>
              <div className="rounded-2xl border border-white/12 bg-white/8 p-4 backdrop-blur-sm">
                <div className="text-[10px] uppercase tracking-[0.18em] text-white/55">Durum</div>
                <div className="mt-1 text-lg font-bold">{profileReady ? "Hazır" : "Eksik"}</div>
              </div>
            </div>
          </div>
        </section>

        {loading ? (
          <div className="rounded-[28px] border border-[#E8E8E2] bg-white p-10 text-center text-[#666] shadow-sm">
            Profil verileri yükleniyor...
          </div>
        ) : (
          <div className="grid gap-6 lg:grid-cols-[360px_minmax(0,1fr)]">
            <aside className="space-y-4 lg:sticky lg:top-6 lg:self-start">
              <div className="rounded-[28px] border border-[#E8E8E2] bg-white p-6 shadow-[0_18px_50px_rgba(0,0,0,0.06)]">
                <div className="flex items-center gap-4">
                  <div className="flex h-16 w-16 items-center justify-center rounded-2xl bg-[#1B4332] text-xl font-bold text-white">
                    {(form.fullName || user.email || "AK").slice(0, 2).toUpperCase()}
                  </div>
                  <div className="min-w-0 flex-1">
                    <div className="text-lg font-bold text-[#1A1A1A]">{form.fullName || user.user_metadata?.full_name || "İsimsiz kullanıcı"}</div>
                    <div className="mt-1 truncate text-sm text-[#666]">{user.email}</div>
                  </div>
                </div>

                <div className="mt-5 grid gap-3">
                  <InfoChip label="Cilt Tipi" value={form.skinTypeName || "Belirlenmedi"} />
                  <InfoChip label="Saç Tipi" value={form.hairTypeName || "Belirlenmedi"} />
                  <InfoChip
                    label="Bütçe"
                    value={
                      form.minBudget || form.maxBudget
                        ? `${form.minBudget || "0"} TL - ${form.maxBudget || "∞"} TL`
                        : "Tanımlı değil"
                    }
                  />
                  <InfoChip label="Cilt Sorunu" value={selectedConcernNames.length > 0 ? selectedConcernNames.join(", ") : "Yok"} />
                </div>

                <div className="mt-6 flex flex-wrap gap-2">
                  <button
                    onClick={onSignOut}
                    className="inline-flex items-center gap-2 rounded-xl border border-[#E0DED7] bg-white px-4 py-2.5 text-sm font-semibold text-[#444] transition-colors hover:bg-[#FAF9F5]"
                  >
                    <Shield size={14} /> Çıkış Yap
                  </button>
                  <button
                    onClick={() => window.scrollTo({ top: 0, behavior: "smooth" })}
                    className="inline-flex items-center gap-2 rounded-xl bg-[#1B4332] px-4 py-2.5 text-sm font-semibold text-white transition-colors hover:bg-[#153427]"
                  >
                    <RefreshCw size={14} /> Yukarı Git
                  </button>
                </div>
              </div>

              <div className="rounded-[28px] border border-[#E8E8E2] bg-[#FCFBF7] p-6 shadow-sm">
                <div className="flex items-center gap-2 text-sm font-semibold text-[#1A1A1A]">
                  <Leaf size={16} className="text-[#2D6A4F]" /> Chatbot ile eşlenen bilgiler
                </div>
                <p className="mt-3 text-sm leading-6 text-[#666]">
                  Sohbet ekranında istenen cilt tipi, saç tipi ve cilt sorunları kayıt edilir. Bu ekran, aynı verileri sonradan güncellemek için kullanılır.
                </p>
              </div>
            </aside>

            <div className="space-y-6">
              <section className="rounded-[28px] border border-[#E8E8E2] bg-white p-6 shadow-[0_18px_50px_rgba(0,0,0,0.06)]">
                <div className="flex items-center justify-between gap-4">
                  <div>
                    <h2 className="text-xl font-bold text-[#1A1A1A]">Kişisel Bilgiler</h2>
                    <p className="mt-1 text-sm text-[#666]">Ad, cilt tercihleri ve bütçe alanlarını buradan güncelleyin.</p>
                  </div>
                  <button
                    onClick={handleSaveProfile}
                    disabled={savingProfile}
                    className="inline-flex items-center gap-2 rounded-xl bg-[#1B4332] px-4 py-2.5 text-sm font-semibold text-white transition-colors hover:bg-[#153427] disabled:cursor-not-allowed disabled:opacity-60"
                  >
                    <Save size={14} /> {savingProfile ? "Kaydediliyor..." : "Profili Kaydet"}
                  </button>
                </div>

                <div className="mt-6 grid gap-4 md:grid-cols-2">
                  <label className="block">
                    <div className="mb-2 text-xs font-semibold uppercase tracking-[0.16em] text-[#6F6F67]">Ad Soyad</div>
                    <div className="relative">
                      <User size={16} className="pointer-events-none absolute left-3 top-1/2 -translate-y-1/2 text-[#8C8C84]" />
                      <input
                        value={form.fullName}
                        onChange={(e) => setForm((current) => ({ ...current, fullName: e.target.value }))}
                        placeholder="Ad Soyad"
                        className="w-full rounded-xl border border-[#DDDAD3] bg-white py-3 pl-10 pr-3 text-[14px] text-[#1A1A1A] outline-none transition-colors focus:border-[#2D6A4F]"
                      />
                    </div>
                  </label>

                  <label className="block">
                    <div className="mb-2 text-xs font-semibold uppercase tracking-[0.16em] text-[#6F6F67]">Mevcut E-posta</div>
                    <div className="relative">
                      <Mail size={16} className="pointer-events-none absolute left-3 top-1/2 -translate-y-1/2 text-[#8C8C84]" />
                      <input
                        value={user.email || ""}
                        disabled
                        className="w-full rounded-xl border border-[#DDDAD3] bg-[#F8F8F5] py-3 pl-10 pr-3 text-[14px] text-[#8C8C84] outline-none"
                      />
                    </div>
                  </label>

                  <SelectField
                    label="Cilt Tipi"
                    value={form.skinTypeName}
                    options={skinTypes}
                    onChange={(value) => setForm((current) => ({ ...current, skinTypeName: value }))}
                  />

                  <SelectField
                    label="Saç Tipi"
                    value={form.hairTypeName}
                    options={hairTypes}
                    onChange={(value) => setForm((current) => ({ ...current, hairTypeName: value }))}
                  />

                  <label className="block">
                    <div className="mb-2 text-xs font-semibold uppercase tracking-[0.16em] text-[#6F6F67]">Min Bütçe</div>
                    <input
                      type="number"
                      min="0"
                      value={form.minBudget}
                      onChange={(e) => setForm((current) => ({ ...current, minBudget: e.target.value }))}
                      placeholder="0"
                      className="w-full rounded-xl border border-[#DDDAD3] bg-white px-3.5 py-3 text-[14px] text-[#1A1A1A] outline-none transition-colors focus:border-[#2D6A4F]"
                    />
                  </label>

                  <label className="block">
                    <div className="mb-2 text-xs font-semibold uppercase tracking-[0.16em] text-[#6F6F67]">Maks. Bütçe</div>
                    <input
                      type="number"
                      min="0"
                      value={form.maxBudget}
                      onChange={(e) => setForm((current) => ({ ...current, maxBudget: e.target.value }))}
                      placeholder="500"
                      className="w-full rounded-xl border border-[#DDDAD3] bg-white px-3.5 py-3 text-[14px] text-[#1A1A1A] outline-none transition-colors focus:border-[#2D6A4F]"
                    />
                  </label>
                </div>

                <div className="mt-6">
                  <div className="mb-2 text-xs font-semibold uppercase tracking-[0.16em] text-[#6F6F67]">Cilt Sorunları</div>
                  <div className="flex flex-wrap gap-2">
                    {skinConcerns.map((option) => {
                      const active = selectedConcernNames.includes(option.name);
                      return (
                        <button
                          key={option.id}
                          onClick={() => toggleConcern(option.name)}
                          className={`rounded-full border px-3.5 py-2 text-sm font-medium transition-colors ${
                            active
                              ? "border-[#2D6A4F] bg-[#EBF5F0] text-[#2D6A4F]"
                              : "border-[#DAD7D0] bg-white text-[#666] hover:bg-[#FAF9F5]"
                          }`}
                        >
                          {option.name}
                        </button>
                      );
                    })}
                  </div>
                </div>
              </section>

              <section className="rounded-[28px] border border-[#E8E8E2] bg-white p-6 shadow-[0_18px_50px_rgba(0,0,0,0.06)]">
                <div className="flex items-center justify-between gap-4">
                  <div>
                    <h2 className="text-xl font-bold text-[#1A1A1A]">Hesap Güvenliği</h2>
                    <p className="mt-1 text-sm text-[#666]">E-posta veya şifre değişikliği yaparken doğrulama gerekebilir.</p>
                  </div>
                  <button
                    onClick={handleSaveSecurity}
                    disabled={savingSecurity}
                    className="inline-flex items-center gap-2 rounded-xl border border-[#1B4332] bg-white px-4 py-2.5 text-sm font-semibold text-[#1B4332] transition-colors hover:bg-[#F4FAF6] disabled:cursor-not-allowed disabled:opacity-60"
                  >
                    <Lock size={14} /> {savingSecurity ? "Güncelleniyor..." : "E-posta / Şifre Güncelle"}
                  </button>
                </div>

                <div className="mt-6 grid gap-4 md:grid-cols-2">
                  <label className="block">
                    <div className="mb-2 text-xs font-semibold uppercase tracking-[0.16em] text-[#6F6F67]">Yeni E-posta</div>
                    <input
                      type="email"
                      value={form.newEmail}
                      onChange={(e) => setForm((current) => ({ ...current, newEmail: e.target.value }))}
                      placeholder="ornek@email.com"
                      className="w-full rounded-xl border border-[#DDDAD3] bg-white px-3.5 py-3 text-[14px] text-[#1A1A1A] outline-none transition-colors focus:border-[#2D6A4F]"
                    />
                  </label>

                  <div className="rounded-2xl border border-[#E8E8E2] bg-[#FCFBF7] p-4">
                    <div className="flex items-center gap-2 text-sm font-semibold text-[#1A1A1A]">
                      <Mail size={15} className="text-[#2D6A4F]" /> E-posta değişikliği notu
                    </div>
                    <p className="mt-2 text-sm leading-6 text-[#666]">
                      Yeni e-posta Supabase tarafından doğrulama talebi ile güncellenir. Doğrulama maili gelirse onaylamanız gerekir.
                    </p>
                  </div>

                  <label className="block">
                    <div className="mb-2 text-xs font-semibold uppercase tracking-[0.16em] text-[#6F6F67]">Yeni Şifre</div>
                    <input
                      type="password"
                      value={form.newPassword}
                      onChange={(e) => setForm((current) => ({ ...current, newPassword: e.target.value }))}
                      placeholder="Yeni şifre"
                      className="w-full rounded-xl border border-[#DDDAD3] bg-white px-3.5 py-3 text-[14px] text-[#1A1A1A] outline-none transition-colors focus:border-[#2D6A4F]"
                    />
                  </label>

                  <label className="block">
                    <div className="mb-2 text-xs font-semibold uppercase tracking-[0.16em] text-[#6F6F67]">Yeni Şifre Tekrar</div>
                    <input
                      type="password"
                      value={form.confirmPassword}
                      onChange={(e) => setForm((current) => ({ ...current, confirmPassword: e.target.value }))}
                      placeholder="Yeni şifre tekrar"
                      className="w-full rounded-xl border border-[#DDDAD3] bg-white px-3.5 py-3 text-[14px] text-[#1A1A1A] outline-none transition-colors focus:border-[#2D6A4F]"
                    />
                  </label>
                </div>
              </section>

              <div className="grid gap-4 md:grid-cols-3">
                <div className="rounded-[24px] border border-[#E8E8E2] bg-white p-5 shadow-sm">
                  <div className="flex items-center gap-2 text-sm font-semibold text-[#1A1A1A]"><Heart size={15} className="text-[#FF7B7B]" /> Favori ürünler</div>
                  <div className="mt-3 text-3xl font-bold text-[#1A1A1A]">{favoriteCount}</div>
                </div>
                <div className="rounded-[24px] border border-[#E8E8E2] bg-white p-5 shadow-sm">
                  <div className="flex items-center gap-2 text-sm font-semibold text-[#1A1A1A]"><ShoppingBag size={15} className="text-[#2D6A4F]" /> Sepet durumu</div>
                  <div className="mt-3 text-3xl font-bold text-[#1A1A1A]">{cartCount}</div>
                </div>
                <div className="rounded-[24px] border border-[#E8E8E2] bg-white p-5 shadow-sm">
                  <div className="flex items-center gap-2 text-sm font-semibold text-[#1A1A1A]"><Shield size={15} className="text-[#1B4332]" /> Profil eşleşmesi</div>
                  <div className="mt-3 text-3xl font-bold text-[#1A1A1A]">{profileReady ? "100%" : "—"}</div>
                </div>
              </div>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}