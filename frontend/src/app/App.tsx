import { useState, useEffect } from "react";
import { Toaster, toast } from "sonner";
import { Sidebar, ActiveTab } from "./components/Sidebar";
import { HomePage } from "./components/HomePage";
import { ChatPage } from "./components/ChatPage";
import { CartOptimizer } from "./components/CartOptimizer";
import { FavoritesPage } from "./components/FavoritesPage";
import { ProfilePage } from "./components/ProfilePage";
import { Product, StoreName } from "./data";
import { User } from "@supabase/supabase-js";
import { supabase } from "./supabase";
import { AuthModal } from "./components/AuthModal";
import { ChartModal } from "./components/ChartModal";
import "../styles/fonts.css";

const BASE_PRODUCT_SELECT = `
  id,
  universal_name,
  image_url,
  brands!brand_id ( name ),
  categories!category_id ( name ),
  store_mappings!p_id (
    current_price,
    markets!m_id ( name )
  ),
  price_log!p_id ( price, date )
`;

const ENRICHED_PRODUCT_SELECT = `
  ${BASE_PRODUCT_SELECT},
  product_skin_types!product_id (
    skin_type_id,
    skin_types!skin_type_id ( name )
  ),
  product_tags!product_id (
    tags!tag_id ( name )
  )
`;

function getRelatedName(relation: any): string | null {
  if (Array.isArray(relation)) {
    return relation[0]?.name ?? null;
  }

  return relation?.name ?? null;
}

function getNestedRelationNames(rows: any[] | null | undefined, relationKey: string): string[] {
  return (rows ?? [])
    .map((row) => getRelatedName(row?.[relationKey]))
    .filter((name): name is string => Boolean(name));
}

