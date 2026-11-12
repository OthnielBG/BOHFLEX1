-- ============================================================================
-- BOLOU and CO — Mise à jour n°3
--   1. Photos des produits (remplace maj-02-photos.sql, inutile de l'exécuter)
--   2. Une closeuse par activité (sacoches / semelles)
--   3. Catalogue des 5 sacoches
--
-- À exécuter UNE fois dans Supabase : SQL Editor > New query > coller > Run.
-- Sans danger : ne supprime aucune donnée, peut être relancé.
-- ============================================================================

-- ---------------------------------------------------------------------------
-- 1. Photos des produits
-- ---------------------------------------------------------------------------
do $$
begin
  if not exists (select 1 from information_schema.columns
                 where table_schema = 'public' and table_name = 'products' and column_name = 'image_url') then
    alter table public.products add column image_url text not null default '';
  end if;
  if not exists (select 1 from information_schema.columns
                 where table_schema = 'public' and table_name = 'variants' and column_name = 'image_url') then
    alter table public.variants add column image_url text not null default '';
  end if;
end $$;

grant insert (product_id, label, alert_threshold, sort, active, image_url) on public.variants to authenticated;
grant update (label, alert_threshold, sort, active, image_url) on public.variants to authenticated;

insert into storage.buckets (id, name, public, file_size_limit, allowed_mime_types)
values ('produits', 'produits', true, 2097152, array['image/jpeg','image/png','image/webp'])
on conflict (id) do update set public = true;

drop policy if exists produits_lecture on storage.objects;
create policy produits_lecture on storage.objects for select
  using (bucket_id = 'produits');
drop policy if exists produits_envoi on storage.objects;
create policy produits_envoi on storage.objects for insert to authenticated
  with check (bucket_id = 'produits' and public.has_role('gerant','stock'));
drop policy if exists produits_modif on storage.objects;
create policy produits_modif on storage.objects for update to authenticated
  using (bucket_id = 'produits' and public.has_role('gerant','stock'));
drop policy if exists produits_suppr on storage.objects;
create policy produits_suppr on storage.objects for delete to authenticated
  using (bucket_id = 'produits' and public.has_role('gerant','stock'));

-- ---------------------------------------------------------------------------
-- 2. Une closeuse par activité
--    profiles.univers : 'passion' (sacoches), 'bienetre' (semelles) ou vide = les deux.
--    Une closeuse ne voit et ne traite que les commandes et prospects de son activité.
-- ---------------------------------------------------------------------------
do $$
begin
  if not exists (select 1 from information_schema.columns
                 where table_schema = 'public' and table_name = 'profiles' and column_name = 'univers') then
    alter table public.profiles add column univers text check (univers in ('passion','bienetre'));
  end if;
end $$;

create or replace function public.my_univers() returns text
language sql stable security definer set search_path = public as $$
  select univers from public.profiles where id = auth.uid() and active
$$;

-- vrai si l'utilisateur peut travailler sur cette activité
create or replace function public.can_univers(u text) returns boolean
language sql stable security definer set search_path = public as $$
  select case
    when public.has_role('gerant','stock') then true
    when public.has_role('closeuse') then coalesce(public.my_univers() is null or public.my_univers() = u, false)
    else false end
$$;

drop policy if exists orders_read on public.orders;
create policy orders_read on public.orders for select to authenticated
  using (public.can_univers(univers) or (public.has_role('livreur') and courier_id = auth.uid()));

drop policy if exists contacts_rw on public.contacts;
create policy contacts_rw on public.contacts for all to authenticated
  using (public.has_role('gerant','closeuse') and public.can_univers(univers))
  with check (public.has_role('gerant','closeuse') and public.can_univers(univers));

-- Rôle, activation et activité d'un membre (gérant)
drop function if exists public.set_member(uuid, text, boolean);
create or replace function public.set_member(p_user uuid, p_role text, p_active boolean, p_univers text default null)
returns void language plpgsql security definer set search_path = public as $$
begin
  if not public.has_role('gerant') then raise exception 'Accès refusé'; end if;
  if p_user = auth.uid() and (p_role is distinct from 'gerant' or not p_active) then
    raise exception 'Vous ne pouvez pas retirer vos propres droits de gérant';
  end if;
  if p_role is not null and p_role not in ('gerant','closeuse','livreur','stock') then raise exception 'Rôle inconnu'; end if;
  if p_univers is not null and p_univers not in ('passion','bienetre') then raise exception 'Activité inconnue'; end if;
  update public.profiles set role = p_role, active = coalesce(p_active, false), univers = p_univers where id = p_user;
end $$;

-- Garde-fous dans les fonctions de commande : une closeuse ne touche qu'à son activité
create or replace function public.check_univers_access(p_univers text) returns void
language plpgsql stable security definer set search_path = public as $$
begin
  if public.has_role('closeuse') and not public.can_univers(p_univers) then
    raise exception 'Cette commande appartient à l''autre activité';
  end if;
end $$;

do $$
declare src text;
begin
  -- save_order : contrôle de l'activité au début
  select pg_get_functiondef('public.save_order(jsonb)'::regprocedure) into src;
  if position('check_univers_access' in src) = 0 then
    src := replace(src,
      'if not public.has_role(''gerant'',''closeuse'') then raise exception ''Accès refusé''; end if;',
      'if not public.has_role(''gerant'',''closeuse'') then raise exception ''Accès refusé''; end if;
  perform public.check_univers_access(p->>''univers'');
  if nullif(p->>''id'','''') is not null then
    perform public.check_univers_access((select univers from public.orders where id = (p->>''id'')::uuid));
  end if;');
    execute src;
  end if;
  -- set_order_status : contrôle de l'activité de la commande
  select pg_get_functiondef('public.set_order_status(uuid,text,text,integer,uuid,integer,date)'::regprocedure) into src;
  if position('check_univers_access' in src) = 0 then
    src := replace(src,
      'if r is null or r = ''stock'' then raise exception ''Accès refusé''; end if;',
      'if r is null or r = ''stock'' then raise exception ''Accès refusé''; end if;
  perform public.check_univers_access(o.univers);');
    execute src;
  end if;
end $$;

revoke execute on function public.my_univers(), public.can_univers(text), public.check_univers_access(text) from public, anon;
grant execute on function public.my_univers(), public.can_univers(text) to authenticated;
grant execute on function public.set_member(uuid, text, boolean, text) to authenticated;

-- ---------------------------------------------------------------------------
-- 3. Catalogue des sacoches (couleur unique pour chaque modèle)
--    Les photos sont fournies avec l'application (dossier gestion/produits).
--    Coût d'achat à compléter dans Stock > crayon.
-- ---------------------------------------------------------------------------
do $$
declare
  r record; pid uuid;
begin
  for r in select * from (values
    ('Sacoche Tommy Hilfiger', 15000, 'produits/sacoche-tommy-hilfiger.jpg', 1),
    ('Sacoche Zara',           15000, 'produits/sacoche-zara.jpg',           2),
    ('Sacoche Lacoste',        15000, 'produits/sacoche-lacoste.jpg',        3),
    ('Sacoche Ranger (antivol)', 12500, 'produits/sacoche-ranger.jpg',       4),
    ('Sacoche Milan',          12500, 'produits/sacoche-milan.jpg',          5)
  ) as t(name, price, img, ord) loop
    select id into pid from public.products where univers = 'passion' and name = r.name;
    if pid is null then
      insert into public.products (univers, name, sale_price, image_url, created_at)
      values ('passion', r.name, r.price, r.img, now() + (r.ord || ' seconds')::interval)
      returning id into pid;
      insert into public.product_costs (product_id, cost_price) values (pid, 0) on conflict do nothing;
      insert into public.variants (product_id, label, alert_threshold, sort) values (pid, 'Unique', 2, 1);
    elsif (select image_url from public.products where id = pid) = '' then
      update public.products set image_url = r.img where id = pid;
    end if;
  end loop;
end $$;

-- Photo de la semelle (si aucune n'a encore été mise)
update public.products set image_url = 'produits/semelle-bohflex.jpg'
where univers = 'bienetre' and name = 'Semelle BOHFLEX' and image_url = '';
