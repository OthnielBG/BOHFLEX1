# BOLOU and CO — Application de gestion

L'application interne de l'entreprise, pour les deux activités :

- **Passion** : sacoches homme
- **Bien-être** : semelles BOHFLEX

Elle couvre les **commandes**, les **prospects et clients**, le **stock**, les **livreurs et leurs encaissements** et les **finances** (bénéfice par produit, publicité, ROAS). Chaque membre de l'équipe a son compte et ne voit que ce qui le concerne.

Elle s'installe sur le téléphone comme une application (Android : menu ⋮ puis « Installer l'application » ; iPhone : Partager puis « Sur l'écran d'accueil »), et s'utilise aussi sur ordinateur.

---

## Installation (une seule fois, environ 15 minutes)

### 1. Créer la base de données Supabase (gratuit)

1. Allez sur **https://supabase.com** puis **Start your project**, et créez un compte (avec GitHub ou un e-mail).
2. Cliquez sur **New project** :
   - Name : `bolou-and-co`
   - Database password : cliquez sur **Generate** et **gardez-le précieusement**
   - Region : **West EU (Paris)**, la plus proche de la Côte d'Ivoire
3. Attendez environ 2 minutes que le projet soit prêt.

### 2. Créer les tables

1. Dans le menu de gauche, ouvrez **SQL Editor**, puis **New query**.
2. Ouvrez le fichier [`supabase/schema.sql`](supabase/schema.sql), copiez **tout** son contenu et collez-le.
3. Cliquez sur **Run**. Le message doit être « Success. No rows returned ».

