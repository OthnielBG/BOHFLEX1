// =============================================================================
// BOLOU and CO — Fonction Supabase « notify-order »
// Envoie une notification « push » aux téléphones du gérant et de la closeuse
// concernée (sacoches / semelles) à chaque nouvelle commande du site.
//
// Déploiement (une seule fois) : Supabase > Edge Functions > Deploy a new function
// > Via Editor > nom : notify-order > coller ce fichier > Deploy.
// Puis, dans les détails de la fonction, désactiver « Verify JWT ».
// Aucune clé à configurer : les clés d'envoi sont créées automatiquement au premier appel.
// =============================================================================
import webpush from "npm:web-push@3.6.7";
import { createClient } from "npm:@supabase/supabase-js@2.49.4";

const CORS = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type, x-hook-secret",
  "Access-Control-Allow-Methods": "POST, OPTIONS",
};
function json(data: unknown, status = 200) {
  return new Response(JSON.stringify(data), { status, headers: { ...CORS, "Content-Type": "application/json" } });
}
function money(n: number) {
  return String(Math.round(n || 0)).replace(/\B(?=(\d{3})+(?!\d))/g, " ") + " F";
}

Deno.serve(async (req: Request) => {
  if (req.method === "OPTIONS") return new Response("ok", { headers: CORS });

  const sb = createClient(Deno.env.get("SUPABASE_URL")!, Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!, {
    auth: { persistSession: false },
  });

  // Réglages internes
  const { data: rows, error } = await sb.from("app_secrets").select("key, value");
  if (error) return json({ ok: false, error: "Base à mettre à jour : exécutez maj-04-notifications.sql" }, 500);
  const sec: Record<string, string> = {};
  (rows || []).forEach((r: { key: string; value: string }) => (sec[r.key] = r.value));

  // Premier appel : création des clés d'envoi (VAPID)
  if (!sec.vapid_public || !sec.vapid_private) {
    const k = webpush.generateVAPIDKeys();
    sec.vapid_public = k.publicKey;
    sec.vapid_private = k.privateKey;
    await sb.from("app_secrets").upsert([
      { key: "vapid_public", value: k.publicKey },
      { key: "vapid_private", value: k.privateKey },
    ]);
  }

  const body = await req.json().catch(() => ({}));

  // L'application demande la clé publique pour inscrire un téléphone
  if (body.action === "setup") return json({ ok: true, publicKey: sec.vapid_public });

  // Le reste n'est accepté que depuis la base de données (secret partagé)
  if (!sec.hook_secret || req.headers.get("x-hook-secret") !== sec.hook_secret) return json({ ok: false }, 401);

  webpush.setVapidDetails(sec.vapid_subject || "https://bolouandco.netlify.app", sec.vapid_public, sec.vapid_private);

  let userIds: string[] = [];
  let payload: Record<string, unknown>;

  if (body.test && body.user_id) {
    userIds = [body.user_id];
    payload = { title: "BOLOU and CO", body: "Test réussi : les notifications fonctionnent sur ce téléphone ✅", tag: "test", url: "#/tableau", test: true };
  } else {
    const { data: o } = await sb.from("orders")
      .select("id, ref, univers, customer_name, phone, city, total_amount")
      .eq("id", body.order_id).single();
    if (!o) return json({ ok: false, error: "commande introuvable" }, 404);
    const { data: staff } = await sb.from("profiles").select("id, role, univers")
      .eq("active", true).in("role", ["gerant", "closeuse"]);
    userIds = (staff || [])
      .filter((p: { role: string; univers: string | null }) => p.role === "gerant" || !p.univers || p.univers === o.univers)
      .map((p: { id: string }) => p.id);
    payload = {
      title: "Nouvelle commande du site",
      body: `${o.customer_name || o.phone} · ${money(o.total_amount)}${o.city ? " · " + o.city : ""} — ${o.univers === "passion" ? "Sacoches" : "Semelles"}`,
      tag: "order-" + o.id,
      url: "#/commandes",
      order_id: o.id,
    };
  }
  if (!userIds.length) return json({ ok: true, sent: 0 });

  const { data: subs } = await sb.from("push_subscriptions").select("id, endpoint, p256dh, auth").in("user_id", userIds);
  let sent = 0;
  await Promise.all((subs || []).map(async (s: { id: string; endpoint: string; p256dh: string; auth: string }) => {
    try {
      await webpush.sendNotification(
        { endpoint: s.endpoint, keys: { p256dh: s.p256dh, auth: s.auth } },
        JSON.stringify(payload),
        { TTL: 3600, urgency: "high" },
      );
      sent++;
    } catch (e) {
      const code = (e as { statusCode?: number })?.statusCode;
      // Téléphone désinscrit ou application désinstallée : on l'oublie
      if (code === 404 || code === 410) await sb.from("push_subscriptions").delete().eq("id", s.id);
      else console.error("push", code, (e as Error)?.message);
    }
  }));
  return json({ ok: true, sent, devices: (subs || []).length });
});
