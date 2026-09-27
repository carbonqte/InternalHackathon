-- Civic Navigator database. Run once in Supabase: SQL Editor -> New query -> paste -> Run.
-- Steps are stored as JSON documents so the API returns exactly what the website already understands.

create table if not exists public.jurisdictions (
  state      text primary key,
  data       jsonb not null,
  updated_at timestamptz not null default now()
);

create table if not exists public.tasks (
  task_id    text primary key check (task_id ~ '^[a-z0-9-]{2,80}$'),
  meta       jsonb not null,            -- title, translations, keywords, area, category, popular, last_verified
  updated_at timestamptz not null default now()
);

create table if not exists public.steps (
  id         text primary key,
  task_id    text not null references public.tasks(task_id) on delete cascade,
  data       jsonb not null,            -- name, type, office, fee, documents, depends_on, scope, state, city, ...
  status     text not null default 'pending' check (status in ('pending', 'approved', 'rejected')),
  source_url text,                      -- the official page this step was taken from
  position   int not null default 0,    -- display order
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create index if not exists steps_task_idx on public.steps (task_id, position);
create index if not exists steps_status_idx on public.steps (status);

-- Security: deny by default. The backend uses the service-role key (bypasses these rules, server only).
-- The public anon key may only READ procedures and APPROVED steps; nobody can write through it.
alter table public.jurisdictions enable row level security;
alter table public.tasks         enable row level security;
alter table public.steps         enable row level security;

drop policy if exists "read jurisdictions" on public.jurisdictions;
create policy "read jurisdictions" on public.jurisdictions for select to anon, authenticated using (true);

drop policy if exists "read tasks" on public.tasks;
create policy "read tasks" on public.tasks for select to anon, authenticated using (true);

drop policy if exists "read approved steps" on public.steps;
create policy "read approved steps" on public.steps for select to anon, authenticated using (status = 'approved');
