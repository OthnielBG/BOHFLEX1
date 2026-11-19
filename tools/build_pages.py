#!/usr/bin/env python3
"""Génère les pages HTML BOHFLEX à partir d'un gabarit commun.

Usage (depuis la racine du projet) : python3 tools/build_pages.py .
"""
import sys, pathlib, csv, html

OUT = pathlib.Path(sys.argv[1])

NAV = [
    ("index.html", "Accueil"),
    ("produit.html", "Le produit"),
    ("a-propos.html", "La marque"),
    ("faq.html", "FAQ"),
    ("suivi.html", "Suivi"),
    ("contact.html", "Contact"),
]

def ic(name, cls="icon"):
    return f'<svg class="{cls}" aria-hidden="true"><use href="#i-{name}"/></svg>'

def head(title, desc, extra=""):
    return f"""<!doctype html>
<html lang="fr">
<head>
<meta charset="utf-8">
<meta name="viewport" content="width=device-width, initial-scale=1, viewport-fit=cover">
<title>{title}</title>
<meta name="description" content="{desc}">
<meta name="theme-color" content="#E8571A">
<meta property="og:type" content="website">
<meta property="og:locale" content="fr_CI">
<meta property="og:site_name" content="BOHFLEX">
<meta property="og:title" content="{title}">
<meta property="og:description" content="{desc}">
<meta property="og:image" content="assets/img/og-image.jpg">
<link rel="icon" href="assets/img/favicon.svg" type="image/svg+xml">
<link rel="apple-touch-icon" href="assets/img/apple-touch-icon.png">
<link rel="manifest" href="manifest.webmanifest">
<link rel="preconnect" href="https://fonts.googleapis.com">
<link rel="preconnect" href="https://fonts.gstatic.com" crossorigin>
<link rel="stylesheet" href="https://fonts.googleapis.com/css2?family=Archivo:wght@600;700;800;900&display=swap">
<link rel="stylesheet" href="assets/css/style.css">
<noscript><img height="1" width="1" style="display:none" alt="" src="https://www.facebook.com/tr?id=1779196666667619&ev=PageView&noscript=1"></noscript>
{extra}</head>
"""

def header(active):
    links = "".join(
        f'<a href="{h}"{" aria-current=\"page\"" if h == active else ""}>{t}</a>' for h, t in NAV
    )
    return f"""<div class="topbar"><strong>Offre spéciale : 3 paires à 7 500 FCFA</strong> · Livraison et expédition partout en Côte d'Ivoire</div>
<header class="header">
  <div class="container header__inner">
    <a class="logo" href="index.html" aria-label="BOHFLEX — accueil">
      <img class="logo__mark" src="assets/img/logo-mark.svg" alt="" width="34" height="34"><span>BOHFLEX<b>.</b></span>
    </a>
    <nav class="nav" aria-label="Navigation principale">{links}</nav>
    <div class="header__actions">
      <a class="btn btn--primary header__cta" href="commander.html">Commander</a>
      <button class="burger" type="button" aria-label="Menu" aria-expanded="false" aria-controls="mobile-menu">{ic("menu")}</button>
    </div>
  </div>
  <nav class="mobile-menu" id="mobile-menu" aria-label="Menu mobile">{links}<a href="commander.html" style="color:var(--orange)">Commander maintenant →</a></nav>
</header>
"""

FOOTER = f"""<footer class="footer">
  <div class="container">
    <div class="footer__grid">
      <div>
        <a class="logo" href="index.html"><img class="logo__mark" src="assets/img/logo-mark.svg" alt="" width="34" height="34"><span>BOHFLEX<b>.</b></span></a>
        <p>Semelles massantes de confort pour celles et ceux qui restent debout toute la journée. Livraison gratuite partout en Côte d'Ivoire, paiement à la livraison.</p>
        <div class="socials">
          <a href="#" data-wa aria-label="WhatsApp">{ic("whatsapp")}</a>
        </div>
      </div>
      <div>
        <h4>Boutique</h4>
        <ul>
          <li><a href="produit.html">Semelles Confort</a></li>
          <li><a href="commander.html?offre=2">Offre 2 paires</a></li>
          <li><a href="commander.html?offre=3">Offre 3 paires</a></li>
          <li><a href="suivi.html">Suivre ma commande</a></li>
        </ul>
      </div>
      <div>
        <h4>Aide</h4>
        <ul>
          <li><a href="faq.html">Questions fréquentes</a></li>
          <li><a href="contact.html">Contact</a></li>
          <li><a href="a-propos.html">La marque</a></li>
          <li><a href="mentions-legales.html">Mentions légales &amp; CGV</a></li>
        </ul>
      </div>
      <div>
        <h4>Nous joindre</h4>
        <ul>
          <li><a href="#" data-wa>WhatsApp</a></li>
          <li><a href="#" data-phone></a></li>
          <li>Abidjan, Côte d'Ivoire</li>
          <li><button class="btn btn--outline" type="button" data-install style="color:#fff;border-color:#555;min-height:40px;padding:8px 14px;font-size:1rem;margin-top:6px">{ic("download")} Installer l'app</button></li>
        </ul>
      </div>
    </div>
    <div class="footer__bottom">© <span data-year></span> BOHFLEX — Tous droits réservés. Produit de confort, ne remplace pas un avis médical.</div>
  </div>
</footer>
"""

def sticky(price_offer="3"):
    return f"""<div class="sticky-cta">
  <div class="sticky-cta__price">À partir de<b id="sticky-price" data-price="2"></b></div>
  <a class="btn btn--primary" href="commander.html?offre={price_offer}" data-order-link>Commander</a>
  <a class="btn btn--wa" href="#" data-wa aria-label="Écrire sur WhatsApp">{ic("whatsapp")}</a>
</div>
<div class="install-banner" id="install-banner" role="dialog" aria-label="Installer l'application">
  <img src="assets/img/logo-mark.svg" alt="" width="36" height="36">
  <p><strong>Installez l'app BOHFLEX</strong><br>Commandez en 1 clic depuis votre écran d'accueil.</p>
  <button class="btn btn--primary" type="button" data-install>Installer</button>
  <button class="close" type="button" aria-label="Fermer">×</button>
</div>
"""

# Liens des réseaux sociaux : à remplir quand les comptes existent (sinon l'icône n'est pas affichée)
SOCIALS = {"facebook": "", "instagram": "", "tiktok": ""}
def social_links(style=""):
    return "".join(f'<a href="{u}" target="_blank" rel="noopener" aria-label="{k.capitalize()}"{style}>{ic(k)}</a>'
                   for k, u in SOCIALS.items() if u)

SCRIPTS = """<script src="assets/js/config.js"></script>
<script src="assets/js/main.js"></script>
"""

import re, datetime, urllib.parse
_CFG = (OUT / "assets/js/config.js").read_text(encoding="utf-8")
def _cfg(key):
    return re.search(key + r'\s*:\s*"?([^",\n]*)"?', _CFG).group(1).strip()
