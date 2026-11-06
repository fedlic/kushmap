begin;

create schema if not exists private;

create or replace function private.is_admin()
returns boolean
language sql
stable
security definer
set search_path = ''
as $$
  select exists (
    select 1
    from public.admins
    where user_id = (select auth.uid())
  );
$$;

create or replace function private.owns_shop(p_shop_id uuid)
returns boolean
language sql
stable
security definer
set search_path = ''
as $$
  select exists (
    select 1
    from public.shop_owners
    where shop_id = p_shop_id
      and user_id = (select auth.uid())
  );
$$;

create or replace function private.shop_is_unclaimed(p_shop_id uuid)
returns boolean
language sql
stable
security definer
set search_path = ''
as $$
  select not exists (
    select 1
    from public.shop_owners
    where shop_id = p_shop_id
  );
$$;

revoke all on function private.is_admin() from public;
revoke all on function private.owns_shop(uuid) from public;
revoke all on function private.shop_is_unclaimed(uuid) from public;
grant usage on schema private to authenticated;
grant execute on function private.is_admin() to authenticated;
grant execute on function private.owns_shop(uuid) to authenticated;
grant execute on function private.shop_is_unclaimed(uuid) to authenticated;

-- Production drifted from 003_admin_support.sql and may not have this column.
alter table public.shops
  add column if not exists is_hidden boolean default false;

alter table public.shops enable row level security;
alter table public.shop_images enable row level security;
alter table public.products enable row level security;
alter table public.reviews enable row level security;
alter table public.bookmarks enable row level security;
alter table public.shop_owners enable row level security;
alter table public.admins enable row level security;

-- The product supports one account claiming a shop. Enforce that invariant
-- in the database as well as in the RLS check so concurrent claims cannot
-- create multiple owners for the same shop.
create unique index if not exists shop_owners_one_owner_per_shop
  on public.shop_owners (shop_id);

-- Replace the effective policy set. This removes any permissive dashboard
-- policies that are not represented in source control, including the policy
-- currently exposing the admins row to unauthenticated requests.
do $$
declare
  policy_record record;
begin
  for policy_record in
    select schemaname, tablename, policyname
    from pg_policies
    where schemaname = 'public'
      and tablename = any (array[
        'shops',
        'shop_images',
        'products',
        'reviews',
        'bookmarks',
        'shop_owners',
        'admins'
      ])
  loop
    execute format(
      'drop policy %I on %I.%I',
      policy_record.policyname,
      policy_record.schemaname,
      policy_record.tablename
    );
  end loop;
end;
$$;

drop function if exists public.is_admin();

create policy "public read visible shops"
  on public.shops for select
  to anon, authenticated
  using (is_hidden is not true);

create policy "owners read own shops"
  on public.shops for select
  to authenticated
  using (private.owns_shop(id));

create policy "admins read all shops"
  on public.shops for select
  to authenticated
  using ((select private.is_admin()));

create policy "owners update own shops"
  on public.shops for update
  to authenticated
  using (private.owns_shop(id))
  with check (private.owns_shop(id));

create policy "admins update shops"
  on public.shops for update
  to authenticated
  using ((select private.is_admin()))
  with check ((select private.is_admin()));

create policy "admins delete shops"
  on public.shops for delete
  to authenticated
  using ((select private.is_admin()));

create policy "public read shop images"
  on public.shop_images for select
  to anon, authenticated
  using (true);

create policy "owners insert shop images"
  on public.shop_images for insert
  to authenticated
  with check (private.owns_shop(shop_id) or (select private.is_admin()));

create policy "owners update shop images"
  on public.shop_images for update
  to authenticated
  using (private.owns_shop(shop_id) or (select private.is_admin()))
  with check (private.owns_shop(shop_id) or (select private.is_admin()));

create policy "owners delete shop images"
  on public.shop_images for delete
  to authenticated
  using (private.owns_shop(shop_id) or (select private.is_admin()));

create policy "public read products"
  on public.products for select
  to anon, authenticated
  using (true);

create policy "owners insert products"
  on public.products for insert
  to authenticated
  with check (private.owns_shop(shop_id) or (select private.is_admin()));

create policy "owners update products"
  on public.products for update
  to authenticated
  using (private.owns_shop(shop_id) or (select private.is_admin()))
  with check (private.owns_shop(shop_id) or (select private.is_admin()));

create policy "owners delete products"
  on public.products for delete
  to authenticated
  using (private.owns_shop(shop_id) or (select private.is_admin()));

