# BOHFLEX — Site web & PWA (prototype v1)

Boutique en ligne des **Semelles Confort BOHFLEX** pour la Côte d'Ivoire : français, FCFA, paiement à la livraison, commande finalisée sur WhatsApp.

Site statique **HTML / CSS / JS**, sans framework ni dépendance : léger, rapide en 3G, et hébergeable partout (Netlify, Vercel, GitHub Pages, o2switch…).

## Voir le site

```bash
python3 -m http.server 8000
# puis ouvrir http://localhost:8000
```

On peut aussi ouvrir `index.html` directement dans le navigateur. Dans ce cas, l'installation en application (PWA) ne fonctionne pas : il faut passer par un serveur, et en ligne il faut du HTTPS.

## Pages

| Fichier | Contenu |
|---|---|
| `index.html` | Accueil : héro avec l'accroche douleur, bénéfices, « Pour qui ? », mécanisme, offres, preuve sociale, réassurance, CTA |
| `produit.html` | Galerie, description, mécanisme, tableau des tailles, choix de l'offre, avis, bouton Commander collant |
| `commander.html` | Formulaire mobile (offre, une pointure par paire, coordonnées), récapitulatif, puis WhatsApp avec le message pré-rempli |
| `suivi.html` | Suivi simple : demande du statut sur WhatsApp à partir du numéro de téléphone |
| `a-propos.html`, `faq.html`, `contact.html` | La marque, questions fréquentes, contact |
| `mentions-legales.html` | Modèle de mentions légales et de CGV, **à compléter** |

## À configurer : `assets/js/config.js`

Tous les réglages sont dans ce fichier :

- `whatsappNumber` : numéro de la closeuse, format `225XXXXXXXXXX`, **à remplacer**
- `phoneDisplay` : numéro affiché sur le site
- `orderWebhookUrl` : URL vers laquelle chaque commande est envoyée (Google Sheet, voir plus bas)
- `metaPixelId` : ID du pixel Meta. Une fois renseigné, le site envoie les événements PageView, ViewContent, InitiateCheckout, Purchase et Contact
- `unitPrice`, `offers` : prix. Le prix barré vaut `unitPrice × nombre de paires`
- `sizes`, `colors` : avec un seul coloris, le champ est masqué
- `deliveredCount` : compteur « déjà X clients livrés », **à remplacer par un chiffre réel**
- `showReviewMarkers` : **mettre `false` avant la mise en ligne** (voir ci-dessous)

- `supabaseUrl`, `supabaseAnonKey`, `univers` : envoient chaque commande dans l'application de gestion (voir ci-dessous)

## Application de gestion (BOLOU and CO)

Le dossier [`gestion/`](gestion/) contient l'application interne : commandes, prospects, stock, livreurs, finances, avec des comptes pour toute l'équipe. Elle est en ligne à l'adresse `/gestion/` du site. Installation et mode d'emploi : [`gestion/README.md`](gestion/README.md).

## Textes santé [À VALIDER]

Les formulations santé du cahier des charges portent la classe CSS `av`. Tant que `showReviewMarkers: true`, elles sont **encadrées en violet avec l'étiquette « À VALIDER »**, ce qui permet de les repérer d'un coup d'œil. Pour toutes les retrouver dans le code : `grep -n 'class="[^"]*av' *.html`.

## Recevoir les commandes dans Google Sheet

1. Suivez les instructions en tête de `docs/google-sheet-webhook.gs`.
2. Collez l'URL `…/exec` obtenue dans `orderWebhookUrl`.

Chaque commande validée crée une ligne : référence, offre, pointures, nom, téléphone, adresse, source et UTM, statut. Si le webhook ne répond pas, la commande part quand même sur WhatsApp.

## Parcours de commande

1. Le client choisit son offre. Le lien `commander.html?offre=2` ou `?offre=3` la pré-sélectionne, ce qui sert aussi pour les liens des publicités.
2. Il choisit une pointure par paire et saisit ses coordonnées. Le numéro est vérifié (10 chiffres, avec ou sans +225).
3. Un récapitulatif s'affiche, puis le bouton **« Confirmer sur WhatsApp »** ouvre `wa.me` avec la commande pré-remplie et sa référence `BHF-AAMMJJ-XXXX`.
4. La commande part vers le webhook, et les coordonnées sont mémorisées sur le téléphone : à la commande suivante, le formulaire est déjà rempli.

## Application (PWA)

`manifest.webmanifest` et `sw.js` rendent le site installable sur l'écran d'accueil d'Android (bannière « Installer l'app ») et d'iPhone (Partager → Sur l'écran d'accueil). Les pages déjà visitées restent disponibles hors connexion.

Pour une app native plus tard (React Native ou Flutter), le même parcours pourra être repris.

## Remplacer les contenus de démonstration

- **Images** : les blocs hachurés orange (`<div class="ph">Photo : …</div>`) sont des emplacements à remplacer par vos photos, par exemple `<img src="assets/img/xxx.webp" alt="…" loading="lazy">`. Exportez-les en WebP de moins de 150 Ko. `assets/img/semelle.svg` est une illustration provisoire du produit.
- **Avis** : ce sont des exemples, étiquetés « Avis de démonstration ». **Remplacez-les par de vrais avis clients** (avec leur accord) avant la mise en ligne. La note 4,8 est fictive elle aussi.
- **Délais de livraison, horaires, entretien, conditions du « satisfait ou remboursé »** : ces informations sont signalées « à confirmer » dans la FAQ et les CGV.

## Modifier les pages

Les fichiers HTML sont générés par `tools/build_pages.py`, qui contient l'en-tête, le pied de page et le contenu. Deux façons de faire :

- **Petite retouche** : modifiez directement le fichier `.html`.
- **Changement sur toutes les pages** (menu, pied de page…) : modifiez `tools/build_pages.py`, puis lancez `python3 tools/build_pages.py .`. Attention, cela écrase les retouches faites à la main dans les `.html`.

## Hors périmètre v1 (prévu)

Paiement Mobile Money (Wave, Orange Money, MTN, Moov), compte client, fidélité, multi-langue, apps dans les stores, suivi de commande automatique. (Le stock, les commandes et les relances sont gérés dans l'application `gestion/`.)