WA_NUMBER, PHONE, UNIT = _cfg("whatsappNumber"), _cfg("phoneDisplay"), int(_cfg("unitPrice"))
OFFER_DATA = {m[0]: (int(m[1]), int(m[2])) for m in re.findall(r'id:\s*"(\d+)",\s*pairs:\s*(\d+),\s*price:\s*(\d+)', _CFG)}
def _fcfa(n):
    return f"{round(n):,}".replace(",", " ") + " FCFA"
WA_DEFAULT = "https://wa.me/" + WA_NUMBER + "?text=" + urllib.parse.quote("Bonjour BOHFLEX, j'aimerais avoir des informations sur les semelles.")

def prerender(html):
    def fill(attr, fn):
        nonlocal html
        html = re.sub(r'(<[a-z]+[^>]*\b' + attr + r'="(\d)"[^>]*>)(</)', lambda m: m.group(1) + fn(*OFFER_DATA[m.group(2)]) + m.group(3), html)
    fill("data-price", lambda pairs, price: _fcfa(price))
    fill("data-old", lambda pairs, price: _fcfa(UNIT * pairs))
    fill("data-unit", lambda pairs, price: "soit " + _fcfa(price / pairs) + " la paire")
    fill("data-save", lambda pairs, price: "Vous économisez " + _fcfa(UNIT * pairs - price))
    html = re.sub(r'(<span data-year>)(</span>)', r'\g<1>' + str(datetime.date.today().year) + r'\g<2>', html)
    html = html.replace('href="#" data-wa', f'href="{WA_DEFAULT}" target="_blank" rel="noopener" data-wa')
    html = re.sub(r'<a ([^>]*)href="#" data-phone>(</a>)', lambda m: f'<a {m.group(1)}href="tel:+{WA_NUMBER}" data-phone>{PHONE}{m.group(2)}', html)
    html = html.replace('<a href="#" data-phone></a>', f'<a href="tel:+{WA_NUMBER}" data-phone>{PHONE}</a>')
    return html

def page(fname, title, desc, body, active=None, body_class="", extra_head=""):
    html = head(title, desc, extra_head)
    html += f'<body{f" class=\"{body_class}\"" if body_class else ""}>\n<script src="assets/js/icons.js"></script>\n'
    html += header(active or fname)
    html += f"<main>\n{body}\n</main>\n"
    html += FOOTER + sticky() + SCRIPTS + "</body>\n</html>\n"
    (OUT / fname).write_text(prerender(html), encoding="utf-8")

TRUST = f"""<ul class="trust-row">
  <li>{ic("truck")} Livraison gratuite</li>
  <li>{ic("cash")} Paiement à la livraison</li>
  <li>{ic("pin")} Toute la Côte d'Ivoire</li>
</ul>"""

def offer_card(oid, pairs, best=False):
    badge = '<div class="offer__badge">Le plus avantageux</div>' if best else ""
    extra = f'<li>{ic("check")} <strong>1 paire offerte</strong> par rapport à l\'offre 2 paires</li>' if best else f'<li>{ic("check")} Idéal pour vous + un proche</li>'
    return f"""<article class="offer{' offer--best' if best else ''}">
  {badge}
  <h3 class="offer__title">{pairs} paires</h3>
  <div class="offer__old" data-old="{oid}"></div>
  <div class="offer__price" data-price="{oid}"></div>
  <div class="offer__unit" data-unit="{oid}"></div>
  <span class="offer__save" data-save="{oid}"></span>
  <ul>
    {extra}
    <li>{ic("check")} Toutes pointures 35 → 46</li>
    <li>{ic("check")} Livraison gratuite</li>
    <li>{ic("check")} Vous payez à la livraison</li>
  </ul>
  <a class="btn {'btn--primary' if best else 'btn--dark'} btn--block" href="commander.html?offre={oid}">Je choisis {pairs} paires</a>
</article>"""

OFFERS = f"""<div class="offers">
  {offer_card("2", 2)}
  {offer_card("3", 3, best=True)}
</div>
<p class="center small muted" style="margin-top:16px">Prix barré = prix unitaire de référence × nombre de paires.</p>"""

# Avis clients.
# - Si le fichier data/avis.csv existe (avis réels exportés de l'ancienne boutique, nettoyés : SANS e-mails),
#   il est utilisé.
# - Sinon, des AVIS D'EXEMPLE s'affichent, clairement signalés comme tels, pour voir la mise en page.
AVIS_CSV = OUT / "data" / "avis.csv"

EXAMPLE_REVIEWS = [
    ("Koffi A.", "Yopougon", 5, "Je suis vigile, je fais mes 12 heures debout. Depuis que j'ai mis les semelles dans mes rangers, le soir ce n'est plus pareil. Livraison rapide en plus.", "02/11/2026"),
    ("Mariam T.", "Cocody", 5, "J'ai pris le pack 3 paires : une pour moi, une pour mon mari, une pour ma maman. Tout le monde est content. Le livreur a appelé avant de passer.", "28/10/2026"),
    ("Serge K.", "Bouaké", 4, "Bonne qualité, j'ai découpé à ma pointure sans problème. Reçu en 3 jours à Bouaké. 4 étoiles parce que j'aurais aimé une autre couleur.", "25/10/2026"),
    ("Aïcha D.", "Abobo", 5, "Je vends au marché toute la journée. Mes pieds me disent merci ! Je recommande à toutes les commerçantes.", "21/10/2026"),
    ("Ibrahim S.", "Yamoussoukro", 5, "Mises dans mes chaussures de sécurité sur le chantier. Ça amortit vraiment, surtout sur le béton.", "18/10/2026"),
    ("Fatou C.", "Marcory", 4, "Très moelleux. Les premiers jours on sent bien les petits picots, après on s'habitue et ça fait du bien.", "14/10/2026"),
    ("Jean-Marc B.", "San-Pédro", 5, "Sérieux. On m'a appelé pour confirmer, j'ai payé à la livraison, rien à dire.", "09/10/2026"),
    ("Estelle N.", "Angré", 5, "Toujours dans les couloirs au travail, je ne m'en sépare plus. J'en ai offert à deux collègues.", "03/10/2026"),
]

def _short_name(full):
    parts = full.split()
    if len(parts) >= 2 and len(parts[-1]) > 2:
        return f"{parts[0]} {parts[-1][0].upper()}."
    return full

