#!/usr/bin/env python3
"""Génère les pages HTML BOHFLEX à partir d'un gabarit commun.

Usage (depuis la racine du projet) : python3 tools/build_pages.py .
"""
import sys, pathlib

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
          <a href="#" aria-label="Facebook">{ic("facebook")}</a>
          <a href="#" aria-label="Instagram">{ic("instagram")}</a>
          <a href="#" aria-label="TikTok">{ic("tiktok")}</a>
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

SCRIPTS = """<script src="assets/js/config.js"></script>
<script src="assets/js/main.js"></script>
"""

def page(fname, title, desc, body, active=None, body_class="", extra_head=""):
    html = head(title, desc, extra_head)
    html += f'<body{f" class=\"{body_class}\"" if body_class else ""}>\n<script src="assets/js/icons.js"></script>\n'
    html += header(active or fname)
    html += f"<main>\n{body}\n</main>\n"
    html += FOOTER + sticky() + SCRIPTS + "</body>\n</html>\n"
    (OUT / fname).write_text(html, encoding="utf-8")

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

# Avis clients : à remplir avec de VRAIS avis (prénom, ville, texte), avec l'accord des clients.
# Tant que la liste est vide, aucune section d'avis n'est affichée sur le site.
REVIEWS_DATA = []

def reviews(n=3):
    if not REVIEWS_DATA:
        return ""
    cards = ""
    for letter, name, meta, text in REVIEWS_DATA[:n]:
        cards += f"""<article class="card review">
  <div class="review__head"><div class="avatar" aria-hidden="true">{letter}</div><div><div class="review__name">{name}</div><div class="review__meta">{meta}</div></div></div>
  <p>« {text} »</p>
</article>"""
    return f'<div class="grid grid--3">{cards}</div>'

def reviews_section(n=3):
    if not REVIEWS_DATA:
        return ""
    return f"""<section class="section" id="avis">
  <div class="container">
    <div class="section-head"><span class="eyebrow">Avis clients</span><h2>Ils portent BOHFLEX</h2></div>
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

<section class="section section--soft">
  <div class="container">
    <div class="section-head">
      <span class="eyebrow">Pour qui ?</span>
      <h2>Pour tous ceux qui travaillent debout</h2>
    </div>
    <div class="grid grid--jobs">{jobs_html}</div>
  </div>
</section>

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

product_body = f"""
<div class="container">
  <nav class="breadcrumb" aria-label="Fil d'Ariane"><a href="index.html">Accueil</a> › Semelles Confort BOHFLEX</nav>
  <section class="product">
    <div class="gallery">
      <div class="gallery__main">{pic("bohflex-hero", ALT_HERO, eager=True)}</div>
      <div class="gallery__thumbs">
        <button type="button" aria-current="true" aria-label="Photo : les semelles">{pic("bohflex-hero", ALT_HERO)}</button>
        <button type="button" aria-current="false" aria-label="Photo : les caractéristiques">{pic("bohflex-details", ALT_DETAILS)}</button>
        <button type="button" aria-current="false" aria-label="Photo : comment les utiliser">{pic("bohflex-utiliser", ALT_HOW)}</button>
        <button type="button" aria-current="false" aria-label="Photo : BOHFLEX contre les semelles ordinaires">{pic("bohflex-vs", ALT_VS)}</button>
      </div>
    </div>
    <div class="product__info">
      <h1>Semelles Confort BOHFLEX</h1>
      <div class="product__tagline">Le confort toute la journée</div>
      <p>Les semelles massantes BOHFLEX se glissent dans toutes vos chaussures — de travail, de sécurité, baskets ou chaussures de ville — et se découpent à votre pointure.</p>
      <ul class="check-list">
        <li>{ic("dots")}<span>Nodules de massage sous la plante du pied</span></li>
        <li>{ic("arch")}<span>Soutien de la voûte plantaire</span></li>
        <li>{ic("wave")}<span>Amorti moelleux qui absorbe les chocs</span></li>
        <li>{ic("wind")}<span>Aération respirante et talon renforcé</span></li>
        <li>{ic("scissors")}<span>Se découpe suivant votre pointure (35 → 46)</span></li>
      </ul>
      <form id="product-picker" onsubmit="return false">
        <fieldset class="offer-picker">
          <legend>Choisissez votre offre :</legend>
          {picker()}
        </fieldset>
      </form>
      <a class="btn btn--primary btn--block" href="commander.html?offre=3" data-order-link>Commander maintenant</a>
      <div style="margin-top:14px">{TRUST}</div>
    </div>
  </section>
