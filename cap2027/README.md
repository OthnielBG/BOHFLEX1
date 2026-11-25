# Cap 2027 — ma vie organisée

Application personnelle (PWA) pour piloter 2027 : objectifs, to-do et routines, agenda, voyages pour voir mon fils, budget, épargne et investissements, avec rappels.

HTML / CSS / JS sans dépendance. **Les données restent sur l'appareil** (localStorage). Rien n'est envoyé sur internet.

## Lancer

```bash
cd cap2027
python3 -m http.server 8000   # puis http://localhost:8000
```

Pour l'avoir sur le téléphone, il faut la mettre en ligne en HTTPS (GitHub Pages, Netlify…), l'ouvrir, puis :
- **Android / Chrome** : menu ⋮ → « Installer l'application »
- **iPhone / Safari** : Partager → « Sur l'écran d'accueil » (obligatoire sur iPhone pour les notifications)

## Modules

| Onglet | Contenu |
|---|---|
| Jour | Compte à rebours ou avancement de 2027, alertes, tâches et événements du jour, résumé financier du mois, prochain voyage, objectifs les moins avancés |
| Tâches | To-do par jour, tâches en retard, tâches sans date, **routines** (quotidiennes, en semaine, hebdo, mensuelles) avec séries 🔥 |
| Agenda | Calendrier mensuel (événements, tâches, voyages, échéances) et vue **année 2027** mois par mois |
| Objectifs | Objectifs 2027 par domaine (études, alternance, finances, famille, perso, santé), mesurés par étapes, par compteur ou par le solde d'un compte |
| Voyages | Dates, transport et logement (réservé ou non), coûts, checklist, budget annuel et montant à mettre de côté chaque mois |
| Argent | **Mois** : revenus, dépenses, épargne, reste, budgets par catégorie, revenus et charges fixes à cocher. **Épargne** : patrimoine, courbe, matelas de précaution, comptes (livret, PEA, AV, crypto…) avec versements et +/- values. **Budget** : mois type, reste à vivre, règle 50/30/20 |
| Réglages | Prénom, heure du résumé du matin, thème, notifications, export agenda `.ics`, sauvegarde et import JSON |

## Rappels

Notifications du navigateur : résumé du matin, tâches à l'heure prévue, événements (de 15 min à 1 semaine avant), versements d'épargne et prélèvements le jour J, voyages encore non réservés (45 jours avant pour le transport, 30 jours pour le logement), veille de départ.

Limite d'une appli web sans serveur : ces rappels partent quand l'appli est ouverte ou récemment utilisée. Pour des alarmes fiables même téléphone verrouillé : **Réglages → Télécharger cap2027.ics**, puis importer le fichier dans Google Agenda ou Calendrier iPhone. Tous les rappels (routines, versements, charges, voyages, échéances) y deviennent des alarmes. Il faut réexporter après des changements importants.

## Sauvegarde

Réglages → Exporter (JSON). Il faut faire une sauvegarde régulièrement et avant de changer de téléphone ou de vider les données du navigateur.
