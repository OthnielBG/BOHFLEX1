-- ============================================================================
-- BOLOU and CO — Base de données de l'application de gestion (Supabase)
--
-- À exécuter UNE fois dans Supabase : SQL Editor > New query > coller > Run.
-- Le script peut être relancé sans danger (il ne supprime aucune donnée).
--
-- Deux univers : 'passion' (sacoches homme) et 'bienetre' (semelles BOHFLEX).
-- Rôles : gerant (tout), closeuse (commandes + prospects, sans coûts ni finances),
--         livreur (ses livraisons uniquement), stock (stock + entrées fournisseur).
-- ============================================================================

-- ---------------------------------------------------------------------------
-- Tables
-- ---------------------------------------------------------------------------

-- Membres de l'équipe (1 ligne par compte Supabase Auth)
create table if not exists public.profiles (
  id          uuid primary key references auth.users(id) on delete cascade,
  email       text,
  full_name   text not null default '',
  phone       text not null default '',
  role        text check (role in ('gerant','closeuse','livreur','stock')),
  active      boolean not null default false,
  created_at  timestamptz not null default now()
);

-- Les deux marques (nom, WhatsApp, site) — sert aux messages WhatsApp
create table if not exists public.brands (
  univers     text primary key check (univers in ('passion','bienetre')),
  name        text not null,
  whatsapp    text not null default '',
  site_url    text not null default ''
);

create table if not exists public.products (
  id          uuid primary key default gen_random_uuid(),
  univers     text not null check (univers in ('passion','bienetre')),
  name        text not null,
  sale_price  integer not null default 0 check (sale_price >= 0),   -- prix de vente unitaire (FCFA)
  active      boolean not null default true,
  created_at  timestamptz not null default now()
);

-- Coût d'achat : table à part, visible seulement par le gérant et le stock
create table if not exists public.product_costs (
  product_id  uuid primary key references public.products(id) on delete cascade,
  cost_price  integer not null default 0 check (cost_price >= 0)    -- coût de revient unitaire (FCFA)
);

-- Variantes : pointure (semelles) ou couleur (sacoches)
create table if not exists public.variants (
  id               uuid primary key default gen_random_uuid(),
  product_id       uuid not null references public.products(id) on delete cascade,
  label            text not null,
  stock            integer not null default 0,
  alert_threshold  integer not null default 3,
  sort             integer not null default 0,
  active           boolean not null default true,
  unique (product_id, label)
);

-- Offres (semelles : 2 paires / 3 paires)
create table if not exists public.offers (
  id          uuid primary key default gen_random_uuid(),
  univers     text not null check (univers in ('passion','bienetre')),
  product_id  uuid references public.products(id) on delete cascade,
  name        text not null,
  qty         integer not null check (qty > 0),
  price       integer not null check (price >= 0),
  active      boolean not null default true
);

-- Prospects / clients : toute personne qui a contacté l'une des marques
create table if not exists public.contacts (
  id               uuid primary key default gen_random_uuid(),
  univers          text not null check (univers in ('passion','bienetre')),
  name             text not null default '',
  phone            text not null,
  city             text not null default '',
  source           text not null default 'whatsapp',
  stage            text not null default 'nouveau'
                   check (stage in ('nouveau','interesse','panier','client','perdu')),
  interest         text not null default '',
  next_followup    date,
  notes            text not null default '',
  assigned_to      uuid references public.profiles(id) on delete set null,
  last_order_at    timestamptz,
  orders_delivered integer not null default 0,
  created_at       timestamptz not null default now(),
  updated_at       timestamptz not null default now(),
  unique (univers, phone)
);