def load_reviews():
    """Lit data/avis.csv (colonnes reconnues : nom/reviewer_name, ville/location, note/rating, texte/body, date/review_date)."""
    if not AVIS_CSV.exists():
        return None
    out = []
    with open(AVIS_CSV, newline="", encoding="utf-8-sig") as f:
        sample = f.read(4096); f.seek(0)
        try:
            dialect = csv.Sniffer().sniff(sample, delimiters=",;\t")
        except csv.Error:
            dialect = csv.excel
        for row in csv.DictReader(f, dialect=dialect):
            k = {(a or "").strip().lower(): (b or "").strip() for a, b in row.items() if a}
            g = lambda *names: next((k[n] for n in names if k.get(n)), "")
            text = g("texte", "body", "review", "content", "text", "avis", "comment")
            if not text:
                continue
            try:
                rating = max(1, min(5, round(float(g("note", "rating", "stars", "score").replace(",", ".") or 5))))
            except ValueError:
                rating = 5
            name = _short_name(g("nom", "reviewer_name", "author", "name", "auteur") or "Client")
            date = g("date", "review_date", "created_at")[:10]
            if len(date) == 10 and date[4] == "-":
                date = f"{date[8:10]}/{date[5:7]}/{date[:4]}"
            size = g("pointure", "size")
            place = g("ville", "location", "city") or (f"Pointure {size}" if size else "")
            out.append((name, place, rating, text, date, g("titre", "title"), g("afficher", "show").lower() in ("oui", "1", "x", "yes")))
    return out

_real = load_reviews()
REVIEWS_EXAMPLE = not _real
REVIEWS_DATA = _real or EXAMPLE_REVIEWS

def stars(n):
    return f'<span class="stars" aria-label="{n} sur 5">{"★" * n}<span class="stars__off">{"★" * (5 - n)}</span></span>'

def reviews(n=6):
    cards = ""
    shown = [r for r in REVIEWS_DATA if len(r) > 6 and r[6]] or REVIEWS_DATA
    for name, city, rating, text, date, *rest in shown[:n]:
        e = html.escape
        title = f"<b class=\"review__title\">{e(rest[0])}</b>" if rest and rest[0] else ""
        meta = " · ".join(x for x in (e(city), e(date)) if x)
        cards += f"""<article class="review">
  <div class="review__top">{stars(rating)}</div>
  {title}<p>{e(text)}</p>
  <div class="review__head"><div class="avatar" aria-hidden="true">{e(name[:1])}</div><div><div class="review__name">{e(name)}</div><div class="review__meta">{meta}</div></div></div>
</article>"""
    return f'<div class="reviews">{cards}</div>'

def reviews_summary():
    total = len(REVIEWS_DATA)
    avg = sum(r[2] for r in REVIEWS_DATA) / total
    bars = ""
    for k in range(5, 0, -1):
        c = sum(1 for r in REVIEWS_DATA if r[2] == k)
        bars += f'<li><span>{k} ★</span><span class="bar"><i style="width:{round(100 * c / total)}%"></i></span><span>{c}</span></li>'
    return f"""<div class="rsum">
  <div class="rsum__score"><b>{avg:.1f}</b>{stars(round(avg))}<span>{total} avis</span></div>
  <ul class="rsum__bars">{bars}</ul>
</div>"""

def reviews_section(n=6):
    if not REVIEWS_DATA or REVIEWS_EXAMPLE:
        return ""
    note = ('<p class="notice center">Aperçu de mise en page : <strong>avis d\'exemple</strong>, '
            'bientôt remplacés par les vrais avis de nos clients.</p>') if REVIEWS_EXAMPLE else ""
    return f"""<section class="section" id="avis">
  <div class="container">
    <div class="section-head"><span class="eyebrow">Avis clients</span><h2>Ils portent BOHFLEX</h2></div>
    {note}
    {reviews_summary()}
    {reviews(n)}
  </div>
</section>"""

REASSURE = f"""<section class="section section--orange">
  <div class="container">
    <div class="reassure">
      <div class="reassure__item">{ic("truck")}<h3>Livraison gratuite</h3><p>Partout en Côte d'Ivoire</p></div>
      <div class="reassure__item">{ic("cash")}<h3>Paiement à la livraison</h3><p>Vous payez quand vous recevez</p></div>
      <div class="reassure__item">{ic("shield")}<h3>Vérifiez avant de payer</h3><p>Vous ouvrez le colis devant le livreur</p></div>
      <div class="reassure__item">{ic("pin")}<h3>Toute la CI</h3><p>Abidjan et intérieur du pays</p></div>
    </div>
  </div>
</section>"""

HERO_VIDEO = "assets/video/bohflex-banniere.mp4"

def hero_media():
    """Vidéo de bannière si le fichier existe, sinon la photo produit."""
    if (OUT / HERO_VIDEO).exists():
        return (f'<video class="hero-video__media" autoplay muted loop playsinline preload="auto" '
                f'poster="assets/video/bohflex-banniere.webp" aria-label="Vidéo de présentation des semelles BOHFLEX">'
                f'<source src="{HERO_VIDEO}" type="video/mp4"></video>')
    return pic("bohflex-hero", "Semelles BOHFLEX orange et blanches posées sur un bloc orange", "hero-video__media", eager=True)

def pic(name, alt, cls="", eager=False, w=1000):
    attrs = 'fetchpriority="high"' if eager else 'loading="lazy" decoding="async"'
    return (f'<img class="{cls}" src="assets/img/{name}-600.webp" srcset="assets/img/{name}-600.webp 600w, assets/img/{name}-1000.webp 1000w" '
            f'sizes="(min-width: 900px) 520px, 100vw" alt="{alt}" width="{w}" height="{w}" {attrs}>')

ALT_HERO = "Semelles BOHFLEX orange et blanches posées sur un bloc orange"
ALT_DETAILS = "Semelle BOHFLEX : soutien de la voûte, nodules de massage, aération respirante, amorti moelleux, talon renforcé, découpable à votre pointure"
ALT_VS = "Comparatif BOHFLEX contre semelles ordinaires : confortable toute la journée, garde sa forme longtemps, masse le pied à chaque pas, soulage les pieds fatigués, agréable dès la première utilisation"
ALT_HOW = "Comment utiliser : 1. retirez l'ancienne semelle de la chaussure, 2. insérez la semelle BOHFLEX, 3. si besoin, découpez-la à votre pointure, 4. profitez d'un confort toute la journée"

SIGNS = [
    ("foot", "Talons douloureux", "en fin de journée"),
    ("sun", "Premiers pas difficiles", "au réveil, le matin"),
    ("user", "Debout toute la journée", "au travail, sans pause"),
    ("fire", "Pieds qui chauffent", "dans les chaussures fermées"),
    ("shoe", "Chaussures inconfortables", "de travail ou de sécurité"),
    ("battery", "Jambes lourdes", "et fatigue le soir"),
]
signs_html = "".join(f'<li class="sign"><span class="sign__ico">{ic(i)}</span><b>{t}</b><span>{d}</span></li>' for i, t, d in SIGNS)

FEATURES = [
    ("dots", "Nodules de massage", "Ils massent la plante du pied à chaque pas."),
    ("arch", "Soutien de la voûte", "Une forme qui épouse et soutient le pied."),
    ("wave", "Amorti moelleux", "La mousse absorbe les chocs, même sur sol dur."),
    ("wind", "Aération respirante", "Des perforations qui laissent respirer le pied."),
    ("shield", "Talon renforcé", "Plus de maintien là où le pied appuie le plus."),
    ("scissors", "Découpable à votre pointure", "Du 35 au 46, d'un simple coup de ciseaux."),
]
features_html = "".join(f'<li>{ic(i)}<div><b>{t}</b><span>{d}</span></div></li>' for i, t, d in FEATURES)

