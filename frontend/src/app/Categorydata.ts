// categoryData.ts
//
// Supabase'deki "categories" ve "brands" tablolarınızın statik bir kopyası.
// Menü yapısı sık değişmeyeceği için şimdilik sabit veri kullanmak en hızlı
// ve en az riskli çözüm. İstersen dosyanın en altındaki nota bakarak bunun
// yerine Supabase'den canlı fetch yapabilirsin.
//
// NOT: "Cilt Bakımı" ve "Saç Bakımı" isimlerini, orijinal HomePage.tsx'inizdeki
// CATEGORIES dizisiyle aynı (sonu "ı" ile) yazdım. Bana ilettiğiniz tabloda bu
// isimler "cilt bakım" / "saç bakım" şeklinde görünüyordu - eğer veritabanınızdaki
// gerçek `name` değerleri buysa, aşağıdaki satırları DB'nizle birebir eşleşecek
// şekilde güncelleyin (fonksiyonlar sadece id/parent_id ilişkisine bakıyor,
// isim string'i sadece görüntüleme için).

export interface CategoryRow {
  category_id: number;
  name: string;
  parent_id: number | null;
}

export interface BrandRow {
  brand_id: number;
  name: string;
}

export const CATEGORIES: CategoryRow[] = [
  { category_id: 1, name: "Makyaj", parent_id: null },
  { category_id: 2, name: "Cilt Bakımı", parent_id: null },
  { category_id: 3, name: "Saç Bakımı", parent_id: null },
  { category_id: 4, name: "Kişisel Bakım", parent_id: null },

  { category_id: 5, name: "Yüz Makyajı", parent_id: 1 },
  { category_id: 6, name: "Göz Makyajı", parent_id: 1 },
  { category_id: 7, name: "Dudak Makyajı", parent_id: 1 },

  { category_id: 8, name: "Fondöten", parent_id: 5 },
  { category_id: 9, name: "Kapatıcı", parent_id: 5 },
  { category_id: 10, name: "Allık", parent_id: 5 },
  { category_id: 11, name: "Highlighter", parent_id: 5 },
  { category_id: 12, name: "BB ve CC Krem", parent_id: 5 },
  { category_id: 13, name: "Bronzer", parent_id: 5 },
  { category_id: 14, name: "Pudra", parent_id: 5 },
  { category_id: 15, name: "Makyaj Bazı ve Sabitleyici", parent_id: 5 },

  { category_id: 16, name: "Maskara", parent_id: 6 },
  { category_id: 17, name: "Eyeliner", parent_id: 6 },
  { category_id: 18, name: "Göz Kalemi", parent_id: 6 },
  { category_id: 19, name: "Far", parent_id: 6 },

  { category_id: 20, name: "Ruj", parent_id: 7 },
  { category_id: 21, name: "Likit Ruj", parent_id: 7 },
  { category_id: 22, name: "Dudak Kalemi", parent_id: 7 },
  { category_id: 23, name: "Parlatıcı", parent_id: 7 },

  { category_id: 24, name: "Yüz Temizleme ve Tonik", parent_id: 2 },
  { category_id: 25, name: "Güneş Kremi", parent_id: 2 },
  { category_id: 26, name: "Makyaj Temizleme", parent_id: 2 },
  { category_id: 27, name: "Nemlendirici", parent_id: 2 },
  { category_id: 28, name: "Yaşlanma Karşıtı", parent_id: 2 },
  { category_id: 29, name: "Yüz Maskesi", parent_id: 2 },
  { category_id: 30, name: "Cilt Serumu ve Yağlar", parent_id: 2 },
  { category_id: 31, name: "Peeling", parent_id: 2 },
  { category_id: 32, name: "Dudak Bakım", parent_id: 2 },
  { category_id: 33, name: "Göz Bakım", parent_id: 2 },

  { category_id: 34, name: "Şampuan", parent_id: 3 },
  { category_id: 35, name: "Saç Kremi", parent_id: 3 },
  { category_id: 36, name: "Saç Bakım Ürünleri", parent_id: 3 },

  { category_id: 37, name: "Roll On", parent_id: 4 },
];

export const BRANDS: BrandRow[] = [
  { brand_id: 1, name: "Anyong" },
  { brand_id: 2, name: "Beauty of Joseon" },
  { brand_id: 3, name: "Bic" },
  { brand_id: 4, name: "Bioablas" },
  { brand_id: 5, name: "Flormar" },
  { brand_id: 6, name: "Garnier" },
  { brand_id: 7, name: "Haioto" },
  { brand_id: 8, name: "Loreal Paris" },
  { brand_id: 9, name: "Maruderm" },
  { brand_id: 10, name: "Maybelline New York" },
  { brand_id: 11, name: "Note" },
  { brand_id: 12, name: "Pastel" },
];