create policy "public read unflagged reviews"
  on public.reviews for select
  to anon, authenticated
  using (is_flagged is not true);

create policy "users read own reviews"
  on public.reviews for select
  to authenticated
  using (user_id = (select auth.uid()));

create policy "users insert own reviews"
  on public.reviews for insert
  to authenticated
  with check (user_id = (select auth.uid()));

create policy "users update own reviews"
  on public.reviews for update
  to authenticated
  using (user_id = (select auth.uid()))
  with check (user_id = (select auth.uid()));

create policy "users delete own reviews"
  on public.reviews for delete
  to authenticated
  using (user_id = (select auth.uid()));

create policy "admins read all reviews"
  on public.reviews for select
  to authenticated
  using ((select private.is_admin()));

create policy "admins update reviews"
  on public.reviews for update
  to authenticated
  using ((select private.is_admin()))
  with check ((select private.is_admin()));

create policy "admins delete reviews"
  on public.reviews for delete
  to authenticated
  using ((select private.is_admin()));

create policy "users read own bookmarks"
  on public.bookmarks for select
  to authenticated
  using (user_id = (select auth.uid()));

create policy "users insert own bookmarks"
  on public.bookmarks for insert
  to authenticated
  with check (user_id = (select auth.uid()));

create policy "users delete own bookmarks"
  on public.bookmarks for delete
  to authenticated
  using (user_id = (select auth.uid()));

create policy "admins read bookmarks"
  on public.bookmarks for select
  to authenticated
  using ((select private.is_admin()));

create policy "owners read own ownership"
  on public.shop_owners for select
  to authenticated
  using (user_id = (select auth.uid()));

create policy "admins read all ownership"
  on public.shop_owners for select
  to authenticated
  using ((select private.is_admin()));

create policy "users claim unowned shops"
  on public.shop_owners for insert
  to authenticated
  with check (
    user_id = (select auth.uid())
    and private.shop_is_unclaimed(shop_id)
  );

create policy "admins read own marker"
  on public.admins for select
  to authenticated
  using (user_id = (select auth.uid()));

revoke all privileges on public.admins from anon, authenticated;
grant select on public.admins to authenticated;

revoke all privileges on public.shops from anon, authenticated;
grant select on public.shops to anon, authenticated;
grant update, delete on public.shops to authenticated;

revoke all privileges on public.shop_images, public.products from anon, authenticated;
grant select on public.shop_images, public.products to anon, authenticated;
grant insert, update, delete on public.shop_images, public.products to authenticated;

revoke all privileges on public.reviews from anon, authenticated;
grant select on public.reviews to anon, authenticated;
grant insert, update, delete on public.reviews to authenticated;

revoke all privileges on public.bookmarks from anon, authenticated;
grant select, insert, delete on public.bookmarks to authenticated;

revoke all privileges on public.shop_owners from anon, authenticated;
grant select, insert on public.shop_owners to authenticated;

-- google_reviews exists in production but is missing from the original
-- migrations. Keep it public-read and server-managed if present.
do $$
declare
  policy_record record;
begin
  if to_regclass('public.google_reviews') is null then
    return;
  end if;

  execute 'alter table public.google_reviews enable row level security';

  for policy_record in
    select policyname
    from pg_policies
    where schemaname = 'public' and tablename = 'google_reviews'
  loop
    execute format(
      'drop policy %I on public.google_reviews',
      policy_record.policyname
    );
  end loop;

  execute 'create policy "public read google reviews" on public.google_reviews for select to anon, authenticated using (true)';
  execute 'revoke all privileges on public.google_reviews from anon, authenticated';
  execute 'grant select on public.google_reviews to anon, authenticated';
end;
$$;

-- Functions called only by triggers or server jobs do not need browser RPC
-- access. Pin search paths to remove caller-controlled name resolution.
alter function public.update_shop_location() set search_path = public;
revoke all on function public.update_shop_location()
  from public, anon, authenticated;

alter function public.nearby_shops(
  double precision,
  double precision,
  double precision
) set search_path = public;

do $$
begin
  if to_regprocedure('public.update_premium_status()') is not null then
    execute 'alter function public.update_premium_status() set search_path = public';
    execute 'revoke all on function public.update_premium_status() from public, anon, authenticated';
    execute 'grant execute on function public.update_premium_status() to service_role';
  end if;

  if to_regprocedure('public.rls_auto_enable()') is not null then
    execute 'revoke all on function public.rls_auto_enable() from public, anon, authenticated';
  end if;
end;
$$;

commit;
