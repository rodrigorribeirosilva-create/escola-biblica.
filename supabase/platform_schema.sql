-- Esquema da plataforma digital atualmente usada em src/App.jsx.
-- Este arquivo é somente uma preparação. Não foi executado em nenhum projeto Supabase.
-- Execute apenas depois de o proprietário escolher e confirmar o projeto de destino.

create table if not exists public.profiles (
  id uuid primary key references auth.users(id) on delete cascade,
  full_name text not null default '',
  role text not null default 'student' check (role in ('student', 'admin')),
  created_at timestamptz not null default now()
);

create table if not exists public.digital_products (
  id uuid primary key default gen_random_uuid(),
  title text not null,
  description text not null default '',
  product_type text not null default 'curso'
    check (product_type in ('curso', 'ebook', 'documentario', 'video')),
  cover_url text,
  price numeric(12,2) not null default 0 check (price >= 0),
  youtube_url text,
  slug text not null unique,
  is_published boolean not null default false,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

-- O conteúdo Pix/WhatsApp é exibido na página pública por decisão do produto.
create table if not exists public.store_settings (
  id boolean primary key default true check (id = true),
  display_name text not null default 'Luciano de Brito',
  pix_key text not null default '',
  pix_holder text not null default 'Luciano de Brito',
  whatsapp text not null default '',
  updated_at timestamptz not null default now()
);

-- Os tokens são gerados no navegador com 32 bytes criptograficamente aleatórios
-- (64 caracteres hexadecimais). A tabela inteira fica restrita a administradores.
create table if not exists public.customer_access (
  id uuid primary key default gen_random_uuid(),
  product_id uuid not null references public.digital_products(id) on delete cascade,
  buyer_name text not null,
  buyer_email text not null default '',
  buyer_whatsapp text not null default '',
  access_token text not null unique
    check (access_token ~ '^[a-f0-9]{64}$'),
  is_active boolean not null default true,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create table if not exists public.library_files (
  id uuid primary key default gen_random_uuid(),
  file_name text not null,
  object_path text not null unique,
  content_type text,
  file_size bigint not null default 0
    check (file_size >= 0 and file_size <= 104857600),
  created_by uuid not null references public.profiles(id),
  created_at timestamptz not null default now()
);

-- O perfil nasce como student. O formulário público nunca escolhe a função.
create or replace function public.handle_new_user()
returns trigger
language plpgsql
security definer
set search_path = ''
as $$
begin
  insert into public.profiles (id, full_name, role)
  values (
    new.id,
    coalesce(new.raw_user_meta_data ->> 'full_name', ''),
    'student'
  );
  return new;
end;
$$;

revoke all on function public.handle_new_user() from public, anon, authenticated;
drop trigger if exists on_auth_user_created on auth.users;
create trigger on_auth_user_created
  after insert on auth.users
  for each row execute procedure public.handle_new_user();

-- RLS habilitado em todas as tabelas do schema public usadas pela aplicação.
alter table public.profiles enable row level security;
alter table public.digital_products enable row level security;
alter table public.store_settings enable row level security;
alter table public.customer_access enable row level security;
alter table public.library_files enable row level security;

drop policy if exists profiles_read_own on public.profiles;
create policy profiles_read_own on public.profiles
for select to authenticated
using (id = (select auth.uid()));

drop policy if exists digital_products_public_read on public.digital_products;
create policy digital_products_public_read on public.digital_products
for select to anon, authenticated
using (is_published = true);

drop policy if exists digital_products_admin_manage on public.digital_products;
create policy digital_products_admin_manage on public.digital_products
for all to authenticated
using (
  exists (
    select 1 from public.profiles p
    where p.id = (select auth.uid()) and p.role = 'admin'
  )
)
with check (
  exists (
    select 1 from public.profiles p
    where p.id = (select auth.uid()) and p.role = 'admin'
  )
);

drop policy if exists store_settings_public_read on public.store_settings;
create policy store_settings_public_read on public.store_settings
for select to anon, authenticated
using (true);

drop policy if exists store_settings_admin_manage on public.store_settings;
create policy store_settings_admin_manage on public.store_settings
for all to authenticated
using (
  exists (
    select 1 from public.profiles p
    where p.id = (select auth.uid()) and p.role = 'admin'
  )
)
with check (
  exists (
    select 1 from public.profiles p
    where p.id = (select auth.uid()) and p.role = 'admin'
  )
);

drop policy if exists customer_access_admin_manage on public.customer_access;
create policy customer_access_admin_manage on public.customer_access
for all to authenticated
using (
  exists (
    select 1 from public.profiles p
    where p.id = (select auth.uid()) and p.role = 'admin'
  )
)
with check (
  exists (
    select 1 from public.profiles p
    where p.id = (select auth.uid()) and p.role = 'admin'
  )
);

drop policy if exists library_files_admin_manage on public.library_files;
create policy library_files_admin_manage on public.library_files
for all to authenticated
using (
  exists (
    select 1 from public.profiles p
    where p.id = (select auth.uid()) and p.role = 'admin'
  )
)
with check (
  exists (
    select 1 from public.profiles p
    where p.id = (select auth.uid()) and p.role = 'admin'
  )
);

-- Grants mínimos para a Data API. RLS continua sendo a segunda camada obrigatória.
grant usage on schema public to anon, authenticated;
grant select on public.digital_products, public.store_settings to anon, authenticated;
grant select on public.profiles to authenticated;
grant select, insert, update, delete
  on public.digital_products, public.store_settings,
     public.customer_access, public.library_files
  to authenticated;

create index if not exists customer_access_created_at_idx
  on public.customer_access(created_at desc);
create index if not exists library_files_created_at_idx
  on public.library_files(created_at desc);

-- Biblioteca privada: somente administradores podem enviar, listar, criar URL
-- assinada ou excluir objetos. A aplicação nunca usa URL pública para estes arquivos.
insert into storage.buckets (id, name, public, file_size_limit)
values ('biblioteca-digital', 'biblioteca-digital', false, 104857600)
on conflict (id) do update
set public = false, file_size_limit = 104857600;

drop policy if exists biblioteca_admin_read on storage.objects;
create policy biblioteca_admin_read on storage.objects
for select to authenticated
using (
  bucket_id = 'biblioteca-digital'
  and exists (
    select 1 from public.profiles p
    where p.id = (select auth.uid()) and p.role = 'admin'
  )
);

drop policy if exists biblioteca_admin_insert on storage.objects;
create policy biblioteca_admin_insert on storage.objects
for insert to authenticated
with check (
  bucket_id = 'biblioteca-digital'
  and exists (
    select 1 from public.profiles p
    where p.id = (select auth.uid()) and p.role = 'admin'
  )
);

drop policy if exists biblioteca_admin_update on storage.objects;
create policy biblioteca_admin_update on storage.objects
for update to authenticated
using (
  bucket_id = 'biblioteca-digital'
  and exists (
    select 1 from public.profiles p
    where p.id = (select auth.uid()) and p.role = 'admin'
  )
)
with check (
  bucket_id = 'biblioteca-digital'
  and exists (
    select 1 from public.profiles p
    where p.id = (select auth.uid()) and p.role = 'admin'
  )
);

drop policy if exists biblioteca_admin_delete on storage.objects;
create policy biblioteca_admin_delete on storage.objects
for delete to authenticated
using (
  bucket_id = 'biblioteca-digital'
  and exists (
    select 1 from public.profiles p
    where p.id = (select auth.uid()) and p.role = 'admin'
  )
);

-- IMPORTANTE:
-- 1. Não existe RPC pública para consultar customer_access por token.
-- 2. A validação do link individual é feita pela Edge Function
--    get-customer-access-content, que usa uma chave secreta apenas no servidor.
-- 3. A primeira conta só vira admin depois de promoção manual pelo proprietário,
--    diretamente no banco, nunca por user_metadata ou pelo formulário público.