PEOPLE = [
    ("bohflex-securite", "Sécurité", "12 h debout, de jour comme de nuit", "Agent de sécurité tenant un paquet de semelles BOHFLEX devant une résidence"),
    ("bohflex-btp", "BTP", "Sur le béton, en chaussures de sécurité", "Ouvrier de chantier en casque et gilet tenant un paquet de semelles BOHFLEX"),
    ("bohflex-sante", "Santé", "Toujours en mouvement dans les couloirs", "Infirmière tenant un paquet de semelles BOHFLEX"),
    ("bohflex-entrepot", "Logistique", "Entrepôts, magasins, manutention", "Magasinier dans un entrepôt, chaussures de travail"),
    ("bohflex-sport", "Sport", "Marche, course, foot", "Coureur souriant pendant une course en ville"),
]
people_html = "".join(
    f'<figure class="person">{pic(n, a)}<figcaption><b>{t}</b><span>{d}</span></figcaption></figure>' for n, t, d, a in PEOPLE
)
PEOPLE_SECTION = f"""<section class="section section--soft">
  <div class="container">
    <div class="section-head">
      <span class="eyebrow">Pour qui ?</span>
      <h2>Pour tous ceux qui tiennent debout</h2>
      <p class="muted">Gardiens, infirmières, ouvriers, magasiniers, commerçantes, serveurs, sportifs…</p>
    </div>
    <div class="people">{people_html}</div>
  </div>
</section>"""

# ============================ ACCUEIL ============================
JOBS = [
    ("shield", "Sécurité", "Gardes de jour & de nuit"),
    ("helmet", "BTP", "Chantiers, chaussures de sécurité"),
    ("heart", "Santé", "Infirmières, aides-soignants"),
    ("bag", "Commerce", "Marchés, boutiques"),
    ("cup", "Restauration", "Serveurs, cuisiniers"),
    ("bolt", "Sport", "Foot, marche, course"),
]
jobs_html = "".join(
    f'<div class="job"><span class="job__ico">{ic(i)}</span><h3>{t}</h3><p>{d}</p></div>' for i, t, d in JOBS
)

index_body = f"""
<section class="hero-video">
  <div class="container hero-video__grid">
    <div class="hero-video__frame">
      {hero_media()}
      <div class="hero-video__overlay">
        <div class="hero__prices">
          <span><b>2 paires</b> <span data-price="2"></span></span>
          <span class="is-best"><b>3 paires</b> <span data-price="3"></span></span>
        </div>
        <a class="btn btn--primary btn--block" href="commander.html" data-order-link>Commander maintenant</a>
      </div>
      <button class="hero-video__play" type="button" aria-label="Lire la vidéo" hidden>{ic("play")}</button>
    </div>
    <div class="hero-video__side">
      <span class="hero__kicker">Semelles massantes de confort</span>
      <h1 class="hero__title">Fini les pieds en feu après une longue journée debout.</h1>
      <p class="hero__lead">Amorti moelleux, nodules de massage et soutien de la voûte : glissez BOHFLEX dans vos chaussures et sentez la différence dès les premiers pas.</p>
      <a class="btn btn--primary" href="commander.html" data-order-link>Commander maintenant</a>
      {TRUST}
    </div>
  </div>
</section>

<section class="section">
  <div class="container">
    <div class="section-head">
      <span class="eyebrow">Ça vous parle ?</span>
      <h2>Vous vous reconnaissez ?</h2>
      <p class="muted">Si vous cochez au moins un de ces signes, vos pieds réclament plus de confort.</p>
    </div>
    <ul class="signs">{signs_html}</ul>
    <p class="center" style="margin-top:22px"><a class="btn btn--primary" href="commander.html" data-order-link>J'offre du confort à mes pieds</a></p>
    <p class="center small muted" style="margin-top:12px">BOHFLEX est un produit de confort. En cas de douleur persistante, consultez un professionnel de santé.</p>
  </div>
</section>

<section class="section section--soft" id="details">
  <div class="container split">
    <div class="split__media">{pic("bohflex-details", ALT_DETAILS, "framed")}</div>
    <div>
      <span class="eyebrow">Dans le détail</span>
      <h2>Pensée pour ceux qui marchent et restent debout</h2>
      <ul class="features">{features_html}</ul>
    </div>
  </div>
</section>

<section class="section">
  <div class="container">
    <div class="section-head">
      <span class="eyebrow">Pourquoi BOHFLEX</span>
      <h2>La différence se sent au premier pas</h2>
    </div>
    <div class="duo">
      <figure>{pic("bohflex-vs", ALT_VS, "framed")}</figure>
      <figure>{pic("bohflex-utiliser", ALT_HOW, "framed")}</figure>
    </div>
  </div>
</section>

{PEOPLE_SECTION}

<section class="section" id="offres">
  <div class="container">
    <div class="section-head">
      <span class="eyebrow">Nos offres</span>
      <h2>Choisissez votre pack</h2>
      <p class="muted">Livraison gratuite et paiement à la livraison sur toutes les offres.</p>
    </div>
    {OFFERS}
  </div>
</section>

{reviews_section(3)}

{REASSURE}

<section class="section final-cta">
  <div class="container">
    <h2>Offrez à vos pieds le confort qu'ils méritent</h2>
    <p class="muted">Commandez en 1 minute. Notre équipe vous appelle pour confirmer, et vous payez seulement à la livraison.</p>
    <a class="btn btn--primary" href="commander.html" data-order-link>Commander maintenant</a>
    <p class="small muted" style="margin-top:14px">ou <a href="#" data-wa>posez votre question sur WhatsApp</a></p>
  </div>
</section>
"""

ORG_LD = """<script type="application/ld+json">
{"@context":"https://schema.org","@type":"Organization","name":"BOHFLEX","areaServed":"CI","logo":"assets/img/icon-512.png","image":"assets/img/og-image.jpg"}
</script>
"""

page("index.html", "BOHFLEX — Semelles massantes de confort | Paiement à la livraison en Côte d'Ivoire",
     "Semelles massantes BOHFLEX : amorti moelleux, nodules de massage, soutien de la voûte, découpables du 35 au 46. 2 paires 6 500 FCFA, 3 paires 7 500 FCFA. Livraison gratuite partout en Côte d'Ivoire, paiement à la livraison.",
     index_body, extra_head=ORG_LD)

# ============================ PRODUIT ============================
def picker(name="offre", default="3"):
    opts = ""
    for oid, pairs, tag in (("2", 2, ""), ("3", 3, "Le plus avantageux")):
        chk = " checked" if oid == default else ""
        t = f'<span class="offer-opt__tag">{tag}</span>' if tag else ""
        opts += f"""<label class="offer-opt">
  <input type="radio" name="{name}" value="{oid}"{chk}>
  <span class="offer-opt__box">
    <span class="offer-opt__radio" aria-hidden="true"></span>
    <span class="offer-opt__label"><b>{pairs} paires</b><small data-unit="{oid}"></small></span>
    <span class="offer-opt__price"><b data-price="{oid}"></b><s data-old="{oid}"></s></span>
  </span>
  {t}
</label>"""
    return opts

