'use strict';
/* Cap 2027 — objectifs, tâches, agenda, voyages, budget, épargne.
   Toutes les données restent dans le navigateur (localStorage). Aucune dépendance. */

const KEY = 'cap2027-v1', YEAR = 2027, VERSION = '1.6';
try { localStorage.removeItem('cap2027-data'); } catch (e) { /* données de test de la version précédente */ }

/* ---------- Référentiels ---------- */
const AREAS = {
  etudes:     { l: 'Études',             c: '#6366f1', i: '🎓' },
  alternance: { l: 'Alternance / Travail', c: '#0ea5e9', i: '💼' },
  finances:   { l: 'Finances',           c: '#10b981', i: '💶' },
  famille:    { l: 'Mon fils / Famille', c: '#f59e0b', i: '👨‍👦' },
  perso:      { l: 'Vie perso',          c: '#ec4899', i: '🌱' },
  sante:      { l: 'Santé / Sport',      c: '#ef4444', i: '💪' },
};
const EXP = {
  logement: 'Logement', courses: 'Courses / alimentation', transport: 'Transport',
  voyages: 'Voyages (mon fils)', enfant: 'Enfant', maison: 'Maison / ménage', abonnements: 'Abonnements / téléphone',
  sante: 'Santé', etudes: 'Études', loisirs: 'Loisirs / sorties', shopping: 'Shopping',
  autre: 'Autre dépense', epargne: 'Épargne & investissement',
};
// Répartition 50/30/20 : besoins, envies, épargne
const NEEDS = ['logement', 'courses', 'maison', 'transport', 'voyages', 'enfant', 'abonnements', 'sante', 'etudes'];
const WANTS = ['loisirs', 'shopping', 'autre'];
const INC = { salaire: 'Salaire (alternance)', aides: 'Aides (APL, prime…)', extra: 'Revenu ponctuel' };
const ACC = { livret: 'Livret (A, LDDS, LEP…)', pea: 'PEA', av: 'Assurance-vie', cto: 'Compte-titres', crypto: 'Crypto', courant: 'Compte courant', autre: 'Autre' };
const REPEAT = { none: 'Une fois', daily: 'Tous les jours', weekdays: 'En semaine (lun–ven)', weekly: 'Chaque semaine', monthly: 'Chaque mois' };
const REMIND = { '-1': 'Pas de rappel', '0': "À l'heure", '15': '15 min avant', '60': '1 h avant', '180': '3 h avant', '1440': 'La veille', '2880': '2 jours avant', '10080': '1 semaine avant' };
const TRIP_CHECK = ['Confirmer les dates de visite', 'Poser les jours (école / entreprise) si besoin', 'Prévoir les activités avec mon fils', 'Préparer le sac'];
const INV_CATS = { alim: '🥫 Épicerie', frais: '🥬 Frais', menage: '🧽 Ménage / maison', hygiene: '🧴 Hygiène', autre: '📦 Autre' };
const ESSENTIALS = [
  // [nom, rayon, unité, prix, suivi en % (produit entamé qui se vide petit à petit)]
  ['Riz', 'alim', 'paquet', 1.5, 1], ['Pâtes', 'alim', 'paquet', 1], ['Huile', 'alim', 'bouteille', 3, 1], ['Farine / semoule', 'alim', 'paquet', 1.2, 1],
  ['Conserves', 'alim', 'boîte', 1], ['Café / thé', 'alim', 'paquet', 3.5, 1], ['Sucre', 'alim', 'paquet', 1.2, 1], ['Œufs', 'frais', 'boîte de 6', 2],
  ['Lait', 'frais', 'brique', 1], ['Liquide vaisselle', 'menage', 'flacon', 1.8, 1], ['Lessive', 'menage', 'bidon', 8, 1], ['Éponges', 'menage', 'lot', 2],
  ['Sacs poubelle', 'menage', 'rouleau', 2.5], ['Papier toilette', 'hygiene', 'paquet', 4], ['Gel douche', 'hygiene', 'flacon', 2.5, 1],
  ['Dentifrice', 'hygiene', 'tube', 2, 1], ['Déodorant', 'hygiene', 'unité', 3, 1],
];
const PCT_DEF = { pct: true, min: 0, target: 2, alert: 25, level: 100 };
const TITLES = { today: "Aujourd'hui", tasks: 'Tâches & routines', agenda: 'Agenda', goals: 'Objectifs 2027', trips: 'Voyages', money: 'Argent', settings: 'Réglages' };

