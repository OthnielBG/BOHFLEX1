-- ============================================================================
-- BOLOU and CO — Mise à jour n°2 : photos des produits
--
-- À exécuter UNE fois dans Supabase : SQL Editor > New query > coller > Run.
-- Sans danger : ne supprime aucune donnée, peut être relancé.
-- (Déjà inclus dans schema.sql pour une nouvelle installation.)
-- ============================================================================

-- Une photo par produit, et une photo facultative par variante (couleur de sacoche…)
alter table public.products add column if not exists image_url text not null default '';
alter table public.variants add column if not exists image_url text not null default '';
grant insert (product_id, label, alert_threshold, sort, active, image_url) on public.variants to authenticated;
grant update (label, alert_threshold, sort, active, image_url) on public.variants to authenticated;

-- Dossier de stockage des photos (lecture publique, envoi par le gérant et le stock)
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