sizes_rows = "".join(
    f"<tr><td>{s}</td><td>{l}</td><td>{p}</td></tr>"
    for s, l, p in [("35/36", "22,5 – 23,5 cm", "Découper au trait 35 ou 36"),
                    ("37/38", "23,5 – 24,5 cm", "Découper au trait 37 ou 38"),
                    ("39/40", "24,5 – 25,5 cm", "Découper au trait 39 ou 40"),
                    ("41/42", "25,5 – 26,5 cm", "Découper au trait 41 ou 42"),
                    ("43/44", "26,5 – 28 cm", "Découper au trait 43 ou 44"),
                    ("45/46", "28 – 29 cm", "Découper au trait 45 ou 46")]
)

PRODUCT_FAQ = [
    ("Comment choisir ma pointure ?", "Choisissez votre pointure habituelle (de 35/36 à 45/46). La semelle se découpe ensuite aux ciseaux le long du trait de votre pointure exacte."),
    ("Je peux prendre des pointures différentes ?", "Oui : vous choisissez une pointure pour chaque paire. Pratique pour équiper toute la famille."),
    ("Comment se passe le paiement ?", "En espèces, au livreur, quand vous recevez votre colis. Aucun paiement en ligne."),
    ("En combien de temps je suis livré ?", "En 24 h. Un conseiller vous appelle d'abord pour confirmer votre commande."),
    ("Dans quelles chaussures les mettre ?", "Chaussures de sécurité, de travail, baskets, chaussures de ville… Retirez la semelle d'origine si possible."),
    ("Est-ce un produit médical ?", "Non, c'est un produit de confort. En cas de douleur persistante, consultez un professionnel de santé."),
]
product_faq_html = "".join(f"<details><summary>{q}</summary><div><p>{a}</p></div></details>" for q, a in PRODUCT_FAQ)

HOW_ORDER = f"""<section class="section">
  <div class="container">
    <div class="section-head"><span class="eyebrow">Commander, c'est simple</span><h2>Vous ne payez qu'à la livraison</h2></div>
    <ol class="howto">
      <li><span>1</span><b>Choisissez votre offre</b><p>2 ou 3 paires, une pointure par paire.</p></li>
      <li><span>2</span><b>Laissez vos coordonnées</b><p>Nom, téléphone et lieu de livraison. Moins d'une minute.</p></li>
      <li><span>3</span><b>On vous appelle</b><p>Un conseiller confirme votre commande avec vous.</p></li>
      <li><span>4</span><b>Payez à la réception</b><p>Vous vérifiez le colis, puis vous payez le livreur.</p></li>
    </ol>
  </div>
</section>"""

product_body = f"""
<div class="container">
  <nav class="breadcrumb" aria-label="Fil d'Ariane"><a href="index.html">Accueil</a> › Semelles Confort BOHFLEX</nav>
  <section class="product">
    <div class="gallery">
      <div class="gallery__main">{pic("bohflex-hero", ALT_HERO, eager=True)}</div>
      <div class="gallery__thumbs">
        <button type="button" aria-current="true" aria-label="Photo : les semelles">{pic("bohflex-hero", ALT_HERO)}</button>
        <button type="button" aria-current="false" aria-label="Photo : les caractéristiques">{pic("bohflex-details", ALT_DETAILS)}</button>
        <button type="button" aria-current="false" aria-label="Photo : en situation">{pic("bohflex-securite", "Agent de sécurité tenant un paquet de semelles BOHFLEX")}</button>
        <button type="button" aria-current="false" aria-label="Photo : comment les utiliser">{pic("bohflex-utiliser", ALT_HOW)}</button>
        <button type="button" aria-current="false" aria-label="Photo : sur un chantier">{pic("bohflex-btp", "Ouvrier de chantier tenant un paquet de semelles BOHFLEX")}</button>
        <button type="button" aria-current="false" aria-label="Photo : comparatif">{pic("bohflex-vs", ALT_VS)}</button>
        <button type="button" aria-current="false" aria-label="Photo : à l'hôpital">{pic("bohflex-sante", "Infirmière tenant un paquet de semelles BOHFLEX")}</button>
        <button type="button" aria-current="false" aria-label="Photo : en entrepôt">{pic("bohflex-entrepot", "Magasinier dans un entrepôt")}</button>
        <button type="button" aria-current="false" aria-label="Photo : pour le sport">{pic("bohflex-sport", "Coureur pendant une course en ville")}</button>
      </div>
    </div>
    <div class="product__info" id="offre">
      <h1 class="product__hook">Vos pieds vous portent toute la journée. Offrez-leur du confort.</h1>
      <p class="product__name">Semelles Confort BOHFLEX · massantes, découpables du 35 au 46</p>
      <form id="product-picker" onsubmit="return false">
        <fieldset class="offer-picker">
          <legend class="sr-only">Choisissez votre offre</legend>
          {picker()}
        </fieldset>
      </form>
      <a class="btn btn--primary btn--block btn--xl" href="commander.html?offre=3" data-order-link>Je commande mes semelles</a>
      <p class="pay-note">{ic("truck")} Livraison gratuite · {ic("cash")} Paiement à la réception</p>
      <ul class="check-list">
        <li>{ic("dots")}<span>Nodules de massage sous la plante du pied</span></li>
        <li>{ic("wave")}<span>Amorti moelleux et soutien de la voûte</span></li>
        <li>{ic("shoe")}<span>Chaussures de travail, de sécurité, baskets, ville</span></li>
      </ul>
    </div>
  </section>
</div>

<section class="section section--soft">
  <div class="container">
    <div class="section-head">
      <span class="eyebrow">Ça vous parle ?</span>
      <h2>Vous vous reconnaissez ?</h2>
      <p class="muted">Si vous cochez au moins un de ces signes, vos pieds réclament plus de confort.</p>
    </div>
    <ul class="signs">{signs_html}</ul>
    <p class="center" style="margin-top:22px"><a class="btn btn--primary" href="commander.html" data-order-link>J'offre du confort à mes pieds</a></p>
    <p class="center small muted" style="margin-top:12px">BOHFLEX est un produit de confort. En cas de douleur persistante, consultez un professionnel de santé.</p>
  </div>
</section>

<section class="section">
  <div class="container split">
    <div class="split__media">{pic("bohflex-details", ALT_DETAILS, "framed")}</div>
    <div>
      <span class="eyebrow">Dans le détail</span>
      <h2>Ce que BOHFLEX change dans votre journée</h2>
      <ul class="features">{features_html}</ul>
    </div>
  </div>
</section>

{PEOPLE_SECTION}

<section class="section">
  <div class="container">
    <div class="section-head"><span class="eyebrow">Pourquoi BOHFLEX</span><h2>La différence se sent au premier pas</h2></div>
    <div class="duo">
      <figure>{pic("bohflex-vs", ALT_VS, "framed")}</figure>
      <figure>{pic("bohflex-utiliser", ALT_HOW, "framed")}</figure>
    </div>
    <p class="center" style="margin-top:22px"><a class="btn btn--primary" href="commander.html" data-order-link>Je commande mes semelles</a></p>
  </div>
</section>

{reviews_section(8)}

{HOW_ORDER}

<section class="section section--soft" id="offres">
  <div class="container">
    <div class="section-head"><span class="eyebrow">Offres</span><h2>Choisissez votre pack</h2></div>
    {OFFERS}
  </div>
</section>

<section class="section" id="tailles">
  <div class="container" style="max-width:800px">
    <div class="section-head"><span class="eyebrow">Guide des tailles</span><h2>Trouvez votre pointure</h2></div>
    <div class="table-wrap">
      <table class="size-table">
        <thead><tr><th>Taille</th><th>Longueur du pied</th><th>Conseil</th></tr></thead>
        <tbody>{sizes_rows}</tbody>
      </table>
    </div>
    <div class="tip">{ic("scissors")}<p><strong>La semelle se découpe suivant la pointure.</strong> Posez votre ancienne semelle dessus, tracez le contour et découpez avec des ciseaux le long du trait correspondant à votre pointure. <span class="muted">(Longueurs indicatives.)</span></p></div>
  </div>
</section>

<section class="section section--soft">
  <div class="container" style="max-width:800px">
    <div class="section-head"><span class="eyebrow">Questions fréquentes</span><h2>Vous vous demandez…</h2></div>
    <div class="faq">{product_faq_html}</div>
    <p class="center small muted" style="margin-top:16px">Une autre question ? <a href="#" data-wa>Écrivez-nous sur WhatsApp</a></p>
  </div>
</section>

{REASSURE}

<section class="section final-cta">
  <div class="container">
    <h2>Vos pieds vous portent toute la journée. À votre tour.</h2>
    <p class="muted">Commandez en 1 minute. Un conseiller vous appelle, et vous payez seulement à la livraison.</p>
    <a class="btn btn--primary btn--xl" href="commander.html" data-order-link>Commander maintenant</a>
  </div>
</section>
"""