create table if not exists public.orders (
  id              uuid primary key default gen_random_uuid(),
  ref             text not null unique,
  univers         text not null check (univers in ('passion','bienetre')),
  contact_id      uuid references public.contacts(id) on delete set null,
  customer_name   text not null default '',
  phone           text not null,
  city            text not null default '',
  address         text not null default '',
  source          text not null default 'whatsapp',   -- site, whatsapp, facebook, tiktok, instagram, autre
  mode            text not null default 'abidjan' check (mode in ('abidjan','expedition')),
  offer_id        uuid references public.offers(id) on delete set null,
  total_amount    integer not null default 0 check (total_amount >= 0),  -- montant total payé par le client
  prepaid_amount  integer not null default 0 check (prepaid_amount >= 0), -- avance Mobile Money (expédition)
  collected_amount integer not null default 0 check (collected_amount >= 0), -- encaissé par le livreur
  delivery_cost   integer not null default 0 check (delivery_cost >= 0),  -- payé au livreur / transport
  courier_id      uuid references public.profiles(id) on delete set null,
  status          text not null default 'nouvelle'
                  check (status in ('nouvelle','injoignable','confirmee','en_livraison','livree','retour','annulee')),
  stock_out       boolean not null default false,  -- le stock a été sorti pour cette commande
  notes           text not null default '',
  utm             text not null default '',
  delivery_date   date,
  created_by      uuid references public.profiles(id) on delete set null,
  created_at      timestamptz not null default now(),
  updated_at      timestamptz not null default now(),
  confirmed_at    timestamptz,
  delivered_at    timestamptz
);
create index if not exists orders_status_idx on public.orders(status);
create index if not exists orders_courier_idx on public.orders(courier_id);
create index if not exists orders_created_idx on public.orders(created_at);

create table if not exists public.order_items (
  id          uuid primary key default gen_random_uuid(),
  order_id    uuid not null references public.orders(id) on delete cascade,
  variant_id  uuid not null references public.variants(id),
  qty         integer not null check (qty > 0),
  unit_price  integer not null default 0
);
create index if not exists order_items_order_idx on public.order_items(order_id);

-- Coût des produits vendus par commande (gérant uniquement)
create table if not exists public.order_costs (
  order_id    uuid primary key references public.orders(id) on delete cascade,
  cogs        integer not null default 0
);

create table if not exists public.order_events (
  id          bigserial primary key,
  order_id    uuid not null references public.orders(id) on delete cascade,
  at          timestamptz not null default now(),
  by_user     uuid references public.profiles(id) on delete set null,
  status      text,
  note        text not null default ''
);
create index if not exists order_events_order_idx on public.order_events(order_id);

create table if not exists public.stock_movements (
  id          bigserial primary key,
  variant_id  uuid not null references public.variants(id) on delete cascade,
  qty         integer not null,                        -- + entrée / − sortie
  kind        text not null check (kind in ('entree','vente','retour','ajustement')),
  order_id    uuid references public.orders(id) on delete set null,
  note        text not null default '',
  by_user     uuid references public.profiles(id) on delete set null,
  at          timestamptz not null default now()
);

-- Argent reversé par un livreur au gérant
create table if not exists public.remittances (
  id          uuid primary key default gen_random_uuid(),
  courier_id  uuid not null references public.profiles(id) on delete cascade,
  amount      integer not null check (amount > 0),
  at          date not null default current_date,
  note        text not null default '',
  received_by uuid references public.profiles(id) on delete set null,
  created_at  timestamptz not null default now()
);

-- Dépenses (pub, salaires, achats de stock…)
create table if not exists public.expenses (
  id          uuid primary key default gen_random_uuid(),
  univers     text not null check (univers in ('passion','bienetre','commun')),
  category    text not null check (category in ('pub_meta','pub_tiktok','pub_autre','achat_stock','transport',
                                                  'salaire','emballage','telephone','autre')),
  amount      integer not null check (amount > 0),
  at          date not null default current_date,
  label       text not null default '',
  created_by  uuid references public.profiles(id) on delete set null,
  created_at  timestamptz not null default now()
);

-- ---------------------------------------------------------------------------
-- Fonctions d'aide (rôle de l'utilisateur connecté)
-- ---------------------------------------------------------------------------
create or replace function public.my_role() returns text
language sql stable security definer set search_path = public as $$
  select role from public.profiles where id = auth.uid() and active
$$;

create or replace function public.has_role(variadic roles text[]) returns boolean
language sql stable security definer set search_path = public as $$
  select coalesce(public.my_role() = any(roles), false)
$$;

create or replace function public.norm_phone(p text) returns text
language sql immutable as $$
  -- garde les 10 derniers chiffres (numéros ivoiriens), sinon tous les chiffres
  select case when length(d) > 10 then right(d, 10) else d end
  from (select regexp_replace(coalesce(p,''), '\D', '', 'g') as d) s
