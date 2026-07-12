alter table public.product_skin_types enable row level security;
alter table public.product_skin_concerns enable row level security;
alter table public.product_hair_types enable row level security;
alter table public.tags enable row level security;
alter table public.product_tags enable row level security;

create policy "Public can view product skin types"
on public.product_skin_types
for select
to anon, authenticated
using (true);

create policy "Public can view product skin concerns"
on public.product_skin_concerns
for select
to anon, authenticated
using (true);

create policy "Public can view product hair types"
on public.product_hair_types
for select
to anon, authenticated
using (true);

create policy "Public can view tags"
on public.tags
for select
to anon, authenticated
using (true);

create policy "Public can view product tags"
on public.product_tags
for select
to anon, authenticated
using (true);