PRODUCT_LD = """<script type="application/ld+json">
{"@context":"https://schema.org","@type":"Product","name":"Semelles Confort BOHFLEX","brand":{"@type":"Brand","name":"BOHFLEX"},
"image":"assets/img/bohflex-hero-1000.webp","description":"Semelles massantes de confort, se découpent suivant la pointure (35 à 46).",
"offers":[{"@type":"Offer","name":"2 paires","price":"6500","priceCurrency":"XOF","availability":"https://schema.org/InStock","areaServed":"CI"},
{"@type":"Offer","name":"3 paires","price":"7500","priceCurrency":"XOF","availability":"https://schema.org/InStock","areaServed":"CI"}]}
</script>
"""

page("produit.html", "Semelles Confort BOHFLEX — 2 paires 6 500 FCFA | Livraison gratuite CI",
     "Semelles massantes BOHFLEX : nodules de massage, soutien de la voûte, amorti moelleux. Se découpent de la pointure 35 à 46. Paiement à la livraison partout en Côte d'Ivoire.",
     product_body, extra_head=PRODUCT_LD)

# ============================ COMMANDER ============================
CITIES = ["Abidjan - Cocody", "Abidjan - Yopougon", "Abidjan - Abobo", "Abidjan - Adjamé", "Abidjan - Plateau",
          "Abidjan - Marcory", "Abidjan - Koumassi", "Abidjan - Treichville", "Abidjan - Port-Bouët",
          "Abidjan - Attécoubé", "Abidjan - Riviera", "Abidjan - Angré", "Bingerville", "Anyama", "Songon",
          "Grand-Bassam", "Bouaké", "Yamoussoukro", "San-Pédro", "Daloa", "Korhogo", "Man", "Gagnoa",
          "Abengourou", "Divo", "Soubré", "Agboville", "Dabou", "Bondoukou", "Odienné"]
datalist = "".join(f'<option value="{c}">' for c in CITIES)

order_body = f"""
<div class="container order-one" id="order-view">
  <div class="order-item">
    <img src="assets/img/bohflex-hero-600.webp" alt="" width="64" height="64">
    <div class="order-item__txt"><b>Semelles Confort BOHFLEX</b><span id="sum-offer"></span></div>
    <div class="order-item__price"><b id="sum-price"></b><a href="produit.html#offre" id="change-offer">Changer</a></div>
  </div>
  <form id="order-form" novalidate>
    <p class="notice" id="welcome-back" hidden>Bon retour <strong></strong> ! Vos informations sont pré-remplies.</p>
    <div class="field">
      <label for="name">Nom complet</label>
      <input class="input" id="name" name="name" type="text" autocomplete="name" placeholder="Ex : Aminata Koné" required>
      <div class="field__error">Indiquez votre nom</div>
    </div>
    <div class="field">
      <label for="phone">Téléphone</label>
      <div class="phone-wrap">
        <span class="phone-wrap__prefix">+225</span>
        <input class="input" id="phone" name="phone" type="tel" inputmode="tel" autocomplete="tel-national" placeholder="07 00 00 00 00" required>
      </div>
      <div class="field__error">10 chiffres (ex : 07 00 00 00 00)</div>
    </div>
    <div class="field-row">
      <div class="field">
        <label for="city">Ville / Quartier</label>
        <input class="input" id="city" name="city" type="text" list="cities" autocomplete="address-level2" placeholder="Ex : Yopougon" required>
        <datalist id="cities">{datalist}</datalist>
        <div class="field__error">Ville ou quartier</div>
      </div>
      <div class="field">
        <label for="address">Point de repère</label>
        <input class="input" id="address" name="address" type="text" autocomplete="street-address" placeholder="Ex : près de la pharmacie" required>
        <div class="field__error">Un repère pour le livreur</div>
      </div>
    </div>
    <div class="field">
      <label>Pointure de chaque paire</label>
      <div class="sizes-row" id="sizes"></div>
    </div>
    <button class="btn btn--primary btn--block btn--xl" type="submit">Commander · <span id="submit-total"></span></button>
    <p class="order-note">{ic("cash")} Paiement à la livraison · {ic("truck")} Livraison gratuite</p>
  </form>
</div>

<div class="container" id="order-success" hidden>
  <div class="success">
    <div class="success__icon">{ic("check")}</div>
    <h1>Merci pour votre commande !</h1>
    <p>Référence : <strong id="success-ref"></strong></p>
    <p>Votre commande est bien enregistrée.</p>
    <p class="muted">Notre équipe vous appelle <strong>très bientôt</strong> au <strong id="success-phone"></strong> pour confirmer l'adresse et le moment de la livraison. Vous payez <strong>seulement à la livraison</strong>.</p>
    <p class="small muted">Une question ? <a href="#" data-wa>Écrivez-nous sur WhatsApp</a></p>
    <p><a href="index.html">← Retour à l'accueil</a></p>
  </div>
</div>

<div class="modal" id="recap-modal" role="dialog" aria-modal="true" aria-labelledby="recap-title">
  <div class="modal__backdrop" data-close></div>
  <div class="modal__panel">
    <button class="modal__close" type="button" data-close aria-label="Fermer">×</button>
    <h2 id="recap-title">Confirmez votre commande</h2>
    <div class="recap"><dl id="recap-list"></dl></div>
    <div class="recap-total"><span>À payer à la livraison</span><b id="recap-total"></b></div>
    <ul class="recap-info">
      <li>{ic("phone")} Un conseiller vous appelle pour confirmer la livraison.</li>
      <li>{ic("cash")} Vous payez en espèces, à la réception du colis.</li>
    </ul>
    <p class="notice notice--error" id="order-error" hidden>L'envoi n'a pas abouti (connexion internet ?). Réessayez, ou envoyez votre commande sur WhatsApp : <a id="order-wa" href="#" target="_blank" rel="noopener">envoyer sur WhatsApp</a>.</p>
    <div class="modal__actions">
      <button class="btn btn--primary btn--block btn--xl" type="button" id="order-confirm">{ic("check")} Je confirme</button>
      <button class="btn btn--outline btn--block" type="button" data-close>Modifier</button>
    </div>
  </div>
</div>
"""