Le script peut être relancé sans risque (par exemple après une mise à jour de l'application) : il n'efface aucune donnée.

### 3. Régler la connexion

Dans **Authentication** puis **URL Configuration** :

- **Site URL** : l'adresse où l'application sera en ligne, par exemple `https://votre-site.com/gestion/`
- **Redirect URLs** : ajoutez la même adresse

Ces réglages servent aux liens envoyés par e-mail : confirmation de compte et mot de passe oublié.

> Conseil : dans **Authentication** puis **Sign In / Providers** puis **Email**, vous pouvez désactiver « Confirm email » si votre équipe n'a pas l'habitude des e-mails. Personne n'entre de toute façon sans que vous ayez validé le compte (étape 6).

### 4. Relier l'application à la base

1. Dans Supabase, ouvrez **Project Settings** puis **API** (ou **Data API**). Copiez :
   - **Project URL**
   - la clé **anon public**. Ne prenez **jamais** la clé `service_role`.
2. Collez ces deux valeurs dans [`config.js`](config.js) :

```js
supabaseUrl: "https://xxxxxxxx.supabase.co",
supabaseAnonKey: "eyJhbGciOi...",
```

La clé « anon » peut être publique : c'est la base qui vérifie, à chaque action, qui a le droit de faire quoi.

### 5. Mettre l'application en ligne

Le dossier `gestion/` fait partie du site. Une fois le site publié (Netlify, Vercel, GitHub Pages, o2switch…), l'application est disponible à l'adresse **`https://votre-site.com/gestion/`**.

Elle n'est pas référencée sur Google, et rien n'est visible sans compte validé.

Pour l'essayer sur votre ordinateur :

```bash
python3 -m http.server 8000
```

Ouvrez ensuite http://localhost:8000/gestion/ (pensez à ajouter cette adresse dans les Redirect URLs de l'étape 3).

### 6. Créer les comptes

1. **Vous en premier** : ouvrez l'application, puis **Créer un compte**. **Le tout premier compte devient automatiquement gérant.**
2. Chaque membre de l'équipe crée ensuite son compte de la même façon. Il voit « Compte en attente » tant que vous ne l'avez pas validé.
3. Dans **Équipe**, choisissez le rôle de chaque membre, cochez **Actif**, puis cliquez sur **Enregistrer**.

| Rôle | Ce qu'il voit et fait |
|---|---|
| **Gérant / associé** | Tout : commandes, prospects, stock, livreurs, finances, équipe |
| **Closeuse** | Commandes et prospects : saisir, confirmer, relancer, envoyer en livraison. Elle ne voit **ni les coûts d'achat, ni les marges, ni les finances** |
| **Livreur** | Uniquement **ses** livraisons : appeler le client, marquer « Livrée » (avec le montant encaissé) ou « Retour » ; il voit aussi ce qu'il doit reverser |
| **Gestionnaire de stock** | Produits, entrées de stock, inventaires ; il consulte les commandes |

Pour retirer l'accès à quelqu'un, décochez **Actif**.

### 6 bis. Mise à jour n°3 : photos, closeuse par activité, catalogue sacoches

Si l'application était déjà installée avant cette mise à jour, ouvrez **SQL Editor**, puis **New query**. Collez tout le fichier [`supabase/maj-03.sql`](supabase/maj-03.sql) et cliquez sur **Run**. Ce fichier :
- active les photos ;
- permet de réserver une closeuse à une activité ;
- crée les 5 sacoches avec leur photo et leur prix.

Pour une nouvelle installation, tout cela est déjà inclus dans `schema.sql`. Le fichier `maj-02-photos.sql` n'est plus à utiliser.

**Une closeuse par activité** : dans **Équipe**, choisissez le rôle « Closeuse », puis son activité :
- **Sacoches uniquement** ;
- **Semelles uniquement** ;
- **Les deux activités**.

Une closeuse réservée à une activité ne voit que les commandes, les prospects et les relances de cette activité. La base de données le garantit elle-même. Ses formulaires sont pré-réglés sur son activité.

### 6 ter. Notifications sur les téléphones (même application fermée)

Sur téléphone, une page web est mise en pause dès qu'elle passe en arrière-plan. Pour que la closeuse soit prévenue d'une commande du site **même application fermée ou écran verrouillé**, il faut deux étapes, à faire une seule fois.

**1. La base de données.** Dans **SQL Editor**, ouvrez une **New query** (une requête « Database », pas « Logs »). Collez tout le fichier [`supabase/maj-04-notifications.sql`](supabase/maj-04-notifications.sql) et cliquez sur **Run**.

**2. La fonction d'envoi.**
1. Dans Supabase, ouvrez **Edge Functions**, puis **Deploy a new function** (ou « Create a function »), puis **Via Editor**.
2. Nom de la fonction : **`notify-order`**. C'est important : exactement ce nom.
3. Effacez le code d'exemple et collez tout le fichier [`supabase/functions/notify-order/index.ts`](supabase/functions/notify-order/index.ts). Cliquez sur **Deploy**.
4. Dans les réglages de la fonction (**Details** ou **Settings**), **désactivez « Verify JWT »**, puis enregistrez. Sans cette étape, l'application ne peut pas inscrire les téléphones.

Il n'y a aucune clé à créer : la fonction fabrique ses propres clés au premier usage, et elles restent illisibles depuis l'application.

**3. Sur chaque téléphone** (gérant et closeuses) :
- Ouvrez **Mon compte**, puis **Notifications des commandes**, puis **Activer sur ce téléphone**, et acceptez.
- Touchez **Envoyer un test**. Une notification doit arriver en quelques secondes.
- **iPhone** : il faut iOS 16.4 ou plus récent. Installez d'abord l'application sur l'écran d'accueil (Safari, puis Partager, puis Sur l'écran d'accueil), ouvrez-la **depuis son icône**, puis activez.
- **Android** : sur certains téléphones (Samsung, Xiaomi, Tecno, Infinix…), autorisez aussi Chrome à fonctionner en arrière-plan : Réglages, puis Batterie, puis Chrome, puis Sans restriction.

Seules les commandes **du site** déclenchent une notification. Le gérant reçoit tout. Une closeuse ne reçoit que son activité. Le livreur ne reçoit rien. À la déconnexion, le téléphone cesse de recevoir les alertes du compte quitté.

### 7. Ajouter vos produits

- **Semelles** : le produit « Semelle BOHFLEX » est déjà créé, avec les pointures 35/36 à 45/46 et les offres **2 paires (6 500 F)** et **3 paires (7 500 F)**. Dans **Stock** puis **Modifier**, indiquez le **coût d'achat** d'une paire.
- **Photos** : dans **Stock**, ouvrez un produit avec le bouton crayon, puis **Ajouter une photo**. Pour les sacoches, touchez la vignette de chaque couleur pour lui donner sa propre photo. Les photos apparaissent ensuite sur chaque commande. Elles sont réduites automatiquement avant l'envoi, ce qui les rend légères en 3G.
- **Sacoches** : les 5 modèles (Tommy Hilfiger, Zara, Lacoste à 15 000 F ; Ranger antivol et Milan à 12 500 F) sont créés par la mise à jour n°3, en couleur unique. Indiquez leur **coût d'achat** et leur stock. Pour un nouveau modèle, dans **Stock**, cliquez sur **+ Produit** pour chaque modèle (par exemple « Sacoche bandoulière cuir »), avec son prix de vente, son coût d'achat et ses couleurs (une par ligne).
- Ajoutez ensuite les quantités réelles avec **+ Entrée de stock**.

> **Coût d'achat** = prix fournisseur + transport + douane, divisé par le nombre de pièces. C'est lui qui permet de calculer votre vrai bénéfice.

### 8. Recevoir les commandes du site

Dans [`../assets/js/config.js`](../assets/js/config.js), renseignez les mêmes valeurs qu'à l'étape 4 :

```js
supabaseUrl: "https://xxxxxxxx.supabase.co",
supabaseAnonKey: "eyJhbGciOi...",
univers: "bienetre",
```

Chaque commande validée sur le site arrive alors **dans « Commandes », onglet « À confirmer »**, avec ses pointures, et le client est ajouté aux prospects. L'envoi sur WhatsApp et vers le Google Sheet continue de fonctionner comme avant.

Le futur site des sacoches se branchera de la même façon, avec `univers: "passion"`.

---

## Utilisation au quotidien

### Le parcours d'une commande

```
Nouvelle ──► Confirmée ──► En livraison ──► Livrée
   │             │               └────────► Retour
   └► Injoignable └► Annulée
```

1. **Nouvelle** : la commande arrive du site, ou la closeuse la saisit depuis WhatsApp ou une messagerie (**+ Nouvelle commande**). Pour les semelles, cliquez sur « 2 paires » ou « 3 paires », puis choisissez une pointure par paire.
2. **Confirmée** : la closeuse a eu le client au téléphone. Le bouton **WhatsApp** envoie un message de confirmation déjà rédigé.
3. **En livraison** : on choisit le livreur, ses frais et la date. **Le stock baisse automatiquement à ce moment-là.**
4. **Livrée** : le livreur, ou la closeuse, indique le montant encaissé.
5. **Retour** ou **Annulée** : **le stock est remis automatiquement**.

**Expédition vers l'intérieur du pays** : choisissez « Expédition intérieur » et indiquez l'avance reçue par Mobile Money. Le livreur ou le transporteur n'encaisse alors que le reste.

### Commandes du site : plus besoin de WhatsApp

Sur le site, le client remplit le formulaire, vérifie sa commande et touche **« Confirmer ma commande »**. La commande part **directement dans l'application**, onglet **À confirmer**. Le client voit alors : « Votre commande est bien enregistrée, notre équipe vous appelle très bientôt ». Il n'a plus de message WhatsApp à envoyer. WhatsApp ne lui est proposé qu'en secours, si l'envoi échoue (pas de connexion, par exemple).

**Alerte de la closeuse** : à chaque nouvelle commande du site, son téléphone joue un son et vibre, et une bannière s'affiche. Son bouton **Voir** ouvre directement la fiche. Elle ne voit que les commandes de son activité.
- La première fois, elle touche **« Activer »** dans le bandeau bleu de « Ma journée » et accepte les notifications. Le téléphone affiche alors aussi une notification système quand l'application est en arrière-plan.
- Pour l'instant, l'alerte fonctionne quand l'application est **ouverte**, même en arrière-plan. Si l'application est complètement fermée, la commande attend dans « À confirmer », avec une pastille rouge sur l'onglet Commandes.

### Vue closeuse : « Ma journée »

C'est l'écran d'accueil de la closeuse. En haut, les compteurs du jour : à confirmer, injoignables, relances, confirmées aujourd'hui. En dessous, la file des commandes à confirmer, **la plus ancienne en premier**. Sur chaque commande, des boutons directs évitent d'ouvrir la fiche :

- **Appeler** et **WhatsApp** (avec un message déjà rédigé) ;
- **Injoignable** : la commande passe en « injoignable », il reste à envoyer un WhatsApp au client ;
- **Confirmer** : propose ensuite d'envoyer le récapitulatif au client et de choisir le livreur.

**Saisir une commande reçue sur WhatsApp** (clients venus des **publicités WhatsApp**) : touchez le bouton **+**, puis **Coller un message WhatsApp**. Le nom, le numéro, la ville, l'adresse, l'offre (2 ou 3 paires) et les pointures se remplissent tout seuls. Si le message vient du site (il contient « Réf : BHF-… ») et que la commande est déjà arrivée, l'application le signale pour éviter un doublon. Les pointures et couleurs se choisissent d'un toucher, avec le stock restant affiché.

### Prospects

Toute personne qui a contacté une des deux marques y figure, quelle que soit la source : WhatsApp, site, Facebook, TikTok… Les étapes sont :

**Nouveau contact → Intéressé → Panier non confirmé → Client**, ou **Perdu**.

- Les clients ajoutés par les commandes passent automatiquement en « Panier non confirmé », puis en « Client » à la première livraison.
- **Anciens clients** : clients sans commande depuis 45 jours, à relancer pour un rachat ou pour l'autre produit.
- L'onglet **À relancer** liste les relances du jour et celles en retard. Après chaque relance, cliquez sur **1 jour / 3 jours / 1 semaine** pour programmer la suivante. Le bouton **WhatsApp** prépare un message adapté à l'étape.

### Livreurs et encaissements

Le menu **Livreurs** montre, pour chaque livreur :

- son taux de livraison ;
- l'argent encaissé ;
- ses frais ;
- ce qu'il a déjà reversé ;
- **ce qu'il doit encore**.

> **Dû = encaissé − frais de livraison (que le livreur garde) − versements reçus**

Quand un livreur vous remet de l'argent (en espèces, Wave, Orange Money…), cliquez sur **Versement reçu**.

### Finances

Pour chaque mois, et séparément pour les sacoches, les semelles et les dépenses communes :

| Ligne | Calcul |
|---|---|
| Chiffre d'affaires | Commandes **livrées** dans le mois |
| Coût d'achat des produits vendus | Coût d'achat × quantités livrées |
| Marge brute | CA − coût d'achat |
| Livraison & transport | Frais des livreurs (livraisons et retours) + dépenses « transport » |
| Publicité | Dépenses Meta, TikTok et autres pubs |
| **Bénéfice net** | Marge brute − livraison − pub − autres dépenses |

Les indicateurs affichés sont le **ROAS** (CA ÷ pub), le **coût pub par commande livrée**, le **taux de confirmation** et le **taux de livraison**.

> **Saisissez vos dépenses pub chaque semaine** (**+ Dépense**), sinon le ROAS et le bénéfice seront faux.

Les **achats de marchandise** apparaissent à part (trésorerie). Ils ne sont pas retirés du bénéfice, car ils y sont déjà comptés via le coût d'achat des produits vendus.

---

## Bon à savoir

- **Temps réel** : quand quelqu'un modifie une commande, les écrans des autres se mettent à jour tout seuls.
- **Sauvegardes** : les boutons **Exporter (CSV)** des pages Commandes et Prospects donnent un fichier qui s'ouvre dans Excel ou Google Sheets. Faites-en un chaque mois.
- **Projet gratuit Supabase** : il se met en pause après 7 jours **sans aucune utilisation**. Si cela arrive, connectez-vous à supabase.com et cliquez sur « Restore ». Avec une utilisation quotidienne, cela n'arrive pas.
- **Sécurité** : les droits (qui voit quoi) sont vérifiés par la base de données elle-même, pas seulement par l'écran. Une closeuse ne peut donc pas voir les coûts, même en bricolant.

## Fichiers

| Fichier | Rôle |
|---|---|
| `index.html`, `app.js`, `app.css` | L'application |
| `config.js` | Adresse et clé publique de votre projet Supabase |
| `supabase/schema.sql` | Tables, règles de sécurité et automatismes (stock, soldes livreurs…) |
| `manifest.webmanifest`, `sw.js` | Installation sur téléphone |

## Prévu pour la V2

- Le site des sacoches branché comme celui des semelles
- Des modèles de messages WhatsApp modifiables
- L'export comptable
- La récupération automatique des dépenses pub Meta
