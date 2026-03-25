create table public.searches (
  id uuid primary key default gen_random_uuid(),
  query text not null,
  search_type text not null default 'general',
  results jsonb,
  trends_data jsonb,
  linkedin_posts jsonb,
  created_at timestamptz default now()
);

alter table public.searches enable row level security;

create policy "Anyone can read searches"
  on public.searches for select
  to anon, authenticated
  using (true);

create policy "Anyone can insert searches"
  on public.searches for insert
  to anon, authenticated
  with check (true);