export function getTopCategories(): CategoryRow[] {
  return CATEGORIES.filter((c) => c.parent_id === null);
}

export function getChildren(parentId: number): CategoryRow[] {
  return CATEGORIES.filter((c) => c.parent_id === parentId);
}

export interface MenuColumn {
  header: CategoryRow;
  items: CategoryRow[];
}

/**
 * Bir üst kategorinin (Makyaj, Cilt Bakımı ...) mega-menüsünde kaç sütun
 * gösterileceğini ve her sütunun başlık/öğelerini üretir.
 *
 * - Makyaj gibi 3 seviyeli kategorilerde: her orta kategori (Yüz Makyajı,
 *   Göz Makyajı, Dudak Makyajı) kendi sütunu olur, altındaki alt kategoriler
 *   o sütunun öğeleridir.
 * - Cilt Bakımı / Saç Bakımı / Kişisel Bakım gibi 2 seviyeli kategorilerde
 *   (ara kategori yok, direkt alt kategoriler var): tek sütun oluşur, başlık
 *   üst kategorinin kendisi olur.
 */
export function getMenuColumns(topCategoryId: number): MenuColumn[] {
  const children = getChildren(topCategoryId);
  const hasSubGroups = children.some(
    (child) => getChildren(child.category_id).length > 0,
  );

  if (hasSubGroups) {
    return children.map((child) => ({
      header: child,
      items: getChildren(child.category_id),
    }));
  }

  const top = CATEGORIES.find((c) => c.category_id === topCategoryId);
  if (!top || children.length === 0) return [];
  return [{ header: top, items: children }];
}

/**
 * Bir kategori id'sinin (herhangi bir seviyeden) altındaki tüm EN ALT seviye
 * (leaf) kategori id'lerini toplar. Kategori zaten leaf ise kendi id'sini döner.
 *
 * Ürün filtrelemesinde kullanılır: kullanıcı "Makyaj"a tıklarsa altındaki tüm
 * leaf kategorilerdeki ürünler gösterilir; "Ruj"a tıklarsa sadece Ruj.
 */
export function getLeafDescendantIds(categoryId: number): number[] {
  const children = getChildren(categoryId);
  if (children.length === 0) return [categoryId];
  return children.flatMap((child) => getLeafDescendantIds(child.category_id));
}

/**
 * Karşılaştırma için metni sadeleştirir (baş/son boşluk temizler, Türkçe'ye
 * uygun küçük harfe çevirir). "Ruj" ile "  ruj " veya "RUJ" aynı kabul edilsin
 * diye category/brand string eşleştirmelerinde bunu kullanıyoruz.
 */
export function normalizeText(value: string): string {
  return value.trim().toLocaleLowerCase("tr-TR");
}

/**
 * getLeafDescendantIds'in isim (string) karşılığı. data.ts'teki Product tipi
 * kategoriyi `category_id` yerine leaf kategori ADI olarak tutuyor
 * (Product.category: string), bu yüzden ürün filtrelemesinde asıl kullanılan
 * fonksiyon bu. Dönen isimler normalize edilmiş halde gelir.
 */
export function getLeafDescendantNames(categoryId: number): string[] {
  return getLeafDescendantIds(categoryId)
    .map((id) => CATEGORIES.find((c) => c.category_id === id)?.name)
    .filter((name): name is string => Boolean(name))
    .map(normalizeText);
}

// --------------------------------------------------------------------------
// İLERİDE İSTERSENİZ: Supabase'den canlı çekmek için yukarıdaki CATEGORIES /
// BRANDS sabitlerini şu şekilde bir useEffect ile değiştirebilirsiniz
// (projenizde zaten bir supabase client'ı olduğunu varsayarak):
//
//   const [categories, setCategories] = useState<CategoryRow[]>([]);
//   useEffect(() => {
//     supabase.from('categories').select('*').then(({ data }) => {
//       if (data) setCategories(data);
//     });
//   }, []);
//
// Bu durumda getChildren/getMenuColumns/getLeafDescendantIds fonksiyonlarını
// da parametre olarak bir CategoryRow[] alacak şekilde küçük bir düzenlemeden
// geçirmeniz gerekir. Şimdilik sabit veri, en az riskli başlangıç noktası.
// --------------------------------------------------------------------------
