-- 1. Products tablosuna açıklama, içerik listesi ve uygun cilt tipi sütunlarını ekle
ALTER TABLE public.products ADD COLUMN IF NOT EXISTS description text;
ALTER TABLE public.products ADD COLUMN IF NOT EXISTS ingredients text;
ALTER TABLE public.products ADD COLUMN IF NOT EXISTS suitable_for text;

-- 2. Postgrest şema önbelleğini yenile
NOTIFY pgrst, 'reload schema';
