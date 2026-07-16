-- 1. Disable RLS on onboarding and tagging tables for testing purposes
ALTER TABLE public.skin_types DISABLE ROW LEVEL SECURITY;
ALTER TABLE public.hair_types DISABLE ROW LEVEL SECURITY;
ALTER TABLE public.skin_concerns DISABLE ROW LEVEL SECURITY;
ALTER TABLE public.user_profiles DISABLE ROW LEVEL SECURITY;
ALTER TABLE public.user_skin_concerns DISABLE ROW LEVEL SECURITY;
ALTER TABLE public.product_skin_types DISABLE ROW LEVEL SECURITY;
ALTER TABLE public.product_hair_types DISABLE ROW LEVEL SECURITY;
ALTER TABLE public.product_skin_concerns DISABLE ROW LEVEL SECURITY;
ALTER TABLE public.product_tags DISABLE ROW LEVEL SECURITY;

-- 2. Seed data for onboarding tables
INSERT INTO public.skin_types (name) VALUES 
    ('Normal'),
    ('Kuru'),
    ('Yağlı'),
    ('Karma'),
    ('Hassas')
ON CONFLICT (name) DO NOTHING;

INSERT INTO public.hair_types (name) VALUES 
    ('Normal'),
    ('Kuru'),
    ('Yağlı'),
    ('Boyalı'),
    ('İnce Telli'),
    ('Kalın Telli'),
    ('Kıvırcık'),
    ('Kepekli')
ON CONFLICT (name) DO NOTHING;

INSERT INTO public.skin_concerns (name) VALUES 
    ('Akne'),
    ('Leke'),
    ('Kuruluk'),
    ('Siyah Nokta'),
    ('Kızarıklık'),
    ('Yaşlanma Karşıtı')
ON CONFLICT (name) DO NOTHING;
