-- 1. pgvector eklentisini aktif et
CREATE EXTENSION IF NOT EXISTS vector;

-- 2. products tablosuna 1536 boyutlu embedding sütununu ekle
ALTER TABLE public.products ADD COLUMN IF NOT EXISTS embedding vector(1536);

-- 3. Arama hızını artırmak için HNSW indeksi oluştur
CREATE INDEX IF NOT EXISTS products_hnsw_idx 
ON public.products 
USING hnsw (embedding vector_cosine_ops);

-- 4. Vektör benzerlik araması yapacak RPC fonksiyonunu oluştur
CREATE OR REPLACE FUNCTION match_products (
  query_embedding vector(1536),
  match_threshold float,
  match_count int
)
RETURNS TABLE (
  id integer,
  brand_id integer,
  category_id integer,
  universal_name varchar,
  image_url text,
  similarity float
)
LANGUAGE plpgsql AS $$
BEGIN
  RETURN QUERY
  SELECT
    products.id,
    products.brand_id,
    products.category_id,
    products.universal_name,
    products.image_url,
    1 - (products.embedding <=> query_embedding) AS similarity
  FROM products
  WHERE products.embedding IS NOT NULL AND 1 - (products.embedding <=> query_embedding) > match_threshold
  ORDER BY products.embedding <=> query_embedding
  LIMIT match_count;
END;
$$;
