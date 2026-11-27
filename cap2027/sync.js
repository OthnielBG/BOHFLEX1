/* Cap 2027 — synchronisation entre appareils (connexion Google + Firestore).
   Un document par personne : users/{uid} = { data: état JSON, updatedAt }.
   Chaque envoi passe par une transaction qui fusionne avec la version en ligne : rien n'est écrasé. */
const V = '10.12.2', BASE = `https://www.gstatic.com/firebasejs/${V}/`;
let st = { status: 'loading', user: null, last: 0, error: '' };
const set = patch => { st = { ...st, ...patch }; if (location.hash === '#settings' && window.Cap) window.Cap.render(); };
window.CapSync = { state: () => st, push() {}, signIn() {}, signOut() {} };

(async () => {
  const cfg = window.CAP_FIREBASE;
  if (!cfg || !cfg.apiKey) { set({ status: 'noconfig' }); return; }
  let A, F;
  try {
    const [{ initializeApp }, auth, fs] = await Promise.all([import(BASE + 'firebase-app.js'), import(BASE + 'firebase-auth.js'), import(BASE + 'firebase-firestore.js')]);
    A = auth; F = fs;
    var app = initializeApp(cfg);
  } catch (e) { set({ status: 'unavailable' }); return; }
  const auth = A.getAuth(app), db = F.getFirestore(app);
  const provider = new A.GoogleAuthProvider();
  provider.setCustomParameters({ prompt: 'select_account' });
  let ref = null, unsub = null, timer = null, busy = false, again = false;

  const parse = snap => { try { return snap.exists() ? JSON.parse(snap.data().data) : null; } catch (e) { return null; } };

  async function push(now) {
    if (!ref) return;
    if (!navigator.onLine) { set({ status: 'offline' }); return; }
    clearTimeout(timer);
    if (!now) { timer = setTimeout(() => push(true), 1200); return; }
    if (busy) { again = true; return; }
    busy = true;
    try {
      const Cap = window.Cap;
      const merged = await F.runTransaction(db, async t => {
        const remote = parse(await t.get(ref));
        const m = remote ? Cap.merge(Cap.get(), remote) : Cap.get();
        if (!remote || Cap.canon(m) !== Cap.canon(remote)) t.set(ref, { data: JSON.stringify(m), updatedAt: F.serverTimestamp() });
        return m;
      });
      if (Cap.canon(merged) !== Cap.canon(Cap.get())) Cap.adopt(merged);
      set({ status: 'ok', last: Date.now(), error: '' });
    } catch (e) {
      set({ status: navigator.onLine ? 'error' : 'offline', error: e && e.code === 'permission-denied' ? 'accès refusé (règles Firestore)' : (e && e.code) || 'échec' });
    } finally {
      busy = false;
      if (again) { again = false; push(true); }
    }
  }

  function listen(uid) {
    ref = F.doc(db, 'users', uid);
    unsub = F.onSnapshot(ref, snap => {
      if (snap.metadata.hasPendingWrites) return;
      const remote = parse(snap), Cap = window.Cap;
      if (!remote) { push(true); return; }
      const merged = Cap.merge(Cap.get(), remote);
      if (Cap.canon(merged) !== Cap.canon(Cap.get())) Cap.adopt(merged);
      if (Cap.canon(merged) !== Cap.canon(remote)) push(); // il reste des changements locaux à envoyer
      set({ status: 'ok', last: Date.now(), error: '' });
    }, e => set({ status: 'error', error: e && e.code === 'permission-denied' ? 'accès refusé (règles Firestore)' : (e && e.code) || 'échec' }));
  }

  A.onAuthStateChanged(auth, u => {
    if (unsub) { unsub(); unsub = null; } ref = null;
    if (u) { set({ status: 'ok', user: u.email || u.displayName || 'compte Google' }); listen(u.uid); }
    else set({ status: 'ready', user: null });
  });
  A.getRedirectResult(auth).catch(() => {});

  window.CapSync = {
    state: () => st,
    push,
    async signIn() {
      try { await A.signInWithPopup(auth, provider); window.Cap.toast('Connecté ✓ synchronisation en cours'); }
      catch (e) {
        const c = e && e.code;
        if (c === 'auth/popup-blocked' || c === 'auth/operation-not-supported-in-this-environment' || c === 'auth/cancelled-popup-request') { try { await A.signInWithRedirect(auth, provider); } catch (e2) { alert('Connexion impossible : ' + (e2.code || e2.message)); } }
        else if (c !== 'auth/popup-closed-by-user') alert('Connexion impossible : ' + (c || e.message) + (c === 'auth/unauthorized-domain' ? '\n\nAjoute ce domaine dans Firebase → Authentication → Paramètres → Domaines autorisés.' : ''));
      }
    },
    async signOut() { await A.signOut(auth); window.Cap.toast('Déconnecté'); },
  };
  window.addEventListener('online', () => push(true));
  document.addEventListener('visibilitychange', () => { if (!document.hidden && ref) push(true); });
})();