/* ---------- Utilitaires ---------- */
const $ = (s, el = document) => el.querySelector(s);
const esc = s => String(s ?? '').replace(/[&<>"']/g, c => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;' }[c]));
const uid = () => Date.now().toString(36) + Math.random().toString(36).slice(2, 7);
const pad = n => String(n).padStart(2, '0');
const ds = d => `${d.getFullYear()}-${pad(d.getMonth() + 1)}-${pad(d.getDate())}`;
const parse = s => { const [y, m, d] = s.split('-').map(Number); return new Date(y, m - 1, d || 1); };
const today = () => ds(new Date());
const addDays = (s, n) => { const d = parse(s); d.setDate(d.getDate() + n); return ds(d); };
const diffDays = (a, b) => Math.round((parse(b) - parse(a)) / 864e5);
const ym = s => s.slice(0, 7);
const addMonths = (m, n) => { const d = parse(m + '-01'); d.setMonth(d.getMonth() + n); return ds(d).slice(0, 7); };
const cap = t => t.charAt(0).toUpperCase() + t.slice(1);
const fmt = (s, o = { weekday: 'short', day: 'numeric', month: 'short' }) => parse(s).toLocaleDateString('fr-FR', o);
const fmtM = m => cap(parse(m + '-01').toLocaleDateString('fr-FR', { month: 'long', year: 'numeric' }));
const eur = n => (Number(n) || 0).toLocaleString('fr-FR', { style: 'currency', currency: 'EUR', minimumFractionDigits: 0, maximumFractionDigits: 2 });
const pct = x => Math.round((x || 0) * 100) + ' %';
const clamp = x => Math.max(0, Math.min(1, x || 0));
const at = (d, t) => { const [h, mi] = (t || '00:00').split(':').map(Number); const x = parse(d); x.setHours(h || 0, mi || 0, 0, 0); return x; };
const inDays = n => n === 0 ? "aujourd'hui" : n === 1 ? 'demain' : n < 0 ? `il y a ${-n} j` : `dans ${n} j`;
const areaOpts = () => Object.entries(AREAS).map(([k, a]) => [k, `${a.i} ${a.l}`]);
const tag = k => { const a = AREAS[k] || AREAS.perso; return `<span class="tag" style="--c:${a.c}">${a.i} ${a.l}</span>`; };
const bar = (x, cls = '') => `<div class="bar ${cls}"><i style="width:${Math.round(clamp(x) * 100)}%"></i></div>`;

/* ---------- Données ---------- */
const DEF = () => ({
  v: 1, onboarded: false,
  settings: { name: '', morning: 8, notif: false, theme: 'auto' },
  tasks: [], events: [], goals: [], trips: [],
  tx: [], recurring: [], budgets: {}, accounts: [], worth: {}, notified: {}, inv: [], aiLast: null,
});
let S = load();
(function migrateInv() {
  const pctNames = new Set(ESSENTIALS.filter(e => e[4]).map(e => e[0].toLowerCase()));
  for (const i of S.inv || []) if (i.pct === undefined && pctNames.has((i.name || '').toLowerCase()) && +i.min === 1 && +i.target === 3) Object.assign(i, PCT_DEF);
})();
function load() {
  try { const r = JSON.parse(localStorage.getItem(KEY)); if (r && r.v) return Object.assign(DEF(), r, { settings: Object.assign(DEF().settings, r.settings) }); } catch (e) { /* stockage indisponible */ }
  return DEF();
}
/* ---------- Horodatage des modifications (pour fusionner entre appareils) ----------
   Chaque élément d'une liste reçoit _u (date de sa dernière modification), chaque suppression
   laisse une trace dans _del, et chaque réglage hors liste est daté dans _kt. Ainsi deux appareils
   modifiés séparément peuvent être fusionnés sans rien perdre. */
const strip = it => { const { _u, ...rest } = it; return JSON.stringify(rest); };
function snapMap(st) {
  const m = {};
  for (const k in st) {
    if (k[0] === '_') continue;
    if (Array.isArray(st[k])) { for (const it of st[k]) if (it && it.id) m[k + ':' + it.id] = strip(it); }
    else m['#' + k] = JSON.stringify(st[k]);
  }
  return m;
}
let lastMap = snapMap(S);
function stamp() {
  const now = Date.now(), cur = snapMap(S);
  S._del = S._del || {}; S._kt = S._kt || {};
  for (const k in cur) {
    if (cur[k] === lastMap[k]) continue;
    if (k[0] === '#') S._kt[k.slice(1)] = now;
    else { const [col, id] = k.split(':'); const it = S[col].find(x => x.id === id); if (it) it._u = now; delete S._del[k]; }
  }
  for (const k in lastMap) if (!(k in cur) && k[0] !== '#') S._del[k] = now;
  const lim = now - 120 * 864e5; for (const k in S._del) if (S._del[k] < lim) delete S._del[k];
  lastMap = cur;
}
function writeLocal() {
  try { localStorage.setItem(KEY, JSON.stringify(S)); } catch (e) { toast('Sauvegarde impossible : stockage du navigateur indisponible'); }
}
function save() {
  stamp(); writeLocal();
  if (window.CapSync && window.CapSync.push) window.CapSync.push();
}
// Fusion de deux états : élément par élément pour les listes, réglage par réglage sinon.
function mergeState(L, R) {
  const out = {}, del = { ...(L._del || {}) }, kt = { ...(L._kt || {}) };
  for (const k in R._del || {}) del[k] = Math.max(del[k] || 0, R._del[k]);
  for (const k in R._kt || {}) kt[k] = Math.max(kt[k] || 0, R._kt[k]);
  for (const key of new Set([...Object.keys(L), ...Object.keys(R)])) {
    if (key[0] === '_') continue;
    const a = L[key], b = R[key];
    if (Array.isArray(a) || Array.isArray(b)) {
      const m = new Map();
      for (const it of [...(a || []), ...(b || [])]) { if (!it || !it.id) continue; const p = m.get(it.id); if (!p || (it._u || 0) > (p._u || 0)) m.set(it.id, it); }
      out[key] = [...m.values()].filter(it => !((del[key + ':' + it.id] || 0) >= (it._u || 0) && del[key + ':' + it.id]));
    } else if (key === 'notified') out[key] = { ...(b || {}), ...(a || {}) };
    else out[key] = (((R._kt || {})[key] || 0) > ((L._kt || {})[key] || 0)) ? b : (a !== undefined ? a : b);
  }
  out._del = del; out._kt = kt;
  return out;
}
// Forme canonique (listes triées par id) pour comparer deux états sans tenir compte de l'ordre.
function canon(st) {
  const o = {};
  for (const k of Object.keys(st).sort()) o[k] = Array.isArray(st[k]) ? [...st[k]].sort((x, y) => String(x.id).localeCompare(String(y.id))) : st[k];
  return JSON.stringify(o);
}
// Remplace l'état local par une version fusionnée reçue d'un autre appareil (sans la re-dater).
function adoptState(next) {
  S = Object.assign(DEF(), next, { settings: Object.assign(DEF().settings, next.settings) });
  lastMap = snapMap(S); writeLocal(); applyTheme();
  const dlg = document.getElementById('dlg');
  if (!(dlg && dlg.open)) render();
}
window.Cap = { get: () => S, merge: mergeState, canon, adopt: adoptState, toast, render: () => render() };
const UI = { task: today(), agMonth: ym(today()), agSel: today(), agMode: 'month', agYear: YEAR, mTab: 'month', mMonth: ym(today()) };

/* ---------- Tâches ---------- */
const isRec = t => t.repeat && t.repeat !== 'none';
function occurs(t, d) {
  if (!isRec(t)) return t.date === d;
  if (t.date && d < t.date) return false;
  const x = parse(d), b = parse(t.date || d);
  switch (t.repeat) {
    case 'daily': return true;
    case 'weekdays': { const w = x.getDay(); return w > 0 && w < 6; }
    case 'weekly': return x.getDay() === b.getDay();
    case 'monthly': return x.getDate() === b.getDate();
  }
  return false;
}
const isDone = (t, d) => isRec(t) ? !!(t.doneOn || {})[d] : !!t.done;
const byTime = (a, b) => (a.time || '99').localeCompare(b.time || '99');
const tasksOn = d => S.tasks.filter(t => occurs(t, d)).sort(byTime);
const overdue = () => S.tasks.filter(t => !isRec(t) && t.date && t.date < today() && !t.done).sort((a, b) => a.date.localeCompare(b.date));
function streak(t) {
  let d = today(), n = 0;
  if (!isDone(t, d)) d = addDays(d, -1);
  for (let i = 0; i < 400; i++) {
    if (t.date && d < t.date) break;
    if (occurs(t, d)) { if (isDone(t, d)) n++; else break; }
    d = addDays(d, -1);
  }
  return n;
}
function taskRow(t, d) {
  const dn = isDone(t, d), st = isRec(t) ? streak(t) : 0;
  return `<li class="item ${dn ? 'is-done' : ''}">
    <button class="chk" data-a="tt" data-id="${t.id}" data-d="${d}" aria-pressed="${dn}" aria-label="${dn ? 'Marquer comme non faite' : 'Marquer comme faite'}">${dn ? '✓' : ''}</button>
    <div class="grow" data-a="et" data-id="${t.id}">
      <div class="ttl">${t.prio === 'high' ? '<span class="prio">!</span> ' : ''}${esc(t.title)}</div>
      <div class="meta">${t.time ? `<span>🕑 ${t.time}</span>` : ''}${tag(t.area)}${isRec(t) ? `<span>↻ ${REPEAT[t.repeat]}</span>` : ''}${st > 1 ? `<span class="streak" title="Série en cours">🔥 ${st}</span>` : ''}${!isRec(t) && t.date && t.date < d ? `<span class="late">prévue ${fmt(t.date)}</span>` : ''}</div>
    </div></li>`;
}
function editTask(id, preset = {}) {
  const t = S.tasks.find(x => x.id === id) || { area: 'perso', date: UI.task, repeat: 'none', prio: 'normal', ...preset };
  form({
    title: id ? 'Modifier la tâche' : 'Nouvelle tâche',
    fields: [
      { k: 'title', l: 'Tâche', req: 1, v: t.title, ph: 'Ex. Envoyer le dossier à mon tuteur' },
      { k: 'area', l: 'Domaine', type: 'select', opts: areaOpts(), v: t.area, half: 1 },
      { k: 'prio', l: 'Priorité', type: 'select', opts: [['normal', 'Normale'], ['high', 'Importante']], v: t.prio, half: 1 },
      { k: 'date', l: 'Date', type: 'date', v: t.date, half: 1, hint: 'Vide = « un jour »' },
      { k: 'time', l: 'Heure (= rappel)', type: 'time', v: t.time, half: 1 },
      { k: 'repeat', l: 'Répétition (routine)', type: 'select', opts: Object.entries(REPEAT), v: t.repeat },
      { k: 'notes', l: 'Notes', type: 'textarea', v: t.notes },
    ],
    onSave: v => {
      if (v.repeat !== 'none' && !v.date) v.date = today();
      if (id) Object.assign(t, v); else S.tasks.push({ id: uid(), doneOn: {}, done: false, ...v });
    },
    onDelete: id && (() => { S.tasks = S.tasks.filter(x => x.id !== id); }),
  });
}

/* ---------- Événements ---------- */
const eventsOn = d => S.events.filter(e => e.date === d).sort(byTime);
function eventRow(e) {
  return `<li class="item"><div class="chk" aria-hidden="true" style="border-color:${(AREAS[e.area] || AREAS.perso).c}"></div>
    <div class="grow" data-a="ee" data-id="${e.id}"><div class="ttl">${esc(e.title)}</div>
    <div class="meta"><span>${e.time ? '🕑 ' + e.time + (e.end ? '–' + e.end : '') : 'Toute la journée'}</span>${e.place ? `<span>📍 ${esc(e.place)}</span>` : ''}${tag(e.area)}</div></div></li>`;
}
function editEvent(id, preset = {}) {
  const e = S.events.find(x => x.id === id) || { area: 'etudes', date: UI.agSel, reminder: '60', ...preset };
  form({
    title: id ? "Modifier l'événement" : 'Nouvel événement',
    fields: [
      { k: 'title', l: 'Titre', req: 1, v: e.title, ph: 'Partiel, RDV, entretien, anniversaire…' },
      { k: 'area', l: 'Domaine', type: 'select', opts: areaOpts(), v: e.area },
      { k: 'date', l: 'Date', type: 'date', req: 1, v: e.date, half: 1 },
      { k: 'time', l: 'Heure', type: 'time', v: e.time, half: 1 },
      { k: 'end', l: 'Fin', type: 'time', v: e.end, half: 1 },
      { k: 'reminder', l: 'Rappel', type: 'select', opts: Object.entries(REMIND), v: String(e.reminder), half: 1 },
      { k: 'place', l: 'Lieu', v: e.place },
      { k: 'notes', l: 'Notes', type: 'textarea', v: e.notes },
    ],
    onSave: v => { if (id) Object.assign(e, v); else S.events.push({ id: uid(), ...v }); },
    onDelete: id && (() => { S.events = S.events.filter(x => x.id !== id); }),
  });
}

/* ---------- Objectifs ---------- */
function goalProg(g) {
  if (g.kind === 'counter') return clamp((+g.current || 0) / (+g.target || 1));
  if (g.kind === 'account') { const a = S.accounts.find(x => x.id === g.account); return a ? clamp((+a.balance || 0) / (+g.target || +a.goal || 1)) : 0; }
  const s = g.steps || []; return s.length ? s.filter(x => x.done).length / s.length : 0;
}
function goalValue(g) {
  if (g.kind === 'counter') return `${+g.current || 0} / ${+g.target || 0} ${esc(g.unit || '')}`;
  if (g.kind === 'account') { const a = S.accounts.find(x => x.id === g.account); return a ? `${eur(a.balance)} / ${eur(+g.target || a.goal)}` : 'Compte introuvable'; }
  const s = g.steps || []; return `${s.filter(x => x.done).length} / ${s.length} étapes`;
}
function editGoal(id) {
  const g = S.goals.find(x => x.id === id) || { area: 'perso', kind: 'steps', deadline: `${YEAR}-12-31` };
  form({
    title: id ? "Modifier l'objectif" : 'Nouvel objectif 2027',
    fields: [
      { k: 'title', l: 'Objectif', req: 1, v: g.title, ph: 'Ex. Décrocher un CDI pour fin 2027' },
      { k: 'area', l: 'Domaine', type: 'select', opts: areaOpts(), v: g.area, half: 1 },
      { k: 'deadline', l: 'Échéance', type: 'date', v: g.deadline, half: 1 },
      { k: 'kind', l: 'Comment mesurer ?', type: 'select', opts: [['steps', 'Par étapes à cocher'], ['counter', 'Par un compteur (ex. 12 visites)'], ['account', "Par le solde d'un compte d'épargne"]], v: g.kind },
      { k: 'target', l: 'Cible (compteur ou montant)', type: 'number', v: g.target, half: 1 },
      { k: 'unit', l: 'Unité (compteur)', v: g.unit, half: 1, ph: 'visites, livres, km…' },
      { k: 'account', l: 'Compte lié', type: 'select', opts: [['', '—'], ...S.accounts.map(a => [a.id, a.name])], v: g.account },
      { k: 'why', l: 'Pourquoi c’est important pour moi', type: 'textarea', v: g.why },
    ],
    onSave: v => { if (id) Object.assign(g, v); else S.goals.push({ id: uid(), steps: [], current: 0, ...v }); },
    onDelete: id && (() => { S.goals = S.goals.filter(x => x.id !== id); }),
  });
}

/* ---------- Voyages ---------- */
const tripCost = t => (+t.transportCost || 0) + (+t.lodgingCost || 0) + (+t.otherCost || 0);
function tripAlerts() {
  const t0 = today(), out = [];
  for (const t of S.trips) {
    const n = diffDays(t0, t.start);
    if (n < 0) continue;
    if (!t.transportBooked && n <= 45) out.push({ lvl: n <= 14 ? 'bad' : 'warn', key: t.id + 'tr', trip: t.id, txt: `Transport à réserver pour ${t.dest} (départ ${inDays(n)})` });
    if (!t.lodgingBooked && !t.noLodging && n <= 30) out.push({ lvl: n <= 10 ? 'bad' : 'warn', key: t.id + 'lo', trip: t.id, txt: `Logement à réserver pour ${t.dest} (départ ${inDays(n)})` });
  }
  return out;
}
function editTrip(id) {
  const t = S.trips.find(x => x.id === id) || { purpose: 'Voir mon fils' };
  form({
    title: id ? 'Modifier le voyage' : 'Nouveau voyage',
    fields: [
      { k: 'dest', l: 'Destination', req: 1, v: t.dest },
      { k: 'purpose', l: 'Objet', v: t.purpose },
      { k: 'start', l: 'Départ', type: 'date', req: 1, v: t.start, half: 1 },
      { k: 'end', l: 'Retour', type: 'date', req: 1, v: t.end, half: 1 },
      { k: 'transport', l: 'Transport', v: t.transport, ph: 'Train, avion, bus…', half: 1 },
      { k: 'transportCost', l: 'Coût transport (€)', type: 'number', v: t.transportCost, half: 1 },
      { k: 'transportBooked', l: 'Transport réservé', type: 'checkbox', v: t.transportBooked },
      { k: 'lodging', l: 'Logement / location', v: t.lodging, ph: 'Airbnb, hôtel…', half: 1 },
      { k: 'lodgingCost', l: 'Coût logement (€)', type: 'number', v: t.lodgingCost, half: 1 },
      { k: 'lodgingBooked', l: 'Logement réservé', type: 'checkbox', v: t.lodgingBooked, half: 1 },
      { k: 'noLodging', l: 'Pas besoin de logement', type: 'checkbox', v: t.noLodging, half: 1 },
      { k: 'otherCost', l: 'Autres frais prévus (€)', type: 'number', v: t.otherCost, hint: 'Repas, activités, cadeaux…' },
      { k: 'notes', l: 'Notes', type: 'textarea', v: t.notes },
    ],
    onSave: v => {
      if (v.end < v.start) { alert('Le retour doit être après le départ.'); return false; }
      if (id) Object.assign(t, v); else S.trips.push({ id: uid(), checklist: TRIP_CHECK.map(c => ({ id: uid(), t: c, done: false })), ...v });
    },
    onDelete: id && (() => { S.trips = S.trips.filter(x => x.id !== id); }),
  });
}

/* ---------- Argent ---------- */
const txM = m => S.tx.filter(x => ym(x.date) === m);
function monthStats(m) {
  let inc = 0, out = 0, sav = 0; const by = {};
  for (const x of txM(m)) {
    const a = +x.amount || 0;
    if (x.type === 'in') inc += a;
    else { out += a; by[x.cat] = (by[x.cat] || 0) + a; if (x.cat === 'epargne') sav += a; }
  }
  return { inc, out, sav, spend: out - sav, rest: inc - out, by };
}
const recDone = (r, m) => S.tx.some(x => x.rec === r.id && ym(x.date) === m);
const accDone = (a, m) => S.tx.some(x => x.acc === a.id && ym(x.date) === m);
const worthNow = () => S.accounts.reduce((s, a) => s + (+a.balance || 0), 0);
function snapshot() { S.worth[ym(today())] = worthNow(); }
function avgMonthly() {
  // Moyenne des 3 derniers mois complets ayant des données, sinon les montants récurrents.
  const ms = []; let m = addMonths(ym(today()), -1);
  for (let i = 0; i < 12 && ms.length < 3; i++, m = addMonths(m, -1)) if (txM(m).length) ms.push(monthStats(m));
  const recIn = S.recurring.filter(r => r.type === 'in').reduce((s, r) => s + (+r.amount || 0), 0);
  const recOut = S.recurring.filter(r => r.type === 'out').reduce((s, r) => s + (+r.amount || 0), 0);
  if (!ms.length) return { inc: recIn, spend: recOut, real: false };
  return { inc: ms.reduce((s, x) => s + x.inc, 0) / ms.length, spend: ms.reduce((s, x) => s + x.spend, 0) / ms.length, real: true };
}
function editTx(id, type = 'out', preset = {}) {
  const x = S.tx.find(t => t.id === id) || { type, date: today(), cat: type === 'in' ? 'salaire' : 'courses', ...preset };
  form({
    title: id ? 'Modifier' : x.type === 'in' ? 'Nouveau revenu' : 'Nouvelle dépense',
    fields: [
      { k: 'amount', l: 'Montant (€)', type: 'number', req: 1, v: x.amount, half: 1, step: '0.01' },
      { k: 'date', l: 'Date', type: 'date', req: 1, v: x.date, half: 1 },
      { k: 'cat', l: 'Catégorie', type: 'select', opts: Object.entries(x.type === 'in' ? INC : EXP), v: x.cat },
      { k: 'label', l: 'Libellé', v: x.label, ph: x.type === 'in' ? 'Ex. Salaire novembre' : 'Ex. Courses Lidl' },
    ],
    onSave: v => {
      if (!(v.amount > 0)) { alert('Indique un montant positif.'); return false; }
      if (id) Object.assign(x, v); else S.tx.push({ id: uid(), type: x.type, ...v });
    },
    after: !id && x.type === 'in' && sampleFn ? askAiAfterIncome : null,
    onDelete: id && (() => { S.tx = S.tx.filter(t => t.id !== id); }),
  });
}
function editRec(id) {
  const r = S.recurring.find(x => x.id === id) || { type: 'out', cat: 'logement', day: 5 };
  form({
    title: id ? 'Modifier le montant fixe' : 'Revenu ou charge fixe mensuelle',
    intro: 'Salaire, loyer, téléphone, abonnements… Tu recevras un rappel le jour J et pourras l’enregistrer en un clic.',
    fields: [
      { k: 'label', l: 'Libellé', req: 1, v: r.label, ph: 'Loyer, salaire, Netflix…' },
      { k: 'type', l: 'Type', type: 'select', opts: [['out', 'Charge (sortie)'], ['in', 'Revenu (entrée)']], v: r.type, half: 1 },
      { k: 'amount', l: 'Montant (€)', type: 'number', req: 1, v: r.amount, half: 1, step: '0.01' },
      { k: 'cat', l: 'Catégorie', type: 'select', opts: [...Object.entries(INC), ...Object.entries(EXP).filter(([k]) => k !== 'epargne')], v: r.cat, half: 1 },
      { k: 'day', l: 'Jour du mois', type: 'number', req: 1, v: r.day, half: 1, step: '1' },
    ],
    onSave: v => {
      v.day = Math.max(1, Math.min(28, Math.round(v.day || 1)));
      if (v.type === 'in' && !INC[v.cat]) v.cat = 'salaire';
      if (v.type === 'out' && !EXP[v.cat]) v.cat = 'autre';
      if (id) Object.assign(r, v); else S.recurring.push({ id: uid(), ...v });
    },
    onDelete: id && (() => { S.recurring = S.recurring.filter(x => x.id !== id); }),
  });
}
function editAcc(id) {
  const a = S.accounts.find(x => x.id === id) || { type: 'livret', day: 5 };
  form({
    title: id ? 'Modifier le compte' : 'Nouveau compte (épargne / investissement)',
    fields: [
      { k: 'name', l: 'Nom', req: 1, v: a.name, ph: 'Livret A, PEA, Assurance-vie…' },
      { k: 'type', l: 'Type', type: 'select', opts: Object.entries(ACC), v: a.type },
      { k: 'balance', l: 'Valeur actuelle (€)', type: 'number', req: 1, v: a.balance, half: 1, step: '0.01' },
      { k: 'invested', l: 'Total versé (€)', type: 'number', v: a.invested, half: 1, step: '0.01', hint: 'Pour calculer +/- value' },
      { k: 'goal', l: 'Objectif (€)', type: 'number', v: a.goal, half: 1 },
      { k: 'monthly', l: 'Versement mensuel (€)', type: 'number', v: a.monthly, half: 1 },
      { k: 'day', l: 'Jour du versement', type: 'number', v: a.day, step: '1', hint: 'Idéalement juste après ta paie : « se payer en premier »' },
    ],
    onSave: v => {
      v.day = Math.max(1, Math.min(28, Math.round(v.day || 1)));
      if (v.invested == null) v.invested = v.balance;
      if (id) Object.assign(a, v); else S.accounts.push({ id: uid(), ...v });
      snapshot();
    },
    onDelete: id && (() => { S.accounts = S.accounts.filter(x => x.id !== id); snapshot(); }),
  });
}
function contribute(id) {
  const a = S.accounts.find(x => x.id === id); if (!a) return;
  form({
    title: `Versement sur ${a.name}`,
    fields: [{ k: 'amount', l: 'Montant (€)', type: 'number', req: 1, v: a.monthly, step: '0.01', half: 1 }, { k: 'date', l: 'Date', type: 'date', v: today(), half: 1 }],
    save: 'Valider le versement',
    onSave: v => {
      if (!(v.amount > 0)) return false;
      a.balance = (+a.balance || 0) + v.amount; a.invested = (+a.invested || 0) + v.amount;
      S.tx.push({ id: uid(), type: 'out', cat: 'epargne', amount: v.amount, date: v.date || today(), label: 'Versement ' + a.name, acc: a.id });
      snapshot(); toast('Bravo, versement enregistré 💪');
    },
  });
}
function editBudgets() {
  const avg = avgMonthly();
  form({
    title: 'Budget mensuel par catégorie',
    intro: avg.inc ? `Revenu mensuel moyen : <b>${eur(avg.inc)}</b>. Repère 50/30/20 : besoins ≤ ${eur(avg.inc * .5)}, envies ≤ ${eur(avg.inc * .3)}, épargne ≥ ${eur(avg.inc * .2)}.` : 'Laisse vide les catégories sans plafond.',
    fields: Object.entries(EXP).map(([k, l]) => ({ k, l: k === 'epargne' ? l + ' (objectif)' : l, type: 'number', v: S.budgets[k], half: 1 })),
    onSave: v => { S.budgets = {}; for (const k in v) if (v[k] > 0) S.budgets[k] = v[k]; },
  });
}

/* ---------- Formulaire générique (feuille modale) ---------- */
function field(x) {
  const id = 'f_' + x.k, v = x.v ?? '', cls = x.half ? 'half' : '';
  if (x.type === 'checkbox') return `<label class="chkline ${cls}"><input type="checkbox" name="${x.k}" ${x.v ? 'checked' : ''}> <span>${x.l}</span></label>`;
  let input;
  if (x.type === 'select') input = `<select id="${id}" name="${x.k}">${x.opts.map(([k, l]) => `<option value="${esc(k)}" ${String(k) === String(v) ? 'selected' : ''}>${esc(l)}</option>`).join('')}</select>`;
  else if (x.type === 'textarea') input = `<textarea id="${id}" name="${x.k}" rows="3">${esc(v)}</textarea>`;
  else input = `<input id="${id}" name="${x.k}" type="${x.type || 'text'}" value="${esc(v)}"${x.req ? ' required' : ''}${x.type === 'number' ? ` step="${x.step || 'any'}" inputmode="decimal"` : ''}${x.ph ? ` placeholder="${esc(x.ph)}"` : ''}>`;
  return `<label class="fld ${cls}" for="${id}"><span>${x.l}</span>${input}${x.hint ? `<small>${x.hint}</small>` : ''}</label>`;
}
function form({ title, fields, onSave, onDelete, save: saveL = 'Enregistrer', intro, after }) {
  const d = $('#dlg');
  d.innerHTML = `<form class="sheet" novalidate><header><h2>${esc(title)}</h2><button type="button" class="icon" data-close aria-label="Fermer">✕</button></header>
    ${intro ? `<p class="mute small">${intro}</p>` : ''}<div class="fields">${fields.map(field).join('')}</div>
    <footer>${onDelete ? '<button type="button" class="btn danger" data-del>Supprimer</button>' : ''}<span class="grow"></span>
    <button type="button" class="btn ghost" data-close>Annuler</button><button class="btn" type="submit">${saveL}</button></footer></form>`;
  const f = d.querySelector('form');
  f.onsubmit = e => {
    e.preventDefault();
    if (!f.reportValidity()) return;
    const v = {};
    for (const x of fields) {
      const el = f.elements[x.k]; if (!el) continue;
      v[x.k] = x.type === 'checkbox' ? el.checked : x.type === 'number' ? (el.value === '' ? null : Number(el.value)) : el.value.trim();
    }
    if (onSave(v) === false) return;
    save(); d.close(); render();
    if (after) setTimeout(after, 80);
  };
  d.querySelectorAll('[data-close]').forEach(b => { b.onclick = () => d.close(); });
  const del = d.querySelector('[data-del]');
  if (del) del.onclick = () => { if (confirm('Supprimer définitivement ?')) { onDelete(); save(); d.close(); render(); } };
  d.showModal();
  const first = f.querySelector('input:not([type=checkbox]),select,textarea');
  if (first && !matchMedia('(pointer:coarse)').matches) first.focus();
}
function quickAdd() {
  const d = $('#dlg');
  const items = [['task', '✅', 'Tâche'], ['event', '📅', 'Événement'], ['out', '🧾', 'Dépense'], ['in', '💰', 'Revenu'], ['trip', '🧳', 'Voyage'], ['goal', '🎯', 'Objectif'], ['inv', '🏠', 'Article maison'], ['ai', '✨', 'Budget IA']];
  d.innerHTML = `<div class="sheet"><header><h2>Ajouter</h2><button class="icon" data-close aria-label="Fermer">✕</button></header>
    <div class="quick">${items.map(([k, i, l]) => `<button data-q="${k}"><b>${i}</b>${l}</button>`).join('')}</div></div>`;
  d.querySelector('[data-close]').onclick = () => d.close();
  d.querySelectorAll('[data-q]').forEach(b => b.onclick = () => {
    d.close();
    ({ task: () => editTask(null, { date: today() }), event: () => editEvent(null, { date: today() }), out: () => editTx(null, 'out'), in: () => editTx(null, 'in'), trip: () => editTrip(null), goal: () => editGoal(null), inv: () => editItem(null), ai: aiBudget })[b.dataset.q]();
  });
  d.showModal();
}

/* ---------- Vues ---------- */
function alertsList() {
  const out = [], t0 = today(), m = ym(t0), day = new Date().getDate();
  const od = overdue();
  if (od.length) out.push({ lvl: 'bad', txt: `${od.length} tâche${od.length > 1 ? 's' : ''} en retard`, go: '#tasks' });
  for (const a of tripAlerts()) out.push({ ...a, go: '#trips' });
  for (const a of S.accounts) if (+a.monthly > 0 && +a.day <= day && !accDone(a, m)) out.push({ lvl: 'warn', txt: `Versement de ${eur(a.monthly)} sur ${a.name} pas encore fait ce mois-ci`, act: 'contrib', id: a.id });
  const st = monthStats(m);
  for (const [k, b] of Object.entries(S.budgets)) if (k !== 'epargne' && (st.by[k] || 0) > b) out.push({ lvl: 'bad', txt: `Budget « ${EXP[k]} » dépassé : ${eur(st.by[k])} / ${eur(b)}`, go: '#money' });
  for (const g of S.goals) { const n = diffDays(t0, g.deadline || '9999-12-31'); if (n >= 0 && n <= 14 && goalProg(g) < 1) out.push({ lvl: 'warn', txt: `Objectif « ${g.title} » : échéance ${inDays(n)}`, go: '#goals' }); }
  const low = shopping();
  if (low.length) out.push({ lvl: 'warn', txt: `🏠 ${low.length} article${low.length > 1 ? 's' : ''} à racheter (≈ ${eur(low.reduce((s, i) => s + toBuy(i) * (+i.price || 0), 0))})`, act: 'gostock', id: '' });
  for (const i of S.inv) { if (!i.exp || !(+i.qty > 0)) continue; const n = diffDays(t0, i.exp); if (n >= 0 && n <= 3) out.push({ lvl: 'warn', txt: `${i.name} périme ${inDays(n)}`, act: 'gostock', id: '' }); }
  if (!S.settings.notif && S.onboarded) out.push({ lvl: 'info', txt: '🔔 Active les notifications pour recevoir tes rappels', go: '#settings' });
  return out;
}
const alertHtml = a => `<div class="alert ${a.lvl}" ${a.act ? `data-a="${a.act}" data-id="${a.id}"` : `data-a="go" data-h="${a.go}"`}>${a.lvl === 'bad' ? '⚠️' : a.lvl === 'warn' ? '⏰' : ''}<span>${esc(a.txt)}</span></div>`;

function vToday() {
  const t0 = today(), now = new Date(), name = S.settings.name;
  if (!S.onboarded) return vWelcome();
  const y0 = new Date(YEAR, 0, 1), y1 = new Date(YEAR + 1, 0, 1);
  const hero = now < y0
    ? `<div class="big">J-${diffDays(t0, `${YEAR}-01-01`)}</div><div class="mute">avant 2027 — c’est le moment de poser tes objectifs et tes routines.</div>`
    : now < y1 ? `<div class="mute">2027 écoulée à ${pct((now - y0) / (y1 - y0))}</div>${bar((now - y0) / (y1 - y0))}` : '';
  const tasks = tasksOn(t0), evs = eventsOn(t0), od = overdue();
  const doneN = tasks.filter(t => isDone(t, t0)).length;
  const st = monthStats(ym(t0));
  const next = S.trips.filter(t => t.end >= t0).sort((a, b) => a.start.localeCompare(b.start))[0];
  const goals = S.goals.slice().sort((a, b) => goalProg(a) - goalProg(b)).slice(0, 3);
  const gAvg = S.goals.length ? S.goals.reduce((s, g) => s + goalProg(g), 0) / S.goals.length : 0;
  const upcoming = S.events.filter(e => e.date > t0 && e.date <= addDays(t0, 7)).sort((a, b) => (a.date + (a.time || '')).localeCompare(b.date + (b.time || '')));
  const al = alertsList();
  return `
  <section class="card hero"><div class="mute">${cap(fmt(t0, { weekday: 'long', day: 'numeric', month: 'long' }))}</div>
    <h2 style="font-size:22px;margin:4px 0 8px">${name ? 'Salut ' + esc(name) + ' 👋' : 'Salut 👋'}</h2>${hero}</section>
  ${al.map(alertHtml).join('')}
  <section class="card"><h2>✅ Ma journée <span class="grow"></span><span class="mute small">${doneN}/${tasks.length}</span></h2>
    ${tasks.length ? bar(doneN / tasks.length, 'okc') : ''}
    <ul class="list">${evs.map(eventRow).join('')}${tasks.map(t => taskRow(t, t0)).join('')}${od.map(t => taskRow(t, t0)).join('')}</ul>
    ${!tasks.length && !evs.length && !od.length ? '<p class="empty">Rien de prévu. Ajoute tes 3 priorités du jour avec ＋</p>' : ''}
    <div class="row" style="margin-top:8px"><button class="btn sm ghost" data-a="nt">＋ Tâche</button><button class="btn sm ghost" data-a="ne">＋ Événement</button></div></section>
  <section class="card"><h2>💶 ${fmtM(ym(t0))} <span class="grow"></span><a class="small" href="#money">Détails</a></h2>
    <div class="kpis"><div class="kpi"><small>Revenus</small><b class="num">${eur(st.inc)}</b></div><div class="kpi"><small>Dépenses</small><b class="num">${eur(st.spend)}</b></div>
    <div class="kpi"><small>Épargné</small><b class="num pos">${eur(st.sav)}</b></div><div class="kpi"><small>Reste</small><b class="num ${st.rest < 0 ? 'neg' : ''}">${eur(st.rest)}</b></div></div>
    <div class="row" style="margin-top:10px"><button class="btn sm ghost" data-a="nx" data-t="out">＋ Dépense</button><button class="btn sm ghost" data-a="nx" data-t="in">＋ Revenu</button>
    <span class="grow"></span><span class="small mute">Patrimoine <b class="num">${eur(worthNow())}</b></span></div></section>
  ${next ? `<section class="card"><h2>🧳 Prochain voyage <span class="grow"></span><a class="small" href="#trips">Voir</a></h2>${tripSummary(next)}</section>` : ''}
  <section class="card"><h2>🎯 Objectifs 2027 <span class="grow"></span><span class="mute small">${pct(gAvg)}</span></h2>
    ${S.goals.length ? bar(gAvg) + '<ul class="list">' + goals.map(g => `<li class="item"><div class="grow" data-a="go" data-h="#goals"><div class="ttl">${esc(g.title)}</div><div class="meta">${tag(g.area)}<span>${goalValue(g)}</span></div>${bar(goalProg(g))}</div></li>`).join('') + '</ul>' : '<p class="empty">Aucun objectif. <a href="#goals">Fixe tes objectifs 2027</a></p>'}</section>
  ${upcoming.length ? `<section class="card"><h2>📅 Les 7 prochains jours</h2><ul class="list">${upcoming.map(e => eventRow(e).replace('<div class="meta">', `<div class="meta"><span><b>${fmt(e.date)}</b></span>`)).join('')}</ul></section>` : ''}`;
}
function vWelcome() {
  return `<section class="card hero"><h2 style="font-size:22px;margin-bottom:6px">Bienvenue dans Cap 2027 🚀</h2>
    <p class="mute" style="margin:0">Une seule appli pour tes objectifs, ta to-do, ton agenda, tes voyages pour voir ton fils, ton budget, ton épargne et tes investissements.</p></section>
  <section class="card"><h2>Pour démarrer</h2>
    <label class="fld"><span>Ton prénom</span><input id="w-name" value="${esc(S.settings.name)}" placeholder="Prénom"></label>
    <p class="small mute">Le <b>modèle de départ</b> crée des objectifs 2027 (études, CDI, épargne de précaution, visites à ton fils), des routines quotidiennes et hebdomadaires, et un livret d’épargne. Tu pourras tout modifier ou supprimer.</p>
    <div class="row"><button class="btn" data-a="start" data-tpl="1">Utiliser le modèle de départ</button><button class="btn ghost" data-a="start">Partir de zéro</button></div>${window.CAP_FIREBASE ? '<p class="small mute" style="margin:12px 0 6px">Déjà utilisé sur un autre appareil ?</p><button class="btn ghost" data-a="signin">☁️ Récupérer mes données (connexion Google)</button>' : ''}</section>
  <section class="card small mute">🔒 Tes données restent sur cet appareil, rien n’est envoyé sur internet. Pense à faire une sauvegarde de temps en temps (Réglages → Exporter).</section>`;
}
function seedTemplate() {
  const t0 = today(), sun = addDays(t0, (7 - new Date().getDay()) % 7);
  const acc = { id: uid(), name: 'Épargne de précaution (Livret A)', type: 'livret', balance: 0, invested: 0, goal: 3000, monthly: 100, day: 5 };
  S.accounts.push(acc);
  const steps = a => a.map(t => ({ id: uid(), t, done: false }));
  S.goals.push(
    { id: uid(), title: 'Valider mon année / mon diplôme', area: 'etudes', kind: 'steps', deadline: `${YEAR}-07-15`, why: 'La base de tout le reste.', steps: steps(['Noter toutes les dates d’examens dans l’agenda', 'Planifier les révisions 3 semaines avant chaque partiel', 'Rendre le mémoire / rapport d’alternance', 'Préparer la soutenance']) },
    { id: uid(), title: 'Décrocher un CDI pour fin 2027', area: 'alternance', kind: 'steps', deadline: `${YEAR}-10-31`, why: 'Entrer dans la vie active sereinement.', steps: steps(['Mettre à jour CV et LinkedIn', 'Parler à mon tuteur d’une embauche après l’alternance', 'Lister 20 entreprises cibles', 'Postuler à 10 offres', 'Préparer mes entretiens (pitch, salaire visé)']) },
    { id: uid(), title: 'Constituer mon épargne de précaution', area: 'finances', kind: 'account', account: acc.id, target: 3000, deadline: `${YEAR}-12-31`, why: '3 mois de dépenses de côté pour ne jamais être pris de court.', steps: [] },
    { id: uid(), title: 'Commencer à investir chaque mois', area: 'finances', kind: 'steps', deadline: `${YEAR}-06-30`, why: 'Faire travailler mon argent sur le long terme.', steps: steps(['Me renseigner : PEA, assurance-vie, ETF', 'Ouvrir un PEA', 'Mettre en place un virement automatique mensuel', 'Ne pas toucher : revue 1 fois par trimestre seulement']) },
    { id: uid(), title: 'Voir mon fils au moins une fois par mois', area: 'famille', kind: 'counter', current: 0, target: 12, unit: 'visites', deadline: `${YEAR}-12-31`, why: 'Être présent pour lui.', steps: [] },
    { id: uid(), title: 'Installer mes routines', area: 'perso', kind: 'steps', deadline: `${YEAR}-03-31`, why: 'Des automatismes plutôt que de la volonté.', steps: steps(['Tenir la routine du soir 21 jours d’affilée', 'Faire 4 revues hebdo d’affilée', 'Faire ma première revue mensuelle']) },
  );
  S.tasks.push(
    { id: uid(), title: 'Noter mes dépenses du jour', area: 'finances', repeat: 'daily', date: t0, time: '21:00', prio: 'normal', doneOn: {} },
    { id: uid(), title: 'Préparer la to-do de demain (3 priorités)', area: 'perso', repeat: 'daily', date: t0, time: '21:30', prio: 'normal', doneOn: {} },
    { id: uid(), title: 'Revue de la semaine : budget, agenda, objectifs', area: 'perso', repeat: 'weekly', date: sun, time: '18:00', prio: 'high', doneOn: {} },
    { id: uid(), title: 'Appeler / faire un appel vidéo avec mon fils', area: 'famille', repeat: 'weekly', date: addDays(sun, -3), time: '19:00', prio: 'high', doneOn: {} },
    { id: uid(), title: 'Revue mensuelle : bilan budget + mettre à jour la valeur des placements', area: 'finances', repeat: 'monthly', date: `${ym(addMonths(ym(t0), 1))}-01`, time: '10:00', prio: 'high', doneOn: {} },
    { id: uid(), title: 'Planifier les visites à mon fils pour 2027 (dates + budget)', area: 'famille', repeat: 'none', date: addDays(t0, 3), prio: 'high', done: false },
    { id: uid(), title: 'Saisir mon salaire et mes charges fixes (onglet Argent)', area: 'finances', repeat: 'none', date: t0, prio: 'high', done: false },
  );
  snapshot();
}

function vTasks() {
  const d = UI.task, t0 = today(), list = tasksOn(d);
  const routines = list.filter(isRec), one = list.filter(t => !isRec(t));
  const od = d === t0 ? overdue() : [];
  const someday = S.tasks.filter(t => !isRec(t) && !t.date);
  const allRoutines = S.tasks.filter(isRec);
  return `<div class="stepper"><button class="icon" data-a="td" data-n="-1" aria-label="Jour précédent">‹</button>
    <h2>${d === t0 ? "Aujourd'hui" : cap(fmt(d, { weekday: 'long', day: 'numeric', month: 'long' }))}</h2>
    <button class="icon" data-a="td" data-n="1" aria-label="Jour suivant">›</button></div>
    ${d !== t0 ? '<p style="text-align:center;margin:-6px 0 10px"><button class="btn sm ghost" data-a="td" data-n="0">Revenir à aujourd’hui</button></p>' : ''}
    ${od.length ? `<div class="sec">En retard</div><section class="card"><ul class="list">${od.map(t => taskRow(t, d)).join('')}</ul></section>` : ''}
    <div class="sec">Tâches<span class="grow"></span><button class="btn sm ghost" data-a="nt">＋</button></div>
    <section class="card">${one.length ? `<ul class="list">${one.map(t => taskRow(t, d)).join('')}</ul>` : '<p class="empty">Aucune tâche ce jour-là.</p>'}</section>
    <div class="sec">Routines du jour</div>
    <section class="card">${routines.length ? `<ul class="list">${routines.map(t => taskRow(t, d)).join('')}</ul>` : '<p class="empty">Aucune routine. Crée une tâche avec une répétition.</p>'}</section>
    ${someday.length ? `<div class="sec">Un jour / sans date</div><section class="card"><ul class="list">${someday.map(t => taskRow(t, d)).join('')}</ul></section>` : ''}
    ${allRoutines.length ? `<div class="sec">Toutes mes routines</div><section class="card"><ul class="list">${allRoutines.map(t => `<li class="item"><div class="grow" data-a="et" data-id="${t.id}"><div class="ttl">${esc(t.title)}</div><div class="meta"><span>↻ ${REPEAT[t.repeat]}${t.time ? ' à ' + t.time : ''}</span>${tag(t.area)}<span class="streak">🔥 série ${streak(t)}</span></div></div></li>`).join('')}</ul></section>` : ''}`;
}

function dayItems(d) {
  const ev = eventsOn(d), tr = S.trips.filter(t => t.start <= d && t.end >= d);
  const tk = S.tasks.filter(t => !isRec(t) && t.date === d), gl = S.goals.filter(g => g.deadline === d);
  return { ev, tr, tk, gl };
}
function vAgenda() {
  const seg = `<div class="seg"><button class="${UI.agMode === 'month' ? 'on' : ''}" data-a="agm" data-m="month">Mois</button><button class="${UI.agMode === 'year' ? 'on' : ''}" data-a="agm" data-m="year">Année ${UI.agYear}</button></div>`;
  if (UI.agMode === 'year') return seg + vYear();
  const m = UI.agMonth, first = parse(m + '-01'), t0 = today();
  const start = addDays(m + '-01', -((first.getDay() + 6) % 7));
  let cells = '';
  for (let i = 0; i < 42; i++) {
    const d = addDays(start, i); if (i >= 35 && ym(d) !== m) break;
    const it = dayItems(d), dots = [...it.ev.map(e => (AREAS[e.area] || AREAS.perso).c), ...it.tk.map(t => (AREAS[t.area] || AREAS.perso).c), ...it.gl.map(() => '#10b981')].slice(0, 4);
    cells += `<button class="${ym(d) !== m ? 'out' : ''} ${d === t0 ? 'today' : ''} ${d === UI.agSel ? 'sel' : ''} ${it.tr.length ? 'trip' : ''}" data-a="ags" data-d="${d}" aria-label="${fmt(d, { weekday: 'long', day: 'numeric', month: 'long' })}">${parse(d).getDate()}<span class="dots">${dots.map(c => `<i style="--c:${c}"></i>`).join('')}</span></button>`;
  }
  const s = UI.agSel, it = dayItems(s), rec = tasksOn(s).filter(isRec);
  return seg + `<div class="stepper"><button class="icon" data-a="agn" data-n="-1" aria-label="Mois précédent">‹</button><h2>${fmtM(m)}</h2><button class="icon" data-a="agn" data-n="1" aria-label="Mois suivant">›</button></div>
    <section class="card"><div class="cal">${['L', 'M', 'M', 'J', 'V', 'S', 'D'].map(x => `<div class="dow">${x}</div>`).join('')}${cells}</div>
    <p class="small mute" style="margin:8px 0 0">Points = événements / tâches · trait orange = voyage</p></section>
    <div class="sec">${cap(fmt(s, { weekday: 'long', day: 'numeric', month: 'long' }))}<span class="grow"></span><button class="btn sm ghost" data-a="ne">＋ Événement</button><button class="btn sm ghost" data-a="nt" data-d="${s}">＋ Tâche</button></div>
    <section class="card">
      ${it.tr.map(t => `<div class="alert info" data-a="go" data-h="#trips">🧳 <span><b>${esc(t.dest)}</b> — ${esc(t.purpose || '')} (${fmt(t.start)} → ${fmt(t.end)})</span></div>`).join('')}
      ${it.gl.map(g => `<div class="alert info" data-a="go" data-h="#goals">🎯 <span>Échéance : <b>${esc(g.title)}</b></span></div>`).join('')}
      <ul class="list">${it.ev.map(eventRow).join('')}${it.tk.map(t => taskRow(t, s)).join('')}${rec.map(t => taskRow(t, s)).join('')}</ul>
      ${!it.ev.length && !it.tk.length && !it.tr.length && !it.gl.length && !rec.length ? '<p class="empty">Rien ce jour-là.</p>' : ''}
    </section>`;
}
function vYear() {
  const y = UI.agYear;
  let html = `<div class="stepper"><button class="icon" data-a="agy" data-n="-1" aria-label="Année précédente">‹</button><h2>Mon année ${y}</h2><button class="icon" data-a="agy" data-n="1" aria-label="Année suivante">›</button></div><div class="months">`;
  for (let i = 1; i <= 12; i++) {
    const m = `${y}-${pad(i)}`;
    const items = [
      ...S.trips.filter(t => ym(t.start) === m).map(t => ({ d: t.start, h: `🧳 ${fmt(t.start, { day: 'numeric' })}–${fmt(t.end, { day: 'numeric', month: ym(t.end) !== m ? 'short' : undefined })} ${esc(t.dest)}` })),
      ...S.events.filter(e => ym(e.date) === m).map(e => ({ d: e.date + (e.time || ''), h: `${(AREAS[e.area] || AREAS.perso).i} ${parse(e.date).getDate()} · ${esc(e.title)}` })),
      ...S.goals.filter(g => g.deadline && ym(g.deadline) === m).map(g => ({ d: g.deadline, h: `🎯 ${parse(g.deadline).getDate()} · ${esc(g.title)}` })),
    ].sort((a, b) => a.d.localeCompare(b.d));
    const spend = monthStats(m);
    html += `<section class="card" data-a="agym" data-m="${m}"><h2>${cap(parse(m + '-01').toLocaleDateString('fr-FR', { month: 'long' }))}<span class="grow"></span>${spend.inc || spend.out ? `<span class="small mute num">${eur(spend.rest)}</span>` : ''}</h2>
      ${items.length ? `<ul class="list">${items.slice(0, 6).map(x => `<li>${x.h}</li>`).join('')}</ul>${items.length > 6 ? `<div class="small mute">+ ${items.length - 6} autres</div>` : ''}` : '<div class="small mute">—</div>'}</section>`;
  }
  return html + '</div>';
}

function vGoals() {
  const avg = S.goals.length ? S.goals.reduce((s, g) => s + goalProg(g), 0) / S.goals.length : 0;
  let html = `<section class="card hero"><div class="row"><div class="grow"><div class="mute">Progression globale</div><div class="big">${pct(avg)}</div></div><button class="btn ghost" data-a="ng" style="background:#fff;color:#4f46e5">＋ Objectif</button></div>${bar(avg)}</section>`;
  if (!S.goals.length) return html + '<p class="empty">Fixe 3 à 6 objectifs clairs pour 2027 : un par domaine important de ta vie.</p>';
  for (const [k, a] of Object.entries(AREAS)) {
    const gs = S.goals.filter(g => g.area === k); if (!gs.length) continue;
    html += `<div class="sec">${a.i} ${a.l}</div>` + gs.map(g => {
      const p = goalProg(g), n = g.deadline ? diffDays(today(), g.deadline) : null;
      let body = '';
      if (g.kind === 'counter') body = `<div class="counter"><button class="btn sm ghost" data-a="gc" data-id="${g.id}" data-n="-1" aria-label="Moins">−</button><b class="num">${goalValue(g)}</b><button class="btn sm" data-a="gc" data-id="${g.id}" data-n="1" aria-label="Plus">＋</button></div>`;
      else if (g.kind === 'account') body = `<div class="counter"><b class="num">${goalValue(g)}</b><span class="grow"></span>${g.account ? `<button class="btn sm" data-a="contrib" data-id="${g.account}">＋ Versement</button>` : ''}</div>`;
      else body = `<ul class="steps">${(g.steps || []).map(s => `<li class="${s.done ? 'is-done' : ''}"><button class="chk" data-a="gs" data-id="${g.id}" data-s="${s.id}" aria-pressed="${!!s.done}" aria-label="${s.done ? 'Décocher' : 'Cocher'} l’étape">${s.done ? '✓' : ''}</button><span class="grow ttl" style="font-weight:500">${esc(s.t)}</span><button class="x" data-a="gsd" data-id="${g.id}" data-s="${s.id}" aria-label="Supprimer l’étape">×</button></li>`).join('')}</ul>
        <form class="addstep" data-g="${g.id}"><input name="t" placeholder="Ajouter une étape…" aria-label="Nouvelle étape"><button class="btn sm ghost">＋</button></form>`;
      return `<section class="card"><div class="row"><div class="grow"><div class="ttl" style="font-size:16px">${p >= 1 ? '🏆 ' : ''}${esc(g.title)}</div>
        <div class="meta">${n !== null ? `<span class="${n < 0 && p < 1 ? 'late' : ''}">⏳ ${fmt(g.deadline, { day: 'numeric', month: 'short', year: 'numeric' })} (${inDays(n)})</span>` : ''}<span><b>${pct(p)}</b></span></div></div>
        <button class="icon" data-a="eg" data-id="${g.id}" aria-label="Modifier l’objectif">✎</button></div>
        ${bar(p, p >= 1 ? 'okc' : '')}${g.why ? `<p class="small mute" style="margin:6px 0 0">💡 ${esc(g.why)}</p>` : ''}${body}</section>`;
    }).join('');
  }
  return html;
}

function tripSummary(t) {
  const n = diffDays(today(), t.start), ck = t.checklist || [], cd = ck.filter(c => c.done).length;
  return `<div data-a="etr" data-id="${t.id}" style="cursor:pointer"><div class="ttl" style="font-size:16px">${esc(t.dest)} <span class="mute small">· ${esc(t.purpose || '')}</span></div>
    <div class="meta"><span>📆 ${fmt(t.start)} → ${fmt(t.end)} (${n >= 0 ? inDays(n) : 'en cours'})</span><span class="num">💶 ${eur(tripCost(t))}</span></div>
    <div class="row" style="margin-top:6px"><span class="pill ${t.transportBooked ? 'ok' : 'bad'}">${t.transportBooked ? '✓' : '✗'} Transport${t.transport ? ' · ' + esc(t.transport) : ''}</span>
    ${t.noLodging ? '' : `<span class="pill ${t.lodgingBooked ? 'ok' : 'bad'}">${t.lodgingBooked ? '✓' : '✗'} Logement${t.lodging ? ' · ' + esc(t.lodging) : ''}</span>`}
    ${ck.length ? `<span class="pill ${cd === ck.length ? 'ok' : 'warn'}">Checklist ${cd}/${ck.length}</span>` : ''}</div></div>`;
}
function vTrips() {
  const t0 = today(), up = S.trips.filter(t => t.end >= t0).sort((a, b) => a.start.localeCompare(b.start)), past = S.trips.filter(t => t.end < t0).sort((a, b) => b.start.localeCompare(a.start));
  const y = S.trips.filter(t => t.start.startsWith(String(YEAR)));
  const yCost = y.reduce((s, t) => s + tripCost(t), 0), yDays = y.reduce((s, t) => s + diffDays(t.start, t.end) + 1, 0);
  return `<section class="card"><h2>Voyages ${YEAR}<span class="grow"></span><button class="btn sm" data-a="ntr">＋ Voyage</button></h2>
    <div class="kpis"><div class="kpi"><small>Voyages prévus</small><b>${y.length}</b></div><div class="kpi"><small>Jours sur place</small><b>${yDays}</b></div>
    <div class="kpi"><small>Budget total</small><b class="num">${eur(yCost)}</b></div><div class="kpi"><small>Par mois (à mettre de côté)</small><b class="num">${eur(yCost / 12)}</b></div></div>
    <p class="small mute" style="margin:8px 0 0">Astuce : réserve le train 2 à 3 mois à l’avance (ouverture des ventes) et mets de côté chaque mois le montant ci-dessus.</p></section>
    ${tripAlerts().map(a => alertHtml({ ...a, act: 'etr', id: a.trip })).join('')}
    <div class="sec">À venir</div>
    ${up.length ? up.map(t => `<section class="card">${tripSummary(t)}
      <ul class="steps">${(t.checklist || []).map(c => `<li class="${c.done ? 'is-done' : ''}"><button class="chk" data-a="tc" data-id="${t.id}" data-s="${c.id}" aria-pressed="${!!c.done}" aria-label="Cocher">${c.done ? '✓' : ''}</button><span class="grow ttl" style="font-weight:500">${esc(c.t)}</span><button class="x" data-a="tcd" data-id="${t.id}" data-s="${c.id}" aria-label="Supprimer">×</button></li>`).join('')}</ul>
      <form class="addstep" data-t="${t.id}"><input name="t" placeholder="Ajouter à la checklist…" aria-label="Nouvel élément"><button class="btn sm ghost">＋</button></form></section>`).join('') : '<p class="empty">Aucun voyage prévu. Planifie tes visites de 2027 dès maintenant : les billets seront moins chers.</p>'}
    ${past.length ? `<details class="card"><summary>Voyages passés (${past.length})</summary>${past.map(t => `<div style="margin-top:10px">${tripSummary(t)}</div>`).join('')}</details>` : ''}`;
}

function vMoney() {
  const tabs = [['month', 'Mois'], ['plan', 'Budget'], ['stock', 'Maison'], ['save', 'Épargne']];
  const seg = `<div class="seg">${tabs.map(([k, l]) => `<button class="${UI.mTab === k ? 'on' : ''}" data-a="mt" data-t="${k}">${l}</button>`).join('')}</div>`;
  return seg + (UI.mTab === 'save' ? vSave() : UI.mTab === 'plan' ? vPlan() : UI.mTab === 'stock' ? vStock() : vMonth());
}
function vMonth() {
  const m = UI.mMonth, st = monthStats(m), list = txM(m).sort((a, b) => b.date.localeCompare(a.date));
  const cats = Object.keys(EXP).filter(k => k !== 'epargne' && (st.by[k] || S.budgets[k]));
  const rate = st.inc ? st.sav / st.inc : 0;
  return `<div class="stepper"><button class="icon" data-a="mm" data-n="-1" aria-label="Mois précédent">‹</button><h2>${fmtM(m)}</h2><button class="icon" data-a="mm" data-n="1" aria-label="Mois suivant">›</button></div>
    <section class="card"><div class="kpis"><div class="kpi"><small>Revenus</small><b class="num">${eur(st.inc)}</b></div><div class="kpi"><small>Dépenses</small><b class="num">${eur(st.spend)}</b></div>
      <div class="kpi"><small>Épargné · ${pct(rate)}</small><b class="num pos">${eur(st.sav)}</b></div><div class="kpi"><small>Reste</small><b class="num ${st.rest < 0 ? 'neg' : ''}">${eur(st.rest)}</b></div></div>
      <div class="row" style="margin-top:10px"><button class="btn sm" data-a="nx" data-t="out">＋ Dépense</button><button class="btn sm ghost" data-a="nx" data-t="in">＋ Revenu</button></div></section>
    ${S.recurring.length ? `<div class="sec">Fixes du mois</div><section class="card"><ul class="list">${S.recurring.slice().sort((a, b) => a.day - b.day).map(r => { const dn = recDone(r, m); return `<li class="item ${dn ? 'is-done' : ''}"><button class="chk" data-a="recok" data-id="${r.id}" aria-pressed="${dn}" aria-label="${dn ? 'Annuler' : 'Enregistrer pour ce mois'}">${dn ? '✓' : ''}</button><div class="grow" data-a="erec" data-id="${r.id}"><div class="ttl">${esc(r.label)}</div><div class="meta"><span>le ${r.day}</span><span>${(r.type === 'in' ? INC : EXP)[r.cat] || ''}</span></div></div><b class="num ${r.type === 'in' ? 'pos' : ''}">${r.type === 'in' ? '+' : '−'}${eur(r.amount)}</b></li>`; }).join('')}</ul></section>` : ''}
    <div class="sec">Par catégorie</div>
    <section class="card">${cats.length ? cats.sort((a, b) => (st.by[b] || 0) - (st.by[a] || 0)).map(k => { const v = st.by[k] || 0, b = S.budgets[k]; return `<div style="margin:0 0 10px"><div class="row"><span class="grow">${EXP[k]}</span><span class="num small"><b>${eur(v)}</b>${b ? ` / ${eur(b)}` : ''}</span></div>${b ? bar(v / b, v > b ? 'over' : '') : ''}</div>`; }).join('') : '<p class="empty">Aucune dépense ce mois-ci.</p>'}
      <button class="btn sm ghost" data-a="bud">Définir mes budgets</button></section>
    <div class="sec">Opérations (${list.length})</div>
    <section class="card">${list.length ? `<ul class="list">${list.map(x => `<li class="item"><div class="grow" data-a="ex" data-id="${x.id}"><div class="ttl">${esc(x.label || (x.type === 'in' ? INC : EXP)[x.cat])}</div><div class="meta"><span>${fmt(x.date)}</span><span>${(x.type === 'in' ? INC : EXP)[x.cat] || ''}</span></div></div><b class="num ${x.type === 'in' ? 'pos' : ''}">${x.type === 'in' ? '+' : '−'}${eur(x.amount)}</b></li>`).join('')}</ul>` : '<p class="empty">Note chaque dépense le soir même : 1 minute par jour suffit.</p>'}</section>`;
}
function worthChart() {
  const pts = Object.entries(S.worth).sort((a, b) => a[0].localeCompare(b[0])).slice(-12);
  if (pts.length < 2) return '<p class="small mute">La courbe de ton patrimoine apparaîtra à partir du 2e mois de suivi.</p>';
  const W = 320, H = 110, P = 18, max = Math.max(...pts.map(p => p[1]), 1), min = Math.min(...pts.map(p => p[1]), 0);
  const x = i => P + i * (W - 2 * P) / (pts.length - 1), y = v => H - P - (v - min) / (max - min || 1) * (H - 2 * P);
  const line = pts.map((p, i) => `${x(i).toFixed(1)},${y(p[1]).toFixed(1)}`).join(' ');
  return `<svg class="chart" viewBox="0 0 ${W} ${H}" role="img" aria-label="Évolution du patrimoine sur ${pts.length} mois, de ${eur(pts[0][1])} à ${eur(pts[pts.length - 1][1])}">
    <polygon class="ar" points="${x(0)},${H - P} ${line} ${x(pts.length - 1)},${H - P}"/><polyline class="ln" points="${line}"/>
    <text x="${P}" y="${H - 3}">${fmtM(pts[0][0])}</text><text x="${W - P}" y="${H - 3}" text-anchor="end">${fmtM(pts[pts.length - 1][0])}</text></svg>`;
}
function vSave() {
  const m = ym(today()), total = worthNow(), inv = S.accounts.reduce((s, a) => s + (+a.invested || 0), 0), avg = avgMonthly();
  const cushion = avg.spend * 3, liquid = S.accounts.filter(a => a.type === 'livret' || a.type === 'courant').reduce((s, a) => s + (+a.balance || 0), 0);
  return `<section class="card hero"><div class="mute">Patrimoine total</div><div class="big">${eur(total)}</div>
    <div class="mute small">Versé ${eur(inv)} · ${total - inv >= 0 ? '+' : ''}${eur(total - inv)} de gains</div></section>
    <section class="card"><h2>📈 Évolution</h2>${worthChart()}</section>
    ${cushion > 0 ? `<section class="card"><h2>🛟 Épargne de précaution</h2><div class="row"><span class="grow small">Livrets : <b>${eur(liquid)}</b> / cible ${eur(cushion)} (3 mois de dépenses)</span></div>${bar(liquid / cushion, liquid >= cushion ? 'okc' : '')}
      <p class="small mute" style="margin:6px 0 0">${liquid >= cushion ? 'Matelas constitué ✅ — tu peux orienter tes versements vers l’investissement long terme (PEA, assurance-vie).' : 'Priorité : remplir ce matelas avant d’investir en bourse.'}</p></section>` : ''}
    <div class="sec">Mes comptes<span class="grow"></span><button class="btn sm ghost" data-a="nacc">＋ Compte</button></div>
    ${S.accounts.length ? S.accounts.map(a => { const g = (+a.balance || 0) - (+a.invested || 0), dn = accDone(a, m); return `<section class="card"><div class="row"><div class="grow" data-a="eacc" data-id="${a.id}" style="cursor:pointer"><div class="ttl">${esc(a.name)}</div><div class="meta"><span>${ACC[a.type] || ''}</span>${a.type !== 'livret' && a.type !== 'courant' && a.invested ? `<span class="${g >= 0 ? 'pos' : 'neg'}">${g >= 0 ? '+' : ''}${eur(g)} (${a.invested ? (g / a.invested * 100).toFixed(1) : 0} %)</span>` : ''}</div></div><b class="num" style="font-size:17px">${eur(a.balance)}</b></div>
      ${a.goal ? `${bar(a.balance / a.goal, a.balance >= a.goal ? 'okc' : '')}<div class="small mute">Objectif ${eur(a.goal)} · ${pct(a.balance / a.goal)}</div>` : ''}
      <div class="row" style="margin-top:8px">${+a.monthly > 0 ? `<span class="pill ${dn ? 'ok' : 'warn'}">${dn ? '✓ Versé ce mois' : `${eur(a.monthly)} le ${a.day}`}</span>` : ''}<span class="grow"></span><button class="btn sm" data-a="contrib" data-id="${a.id}">＋ Versement</button><button class="btn sm ghost" data-a="eacc" data-id="${a.id}">Mettre à jour</button></div></section>`; }).join('') : '<p class="empty">Ajoute tes livrets, PEA, assurance-vie, crypto… et mets à jour leur valeur une fois par mois.</p>'}`;
}
function vPlan() {
  const avg = avgMonthly(), st = monthStats(ym(today()));
  const sum = ks => ks.reduce((s, k) => s + (st.by[k] || 0), 0);
  const needs = sum(NEEDS), wants = sum(WANTS), inc = st.inc || avg.inc;
  const fixedOut = S.recurring.filter(r => r.type === 'out').reduce((s, r) => s + (+r.amount || 0), 0);
  const fixedIn = S.recurring.filter(r => r.type === 'in').reduce((s, r) => s + (+r.amount || 0), 0);
  const plannedSave = S.accounts.reduce((s, a) => s + (+a.monthly || 0), 0);
  const rule = (l, v, target, good) => `<div style="margin:0 0 10px"><div class="row"><span class="grow">${l}</span><span class="num small"><b>${eur(v)}</b> · ${inc ? pct(v / inc) : '–'} <span class="mute">(repère ${target})</span></span></div>${bar(inc ? v / inc : 0, good ? 'okc' : '')}</div>`;
  return aiCard() + `<section class="card"><h2>🧮 Mon mois type</h2>
    <div class="kpis"><div class="kpi"><small>Revenus fixes</small><b class="num">${eur(fixedIn)}</b></div><div class="kpi"><small>Charges fixes</small><b class="num">${eur(fixedOut)}</b></div>
    <div class="kpi"><small>Épargne programmée</small><b class="num pos">${eur(plannedSave)}</b></div><div class="kpi"><small>Reste à vivre</small><b class="num ${fixedIn - fixedOut - plannedSave < 0 ? 'neg' : ''}">${eur(fixedIn - fixedOut - plannedSave)}</b></div></div>
    <p class="small mute" style="margin:8px 0 0">Reste à vivre = ce qu’il te reste pour les courses, sorties et imprévus une fois les fixes payés et l’épargne mise de côté.</p></section>
    <section class="card"><h2>⚖️ Règle 50/30/20 — ce mois-ci</h2>
    ${inc ? rule('Besoins (logement, courses, transport, voyages…)', needs, '≤ 50 %', needs / inc <= .5) + rule('Envies (loisirs, shopping…)', wants, '≤ 30 %', wants / inc <= .3) + rule('Épargne & investissement', st.sav, '≥ 20 %', st.sav / inc >= .2) : '<p class="empty">Ajoute tes revenus pour voir ta répartition.</p>'}
    <button class="btn sm ghost" data-a="bud">Définir mes budgets par catégorie</button></section>
    <div class="sec">Revenus & charges fixes<span class="grow"></span><button class="btn sm ghost" data-a="nrec">＋ Ajouter</button></div>
    <section class="card">${S.recurring.length ? `<ul class="list">${S.recurring.slice().sort((a, b) => a.day - b.day).map(r => `<li class="item"><div class="grow" data-a="erec" data-id="${r.id}"><div class="ttl">${esc(r.label)}</div><div class="meta"><span>le ${r.day} du mois</span><span>${(r.type === 'in' ? INC : EXP)[r.cat] || ''}</span></div></div><b class="num ${r.type === 'in' ? 'pos' : ''}">${r.type === 'in' ? '+' : '−'}${eur(r.amount)}</b></li>`).join('')}</ul>` : '<p class="empty">Commence par ton salaire d’alternance, ton loyer et tes abonnements.</p>'}</section>
    <section class="card small"><h2>📌 Mes automatismes conseillés</h2><ol style="margin:0;padding-left:18px">
      <li>Le jour de la paie : <b>virement automatique</b> vers l’épargne (« se payer en premier »).</li>
      <li>Chaque soir : noter ses dépenses (1 min).</li>
      <li>Chaque dimanche : revue de la semaine (budget, agenda, objectifs).</li>
      <li>Chaque début de mois : bilan du mois + mise à jour de la valeur des placements.</li>
      <li>Ordre de priorité : matelas de sécurité (3 mois) → investir long terme (PEA / assurance-vie).</li></ol></section>`;
}

function syncCard() {
  const st = window.CapSync && window.CapSync.state ? window.CapSync.state() : { status: 'loading' };
  const ago = st.last ? new Date(st.last).toLocaleTimeString('fr-FR', { hour: '2-digit', minute: '2-digit' }) : '';
  let body;
  if (st.status === 'noconfig') body = '<p class="small mute">La synchronisation n’est pas encore configurée.</p>';
  else if (st.status === 'unavailable' || st.status === 'loading') body = `<p class="small mute">${st.status === 'loading' ? 'Chargement…' : 'Service de synchronisation injoignable (pas de connexion ?). Tes données restent sur cet appareil.'}</p>`;
  else if (!st.user) body = `<p class="small mute">Connecte-toi avec ton compte Google sur chaque appareil (téléphone, ordinateur…) : tes données seront les mêmes partout et mises à jour en quelques secondes.</p><button class="btn sm" data-a="signin">Se connecter avec Google</button>`;
  else body = `<p class="small">Connecté : <b>${esc(st.user)}</b><br>${st.status === 'error' ? `<span class="pill bad">Erreur</span> ${esc(st.error || '')}` : st.status === 'offline' ? '<span class="pill warn">Hors connexion</span> synchronisation au retour du réseau' : `<span class="pill ok">Synchronisé</span>${ago ? ' à ' + ago : ''}`}</p><div class="row"><button class="btn sm ghost" data-a="syncnow">Synchroniser maintenant</button><button class="btn sm ghost" data-a="signout">Se déconnecter</button></div>`;
  return `<section class="card"><h2>☁️ Synchronisation entre appareils</h2>${body}</section>`;
}
function vSettings() {
  const st = S.settings, perm = 'Notification' in window ? Notification.permission : 'unsupported';
  const standalone = matchMedia('(display-mode: standalone)').matches || navigator.standalone;
  return `<section class="card"><h2>👤 Profil</h2><div class="fields">
      <label class="fld half"><span>Prénom</span><input id="s-name" value="${esc(st.name)}"></label>
      <label class="fld half"><span>Résumé du matin à</span><select id="s-morning">${Array.from({ length: 6 }, (_, i) => i + 5).map(h => `<option value="${h}" ${+st.morning === h ? 'selected' : ''}>${h} h</option>`).join('')}</select></label>
      <label class="fld"><span>Thème</span><select id="s-theme">${[['auto', 'Automatique'], ['light', 'Clair'], ['dark', 'Sombre']].map(([k, l]) => `<option value="${k}" ${st.theme === k ? 'selected' : ''}>${l}</option>`).join('')}</select></label></div>
      <button class="btn sm" data-a="sset" style="margin-top:10px">Enregistrer</button></section>
    <section class="card"><h2>🔔 Notifications & rappels</h2>
      <p class="small">État : ${perm === 'granted' && st.notif ? '<span class="pill ok">Activées</span>' : perm === 'denied' ? '<span class="pill bad">Bloquées dans le navigateur</span>' : perm === 'unsupported' ? '<span class="pill bad">Non disponibles ici</span>' : '<span class="pill warn">Désactivées</span>'}</p>
      <p class="small mute">Rappels envoyés : résumé du matin, tâches à l’heure prévue, événements (selon le rappel choisi), versements d’épargne et prélèvements le jour J, voyages pas encore réservés, veille de départ.</p>
      <div class="row">${st.notif && perm === 'granted' ? '<button class="btn sm ghost" data-a="noff">Désactiver</button><button class="btn sm ghost" data-a="ntest">Tester</button>' : '<button class="btn sm" data-a="non">Activer les notifications</button>'}</div>
      <p class="small mute">⚠️ Une appli web envoie ses rappels quand elle est ouverte ou en arrière-plan récent. Pour des alarmes 100 % fiables même téléphone verrouillé, <b>exporte ton agenda</b> ci-dessous et importe-le dans Google Agenda / Calendrier iPhone : chaque rappel y devient une alarme.</p>
      ${!standalone ? '<p class="small mute">📱 Installe l’appli : Android/Chrome → menu ⋮ → « Installer l’application ». iPhone/Safari → Partager → « Sur l’écran d’accueil » (obligatoire sur iPhone pour les notifications).</p>' : ''}</section>
    ${syncCard()}
    <section class="card"><h2>📆 Exporter vers mon agenda</h2><p class="small mute">Fichier .ics avec tes événements, voyages, routines horaires, versements d’épargne, charges fixes et échéances d’objectifs, avec alarmes.</p>
      <button class="btn sm" data-a="ics">Télécharger cap2027.ics</button></section>
    <section class="card"><h2>💾 Sauvegarde</h2><p class="small mute">Tes données sont uniquement sur cet appareil. Exporte une sauvegarde régulièrement (et pour passer sur un autre téléphone).</p>
      <div class="row"><button class="btn sm" data-a="exp">Exporter (JSON)</button><label class="btn sm ghost">Importer<input type="file" id="imp" accept="application/json,.json" hidden></label></div></section>
    <section class="card"><h2>🧹 Données</h2><div class="row"><button class="btn sm ghost" data-a="tpl">Ajouter le modèle de départ</button><button class="btn sm danger" data-a="wipe">Tout effacer</button></div></section>
    <p class="small mute" style="text-align:center">Cap 2027 · version ${VERSION} · données locales</p>`;
}

/* ---------- Notifications ---------- */
function summaryText() {
  const t0 = today(), tk = tasksOn(t0).filter(t => !isDone(t, t0)), ev = eventsOn(t0), od = overdue().length;
  const parts = [];
  if (ev.length) parts.push(`${ev.length} événement${ev.length > 1 ? 's' : ''} (${ev.slice(0, 2).map(e => e.title).join(', ')})`);
  parts.push(`${tk.length} tâche${tk.length > 1 ? 's' : ''} à faire`);
  if (od) parts.push(`${od} en retard`);
  return parts.join(' · ');
}
function dueList(now) {
  const out = [], t0 = ds(now), m = ym(t0), day = now.getDate(), mh = pad(S.settings.morning || 8) + ':00';
  const push = (key, when, title, body) => { if (when <= now && now - when < 6 * 36e5 && !S.notified[key]) out.push({ key, title, body }); };
  push('m:' + t0, at(t0, mh), '☀️ Ta journée', summaryText());
  for (const e of S.events) {
    if (e.reminder == null || +e.reminder < 0 || !e.date) continue;
    const w = new Date(at(e.date, e.time || mh) - e.reminder * 6e4);
    push(`e:${e.id}:${e.date}${e.time || ''}:${e.reminder}`, w, '📅 ' + e.title, (e.time ? `${fmt(e.date)} à ${e.time}` : fmt(e.date)) + (e.place ? ' · ' + e.place : ''));
  }
  for (const t of tasksOn(t0)) if (t.time && !isDone(t, t0)) push(`t:${t.id}:${t0}`, at(t0, t.time), '✅ ' + t.title, isRec(t) ? 'Routine — garde ta série 🔥' : 'Tâche prévue maintenant');
  for (const a of S.accounts) if (+a.monthly > 0 && +a.day === day && !accDone(a, m)) push(`a:${a.id}:${m}`, at(t0, '09:00'), '💶 Versement épargne', `${eur(a.monthly)} vers ${a.name} aujourd’hui`);
  for (const r of S.recurring) if (+r.day === day && !recDone(r, m)) push(`r:${r.id}:${m}`, at(t0, '09:00'), r.type === 'in' ? '💰 Rentrée prévue' : '🧾 Prélèvement prévu', `${r.label} : ${eur(r.amount)}`);
  for (const a of tripAlerts()) push(`ta:${a.key}:${t0}`, at(t0, '10:00'), '🧳 Voyage à préparer', a.txt);
  for (const t of S.trips) if (t.start === addDays(t0, 1)) push(`td:${t.id}:${t.start}`, at(t0, '18:00'), '🧳 Départ demain', `${t.dest} — billets, logement, sac : tout est prêt ?`);
  return out;
}
async function sysNotify(title, body, tag) {
  try {
    const r = 'serviceWorker' in navigator && await navigator.serviceWorker.getRegistration();
    if (r) { await r.showNotification(title, { body, tag, icon: 'icon-192.png', badge: 'badge-96.png' }); return; }
    new Notification(title, { body, tag });
  } catch (e) { toast(title + ' — ' + body); }
}
function checkReminders() {
  if (!S.settings.notif) return;
  const due = dueList(new Date()); if (!due.length) return;
  const granted = 'Notification' in window && Notification.permission === 'granted';
  for (const n of due) { S.notified[n.key] = today(); if (granted) sysNotify(n.title, n.body, n.key); else toast(n.title + ' — ' + n.body); }
  // Nettoyage des clés de plus de 60 jours
  const lim = addDays(today(), -60);
  for (const k in S.notified) if (S.notified[k] < lim) delete S.notified[k];
  save();
}

/* ---------- Export agenda (.ics) ---------- */
function ics() {
  const L = ['BEGIN:VCALENDAR', 'VERSION:2.0', 'PRODID:-//Cap 2027//FR', 'CALSCALE:GREGORIAN', 'X-WR-CALNAME:Cap 2027'];
  const stamp = new Date().toISOString().replace(/[-:]/g, '').replace(/\.\d+/, '');
  const tx = s => String(s || '').replace(/\\/g, '\\\\').replace(/\n/g, '\\n').replace(/[,;]/g, m => '\\' + m);
  const dt = (d, t) => d.replace(/-/g, '') + (t ? 'T' + t.replace(':', '') + '00' : '');
  // min = minutes AVANT le début (négatif = après, ex. 8 h le jour même d'un événement sur la journée) ; null = pas d'alarme
  const alarm = min => min == null ? [] : ['BEGIN:VALARM', 'ACTION:DISPLAY', 'DESCRIPTION:Rappel', `TRIGGER:${min > 0 ? '-' : ''}PT${Math.abs(min)}M`, 'END:VALARM'];
  const ev = (id, sum, start, end, extra = [], min = null, allDay = false) => L.push('BEGIN:VEVENT', `UID:${id}@cap2027`, `DTSTAMP:${stamp}`,
    allDay ? `DTSTART;VALUE=DATE:${start}` : `DTSTART:${start}`, allDay ? `DTEND;VALUE=DATE:${end}` : `DTEND:${end}`, `SUMMARY:${tx(sum)}`, ...extra, ...alarm(min), 'END:VEVENT');
  const plus1h = (d, t) => { const x = at(d, t); x.setHours(x.getHours() + 1); return dt(ds(x), pad(x.getHours()) + ':' + pad(x.getMinutes())); };
  for (const e of S.events) {
    const extra = [e.place && `LOCATION:${tx(e.place)}`, e.notes && `DESCRIPTION:${tx(e.notes)}`].filter(Boolean);
    const rem = e.reminder == null || +e.reminder < 0 ? null : +e.reminder;
    if (e.time) ev(e.id, e.title, dt(e.date, e.time), e.end && e.end > e.time ? dt(e.date, e.end) : plus1h(e.date, e.time), extra, rem);
    else ev(e.id, e.title, dt(e.date), dt(addDays(e.date, 1)), extra, rem == null ? null : rem - (S.settings.morning || 8) * 60, true);
  }
  for (const t of S.trips) ev(t.id, `🧳 ${t.dest} — ${t.purpose || 'voyage'}`, dt(t.start), dt(addDays(t.end, 1)), [`DESCRIPTION:${tx(`Transport : ${t.transport || '?'} (${t.transportBooked ? 'réservé' : 'À RÉSERVER'})\nLogement : ${t.noLodging ? '—' : (t.lodging || '?') + (t.lodgingBooked ? ' (réservé)' : ' (À RÉSERVER)')}\nBudget : ${eur(tripCost(t))}`)}`], 6 * 60, true); // la veille à 18 h
  const BYDAY = ['SU', 'MO', 'TU', 'WE', 'TH', 'FR', 'SA'];
  for (const t of S.tasks.filter(t => isRec(t) && t.time)) {
    const b = parse(t.date || today());
    const rule = { daily: 'FREQ=DAILY', weekdays: 'FREQ=WEEKLY;BYDAY=MO,TU,WE,TH,FR', weekly: `FREQ=WEEKLY;BYDAY=${BYDAY[b.getDay()]}`, monthly: `FREQ=MONTHLY;BYMONTHDAY=${b.getDate()}` }[t.repeat];
    ev(t.id, '✅ ' + t.title, dt(t.date || today(), t.time), plus1h(t.date || today(), t.time), [`RRULE:${rule}`], 0);
  }
  const m1 = ym(today()) + '-';
  for (const a of S.accounts) if (+a.monthly > 0) ev(a.id, `💶 Versement ${eur(a.monthly)} → ${a.name}`, dt(m1 + pad(a.day), '09:00'), dt(m1 + pad(a.day), '09:15'), [`RRULE:FREQ=MONTHLY;BYMONTHDAY=${a.day}`], 0);
  for (const r of S.recurring) ev(r.id, `${r.type === 'in' ? '💰' : '🧾'} ${r.label} ${eur(r.amount)}`, dt(m1 + pad(r.day), '09:00'), dt(m1 + pad(r.day), '09:15'), [`RRULE:FREQ=MONTHLY;BYMONTHDAY=${r.day}`], 0);
  for (const g of S.goals) if (g.deadline) ev(g.id, `🎯 Échéance : ${g.title}`, dt(g.deadline), dt(addDays(g.deadline, 1)), [], 7 * 24 * 60 - 9 * 60, true);
  L.push('END:VCALENDAR');
  // Lignes ≤ 75 octets (RFC 5545) : repli simple par caractères
  const fold = l => { const o = []; while (l.length > 70) { o.push(l.slice(0, 70)); l = ' ' + l.slice(70); } o.push(l); return o.join('\r\n'); };
  download('cap2027.ics', L.map(fold).join('\r\n'), 'text/calendar');
}
function download(name, text, type) {
  const a = document.createElement('a');
  a.href = URL.createObjectURL(new Blob([text], { type }));
  a.download = name; document.body.appendChild(a); a.click(); a.remove();
  setTimeout(() => URL.revokeObjectURL(a.href), 2000);
}

/* ---------- Inventaire maison ---------- */
// Produit suivi en % : stock effectif = unités pleines + niveau de l'unité entamée (ex. 1 tube à 10 % = 0,1)
const lvl = i => i.level == null || i.level === '' ? 100 : Math.max(0, Math.min(100, +i.level));
const eff = i => i.pct ? (+i.qty > 0 ? +i.qty - 1 + lvl(i) / 100 : 0) : (+i.qty || 0);
const invStatus = i => {
  if (i.qty == null || i.qty === '') return 'unk';
  const e = eff(i);
  if (e <= 0) return 'out';
  if (i.pct) return e <= (+i.min || 0) + (i.alert == null ? 25 : +i.alert) / 100 ? 'low' : 'ok';
  return e <= (+i.min || 0) ? 'low' : 'ok';
};
const toBuy = i => Math.max(1, Math.ceil((+i.target || (+i.min || 0) + 1) - eff(i)));
const shopping = () => S.inv.filter(i => ['out', 'low'].includes(invStatus(i)));
function editItem(id) {
  const i = S.inv.find(x => x.id === id) || { cat: 'alim', min: 1, target: 3, qty: 1 };
  form({
    title: id ? "Modifier l'article" : 'Nouvel article maison',
    fields: [
      { k: 'name', l: 'Article', req: 1, v: i.name, ph: 'Riz, lessive, dentifrice…' },
      { k: 'cat', l: 'Rayon', type: 'select', opts: Object.entries(INV_CATS), v: i.cat, half: 1 },
      { k: 'unit', l: 'Unité', v: i.unit, ph: 'paquet, kg, flacon…', half: 1 },
      { k: 'qty', l: 'Quantité en stock', type: 'number', v: i.qty, half: 1, step: '0.5' },
      { k: 'price', l: 'Prix unitaire (€)', type: 'number', v: i.price, half: 1, step: '0.01' },
      { k: 'min', l: 'Racheter quand ≤', type: 'number', v: i.min, half: 1, step: '0.5' },
      { k: 'target', l: 'Stock idéal', type: 'number', v: i.target, half: 1, step: '0.5' },
      { k: 'exp', l: 'Date de péremption (facultatif)', type: 'date', v: i.exp },
      { k: 'pct', l: 'Suivre le niveau en % (huile, lessive, dentifrice…)', type: 'checkbox', v: i.pct },
      { k: 'level', l: 'Niveau de l’unité entamée (%)', type: 'number', v: i.pct ? lvl(i) : 100, half: 1, step: '5' },
      { k: 'alert', l: 'Alerte quand il reste ≤ (%)', type: 'number', v: i.alert ?? 25, half: 1, step: '5', hint: 'Pour un suivi en %, « Racheter quand ≤ » compte les unités pleines de réserve (0 = seulement l’unité entamée).' },
    ],
    onSave: v => {
      v.level = Math.max(0, Math.min(100, v.level ?? 100)); v.alert = Math.max(0, Math.min(100, v.alert ?? 25));
      if (id) Object.assign(i, v); else S.inv.push({ id: uid(), ...v });
    },
    onDelete: id && (() => { S.inv = S.inv.filter(x => x.id !== id); }),
  });
}
function vStock() {
  const list = shopping(), total = list.reduce((s, i) => s + toBuy(i) * (+i.price || 0), 0), unk = S.inv.filter(i => invStatus(i) === 'unk').length;
  const pill = i => ({ ok: '<span class="pill ok">OK</span>', low: '<span class="pill warn">Bientôt fini</span>', out: '<span class="pill bad">Épuisé</span>', unk: '<span class="pill warn">À renseigner</span>' })[invStatus(i)];
  let html = `<section class="card"><h2>🏠 Ma maison<span class="grow"></span><button class="btn sm" data-a="ni">＋ Article</button></h2>
    <div class="kpis"><div class="kpi"><small>Articles suivis</small><b>${S.inv.length}</b></div><div class="kpi"><small>À racheter</small><b>${list.length}</b></div>
    <div class="kpi"><small>Courses estimées</small><b class="num">${eur(total)}</b></div><div class="kpi"><small>Quantités à renseigner</small><b>${unk}</b></div></div>
    ${S.inv.length ? '' : '<p class="small mute" style="margin:10px 0 0">Suis ce que tu as chez toi : l’appli fait ta liste de courses et Claude en tient compte pour ton budget.</p><div class="row" style="margin-top:8px"><button class="btn sm ghost" data-a="ess">Ajouter les essentiels (épicerie, ménage, hygiène)</button></div>'}</section>`;
  if (list.length) html += `<div class="sec">🛒 Liste de courses</div><section class="card"><ul class="list">${list.map(i => `<li class="item"><button class="chk" data-a="buy" data-id="${i.id}" aria-label="Acheté : ajouter au stock"></button><div class="grow" data-a="ei" data-id="${i.id}"><div class="ttl">${esc(i.name)}</div><div class="meta"><span>${toBuy(i)} ${esc(i.unit || '')}</span>${i.price ? `<span class="num">≈ ${eur(toBuy(i) * i.price)}</span>` : '<span>prix ?</span>'}</div></div></li>`).join('')}</ul>
    <div class="row" style="margin-top:8px"><span class="small mute grow">Coche un article une fois acheté : il est ajouté au stock.</span><button class="btn sm" data-a="buytx">Noter la dépense</button></div></section>`;
  for (const [k, l] of Object.entries(INV_CATS)) {
    const items = S.inv.filter(i => (i.cat || 'autre') === k).sort((a, b) => a.name.localeCompare(b.name)); if (!items.length) continue;
    html += `<div class="sec">${l}</div><section class="card"><ul class="list">${items.map(i => `<li class="item"><div class="grow" data-a="ei" data-id="${i.id}"><div class="ttl">${esc(i.name)}</div><div class="meta">${pill(i)}${i.unit ? `<span>${esc(i.unit)}</span>` : ''}${i.price ? `<span class="num">${eur(i.price)}</span>` : ''}${i.exp ? `<span class="${diffDays(today(), i.exp) <= 3 ? 'late' : ''}">⏳ ${fmt(i.exp)}</span>` : ''}</div>
      ${i.pct && +i.qty > 0 ? `<div class="lvl" data-stop><span class="small mute">Entamé${+i.qty > 1 ? ` (+${+i.qty - 1} plein${+i.qty > 2 ? 's' : ''})` : ''}</span><input type="range" min="0" max="100" step="5" value="${lvl(i)}" data-lvl="${i.id}" aria-label="Niveau restant de ${esc(i.name)}" style="--v:${lvl(i)}%;--c:${invStatus(i) === 'ok' ? 'var(--ok)' : 'var(--bad)'}"><b class="num small" data-lvlv="${i.id}">${lvl(i)} %</b></div>` : ''}</div>
      <div class="row" style="flex-wrap:nowrap"><button class="btn sm ghost" data-a="iq" data-id="${i.id}" data-n="-1" aria-label="Retirer 1 ${esc(i.name)}">−</button><b class="num" style="min-width:24px;text-align:center">${i.qty == null ? '?' : +i.qty}</b><button class="btn sm ghost" data-a="iq" data-id="${i.id}" data-n="1" aria-label="Ajouter 1 ${esc(i.name)}">＋</button></div></li>`).join('')}</ul></section>`;
  }
  return html;
}

/* ---------- Budget proposé par l'IA (Claude) ---------- */
let sampleFn = null; // fonction Claude fournie par claude.ai, ou null hors de claude.ai
function aiContext() {
  const m = ym(today()), st = monthStats(m), next = addMonths(m, 1), hist = [];
  let mm = addMonths(m, -1);
  for (let i = 0; i < 6 && hist.length < 3; i++, mm = addMonths(mm, -1)) if (txM(mm).length) { const s = monthStats(mm); hist.push({ mois: mm, revenus: s.inc, depenses_par_categorie: s.by }); }
  return {
    date_du_jour: today(), mois: m,
    revenus_du_mois: txM(m).filter(x => x.type === 'in').map(x => ({ libelle: x.label || INC[x.cat], montant: +x.amount })),
    revenu_moyen_estime: Math.round(avgMonthly().inc),
    depenses_deja_faites_ce_mois: st.by,
    charges_et_revenus_fixes: S.recurring.map(r => ({ libelle: r.label, type: r.type === 'in' ? 'revenu' : 'charge', montant: +r.amount, categorie: r.cat, jour: r.day })),
    epargne_programmee: S.accounts.filter(a => +a.monthly > 0).map(a => ({ compte: a.name, montant_mensuel: +a.monthly })),
    comptes: S.accounts.map(a => ({ compte: a.name, type: ACC[a.type], solde: +a.balance || 0, objectif: +a.goal || null })),
    historique_mois_precedents: hist,
    budgets_actuels: S.budgets,
    voyages_ce_mois_et_le_suivant: S.trips.filter(t => ym(t.start) === m || ym(t.start) === next).map(t => ({ destination: t.dest, objet: t.purpose, depart: t.start, retour: t.end, cout_prevu: tripCost(t), deja_reserve: !!t.transportBooked })),
    inventaire_maison: S.inv.map(i => ({ article: i.name, rayon: INV_CATS[i.cat], quantite: i.qty, niveau_unite_entamee: i.pct ? lvl(i) + ' %' : undefined, unite: i.unit, racheter_si_inferieur_a: i.min, prix_unitaire: i.price || null, peremption: i.exp || null })),
    a_racheter: shopping().map(i => ({ article: i.name, quantite: toBuy(i), unite: i.unit, prix_unitaire: i.price || null })),
    objectifs_financiers: S.goals.filter(g => g.area === 'finances').map(g => ({ objectif: g.title, progression: pct(goalProg(g)) })),
  };
}
function aiPrompt(ctx, asJson = true) {
  return `Tu es mon assistant budgétaire personnel. Je suis étudiant en alternance en France, j'entre dans la vie active fin 2027 et je veux prendre de bons automatismes financiers. J'ai un fils que je vais voir régulièrement (voyages).

Propose-moi un budget pour le mois ${fmtM(ctx.mois)} à partir des données JSON ci-dessous.
Règles :
- Pars des revenus du mois (sinon du revenu moyen estimé). Réserve d'abord les charges fixes et l'épargne programmée (« se payer en premier »).
- Appuie-toi sur mon historique réel par catégorie, sur les voyages prévus (à budgéter dans « voyages ») et sur mon inventaire : si j'ai déjà du stock, réduis le budget courses ; chiffre ce qui manque (prix moyen en France si le prix est inconnu).
- Vise environ 50 % besoins / 30 % envies / 20 % épargne, de façon réaliste.
- La somme des catégories (épargne comprise) ne doit pas dépasser le revenu pris en compte.
- Montants en euros, arrondis à l'euro. Ton direct, bienveillant, tutoiement.

Clés de catégories autorisées (clé = libellé) : ${Object.entries(EXP).map(([k, l]) => k + ' = ' + l).join(' ; ')}.

${asJson ? `Réponds uniquement avec un objet JSON de cette forme :
{"resume":"2 à 3 phrases","revenu_pris_en_compte":1200,"categories":[{"cat":"courses","montant":180,"raison":"explication courte"}],"liste_courses":[{"article":"Riz","quantite":"2 paquets","prix_estime":3}],"conseils":["conseil concret 1","conseil concret 2","conseil concret 3"]}` : `Réponds en français, de façon claire et lisible sur téléphone : un court résumé, puis un tableau « catégorie | montant | pourquoi », puis la liste de courses avec prix estimés, puis 3 conseils concrets.`}

Données :
${JSON.stringify(ctx)}`;
}
const AI_ERR = { not_granted: 'Tu as refusé l’accès à Claude pour cette page. Tu peux le réautoriser dans le menu Autorisations de la page.', rate_limited: 'Trop de demandes d’un coup : réessaie dans quelques minutes.', invalid_json: 'La réponse de Claude était illisible. Réessaie.', prompt_too_large: 'Trop de données à envoyer. Réduis l’historique ou l’inventaire.', session_expired: 'Ta session claude.ai a expiré : recharge la page.', refused: 'Claude n’a pas pu traiter cette demande.' };
function aiCard() {
  const last = S.aiLast;
  return `<section class="card ai"><h2>✨ Budget proposé par l’IA</h2>
    <p class="small mute" style="margin:0 0 10px">Claude analyse tes revenus du mois, tes charges fixes, ton historique de dépenses, tes voyages prévus et l’inventaire de ta maison, puis te propose un budget par catégorie et une liste de courses.</p>
    ${sampleFn ? `<div class="row"><button class="btn" data-a="ai">Proposer mon budget de ${fmtM(ym(today()))}</button>${last ? `<button class="btn ghost sm" data-a="aiseen">Revoir la dernière (${fmt(last.at.slice(0, 10))})</button>` : ''}</div>`
      : `<button class="btn" data-a="aicopy">📋 Copier ma demande pour Claude</button><p class="small mute" style="margin:8px 0 0">Ici, l’appli ne peut pas appeler Claude directement : copie la demande (avec tes données du mois), puis colle-la dans l’appli Claude ou sur claude.ai.</p>`}</section>`;
}
function askAiAfterIncome() {
  const d = $('#dlg');
  d.innerHTML = `<div class="sheet"><header><h2>💰 Revenu enregistré</h2><button class="icon" data-close aria-label="Fermer">✕</button></header>
    <p>Veux-tu que Claude te propose un budget pour ${fmtM(ym(today()))}, en tenant compte de ton historique, de tes voyages et de ton inventaire ?</p>
    <footer><span class="grow"></span><button class="btn ghost" data-close>Plus tard</button><button class="btn" data-go>✨ Proposer mon budget</button></footer></div>`;
  d.querySelectorAll('[data-close]').forEach(b => b.onclick = () => d.close());
  d.querySelector('[data-go]').onclick = () => aiBudget();
  d.showModal();
}
async function aiBudget() {
  const d = $('#dlg');
  if (!sampleFn) { if (d.open) d.close(); alert('Claude est disponible uniquement quand l’appli est ouverte depuis son lien claude.ai.'); return; }
  const ctx = aiContext(), m = ctx.mois;
  if (!ctx.revenus_du_mois.length && !ctx.revenu_moyen_estime) { if (d.open) d.close(); alert('Ajoute d’abord tes revenus du mois (ou ton salaire dans les revenus fixes).'); return; }
  const ctl = new AbortController();
  d.innerHTML = `<div class="sheet"><header><h2>✨ Claude prépare ton budget…</h2></header>
    <p class="mute">Analyse de tes revenus, dépenses, voyages et de ton inventaire. Cela peut prendre jusqu’à une minute.</p><div class="loader" aria-hidden="true"></div>
    <footer><span class="grow"></span><button class="btn ghost" data-stop>Arrêter</button></footer></div>`;
  d.querySelector('[data-stop]').onclick = () => { ctl.abort(); d.close(); };
  if (!d.open) d.showModal();
  try {
    const res = await sampleFn.json(aiPrompt(ctx), { signal: ctl.signal, modelTier: 'default' });
    const clean = {
      resume: String(res?.resume || ''),
      revenu: +res?.revenu_pris_en_compte || 0,
      categories: (Array.isArray(res?.categories) ? res.categories : []).filter(c => EXP[c?.cat] && +c.montant >= 0).map(c => ({ cat: c.cat, montant: Math.round(+c.montant), raison: String(c.raison || '') })),
      courses: (Array.isArray(res?.liste_courses) ? res.liste_courses : []).slice(0, 40).map(c => ({ article: String(c?.article || ''), quantite: String(c?.quantite || ''), prix: +c?.prix_estime || 0 })),
      conseils: (Array.isArray(res?.conseils) ? res.conseils : []).slice(0, 6).map(String),
    };
    if (!clean.categories.length) throw { code: 'invalid_json' };
    S.aiLast = { month: m, at: new Date().toISOString(), res: clean }; save();
    showAi(clean, m); render();
  } catch (e) {
    if (e && e.code === 'cancelled') return;
    if (d.open) d.close();
    alert(AI_ERR[e && e.code] || `Claude n’a pas pu répondre pour le moment (${(e && e.code) || 'erreur'}). Réessaie plus tard.`);
  }
}
function showAi(r, m) {
  const d = $('#dlg'), total = r.categories.reduce((s, c) => s + c.montant, 0), rest = r.revenu - total;
  const courses = r.courses.reduce((s, c) => s + c.prix, 0);
  d.innerHTML = `<div class="sheet"><header><h2>✨ Budget de ${esc(fmtM(m))}</h2><button class="icon" data-close aria-label="Fermer">✕</button></header>
    ${r.resume ? `<p>${esc(r.resume)}</p>` : ''}
    <div class="kpis" style="grid-template-columns:repeat(3,1fr)"><div class="kpi"><small>Revenu pris en compte</small><b class="num">${eur(r.revenu)}</b></div><div class="kpi"><small>Réparti</small><b class="num">${eur(total)}</b></div><div class="kpi"><small>Non alloué</small><b class="num ${rest < 0 ? 'neg' : ''}">${eur(rest)}</b></div></div>
    <ul class="list" style="margin-top:8px">${r.categories.map(c => `<li class="item"><div class="grow"><div class="ttl">${esc(EXP[c.cat])}</div>${c.raison ? `<div class="meta">${esc(c.raison)}</div>` : ''}</div><b class="num">${eur(c.montant)}</b></li>`).join('')}</ul>
    ${r.courses.length ? `<details style="margin-top:8px"><summary>🛒 Liste de courses proposée (≈ ${eur(courses)})</summary><ul class="list">${r.courses.map(c => `<li class="item"><div class="grow"><div class="ttl" style="font-weight:500">${esc(c.article)}</div><div class="meta">${esc(c.quantite)}</div></div>${c.prix ? `<span class="num small">${eur(c.prix)}</span>` : ''}</li>`).join('')}</ul></details>` : ''}
    ${r.conseils.length ? `<div class="sec" style="margin-top:14px">💡 Conseils</div><ul style="margin:0;padding-left:18px">${r.conseils.map(c => `<li style="margin-bottom:4px">${esc(c)}</li>`).join('')}</ul>` : ''}
    <p class="small mute">Proposition générée par l’IA : vérifie-la avant de l’appliquer.</p>
    <footer><span class="grow"></span><button class="btn ghost" data-close>Fermer</button><button class="btn" data-apply>Appliquer comme budgets</button></footer></div>`;
  d.querySelectorAll('[data-close]').forEach(b => b.onclick = () => d.close());
  d.querySelector('[data-apply]').onclick = () => {
    S.budgets = {}; for (const c of r.categories) if (c.montant > 0) S.budgets[c.cat] = c.montant;
    save(); d.close(); UI.mTab = 'month'; location.hash = '#money'; render(); toast('Budgets appliqués ✓');
  };
  if (!d.open) d.showModal();
}

/* ---------- Actions ---------- */
const findTrip = id => S.trips.find(x => x.id === id), findGoal = id => S.goals.find(x => x.id === id);
const ACT = {
  go: d => { location.hash = d.h; },
  quick: quickAdd,
  tt: d => { const t = S.tasks.find(x => x.id === d.id); if (!t) return; if (isRec(t)) { t.doneOn = t.doneOn || {}; if (t.doneOn[d.d]) delete t.doneOn[d.d]; else t.doneOn[d.d] = 1; } else t.done = !t.done; save(); render(); if (isDone(t, d.d)) toast(isRec(t) && streak(t) > 1 ? `Série de ${streak(t)} 🔥` : 'Fait ✓'); },
  et: d => editTask(d.id), nt: d => editTask(null, { date: d.d || (location.hash === '#agenda' ? UI.agSel : location.hash === '#tasks' ? UI.task : today()) }),
  ee: d => editEvent(d.id), ne: () => editEvent(null, { date: location.hash === '#agenda' ? UI.agSel : today() }),
  td: d => { UI.task = d.n === '0' ? today() : addDays(UI.task, +d.n); render(); },
  agm: d => { UI.agMode = d.m; render(); }, agn: d => { UI.agMonth = addMonths(UI.agMonth, +d.n); render(); },
  ags: d => { UI.agSel = d.d; if (ym(d.d) !== UI.agMonth) UI.agMonth = ym(d.d); render(); },
  agy: d => { UI.agYear += +d.n; render(); }, agym: d => { UI.agMode = 'month'; UI.agMonth = d.m; UI.agSel = d.m + '-01'; render(); },
  ng: () => editGoal(null), eg: d => editGoal(d.id),
  gc: d => { const g = findGoal(d.id); g.current = Math.max(0, (+g.current || 0) + +d.n); save(); render(); },
  gs: d => { const s = findGoal(d.id).steps.find(x => x.id === d.s); s.done = !s.done; save(); render(); if (s.done) toast('Étape validée 💪'); },
  gsd: d => { const g = findGoal(d.id); g.steps = g.steps.filter(x => x.id !== d.s); save(); render(); },
  ntr: () => editTrip(null), etr: d => editTrip(d.id),
  tc: d => { const c = findTrip(d.id).checklist.find(x => x.id === d.s); c.done = !c.done; save(); render(); },
  tcd: d => { const t = findTrip(d.id); t.checklist = t.checklist.filter(x => x.id !== d.s); save(); render(); },
  mt: d => { UI.mTab = d.t; render(); }, mm: d => { UI.mMonth = addMonths(UI.mMonth, +d.n); render(); },
  nx: d => editTx(null, d.t), ex: d => editTx(d.id),
  nrec: () => editRec(null), erec: d => editRec(d.id),
  recok: d => {
    const r = S.recurring.find(x => x.id === d.id), m = location.hash === '#money' ? UI.mMonth : ym(today());
    if (recDone(r, m)) S.tx = S.tx.filter(x => !(x.rec === r.id && ym(x.date) === m));
    else S.tx.push({ id: uid(), type: r.type, cat: r.cat, amount: r.amount, label: r.label, date: `${m}-${pad(r.day)}`, rec: r.id });
    save(); render();
  },
  ai: () => aiBudget(),
  signin: () => window.CapSync && window.CapSync.signIn(),
  signout: () => { if (confirm('Se déconnecter ? Les données restent sur cet appareil mais ne seront plus synchronisées.')) window.CapSync && window.CapSync.signOut(); },
  syncnow: () => window.CapSync && window.CapSync.push(true),
  aicopy: async () => {
    const ctx = aiContext();
    if (!ctx.revenus_du_mois.length && !ctx.revenu_moyen_estime) { alert('Ajoute d’abord tes revenus du mois (ou ton salaire dans les revenus fixes).'); return; }
    const txt = aiPrompt(ctx, false);
    try { await navigator.clipboard.writeText(txt); toast('Demande copiée : colle-la dans l’appli Claude'); }
    catch (e) { download('demande-budget-claude.txt', txt, 'text/plain'); toast('Copie impossible : fichier texte téléchargé'); }
  }, aiseen: () => S.aiLast && showAi(S.aiLast.res, S.aiLast.month),
  gostock: () => { UI.mTab = 'stock'; location.hash = '#money'; render(); },
  ni: () => editItem(null), ei: d => editItem(d.id),
  iq: d => {
    const i = S.inv.find(x => x.id === d.id), before = +i.qty || 0;
    i.qty = Math.max(0, (i.qty == null ? (+d.n > 0 ? 0 : 1) : before) + +d.n);
    // Suivi en % : « − » = l'unité entamée est finie, on en ouvre une pleine ; « ＋ » depuis 0 = unité neuve
    if (i.pct && (+d.n < 0 || before === 0)) i.level = i.qty > 0 ? 100 : 0;
    save(); render();
  },
  buy: d => { const i = S.inv.find(x => x.id === d.id); const n = toBuy(i); if (i.pct && !(+i.qty > 0)) i.level = 100; i.qty = (+i.qty || 0) + n; save(); render(); toast(`${i.name} : +${n} ${i.unit || ''} en stock`); },
  buytx: () => editTx(null, 'out', { amount: Math.round(shopping().reduce((s, i) => s + toBuy(i) * (+i.price || 0), 0) * 100) / 100 || null, label: 'Courses', cat: 'courses' }),
  ess: () => { const have = new Set(S.inv.map(i => i.name.toLowerCase())); for (const [name, cat, unit, price, p] of ESSENTIALS) if (!have.has(name.toLowerCase())) S.inv.push({ id: uid(), name, cat, unit, price, qty: null, ...(p ? PCT_DEF : { min: 1, target: 3 }) }); save(); render(); toast('Indique maintenant tes quantités avec − / ＋'); },
  nacc: () => editAcc(null), eacc: d => editAcc(d.id), contrib: d => contribute(d.id), bud: editBudgets,
  start: d => { S.settings.name = ($('#w-name')?.value || '').trim(); if (d.tpl) seedTemplate(); S.onboarded = true; save(); render(); if (d.tpl) toast('Modèle chargé : tout est modifiable ✎'); },
  sset: () => { S.settings.name = $('#s-name').value.trim(); S.settings.morning = +$('#s-morning').value; S.settings.theme = $('#s-theme').value; applyTheme(); save(); toast('Réglages enregistrés'); },
  non: async () => {
    if (!('Notification' in window)) { alert('Ce navigateur ne gère pas les notifications. Sur iPhone, installe d’abord l’appli sur l’écran d’accueil (Partager → Sur l’écran d’accueil), puis ouvre-la depuis l’icône.'); return; }
    const p = await Notification.requestPermission();
    if (p === 'granted') { S.settings.notif = true; save(); render(); sysNotify('🔔 Notifications activées', 'Tu recevras ici tes rappels Cap 2027.', 'test'); }
    else alert('Notifications refusées. Tu peux les réautoriser dans les réglages du site de ton navigateur.');
  },
  noff: () => { S.settings.notif = false; save(); render(); },
  ntest: () => sysNotify('☀️ Ta journée (test)', summaryText(), 'test'),
  ics, exp: () => download(`cap2027-sauvegarde-${today()}.json`, JSON.stringify(S, null, 1), 'application/json'),
  tpl: () => { if (confirm('Ajouter les objectifs, routines et le livret du modèle de départ ?')) { seedTemplate(); save(); toast('Modèle ajouté'); render(); } },
  wipe: () => { if (confirm('Effacer TOUTES les données ? Pense à exporter une sauvegarde avant.') && confirm('Vraiment tout effacer ?')) { S = DEF(); save(); location.hash = '#today'; render(); } },
};
document.addEventListener('click', e => {
  if (e.target.closest('[data-stop]')) return;
  const b = e.target.closest('[data-a]'); if (!b || b.closest('dialog')) return;
  const fn = ACT[b.dataset.a]; if (!fn) return;
  e.preventDefault(); fn(b.dataset, b);
});
document.addEventListener('submit', e => {
  const f = e.target.closest('form.addstep'); if (!f) return;
  e.preventDefault();
  const t = f.elements.t.value.trim(); if (!t) return;
  if (f.dataset.g) findGoal(f.dataset.g).steps.push({ id: uid(), t, done: false });
  else findTrip(f.dataset.t).checklist.push({ id: uid(), t, done: false });
  save(); render();
  const nf = document.querySelector(`form.addstep[data-${f.dataset.g ? 'g' : 't'}="${f.dataset.g || f.dataset.t}"] input`); if (nf) nf.focus();
});
document.addEventListener('input', e => {
  const id = e.target.dataset && e.target.dataset.lvl; if (!id) return;
  e.target.style.setProperty('--v', e.target.value + '%');
  const out = document.querySelector(`[data-lvlv="${id}"]`); if (out) out.textContent = e.target.value + ' %';
});
document.addEventListener('change', e => {
  const lid = e.target.dataset && e.target.dataset.lvl;
  if (lid) {
    const i = S.inv.find(x => x.id === lid); if (!i) return;
    i.level = +e.target.value;
    if (i.level === 0) { i.qty = Math.max(0, (+i.qty || 0) - 1); i.level = i.qty > 0 ? 100 : 0; toast(i.qty > 0 ? `${i.name} terminé : unité suivante entamée` : `${i.name} épuisé, ajouté à la liste de courses`); }
    save(); render(); return;
  }
  if (e.target.id !== 'imp') return;
  const file = e.target.files[0]; if (!file) return;
  file.text().then(txt => {
    const d = JSON.parse(txt); if (!d || !d.v) throw new Error();
    if (!confirm('Remplacer les données actuelles par cette sauvegarde ?')) return;
    S = Object.assign(DEF(), d); save(); applyTheme(); render(); toast('Sauvegarde importée ✓');
  }).catch(() => alert('Fichier de sauvegarde invalide.'));
});

/* ---------- Rendu ---------- */
let toastT;
function toast(msg) { const t = $('#toast'); t.textContent = msg; t.classList.add('on'); clearTimeout(toastT); toastT = setTimeout(() => t.classList.remove('on'), 2800); }
function applyTheme() { const t = S.settings.theme; if (t === 'light' || t === 'dark') document.documentElement.dataset.theme = t; else delete document.documentElement.dataset.theme; }
const VIEWS = { today: vToday, tasks: vTasks, agenda: vAgenda, goals: vGoals, trips: vTrips, money: vMoney, settings: vSettings };
let lastView = '';
function render() {
  const v = VIEWS[location.hash.slice(1)] ? location.hash.slice(1) : 'today';
  const y = window.scrollY;
  $('#main').innerHTML = VIEWS[v]();
  $('#title').textContent = v === 'today' && !S.onboarded ? 'Cap 2027' : TITLES[v];
  document.querySelectorAll('.nav a').forEach(a => a.classList.toggle('on', a.getAttribute('href') === '#' + v));
  window.scrollTo(0, v === lastView ? y : 0);
  lastView = v;
}
window.addEventListener('hashchange', render);
document.addEventListener('visibilitychange', () => { if (!document.hidden) { render(); checkReminders(); } });

applyTheme();
render();
if (window.claude && typeof claude.use === 'function') claude.use('sample').then(f => { sampleFn = f; render(); }).catch(() => {});
checkReminders();
setInterval(checkReminders, 30000);
// Changement de jour pendant que l'appli reste ouverte
let dayShown = today();
setInterval(() => { if (today() !== dayShown) { if (UI.task === dayShown) UI.task = today(); dayShown = today(); render(); } }, 60000);
if ('serviceWorker' in navigator && location.protocol !== 'file:') navigator.serviceWorker.register('sw.js', { updateViaCache: 'none' }).then(r => r.update()).catch(() => {});
if (navigator.storage && navigator.storage.persist) navigator.storage.persist().catch(() => {});
