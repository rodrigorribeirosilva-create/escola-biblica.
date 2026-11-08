-- Escola Bíblica: estrutura inicial do banco Supabase
-- Execute este arquivo no SQL Editor do projeto Supabase quando o banco estiver definido.

create table if not exists public.profiles (
  id uuid primary key references auth.users(id) on delete cascade,
  full_name text,
  role text not null default 'student' check (role in ('student', 'admin')),
  created_at timestamptz not null default now()
);

create table if not exists public.courses (
  id uuid primary key default gen_random_uuid(),
  title text not null,
  description text,
  cover_url text,
  level text not null default 'Iniciante',
  is_published boolean not null default false,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create table if not exists public.modules (
  id uuid primary key default gen_random_uuid(),
  course_id uuid not null references public.courses(id) on delete cascade,
  title text not null,
  description text,
  position integer not null default 0,
  created_at timestamptz not null default now()
);

create table if not exists public.lessons (
  id uuid primary key default gen_random_uuid(),
  module_id uuid not null references public.modules(id) on delete cascade,
  title text not null,
  description text,
  video_url text,
  content text,
  duration_minutes integer not null default 0 check (duration_minutes >= 0),
  position integer not null default 0,
  is_preview boolean not null default false,
  created_at timestamptz not null default now()
);

create table if not exists public.enrollments (
  id uuid primary key default gen_random_uuid(),
  student_id uuid not null references public.profiles(id) on delete cascade,
  course_id uuid not null references public.courses(id) on delete cascade,
  status text not null default 'active' check (status in ('active', 'cancelled', 'completed')),
  enrolled_at timestamptz not null default now(),
  unique (student_id, course_id)
);

create table if not exists public.lesson_progress (
  id uuid primary key default gen_random_uuid(),
  student_id uuid not null references public.profiles(id) on delete cascade,
  lesson_id uuid not null references public.lessons(id) on delete cascade,
  completed boolean not null default false,
  completed_at timestamptz,
  updated_at timestamptz not null default now(),
  unique (student_id, lesson_id)
);

-- Cria automaticamente o perfil básico quando alguém se cadastra.
create or replace function public.handle_new_user()
returns trigger
language plpgsql
security definer
set search_path = ''
as $$
begin
  insert into public.profiles (id, full_name)
  values (new.id, coalesce(new.raw_user_meta_data ->> 'full_name', ''));
  return new;
end;
$$;

drop trigger if exists on_auth_user_created on auth.users;
create trigger on_auth_user_created
  after insert on auth.users
  for each row execute procedure public.handle_new_user();

-- RLS: todas as tabelas expostas ficam protegidas.
alter table public.profiles enable row level security;
alter table public.courses enable row level security;
alter table public.modules enable row level security;
alter table public.lessons enable row level security;
alter table public.enrollments enable row level security;
alter table public.lesson_progress enable row level security;

-- O aluno só consulta o próprio perfil. A função administrativa será atribuída
-- manualmente pelo proprietário no banco, nunca pelo formulário público.
create policy "profile_select_own" on public.profiles
for select to authenticated using (id = (select auth.uid()));

create policy "courses_read_published" on public.courses
for select to anon, authenticated using (is_published = true);

create policy "courses_admin_all" on public.courses
for all to authenticated
using (exists (select 1 from public.profiles p where p.id = (select auth.uid()) and p.role = 'admin'))
with check (exists (select 1 from public.profiles p where p.id = (select auth.uid()) and p.role = 'admin'));

create policy "modules_read_published_courses" on public.modules
for select to anon, authenticated
using (exists (select 1 from public.courses c where c.id = course_id and c.is_published = true));

create policy "modules_admin_all" on public.modules
for all to authenticated
using (exists (select 1 from public.profiles p where p.id = (select auth.uid()) and p.role = 'admin'))
with check (exists (select 1 from public.profiles p where p.id = (select auth.uid()) and p.role = 'admin'));

create policy "lessons_read_preview_or_enrolled" on public.lessons
for select to anon, authenticated
using (
  is_preview = true
  or exists (
    select 1 from public.modules m
    join public.courses c on c.id = m.course_id
    where m.id = module_id and c.is_published = true
  )
  and exists (
    select 1 from public.enrollments e
    where e.student_id = (select auth.uid())
      and e.status = 'active'
      and e.course_id = (select m.course_id from public.modules m where m.id = module_id)
  )
);

create policy "lessons_admin_all" on public.lessons
for all to authenticated
using (exists (select 1 from public.profiles p where p.id = (select auth.uid()) and p.role = 'admin'))
with check (exists (select 1 from public.profiles p where p.id = (select auth.uid()) and p.role = 'admin'));

create policy "enrollments_read_own_or_admin" on public.enrollments
for select to authenticated
using (
  student_id = (select auth.uid())
  or exists (select 1 from public.profiles p where p.id = (select auth.uid()) and p.role = 'admin')
);

create policy "enrollments_admin_manage" on public.enrollments
for all to authenticated
using (exists (select 1 from public.profiles p where p.id = (select auth.uid()) and p.role = 'admin'))
with check (exists (select 1 from public.profiles p where p.id = (select auth.uid()) and p.role = 'admin'));

create policy "progress_read_own_or_admin" on public.lesson_progress
for select to authenticated
using (
  student_id = (select auth.uid())
  or exists (select 1 from public.profiles p where p.id = (select auth.uid()) and p.role = 'admin')
);

create policy "progress_insert_own" on public.lesson_progress
for insert to authenticated
with check (student_id = (select auth.uid()));

create policy "progress_update_own" on public.lesson_progress
for update to authenticated
using (student_id = (select auth.uid()))
with check (student_id = (select auth.uid()));

create policy "progress_admin_all" on public.lesson_progress
for all to authenticated
using (exists (select 1 from public.profiles p where p.id = (select auth.uid()) and p.role = 'admin'))
with check (exists (select 1 from public.profiles p where p.id = (select auth.uid()) and p.role = 'admin'));

-- Índices para consultas frequentes.
create index if not exists modules_course_position_idx on public.modules(course_id, position);
create index if not exists lessons_module_position_idx on public.lessons(module_id, position);
create index if not exists enrollments_student_status_idx on public.enrollments(student_id, status);
create index if not exists lesson_progress_student_idx on public.lesson_progress(student_id);