$$;

-- Nouveau compte : profil créé automatiquement. Le tout premier compte devient gérant.
create or replace function public.handle_new_user() returns trigger
language plpgsql security definer set search_path = public as $$
declare first_user boolean;
begin
  select not exists (select 1 from public.profiles) into first_user;
  insert into public.profiles (id, email, full_name, role, active)
  values (new.id, new.email, coalesce(new.raw_user_meta_data->>'full_name', ''),
          case when first_user then 'gerant' else null end, first_user)
  on conflict (id) do nothing;
  return new;
end $$;

drop trigger if exists on_auth_user_created on auth.users;
create trigger on_auth_user_created after insert on auth.users
  for each row execute function public.handle_new_user();

-- Mise à jour du stock à chaque mouvement
create or replace function public.apply_stock_movement() returns trigger
language plpgsql security definer set search_path = public as $$
begin
  update public.variants set stock = stock + new.qty where id = new.variant_id;
  return new;
end $$;

drop trigger if exists stock_movement_apply on public.stock_movements;
create trigger stock_movement_apply after insert on public.stock_movements
  for each row execute function public.apply_stock_movement();

-- Sort ou remet le stock d'une commande selon son statut
create or replace function public.sync_order_stock(p_order uuid) returns void
language plpgsql security definer set search_path = public as $$
declare o public.orders; should_out boolean;
begin
  select * into o from public.orders where id = p_order for update;
  should_out := o.status in ('en_livraison','livree');
  if should_out and not o.stock_out then
    insert into public.stock_movements (variant_id, qty, kind, order_id, note, by_user)
      select variant_id, -qty, 'vente', o.id, o.ref, auth.uid() from public.order_items where order_id = o.id;
    update public.orders set stock_out = true where id = o.id;
  elsif not should_out and o.stock_out then
    insert into public.stock_movements (variant_id, qty, kind, order_id, note, by_user)
      select variant_id, qty, 'retour', o.id, o.ref || ' (' || o.status || ')', auth.uid()
      from public.order_items where order_id = o.id;
    update public.orders set stock_out = false where id = o.id;
  end if;
end $$;

-- Met à jour la fiche contact quand une commande change
create or replace function public.touch_contact_from_order(p_order uuid) returns void
language plpgsql security definer set search_path = public as $$
declare o public.orders; n integer;
begin
  select * into o from public.orders where id = p_order;
  if o.contact_id is null then return; end if;
  select count(*) into n from public.orders where contact_id = o.contact_id and status = 'livree';
  update public.contacts c set
    orders_delivered = n,
    last_order_at = greatest(coalesce(c.last_order_at, o.created_at), o.created_at),
    stage = case when n > 0 then 'client'
                 when c.stage in ('nouveau','interesse') and o.status in ('nouvelle','injoignable','confirmee','en_livraison') then 'panier'
                 else c.stage end,
    updated_at = now()
  where c.id = o.contact_id;
end $$;

-- Trouve ou crée le contact (univers + téléphone)
create or replace function public.upsert_contact(p_univers text, p_name text, p_phone text, p_city text, p_source text)
returns uuid language plpgsql security definer set search_path = public as $$
declare cid uuid; ph text := public.norm_phone(p_phone);
begin
  insert into public.contacts (univers, name, phone, city, source)
  values (p_univers, coalesce(p_name,''), ph, coalesce(p_city,''), coalesce(nullif(p_source,''),'whatsapp'))
  on conflict (univers, phone) do update set
    name = case when excluded.name <> '' then excluded.name else public.contacts.name end,
    city = case when excluded.city <> '' then excluded.city else public.contacts.city end,
    updated_at = now()
  returning id into cid;
  return cid;
end $$;

create or replace function public.make_ref(p_univers text) returns text
language sql volatile as $$
  select (case when p_univers = 'passion' then 'BCO-' else 'BHF-' end)
      || to_char(now() at time zone 'Africa/Abidjan', 'YYMMDD') || '-'
      || upper(substr(md5(random()::text || clock_timestamp()::text), 1, 4))
$$;