</div>

<section class="section section--soft">
  <div class="container split">
    <div class="split__media">{pic("bohflex-details", ALT_DETAILS, "framed")}</div>
    <div>
      <span class="eyebrow">Dans le détail</span>
      <h2>Ce que BOHFLEX change dans votre journée</h2>
      <ul class="features">{features_html}</ul>
    </div>
  </div>
</section>

<section class="section">
  <div class="container">
    <div class="duo">
      <figure>{pic("bohflex-utiliser", ALT_HOW, "framed")}</figure>
      <figure>{pic("bohflex-vs", ALT_VS, "framed")}</figure>
    </div>
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

<section class="section section--soft" id="offres">
  <div class="container">
    <div class="section-head"><span class="eyebrow">Offres</span><h2>Choisissez votre pack</h2></div>
    {OFFERS}
  </div>
</section>

{reviews_section(6)}

{REASSURE}
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
<div class="container" id="order-view">
  <div class="order__title">
    <h1>Finaliser ma commande</h1>
    <p class="muted">Remplissez le formulaire, ça prend moins d'une minute.</p>
  </div>
  <div class="order">
    <form id="order-form" novalidate>
      <div class="cod-banner">{ic("cash")}<div>Vous payez <span>seulement à la livraison</span>. Aucun paiement en ligne.</div></div>
      <p class="notice" id="welcome-back" hidden>Bon retour <strong></strong> ! Vos informations ont été pré-remplies.</p>

      <div class="form-step">
        <h2 class="form-step__title"><i>1</i> Mon offre</h2>
        <fieldset class="offer-picker"><legend class="sr-only">Choix de l'offre</legend>{picker()}</fieldset>
      </div>

      <div class="form-step">
        <h2 class="form-step__title"><i>2</i> Ma pointure</h2>
        <div class="sizes-grid" id="sizes"></div>
        <p class="hint small muted" style="margin-top:-4px">Une pointure par paire : vous pouvez commander pour toute la famille. La semelle se découpe ensuite à la taille exacte.</p>
        <div class="field" id="field-color">
          <label for="color">Coloris <span class="req">*</span></label>
          <select class="select" id="color" name="color"><option value="">Choisir…</option></select>
          <div class="field__error">Choisissez un coloris</div>
        </div>
      </div>

      <div class="form-step">
        <h2 class="form-step__title"><i>3</i> Mes informations de livraison</h2>
        <div class="field">
          <label for="name">Nom complet <span class="req">*</span></label>
          <input class="input" id="name" name="name" type="text" autocomplete="name" placeholder="Ex : Aminata Koné" required>
          <div class="field__error">Indiquez votre nom complet</div>
        </div>
        <div class="field">
          <label for="phone">Téléphone / WhatsApp <span class="req">*</span></label>
          <div class="phone-wrap">
            <span class="phone-wrap__prefix">+225</span>
            <input class="input" id="phone" name="phone" type="tel" inputmode="tel" autocomplete="tel-national" placeholder="07 00 00 00 00" required>
          </div>
          <div class="field__error">Numéro à 10 chiffres (ex : 07 00 00 00 00)</div>
          <div class="hint">Le livreur vous appellera sur ce numéro.</div>
        </div>
        <div class="field">
          <label for="city">Ville / Quartier <span class="req">*</span></label>
          <input class="input" id="city" name="city" type="text" list="cities" autocomplete="address-level2" placeholder="Ex : Abidjan - Yopougon Niangon" required>
          <datalist id="cities">{datalist}</datalist>
          <div class="field__error">Indiquez votre ville ou quartier</div>
        </div>
        <div class="field">
          <label for="address">Adresse précise / point de repère <span class="req">*</span></label>
          <input class="input" id="address" name="address" type="text" autocomplete="street-address" placeholder="Ex : derrière la pharmacie, près du carrefour…" required>
          <div class="field__error">Donnez un point de repère pour le livreur</div>
        </div>
        <div class="field">
          <label for="notes">Remarques <span class="muted small">(optionnel)</span></label>
          <textarea class="textarea" id="notes" name="notes" placeholder="Ex : livrer après 17h, appeler avant de passer…"></textarea>
        </div>
      </div>

      <button class="btn btn--primary btn--block" type="submit">Valider ma commande · <span id="submit-total"></span></button>
      <p class="center small muted" style="margin-top:10px">💵 Vous payez seulement à la livraison · 🚚 Livraison gratuite</p>
    </form>

    <aside class="card summary" aria-label="Résumé de la commande">
      <h2>Ma commande</h2>
      <div style="display:flex;gap:12px;align-items:center;margin-bottom:10px">
        <img src="assets/img/bohflex-hero-600.webp" alt="" width="72" height="72" style="object-fit:cover;border-radius:12px">
        <div><strong>Semelles Confort BOHFLEX</strong><div class="muted small" id="sum-offer"></div></div>
      </div>
      <div class="summary__row"><span>Prix normal</span><s class="muted" id="sum-old"></s></div>
      <div class="summary__row"><span>Prix de l'offre</span><strong id="sum-price"></strong></div>
      <div class="summary__row"><span>Livraison</span><span class="free">Gratuite</span></div>
      <div class="summary__total"><span>À payer à la livraison</span><b id="sum-total"></b></div>
      <ul class="trust-row">
        <li>{ic("cash")} Paiement en espèces au livreur</li>
        <li>{ic("phone")} Appel de confirmation avant livraison</li>
        <li>{ic("pin")} Toute la Côte d'Ivoire</li>
      </ul>
    </aside>
  </div>
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
    <h2 id="recap-title">Vérifiez votre commande</h2>
    <div class="recap"><dl id="recap-list"></dl></div>
    <p class="small muted">Vérifiez vos informations : notre équipe vous appellera à ce numéro pour confirmer la livraison.</p>
    <p class="notice notice--error" id="order-error" hidden>L'envoi n'a pas abouti (connexion internet ?). Réessayez, ou envoyez votre commande sur WhatsApp : <a id="order-wa" href="#" target="_blank" rel="noopener">envoyer sur WhatsApp</a>.</p>
    <div class="modal__actions">
      <button class="btn btn--primary btn--block" type="button" id="order-confirm">{ic("check")} Confirmer ma commande</button>
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
        ("Quel est le délai de livraison ?", "En général 24h à Abidjan et 48 à 72h pour l'intérieur du pays, après confirmation de votre commande par téléphone. <em>[Délais à confirmer]</em>"),
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
<section class="page-hero"><div class="container"><h1>Contactez-nous</h1><p>Une question avant de commander ? Notre équipe vous répond rapidement, 7j/7. <em class="small">[Horaires à confirmer]</em></p></div></section>
<section class="section"><div class="container">
  <div class="grid grid--3 contact-cards">
    <div class="card">{ic("whatsapp")}<h3>WhatsApp</h3><p class="muted">Le moyen le plus rapide pour commander ou poser une question.</p><a class="btn btn--wa" href="#" data-wa>Écrire sur WhatsApp</a></div>
    <div class="card">{ic("phone")}<h3>Téléphone</h3><p class="muted">Appelez-nous de 8h à 20h.</p><a class="btn btn--dark" href="#" data-phone></a></div>
    <div class="card">{ic("heart")}<h3>Réseaux sociaux</h3><p class="muted">Suivez-nous pour les nouveautés et les promos.</p>
      <div class="socials" style="margin-top:0"><a href="#" aria-label="Facebook" style="background:var(--orange);color:#fff">{ic("facebook")}</a><a href="#" aria-label="Instagram" style="background:var(--orange);color:#fff">{ic("instagram")}</a><a href="#" aria-label="TikTok" style="background:var(--orange);color:#fff">{ic("tiktok")}</a></div>
    </div>
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
  <p>Livraison à l'adresse indiquée, partout en Côte d'Ivoire. Délais indicatifs : [24h Abidjan / 48–72h intérieur]. Le livreur contacte le client avant son passage.</p>
  <h3>6. Satisfait ou remboursé</h3>
  <p>[À définir : délai (ex. 7 jours), état du produit, modalités de retour et de remboursement.]</p>
  <h3>7. Réclamations</h3>
  <p>Pour toute réclamation, contactez-nous sur WhatsApp ou par téléphone.</p>
</div></section>
"""
page("mentions-legales.html", "Mentions légales & CGV — BOHFLEX", "Mentions légales et conditions générales de vente BOHFLEX.", legal_body)

print("ok")