page("commander.html", "Commander — Semelles BOHFLEX | Paiement à la livraison",
     "Commandez vos semelles BOHFLEX en 1 minute. Livraison gratuite partout en Côte d'Ivoire, paiement à la livraison.",
     order_body, body_class="page-order", extra_head='<meta name="robots" content="noindex">\n')

# ============================ SUIVI ============================
track_body = f"""
<section class="page-hero"><div class="container"><h1>Suivre ma commande</h1><p>Entrez le numéro utilisé lors de la commande : notre équipe vous répond sur WhatsApp avec le statut de votre livraison.</p></div></section>
<section class="section"><div class="container" style="max-width:520px">
  <form id="track-form" class="card" novalidate>
    <div class="field">
      <label for="t-phone">Téléphone utilisé pour la commande <span class="req">*</span></label>
      <input class="input" id="t-phone" name="phone" type="tel" inputmode="tel" placeholder="07 00 00 00 00" required>
      <div class="field__error">Numéro à 10 chiffres</div>
    </div>
    <div class="field">
      <label for="t-ref">Référence de commande <span class="muted small">(optionnel)</span></label>
      <input class="input" id="t-ref" name="ref" type="text" placeholder="BHF-…">
    </div>
    <button class="btn btn--wa btn--block" type="submit">{ic("whatsapp")} Demander le statut</button>
  </form>
  <p class="small muted center" style="margin-top:14px">Bientôt : suivi automatique en temps réel dans l'application.</p>
</div></section>
"""
page("suivi.html", "Suivi de commande — BOHFLEX", "Suivez votre commande de semelles BOHFLEX via WhatsApp.", track_body,
     extra_head='<meta name="robots" content="noindex">\n')

# ============================ À PROPOS ============================
about_body = f"""
<section class="page-hero"><div class="container"><span class="eyebrow">La marque</span><h1>BOHFLEX, le confort de ceux qui tiennent debout</h1><p>Une marque née en Côte d'Ivoire, pour les travailleurs et travailleuses qui font tourner le pays.</p></div></section>
<section class="section"><div class="container prose">
  <div style="margin-bottom:24px">{pic("bohflex-hero", ALT_HERO, "framed")}</div>
  <h2>Notre histoire</h2>
  <p>Tout est parti d'un constat simple : autour de nous, les agents de sécurité, les infirmières, les commerçantes du marché, les ouvriers sur les chantiers rentraient tous le soir avec la même plainte : « J'ai mal aux pieds ». BOHFLEX est né pour leur apporter une solution simple, accessible et livrée jusqu'à leur porte.</p>
  <h2>Notre engagement</h2>
  <ul>
    <li><strong>Un prix juste</strong> : du confort accessible à tous, à partir de <span data-price="2"></span> les 2 paires.</li>
    <li><strong>Zéro risque</strong> : vous payez uniquement à la livraison, quand vous avez le produit en main.</li>
    <li><strong>Livraison partout</strong> : Abidjan et l'intérieur du pays, gratuitement.</li>
    <li><strong>Un vrai service client</strong> : une équipe joignable sur WhatsApp pour vous conseiller.</li>
  </ul>
  <h2>Pourquoi BOHFLEX ?</h2>
  <p>Parce que vos journées sont longues et que vos pieds vous portent du matin au soir. Nos semelles se glissent dans toutes vos chaussures et se découpent à votre pointure : une solution simple pour plus de confort au quotidien.</p>
  <p class="center" style="margin-top:28px"><a class="btn btn--primary" href="commander.html">Commander maintenant</a></p>
</div></section>
{REASSURE}
"""
page("a-propos.html", "La marque BOHFLEX — Semelles de confort made for Côte d'Ivoire",
     "Découvrez BOHFLEX, la marque de semelles de confort pour les personnes qui travaillent debout en Côte d'Ivoire.", about_body)

# ============================ FAQ ============================
FAQ = [
    ("Taille & utilisation", [
        ("Comment choisir ma taille ?", "Choisissez la taille qui correspond à votre pointure habituelle (35/36 jusqu'à 45/46). La semelle se découpe ensuite avec des ciseaux le long du trait correspondant à votre pointure exacte. Consultez le <a href=\"produit.html#tailles\">guide des tailles</a>."),
        ("Dans quelles chaussures puis-je les mettre ?", "Chaussures de travail, de sécurité, baskets, chaussures de ville… Pour un meilleur confort, retirez la semelle d'origine si votre chaussure le permet."),
        ("Je peux commander des pointures différentes ?", "Oui ! Dans le formulaire, vous choisissez une pointure pour chaque paire. Idéal pour équiper toute la famille."),
    ]),
    ("Livraison", [
        ("La livraison est-elle vraiment gratuite ?", "Oui, la livraison est gratuite partout en Côte d'Ivoire, à Abidjan comme à l'intérieur du pays."),
        ("Quel est le délai de livraison ?", "En 24 h, après confirmation de votre commande par téléphone."),
        ("Comment se passe la livraison ?", "Notre équipe vous contacte sur WhatsApp ou par téléphone pour confirmer la commande, puis le livreur vous appelle avant de passer à l'adresse indiquée."),
    ]),
    ("Paiement", [
        ("Comment je paie ?", "Vous payez en espèces au livreur, au moment où vous recevez votre colis. Aucun paiement en ligne n'est demandé."),
        ("Puis-je payer par Wave ou Orange Money ?", "Le paiement mobile (Wave, Orange Money, MTN MoMo, Moov Money) arrive bientôt. En attendant, demandez à notre équipe sur WhatsApp si c'est possible pour votre livraison."),
    ]),
    ("Entretien & garantie", [
        ("Comment entretenir mes semelles ?", "Lavez-les à la main à l'eau tiède savonneuse, puis laissez-les sécher à l'air libre, à l'abri du soleil direct. Ne pas mettre en machine ni au sèche-linge. <em>[À vérifier selon le produit]</em>"),
        ("Combien de temps durent-elles ?", "Avec un usage quotidien, comptez plusieurs mois de confort. Nous conseillons de les remplacer dès que la mousse s'affaisse. <em>[À vérifier]</em>"),
        ("Et si je ne suis pas satisfait ?", "Vous vérifiez le colis à la livraison avant de payer. Pour toute question après réception, écrivez-nous sur WhatsApp : nous trouvons une solution ensemble. Voir aussi nos <a href=\"mentions-legales.html#cgv\">CGV</a>."),
        ("Est-ce un dispositif médical ?", "Non. Les semelles BOHFLEX sont un produit de confort. En cas de douleur persistante, consultez un professionnel de santé."),
    ]),
]
faq_html = ""
for cat, items in FAQ:
    faq_html += f"<h2>{cat}</h2>"
    for q, a in items:
        faq_html += f"<details><summary>{q}</summary><div><p>{a}</p></div></details>"