-- ---------------------------------------------------------------------------
-- Créer / modifier une commande (gérant, closeuse)
-- p = { id?, univers, customer_name, phone, city, address, source, mode, offer_id?,
--       total_amount, prepaid_amount, delivery_cost, courier_id?, status?, notes, delivery_date?,
--       items: [{variant_id, qty, unit_price}] }
-- ---------------------------------------------------------------------------
create or replace function public.save_order(p jsonb) returns uuid
language plpgsql security definer set search_path = public as $$
declare
  oid uuid := nullif(p->>'id','')::uuid;
  old public.orders;
  cid uuid;
  st text := coalesce(nullif(p->>'status',''), 'nouvelle');
  it jsonb;
  cogs integer;
begin
  if not public.has_role('gerant','closeuse') then raise exception 'Accès refusé'; end if;
  if jsonb_array_length(coalesce(p->'items','[]'::jsonb)) = 0 then raise exception 'La commande doit contenir au moins un article'; end if;
  if length(public.norm_phone(p->>'phone')) < 8 then raise exception 'Numéro de téléphone invalide'; end if;

  cid := public.upsert_contact(p->>'univers', p->>'customer_name', p->>'phone', p->>'city', p->>'source');

  if oid is null then
    insert into public.orders (ref, univers, contact_id, customer_name, phone, city, address, source, mode,
      offer_id, total_amount, prepaid_amount, delivery_cost, courier_id, status, notes, delivery_date, created_by,
      confirmed_at)
    values (public.make_ref(p->>'univers'), p->>'univers', cid, coalesce(p->>'customer_name',''),
      public.norm_phone(p->>'phone'), coalesce(p->>'city',''), coalesce(p->>'address',''),
      coalesce(nullif(p->>'source',''),'whatsapp'), coalesce(nullif(p->>'mode',''),'abidjan'),
      nullif(p->>'offer_id','')::uuid, coalesce((p->>'total_amount')::int,0), coalesce((p->>'prepaid_amount')::int,0),
      coalesce((p->>'delivery_cost')::int,0), nullif(p->>'courier_id','')::uuid, 'nouvelle',
      coalesce(p->>'notes',''), nullif(p->>'delivery_date','')::date, auth.uid(), null)
    returning id into oid;
    insert into public.order_events (order_id, by_user, status, note) values (oid, auth.uid(), 'nouvelle', 'Commande créée');
  else
    select * into old from public.orders where id = oid for update;
    if not found then raise exception 'Commande introuvable'; end if;
    -- on remet le stock avant de changer les articles
    if old.stock_out then
      insert into public.stock_movements (variant_id, qty, kind, order_id, note, by_user)
        select variant_id, qty, 'retour', oid, old.ref || ' (modification)', auth.uid() from public.order_items where order_id = oid;
      update public.orders set stock_out = false where id = oid;
    end if;
    update public.orders set
      univers = p->>'univers', contact_id = cid, customer_name = coalesce(p->>'customer_name',''),
      phone = public.norm_phone(p->>'phone'), city = coalesce(p->>'city',''), address = coalesce(p->>'address',''),
      source = coalesce(nullif(p->>'source',''),'whatsapp'), mode = coalesce(nullif(p->>'mode',''),'abidjan'),
      offer_id = nullif(p->>'offer_id','')::uuid, total_amount = coalesce((p->>'total_amount')::int,0),
      prepaid_amount = coalesce((p->>'prepaid_amount')::int,0), delivery_cost = coalesce((p->>'delivery_cost')::int,0),
      courier_id = nullif(p->>'courier_id','')::uuid, notes = coalesce(p->>'notes',''),
      delivery_date = nullif(p->>'delivery_date','')::date, updated_at = now()
    where id = oid;
    delete from public.order_items where order_id = oid;
    insert into public.order_events (order_id, by_user, status, note) values (oid, auth.uid(), null, 'Commande modifiée');
  end if;

  for it in select * from jsonb_array_elements(p->'items') loop
    insert into public.order_items (order_id, variant_id, qty, unit_price)
    values (oid, (it->>'variant_id')::uuid, greatest(coalesce((it->>'qty')::int,1),1), coalesce((it->>'unit_price')::int,0));
  end loop;

  select coalesce(sum(i.qty * coalesce(pc.cost_price,0)),0) into cogs
  from public.order_items i join public.variants v on v.id = i.variant_id
  left join public.product_costs pc on pc.product_id = v.product_id where i.order_id = oid;
  insert into public.order_costs (order_id, cogs) values (oid, cogs)
    on conflict (order_id) do update set cogs = excluded.cogs;

  if st <> (select status from public.orders where id = oid) then
    perform public.set_order_status(oid, st, '', null);
  else
    perform public.sync_order_stock(oid);
    perform public.touch_contact_from_order(oid);
  end if;
  return oid;
