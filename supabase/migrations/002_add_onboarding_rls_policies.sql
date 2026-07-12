alter table public.user_profiles enable row level security;
alter table public.user_skin_concerns enable row level security;

create policy "Users can view own profile"
on public.user_profiles
for select
to authenticated
using (auth.uid() = user_id);

create policy "Users can insert own profile"
on public.user_profiles
for insert
to authenticated
with check (auth.uid() = user_id);

create policy "Users can update own profile"
on public.user_profiles
for update
to authenticated
using (auth.uid() = user_id)
with check (auth.uid() = user_id);

create policy "Users can delete own profile"
on public.user_profiles
for delete
to authenticated
using (auth.uid() = user_id);

create policy "Users can view own skin concerns"
on public.user_skin_concerns
for select
to authenticated
using (auth.uid() = user_id);

create policy "Users can insert own skin concerns"
on public.user_skin_concerns
for insert
to authenticated
with check (auth.uid() = user_id);

create policy "Users can delete own skin concerns"
on public.user_skin_concerns
for delete
to authenticated
using (auth.uid() = user_id);

create policy "Authenticated users can view skin types"
on public.skin_types
for select
to authenticated
using (true);

create policy "Authenticated users can view skin concerns"
on public.skin_concerns
for select
to authenticated
using (true);

create policy "Authenticated users can view hair types"
on public.hair_types
for select
to authenticated
using (true);