faq_ld_items = ",".join(
    '{"@type":"Question","name":"%s","acceptedAnswer":{"@type":"Answer","text":"%s"}}' % (q.replace('"', "'"), __import__("re").sub("<[^>]+>", "", a).replace('"', "'"))
    for _, items in FAQ for q, a in items
)
faq_body = f"""
<section class="page-hero"><div class="container"><h1>Questions fréquentes</h1><p>Taille, livraison, paiement, entretien : toutes les réponses. Vous ne trouvez pas ? <a href="#" data-wa>Écrivez-nous sur WhatsApp</a>.</p></div></section>
<section class="section"><div class="container"><div class="faq">{faq_html}</div>
<p class="center" style="margin-top:28px"><a class="btn btn--primary" href="commander.html">Commander maintenant</a></p></div></section>
"""
page("faq.html", "FAQ — Semelles BOHFLEX : taille, livraison, paiement",
     "Toutes les réponses sur les semelles BOHFLEX : choix de la taille, livraison gratuite en Côte d'Ivoire, paiement à la livraison, entretien.",
     faq_body, extra_head=f'<script type="application/ld+json">{{"@context":"https://schema.org","@type":"FAQPage","mainEntity":[{faq_ld_items}]}}</script>\n')

# ============================ CONTACT ============================
contact_body = f"""
<section class="page-hero"><div class="container"><h1>Contactez-nous</h1><p>Une question avant de commander ? Notre équipe vous répond 7j/7, de 6 h à 23 h.</p></div></section>
<section class="section"><div class="container">
  <div class="grid grid--3 contact-cards">
    <div class="card">{ic("whatsapp")}<h3>WhatsApp</h3><p class="muted">Le moyen le plus rapide pour commander ou poser une question.</p><a class="btn btn--wa" href="#" data-wa>Écrire sur WhatsApp</a></div>
    <div class="card">{ic("phone")}<h3>Téléphone</h3><p class="muted">Appelez-nous 7j/7, de 6 h à 23 h.</p><a class="btn btn--dark" href="#" data-phone></a></div>
{f"""<div class="card">{ic("heart")}<h3>Réseaux sociaux</h3><p class="muted">Suivez-nous pour les nouveautés et les promos.</p>
      <div class="socials" style="margin-top:0">{social_links(' style="background:var(--orange);color:#fff"')}</div>
    </div>""" if any(SOCIALS.values()) else ""}
  </div>
</div></section>
"""
page("contact.html", "Contact — BOHFLEX | WhatsApp & téléphone",
     "Contactez BOHFLEX sur WhatsApp ou par téléphone. Livraison gratuite partout en Côte d'Ivoire.", contact_body)

# ============================ MENTIONS / CGV ============================
legal_body = """
<section class="page-hero"><div class="container"><h1>Mentions légales &amp; CGV</h1><p>Modèle à compléter et à faire valider avant la mise en ligne.</p></div></section>
<section class="section"><div class="container prose">
  <p class="notice">⚠️ Ce texte est un <strong>modèle de démonstration</strong>. Complétez les champs entre crochets et faites-le relire (idéalement par un juriste) avant toute mise en ligne.</p>
  <h2>Mentions légales</h2>
  <ul>
    <li><strong>Éditeur du site :</strong> [Raison sociale / Nom], [Forme juridique], RCCM [numéro], NCC [numéro]</li>
    <li><strong>Siège :</strong> [Adresse complète], Abidjan, Côte d'Ivoire</li>
    <li><strong>Contact :</strong> [e-mail] · [téléphone]</li>
    <li><strong>Directeur de la publication :</strong> [Nom]</li>
    <li><strong>Hébergeur :</strong> [Nom de l'hébergeur, adresse]</li>
  </ul>
  <h2>Données personnelles</h2>
  <p>Les informations collectées via le formulaire de commande (nom, téléphone, adresse de livraison) servent uniquement au traitement et à la livraison de votre commande. Elles ne sont pas revendues. Conformément à la loi ivoirienne n° 2013-450 relative à la protection des données à caractère personnel, vous pouvez demander l'accès, la rectification ou la suppression de vos données en nous contactant. [À compléter : déclaration ARTCI le cas échéant]</p>
  <p>Ce site peut utiliser le pixel Meta (Facebook) pour mesurer l'efficacité de ses publicités. [À compléter : bandeau de consentement si nécessaire]</p>
  <h2 id="cgv">Conditions générales de vente</h2>
  <h3>1. Produits</h3>
  <p>Semelles de confort BOHFLEX. Produit de confort, non médical. Les visuels sont non contractuels.</p>
  <h3>2. Prix</h3>
  <p>Les prix sont indiqués en francs CFA (FCFA), toutes taxes comprises. Offres en vigueur : 2 paires à 6 500 FCFA, 3 paires à 7 500 FCFA. Livraison gratuite en Côte d'Ivoire.</p>
  <h3>3. Commande</h3>
  <p>La commande est passée via le formulaire du site puis confirmée par WhatsApp ou par téléphone avec notre équipe. Elle n'est définitive qu'après cette confirmation.</p>
  <h3>4. Paiement</h3>
  <p>Paiement en espèces à la livraison, à la remise du colis. [Moyens de paiement mobile à ajouter ultérieurement.]</p>
  <h3>5. Livraison</h3>
  <p>Livraison à l'adresse indiquée, partout en Côte d'Ivoire. Délai indicatif : 24 h après confirmation de la commande. Le livreur contacte le client avant son passage.</p>
  <h3>6. Satisfait ou remboursé</h3>
  <p>[À définir : délai (ex. 7 jours), état du produit, modalités de retour et de remboursement.]</p>
  <h3>7. Réclamations</h3>
  <p>Pour toute réclamation, contactez-nous sur WhatsApp ou par téléphone.</p>
</div></section>
"""
page("mentions-legales.html", "Mentions légales & CGV — BOHFLEX", "Mentions légales et conditions générales de vente BOHFLEX.", legal_body)

print("ok")