end $$;

-- ---------------------------------------------------------------------------
-- Changer le statut d'une commande
--  gérant / closeuse : tous les statuts
--  livreur : uniquement ses commandes, vers en_livraison / livree / retour
-- ---------------------------------------------------------------------------
drop function if exists public.set_order_status(uuid, text, text, integer, uuid);
create or replace function public.set_order_status(p_order uuid, p_status text, p_note text default '',
                                                   p_collected integer default null, p_courier uuid default null,
                                                   p_delivery_cost integer default null, p_delivery_date date default null)
returns void language plpgsql security definer set search_path = public as $$
declare o public.orders; r text := public.my_role();
begin
  select * into o from public.orders where id = p_order for update;
  if not found then raise exception 'Commande introuvable'; end if;
  if r is null or r = 'stock' then raise exception 'Accès refusé'; end if;
  if r = 'livreur' and (o.courier_id is distinct from auth.uid() or p_status not in ('en_livraison','livree','retour')) then
    raise exception 'Accès refusé';
  end if;
  if p_status not in ('nouvelle','injoignable','confirmee','en_livraison','livree','retour','annulee') then
    raise exception 'Statut inconnu';
  end if;

  update public.orders set
    status = p_status,
    courier_id = case when r <> 'livreur' and p_courier is not null then p_courier else courier_id end,
    delivery_cost = case when r <> 'livreur' and p_delivery_cost is not null then greatest(p_delivery_cost, 0) else delivery_cost end,
    delivery_date = case when r <> 'livreur' and p_delivery_date is not null then p_delivery_date else delivery_date end,
    confirmed_at = case when p_status = 'confirmee' and confirmed_at is null then now() else confirmed_at end,
    delivered_at = case when p_status = 'livree' then now() when p_status <> 'livree' then null else delivered_at end,
    collected_amount = case
      when p_status = 'livree' then coalesce(p_collected, greatest(total_amount - prepaid_amount, 0))
      else 0 end,
    updated_at = now()
  where id = p_order;

  insert into public.order_events (order_id, by_user, status, note)
  values (p_order, auth.uid(), p_status, coalesce(p_note,''));

  perform public.sync_order_stock(p_order);
  perform public.touch_contact_from_order(p_order);
end $$;

create or replace function public.delete_order(p_order uuid) returns void
language plpgsql security definer set search_path = public as $$
begin
  if not public.has_role('gerant') then raise exception 'Accès refusé'; end if;
  update public.orders set status = 'annulee' where id = p_order;
  perform public.sync_order_stock(p_order);
  delete from public.orders where id = p_order;
end $$;

-- ---------------------------------------------------------------------------
-- Commande venant d'un site (appelée sans connexion, avec la clé publique)
-- p = { ref, univers, offer (libellé), pairs, price, sizes ("39/40, 41/42"), color,
--       name, phone, city, address, notes, source, utm }
-- ---------------------------------------------------------------------------
create or replace function public.site_order(p jsonb) returns jsonb
language plpgsql security definer set search_path = public as $$
declare
  u text := case when p->>'univers' = 'passion' then 'passion' else 'bienetre' end;
  ph text := public.norm_phone(p->>'phone');
  cid uuid; oid uuid; off public.offers; prod uuid; v uuid; s text; lbl text;
  rf text := left(coalesce(nullif(p->>'ref',''), public.make_ref(u)), 40);
  cogs integer;
