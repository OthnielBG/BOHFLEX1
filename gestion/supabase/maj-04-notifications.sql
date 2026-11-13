-- ============================================================================
-- BOLOU and CO — Mise à jour n°4 : notifications « push » sur les téléphones
-- (alerte même quand l'application est fermée ou l'écran verrouillé)
--
-- À exécuter UNE fois dans Supabase : SQL Editor > New query (base de données,
-- pas « Logs ») > coller > Run. Sans danger, peut être relancé.
-- Ensuite : déployer la fonction « notify-order » (voir README, étape 6 ter).
-- ============================================================================

-- Extension pour appeler la fonction d'envoi depuis la base
do $$ begin
  execute 'create extension if not exists pg_net';
end $$;

-- Réglages internes (jamais lisibles par l'application ni par le public)
create table if not exists public.app_secrets (
  key   text primary key,
  value text not null
);
alter table public.app_secrets enable row level security;
revoke all on public.app_secrets from anon, authenticated;

insert into public.app_secrets (key, value)
values ('hook_secret', md5(random()::text || clock_timestamp()::text) || md5(random()::text || clock_timestamp()::text))
on conflict (key) do nothing;
insert into public.app_secrets (key, value)
values ('functions_url', 'https://wohvofrogfdjyjnegguz.supabase.co/functions/v1')
on conflict (key) do nothing;

-- Téléphones inscrits aux notifications (un par appareil et par navigateur)
create table if not exists public.push_subscriptions (
  id          uuid primary key default gen_random_uuid(),
  user_id     uuid not null references public.profiles(id) on delete cascade,
  endpoint    text not null unique,
  p256dh      text not null,
  auth        text not null,
  user_agent  text not null default '',
  created_at  timestamptz not null default now()
);
alter table public.push_subscriptions enable row level security;
drop policy if exists push_own on public.push_subscriptions;
create policy push_own on public.push_subscriptions for select to authenticated using (user_id = auth.uid());
revoke insert, update, delete on public.push_subscriptions from anon, authenticated;

-- Enregistrer / retirer le téléphone de l'utilisateur connecté
-- (si un autre compte s'était connecté sur ce même téléphone, l'appareil lui est retiré)
create or replace function public.save_push_subscription(p_endpoint text, p_p256dh text, p_auth text, p_ua text default '')
returns void language plpgsql security definer set search_path = public as $$
begin
  if public.my_role() is null then raise exception 'Accès refusé'; end if;
  delete from public.push_subscriptions where endpoint = p_endpoint;
  insert into public.push_subscriptions (user_id, endpoint, p256dh, auth, user_agent)
  values (auth.uid(), p_endpoint, p_p256dh, p_auth, left(coalesce(p_ua, ''), 200));
end $$;

create or replace function public.delete_push_subscription(p_endpoint text)
returns void language sql security definer set search_path = public as $$
  delete from public.push_subscriptions where endpoint = p_endpoint and user_id = auth.uid()
$$;

-- Clé publique d'inscription (créée par la fonction au premier appel)
create or replace function public.push_public_key()
returns text language sql stable security definer set search_path = public as $$
  select value from public.app_secrets where key = 'vapid_public'
$$;

-- Appel de la fonction d'envoi (ne bloque jamais l'enregistrement d'une commande)
create or replace function public.call_notify(p_body jsonb)
returns void language plpgsql security definer set search_path = public as $$
declare u text; s text;
begin
  select value into u from public.app_secrets where key = 'functions_url';
  select value into s from public.app_secrets where key = 'hook_secret';
  perform net.http_post(
    url := u || '/notify-order',
    body := p_body,
    headers := jsonb_build_object('Content-Type', 'application/json', 'x-hook-secret', s)
  );
exception when others then
  raise warning 'notification non envoyée : %', sqlerrm;
end $$;

create or replace function public.notify_new_order()
returns trigger language plpgsql security definer set search_path = public as $$
begin
  perform public.call_notify(jsonb_build_object('order_id', new.id));
  return new;
end $$;

drop trigger if exists orders_notify on public.orders;
create trigger orders_notify after insert on public.orders
  for each row when (new.source = 'site') execute function public.notify_new_order();

-- Bouton « Tester » dans l'application : envoie une notification à son propre téléphone
create or replace function public.test_push()
returns void language plpgsql security definer set search_path = public as $$
begin
  if public.my_role() is null then raise exception 'Accès refusé'; end if;
  perform public.call_notify(jsonb_build_object('test', true, 'user_id', auth.uid()));
end $$;

revoke execute on function public.save_push_subscription(text, text, text, text), public.delete_push_subscription(text),
  public.push_public_key(), public.call_notify(jsonb), public.notify_new_order(), public.test_push() from public, anon;
revoke execute on function public.call_notify(jsonb), public.notify_new_order() from authenticated;
grant execute on function public.save_push_subscription(text, text, text, text), public.delete_push_subscription(text),
  public.push_public_key(), public.test_push() to authenticated;