export default function App() {
  const [activeTab, setActiveTab] = useState<ActiveTab>("home");
  const [cartItems, setCartItems] = useState<Product[]>([]);
  const [favoriteIds, setFavoriteIds] = useState<Set<string>>(new Set());

  // --- SUPABASE VERİ STATE'LERİ ---
  const [products, setProducts] = useState<Product[]>([]);
  const [loading, setLoading] = useState<boolean>(true);

  // --- AUTH (KULLANICI SEANS) STATE'LERİ ---
  const [user, setUser] = useState<User | null>(null);
  const [userSkinTypeName, setUserSkinTypeName] = useState<string | null>(null);
  const [isAuthModalOpen, setIsAuthModalOpen] = useState<boolean>(false);
  const [authModalTab, setAuthModalTab] = useState<"login" | "register">("login");

  // --- FİYAT ANALİZİ (CHART) MODAL STATE'İ ---
  const [chartProduct, setChartProduct] = useState<Product | null>(null);
  const openChart = (product: Product) => setChartProduct(product);

  // --- SUPABASE OTURUM DURUMUNU DİNLEME ---
  useEffect(() => {
    supabase.auth.getSession().then(({ data: { session } }) => {
      setUser(session?.user ?? null);
    });

    const {
      data: { subscription },
    } = supabase.auth.onAuthStateChange((_event, session) => {
      setUser(session?.user ?? null);
    });

    return () => subscription.unsubscribe();
  }, []);

  // --- KULLANICI CİLT TİPİNİ OKUMA ---
  useEffect(() => {
    let cancelled = false;

    if (!user) {
      setUserSkinTypeName(null);
      return;
    }

    async function fetchUserSkinType() {
      try {
        const { data, error } = await supabase
          .from("user_profiles")
          .select("skin_types!skin_type_id ( name )")
          .eq("user_id", user.id)
          .maybeSingle();

        if (error) throw error;
        if (!cancelled) {
          setUserSkinTypeName(getRelatedName((data as any)?.skin_types));
        }
      } catch (err) {
        console.error("Kullanıcı cilt tipi yüklenirken hata oluştu:", err);
        if (!cancelled) setUserSkinTypeName(null);
      }
    }

    fetchUserSkinType();

    return () => {
      cancelled = true;
    };
  }, [user]);

  // --- YENİ ENTEGRASYON: KULLANICI GİRİŞ YAPTIĞINDA FAVORİLERİ VERİTABANINDAN ÇEKME ---
  useEffect(() => {
    if (!user) {
      setFavoriteIds(new Set()); // Kullanıcı çıkış yaptıysa favorileri temizle
      return;
    }

    async function fetchUserFavorites() {
      try {
        const { data, error } = await supabase
          .from("user_favorites")
          .select("product_id")
          .eq("user_id", user.id);

        if (error) throw error;

        if (data) {
          // Veritabanındaki int4 ID'leri stringe çevirip Set state'ine atıyoruz
          const favIdsString = data.map((item: any) => item.product_id.toString());
          setFavoriteIds(new Set(favIdsString));
        }
      } catch (err) {
        console.error("Favoriler yüklenirken hata oluştu:", err);
      }
    }

    fetchUserFavorites();
  }, [user]);

  // --- YENİ ENTEGRASYON: KULLANICI GİRİŞ YAPTIĞINDA SEPETİ VERİTABANINDAN ÇEKME ---
  useEffect(() => {
    if (!user) {
      setCartItems([]); // Kullanıcı çıkış yaparsa arayüzdeki sepeti boşalt
      return;
    }

    async function fetchUserCart() {
      try {
        // Önceden Supabase'de oluşturduğumuz view'ı sorguluyoruz
        const { data, error } = await supabase
          .from("my_cart_with_prices")
          .select("*");

        if (error) {
          // Eğer view henüz yoksa fallback olarak cart_items tablosundan id çekmeyi deneyelim
          const fallback = await supabase
            .from("cart_items")
            .select("product_id, quantity")
            .eq("user_id", user.id);
            
          if (!fallback.error && fallback.data) {
            // Ana ürün listesindeki ürünlerle eşleştiriyoruz
            const matchedProducts: Product[] = [];
            fallback.data.forEach((item: any) => {
              const found = products.find((p) => p.id === item.product_id.toString());
              if (found) {
                matchedProducts.push({ ...found, quantity: item.quantity });
              }
            });
            setCartItems(matchedProducts);
          }
          return;
        }

        if (data && data.length > 0) {
          // Gelen veriyi Product formatına map'liyoruz
          const cartMap: Record<string, Product> = {};
          
          data.forEach((row: any) => {
            const pid = row.product_id.toString();
            if (!cartMap[pid]) {
              // Ürün ana listemizde varsa onu baz al, yoksa view'dan oluştur
              const existingProduct = products.find((p) => p.id === pid);
              cartMap[pid] = existingProduct
                ? { ...existingProduct, quantity: row.quantity }
                : {
                    id: pid,
                    title: row.universal_name || "İsimsiz Ürün",
                    brand: row.brand_name || "Markasız",
                    image: row.image_url || "",
                    quantity: row.quantity,
                    stores: [],
                  };
            }
            // Mağaza fiyatlarını ekliyoruz
            if (row.market_name && row.current_price) {
              const exists = cartMap[pid].stores.some((s) => s.name === row.market_name);
              if (!exists) {
                cartMap[pid].stores.push({
                  name: row.market_name as StoreName,
                  price: Number(row.current_price) || 0,
                });
              }
            }
          });
          setCartItems(Object.values(cartMap));
        }
      } catch (err) {
        console.error("Sepet verileri çekilirken hata oluştu:", err);
      }
    }

    // Eğer ana ürünler yüklendiyse sepeti çek
    if (products.length > 0) {
      fetchUserCart();
    }
  }, [user, products]);

  // --- SUPABASE'DEN ÜRÜNLERİ VE FİYATLARI ÇEKME ---
  useEffect(() => {
    async function fetchProducts() {
      try {
        setLoading(true);

        if (!supabase) {
          console.error("❌ Supabase Bağlantı Hatası: API anahtarları eksik!");
          toast.error("Supabase API anahtarları bulunamadı.");
          setLoading(false);
          return;
        }

        let { data, error } = await supabase.from("products").select(ENRICHED_PRODUCT_SELECT);

        if (error) {
          console.warn("Öneri eşleşme verileri alınamadı, temel ürün verisiyle devam ediliyor:", error);
          const fallbackResult = await supabase.from("products").select(BASE_PRODUCT_SELECT);
          data = fallbackResult.data;
          error = fallbackResult.error;
        }

        if (error) throw error;

        if (!data || data.length === 0) {
          console.warn("Supabase 'products' tablosunda hiç veri yok!");
          setLoading(false);
          return;
        }

        const formattedProducts: Product[] = data.map((item: any) => {
          const storesData = (item.store_mappings || []).map((sm: any) => {
            const rawMarketName = sm.markets?.name || "Mion";
            const formattedMarketName =
              rawMarketName.charAt(0).toUpperCase() +
              rawMarketName.slice(1).toLowerCase();

            return {
              name: formattedMarketName as StoreName,
              price: Number(sm.current_price) || 0,
            };
          });

          return {
            id: item.id.toString(),
            title: item.universal_name || "İsimsiz Ürün",
            image: item.image_url || "https://via.placeholder.com/600",
            brand: item.brands?.name || "Markasız",
            category: item.categories?.name || "Genel",
            attributes: getNestedRelationNames(item.product_tags, "tags"),
            skinTypeNames: getNestedRelationNames(item.product_skin_types, "skin_types"),
            tagNames: getNestedRelationNames(item.product_tags, "tags"),
            stores: storesData,
            featured: false,
            history: (item.price_log || []).map((log: any) => ({
              date: log.date
                ? new Date(log.date).toLocaleDateString("tr-TR", {
                    day: "2-digit",
                    month: "2-digit",
                  })
                : "",
              price: Number(log.price) || 0,
            })),
          };
        });

        setProducts(formattedProducts);
      } catch (err: any) {
        console.error("Supabase sorgu hatası:", err);
        toast.error(`Veritabanı Hatası: ${err.message || "Bilinmeyen bir hata oluştu."}`);
      } finally {
        setLoading(false);
      }
    }

    fetchProducts();
  }, []);

  const cartItemIds = new Set(cartItems.map((p) => p.id));

// --- GÜNCELLENEN SEPETE EKLEME FONKSİYONU (SUPABASE ENTEGRELİ) ---
  const handleAddToCart = async (product: Product) => {
    // 1. Kullanıcı giriş yapmamışsa veritabanına yazamayız, login modalını aç!
    if (!user) {
      setAuthModalTab("login");
      setIsAuthModalOpen(true);
      return;
    }

    // 2. Arayüzü anında güncelle (Kullanıcıyı bekletmemek için Optimistic UI)
    setCartItems((prev) => {
      const existing = prev.find((p) => p.id === product.id);
      if (existing) {
        toast.info(`${product.brand} miktar artırıldı`);
        return prev.map((p) =>
          p.id === product.id ? { ...p, quantity: (p.quantity || 1) + 1 } : p
        );
      }
      toast.success(`${product.brand} sepete eklendi ✓`, {
        style: { background: "#EBF5F0", border: "1px solid #A8D5C2", color: "#1B4332" },
      });
      return [...prev, { ...product, quantity: 1 }];
    });

    // 3. Arka planda Supabase veritabanındaki RPC fonksiyonunu tetikle
    try {
      const { error } = await supabase.rpc("add_to_cart", {
        p_product_id: parseInt(product.id, 10),
        p_quantity: 1,
      });

      if (error) {
        console.error("Supabase sepete ekleme hatası:", error.message);
        toast.error("Sepet değişikliği veritabanına kaydedilemedi!");
      }
    } catch (err) {
      console.error("Sepete eklerken beklenmeyen hata:", err);
    }
  };

  // --- YENİ EKLENEN: SEPETTEKİ MİKTARI GÜNCELLEME ---
  const handleUpdateQuantity = async (productId: string, newQuantity: number) => {
    if (!user) return;

    // Arayüzü anlık güncelle
    setCartItems((prev) =>
      newQuantity <= 0
        ? prev.filter((p) => p.id !== productId)
        : prev.map((p) => (p.id === productId ? { ...p, quantity: newQuantity } : p))
    );

    // Veritabanına bildir
    try {
      if (newQuantity <= 0) {
        await supabase.rpc("remove_from_cart", { p_product_id: parseInt(productId, 10) });
      } else {
        await supabase.rpc("update_cart_quantity", {
          p_product_id: parseInt(productId, 10),
          p_quantity: newQuantity,
        });
      }
    } catch (err) {
      console.error("Miktar güncellenemedi:", err);
    }
  };

  // --- GÜNCELLENEN SEPETTEN SİLME FONKSİYONU ---
  const handleRemoveFromCart = async (id: string) => {
    setCartItems((prev) => prev.filter((p) => p.id !== id));
    toast.info("Ürün sepetten kaldırıldı");

    if (user) {
      try {
        await supabase.rpc("remove_from_cart", { p_product_id: parseInt(id, 10) });
      } catch (err) {
        console.error("Supabase silme hatası:", err);
      }
    }
  };

  // --- DÜZELTME: FAVORİ EKLEME/SİLME FONKSİYONUNU SUPABASE'E BAĞLAMA ---
  const handleToggleFavorite = async (id: string) => {
    if (!user) return; // Giriş yapılmadıysa işlem yapma (Kart bileşeni zaten engelliyor)

    const isAlreadyFav = favoriteIds.has(id);
    const productIdNum = parseInt(id, 10); // Veritabanı int4 beklediği için sayıya çeviriyoruz

    // Arayüzün gecikmemesi için state'i anında güncelliyoruz
    setFavoriteIds((prev) => {
      const next = new Set(prev);
      if (isAlreadyFav) next.delete(id);
      else next.add(id);
      return next;
    });

    try {
      if (isAlreadyFav) {
        toast("Favorilerden kaldırıldı", { icon: "♡" });
        // Supabase user_favorites tablosundan sil
        await supabase
          .from("user_favorites")
          .delete()
          .eq("user_id", user.id)
          .eq("product_id", productIdNum);
      } else {
        toast.success("Favorilere eklendi ♥", {
          style: { background: "#FFF0F0", border: "1px solid #FFB7B2", color: "#8B2E3A" },
        });
        // Supabase user_favorites tablosuna ekle
        await supabase
          .from("user_favorites")
          .insert({ user_id: user.id, product_id: productIdNum });
      }
    } catch (err) {
      console.error("Favori senkronizasyon hatası:", err);
      toast.error("Favori durumu veritabanına kaydedilemedi.");
    }
  };

  // const handleRemoveFromCart = (id: string) => {
  //   setCartItems((prev) => prev.filter((p) => p.id !== id));
  //   toast.info("Ürün sepetten kaldırıldı");
  // };

  const handleSignOut = async () => {
    if (!supabase) return;
    const { error } = await supabase.auth.signOut();
    if (error) {
      toast.error("Çıkış yapılırken bir hata oluştu.");
    } else {
      toast.success("Başarıyla çıkış yapıldı.");
    }
  };

  return (
    // TAILWIND GÜNCELLEMESİ: Dış sarmalayıcı flex kutusu düzenlendi
    <div className="flex h-screen overflow-hidden font-sans bg-[#F5F5F0]">
      <Toaster position="bottom-right" richColors />

      <Sidebar
        activeTab={activeTab}
        onTabChange={setActiveTab}
        cartCount={cartItems.length}
        user={user}
        onOpenLogin={() => {
          setAuthModalTab("login");
          setIsAuthModalOpen(true);
        }}
        onOpenRegister={() => {
          setAuthModalTab("register");
          setIsAuthModalOpen(true);
        }}
        onSignOut={handleSignOut}
      />

      {/* TAILWIND GÜNCELLEMESİ: Main içerik alanı sınıfları eklendi */}
      <main className="flex-1 overflow-y-auto relative">
        {/* TAILWIND GÜNCELLEMESİ: Yükleniyor ekranı sınıfları düzenlendi */}
        {loading && (
          <div className="flex justify-center items-center h-full text-gray-500 font-medium">
            Supabase'den veriler yükleniyor...
          </div>
        )}

        {/* Sayfaların Gösterilmesi */}
        {!loading && activeTab === "home" && (
          <HomePage
            products={products}
            cartItemIds={cartItemIds}
            favoriteIds={favoriteIds}
            onAddToCart={handleAddToCart}
            onToggleFavorite={handleToggleFavorite}
            user={user}
            userSkinTypeName={userSkinTypeName}
            onOpenLogin={() => {
              setAuthModalTab("login");
              setIsAuthModalOpen(true);
            }}
            onOpenChart={openChart}
          />
        )}
        {!loading && (
          <div style={{ display: activeTab === "chat" ? "block" : "none", height: "100%" }}>
            <ChatPage
              products={products}
              onAddToCart={handleAddToCart}
              cartItemIds={cartItemIds}
              onNavigateToCart={() => setActiveTab("cart")}
              user={user}
            />
          </div>
        )}
        {/* Sayfaların Gösterilmesi bölümünde ilgili satırları şu şekilde güncelleyin: */}

        {!loading && activeTab === "cart" && (
          <CartOptimizer 
            items={cartItems} 
            onRemoveItem={handleRemoveFromCart}
            onUpdateQuantity={handleUpdateQuantity} // <-- BU SATIR EKLENDİ
          />
        )}

{!loading && activeTab === "favorites" && (
  <FavoritesPage
    products={products}
    favoriteIds={favoriteIds}
    onToggleFavorite={handleToggleFavorite}
    onAddToCart={handleAddToCart}
    // onUpdateQuantity={handleUpdateQuantity}  <-- BU SATIRI SİL
    cartItemIds={cartItemIds}
    user={user}
    onOpenLogin={() => {
      setAuthModalTab("login");
      setIsAuthModalOpen(true);
    }}
    onOpenChart={openChart}
  />
)}
        {!loading && activeTab === "profile" && (
          <ProfilePage
            user={user}
            onOpenLogin={() => {
              setAuthModalTab("login");
              setIsAuthModalOpen(true);
            }}
            onSignOut={handleSignOut}
            favoriteCount={favoriteIds.size}
            cartCount={cartItems.length}
            productCount={products.length}
            onNavigate={setActiveTab}
          />
        )}
      </main>

      <AuthModal
        isOpen={isAuthModalOpen}
        initialTab={authModalTab}
        onClose={() => setIsAuthModalOpen(false)}
      />

      <ChartModal
        isOpen={chartProduct !== null}
        productId={chartProduct?.id ?? null}
        productTitle={chartProduct?.title}
        onClose={() => setChartProduct(null)}
      />
    </div>
  );
}