begin
  if length(ph) < 8 then raise exception 'Numéro invalide'; end if;
  if exists (select 1 from public.orders where ref = rf) then return jsonb_build_object('ok', true, 'duplicate', true); end if;
  -- anti-abus : 5 commandes max par numéro et par heure
  if (select count(*) from public.orders where phone = ph and created_at > now() - interval '1 hour') >= 5 then
    raise exception 'Trop de commandes';
  end if;

  cid := public.upsert_contact(u, left(p->>'name',120), ph, left(p->>'city',120), 'site');

  select * into off from public.offers where univers = u and active and qty = coalesce((p->>'pairs')::int, 0)
    order by price limit 1;
  select id into prod from public.products where univers = u and active order by created_at limit 1;

  insert into public.orders (ref, univers, contact_id, customer_name, phone, city, address, source, offer_id,
                             total_amount, notes, utm, status)
  values (rf, u, cid, left(coalesce(p->>'name',''),120), ph, left(coalesce(p->>'city',''),120),
          left(coalesce(p->>'address',''),300), 'site', off.id,
          coalesce(off.price, greatest(coalesce((p->>'price')::int,0),0)),
          left(trim(both ' ' from coalesce(p->>'notes','') ||
               case when coalesce(p->>'color','') <> '' then ' · Coloris : ' || (p->>'color') else '' end), 500),
          left(coalesce(p->>'utm',''),300), 'nouvelle')
  returning id into oid;

  -- une ligne par pointure / variante demandée
  foreach s in array string_to_array(coalesce(p->>'sizes',''), ',') loop
    lbl := trim(s);
    if lbl = '' then continue; end if;
    select va.id into v from public.variants va join public.products pr on pr.id = va.product_id
      where pr.univers = u and va.label = lbl and va.active order by pr.created_at limit 1;
    if v is not null then
      insert into public.order_items (order_id, variant_id, qty, unit_price)
      values (oid, v, 1, coalesce(off.price, 0) / greatest(coalesce(off.qty, 1), 1));
    end if;
  end loop;

  select coalesce(sum(i.qty * coalesce(pc.cost_price,0)),0) into cogs
  from public.order_items i join public.variants va on va.id = i.variant_id
  left join public.product_costs pc on pc.product_id = va.product_id where i.order_id = oid;
  insert into public.order_costs (order_id, cogs) values (oid, cogs);

  insert into public.order_events (order_id, status, note) values (oid, 'nouvelle', 'Commande reçue du site');
  perform public.touch_contact_from_order(oid);
  return jsonb_build_object('ok', true, 'ref', rf);
end $$;

-- Entrée / ajustement de stock (gérant, stock)
create or replace function public.stock_move(p_variant uuid, p_qty integer, p_kind text, p_note text default '')
returns void language plpgsql security definer set search_path = public as $$
begin
  if not public.has_role('gerant','stock') then raise exception 'Accès refusé'; end if;
  if p_kind not in ('entree','ajustement') then raise exception 'Type de mouvement invalide'; end if;
  if p_qty = 0 then return; end if;
  insert into public.stock_movements (variant_id, qty, kind, note, by_user)
  values (p_variant, p_qty, p_kind, coalesce(p_note,''), auth.uid());
end $$;

-- Coût d'achat d'un produit (gérant, stock)
create or replace function public.set_product_cost(p_product uuid, p_cost integer) returns void
language plpgsql security definer set search_path = public as $$
begin
  if not public.has_role('gerant','stock') then raise exception 'Accès refusé'; end if;
  insert into public.product_costs (product_id, cost_price) values (p_product, greatest(p_cost,0))
  on conflict (product_id) do update set cost_price = excluded.cost_price;
end $$;

-- Rôle et activation d'un membre (gérant). Un gérant ne peut pas se retirer lui-même ses droits.
create or replace function public.set_member(p_user uuid, p_role text, p_active boolean) returns void
language plpgsql security definer set search_path = public as $$
begin
  if not public.has_role('gerant') then raise exception 'Accès refusé'; end if;
  if p_user = auth.uid() and (p_role is distinct from 'gerant' or not p_active) then
    raise exception 'Vous ne pouvez pas retirer vos propres droits de gérant';
  end if;
  if p_role is not null and p_role not in ('gerant','closeuse','livreur','stock') then raise exception 'Rôle inconnu'; end if;
  update public.profiles set role = p_role, active = coalesce(p_active, false) where id = p_user;
end $$;

-- Livreurs : soldes (gérant)
--  encaissé  = argent collecté sur les commandes livrées
--  frais     = frais de livraison qui lui reviennent (il les garde sur l'encaissement)
--  versé     = argent déjà remis au gérant
--  dû        = encaissé − frais − versé
create or replace view public.courier_balances with (security_invoker = true) as
select p.id as courier_id, p.full_name, p.phone,
  coalesce(o.delivered, 0)  as delivered,
  coalesce(o.returned, 0)   as returned,
  coalesce(o.in_progress,0) as in_progress,
  coalesce(o.collected, 0)  as collected,
  coalesce(o.fees, 0)       as fees,
  coalesce(r.paid, 0)       as remitted,
  coalesce(o.collected, 0) - coalesce(o.fees, 0) - coalesce(r.paid, 0) as due
from public.profiles p
left join (
  select courier_id,
    count(*) filter (where status = 'livree') as delivered,
    count(*) filter (where status = 'retour') as returned,
    count(*) filter (where status = 'en_livraison') as in_progress,
    sum(collected_amount) filter (where status = 'livree') as collected,
    sum(delivery_cost) filter (where status in ('livree','retour')) as fees
  from public.orders where courier_id is not null group by courier_id
) o on o.courier_id = p.id
left join (select courier_id, sum(amount) as paid from public.remittances group by courier_id) r on r.courier_id = p.id
where p.role = 'livreur';

-- ---------------------------------------------------------------------------
-- Sécurité (Row Level Security)
-- ---------------------------------------------------------------------------
alter table public.profiles        enable row level security;
alter table public.brands          enable row level security;
alter table public.products        enable row level security;
alter table public.product_costs   enable row level security;
alter table public.variants        enable row level security;
alter table public.offers          enable row level security;
alter table public.contacts        enable row level security;
alter table public.orders          enable row level security;
alter table public.order_items     enable row level security;
alter table public.order_costs     enable row level security;
alter table public.order_events    enable row level security;
alter table public.stock_movements enable row level security;
alter table public.remittances     enable row level security;
alter table public.expenses        enable row level security;

drop policy if exists profiles_read on public.profiles;
create policy profiles_read on public.profiles for select to authenticated
  using (id = auth.uid() or public.my_role() is not null);
drop policy if exists profiles_self_update on public.profiles;
create policy profiles_self_update on public.profiles for update to authenticated
  using (id = auth.uid()) with check (id = auth.uid());
drop policy if exists profiles_admin on public.profiles;
-- un membre ne modifie que son nom et son téléphone ; rôle et activation passent par set_member (gérant)
revoke insert, update, delete on public.profiles from anon, authenticated;
grant update (full_name, phone) on public.profiles to authenticated;

drop policy if exists brands_read on public.brands;
create policy brands_read on public.brands for select to authenticated using (public.my_role() is not null);
drop policy if exists brands_write on public.brands;
create policy brands_write on public.brands for all to authenticated
  using (public.has_role('gerant')) with check (public.has_role('gerant'));

drop policy if exists products_read on public.products;
create policy products_read on public.products for select to authenticated using (public.my_role() is not null);
drop policy if exists products_write on public.products;
create policy products_write on public.products for all to authenticated
  using (public.has_role('gerant','stock')) with check (public.has_role('gerant','stock'));

drop policy if exists product_costs_read on public.product_costs;
create policy product_costs_read on public.product_costs for select to authenticated using (public.has_role('gerant','stock'));

drop policy if exists variants_read on public.variants;
create policy variants_read on public.variants for select to authenticated using (public.my_role() is not null);
drop policy if exists variants_write on public.variants;
create policy variants_write on public.variants for all to authenticated
  using (public.has_role('gerant','stock')) with check (public.has_role('gerant','stock'));
-- le stock ne se modifie que par les mouvements (stock_move / commandes)
revoke insert, update on public.variants from anon, authenticated;
grant insert (product_id, label, alert_threshold, sort, active) on public.variants to authenticated;
grant update (label, alert_threshold, sort, active) on public.variants to authenticated;
revoke insert, update, delete on public.stock_movements, public.orders, public.order_items,
  public.order_costs, public.order_events, public.product_costs from anon, authenticated;

drop policy if exists offers_read on public.offers;
create policy offers_read on public.offers for select to authenticated using (public.my_role() is not null);
drop policy if exists offers_write on public.offers;
create policy offers_write on public.offers for all to authenticated
  using (public.has_role('gerant')) with check (public.has_role('gerant'));

drop policy if exists contacts_rw on public.contacts;
create policy contacts_rw on public.contacts for all to authenticated
  using (public.has_role('gerant','closeuse')) with check (public.has_role('gerant','closeuse'));

drop policy if exists orders_read on public.orders;
create policy orders_read on public.orders for select to authenticated
  using (public.has_role('gerant','closeuse','stock') or (public.has_role('livreur') and courier_id = auth.uid()));
-- écriture des commandes uniquement via save_order / set_order_status

drop policy if exists order_items_read on public.order_items;
create policy order_items_read on public.order_items for select to authenticated
  using (exists (select 1 from public.orders o where o.id = order_id));

drop policy if exists order_costs_read on public.order_costs;
create policy order_costs_read on public.order_costs for select to authenticated using (public.has_role('gerant'));

drop policy if exists order_events_read on public.order_events;
create policy order_events_read on public.order_events for select to authenticated
  using (exists (select 1 from public.orders o where o.id = order_id));

drop policy if exists stock_movements_read on public.stock_movements;
create policy stock_movements_read on public.stock_movements for select to authenticated
  using (public.has_role('gerant','stock'));

drop policy if exists remittances_rw on public.remittances;
create policy remittances_rw on public.remittances for all to authenticated
  using (public.has_role('gerant')) with check (public.has_role('gerant'));
drop policy if exists remittances_own on public.remittances;
create policy remittances_own on public.remittances for select to authenticated
  using (courier_id = auth.uid());

drop policy if exists expenses_rw on public.expenses;
create policy expenses_rw on public.expenses for all to authenticated
  using (public.has_role('gerant')) with check (public.has_role('gerant'));

-- Droits d'exécution des fonctions
revoke execute on all functions in schema public from public, anon, authenticated;
grant execute on function public.my_role(), public.has_role(text[]), public.norm_phone(text) to authenticated;
grant execute on function public.set_member(uuid, text, boolean) to authenticated;
grant execute on function public.save_order(jsonb), public.set_order_status(uuid, text, text, integer, uuid, integer, date),
  public.delete_order(uuid), public.stock_move(uuid, integer, text, text), public.set_product_cost(uuid, integer)
  to authenticated;
grant execute on function public.site_order(jsonb) to anon, authenticated;
grant select on public.courier_balances to authenticated;

-- Temps réel (mise à jour automatique des écrans)
do $$ begin
  if exists (select 1 from pg_publication where pubname = 'supabase_realtime') then
    begin alter publication supabase_realtime add table public.orders; exception when duplicate_object then null; end;
    begin alter publication supabase_realtime add table public.contacts; exception when duplicate_object then null; end;
    begin alter publication supabase_realtime add table public.variants; exception when duplicate_object then null; end;
  end if;
end $$;

-- ---------------------------------------------------------------------------
-- Données de départ (modifiables ensuite dans l'application)
-- ---------------------------------------------------------------------------
insert into public.brands (univers, name, whatsapp, site_url) values
  ('bienetre', 'BOHFLEX', '', ''),
  ('passion',  'Sacoches BOLOU and CO', '', '')
on conflict (univers) do nothing;

do $$
declare pid uuid; s text; i int := 0;
begin
  if not exists (select 1 from public.products where univers = 'bienetre') then
    insert into public.products (univers, name, sale_price) values ('bienetre', 'Semelle BOHFLEX', 4500) returning id into pid;
    insert into public.product_costs (product_id, cost_price) values (pid, 0);
    foreach s in array array['35/36','37/38','39/40','41/42','43/44','45/46'] loop
      i := i + 1;
      insert into public.variants (product_id, label, sort) values (pid, s, i);
    end loop;
    insert into public.offers (univers, product_id, name, qty, price) values
      ('bienetre', pid, '2 paires', 2, 6500),
      ('bienetre', pid, '3 paires', 3, 7500);
  end if;
end $$;
