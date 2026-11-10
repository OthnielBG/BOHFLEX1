/* ==========================================================================
   BOHFLEX — Configuration centrale
   Modifiez ce fichier pour changer le numéro WhatsApp, les prix, etc.
   ========================================================================== */
window.BOHFLEX_CONFIG = {
  // Numéro WhatsApp de la closeuse, format international SANS "+" ni espaces.
  // Exemple Côte d'Ivoire : 225 + 10 chiffres → "2250700000000"
  whatsappNumber: "2250700000000", // [À REMPLACER]

  // Numéro affiché sur le site (format lisible)
  phoneDisplay: "+225 07 00 00 00 00", // [À REMPLACER]

  // URL du webhook (Google Apps Script / Make / Zapier...). Laisser vide pour désactiver.
  // Voir docs/google-sheet-webhook.gs pour un exemple prêt à l'emploi.
  orderWebhookUrl: "",

  // Application de gestion BOLOU and CO (Supabase) : chaque commande y arrive dans « À confirmer ».
  // Valeurs à copier depuis l'application (Équipe > Recevoir les commandes d'un site). Laisser vide pour désactiver.
  supabaseUrl: "",
  supabaseAnonKey: "",
  univers: "bienetre", // "bienetre" (semelles) ou "passion" (sacoches)

  // ID du pixel Meta (Facebook). Laisser vide pour désactiver.
  metaPixelId: "",

  // Prix unitaire de référence (sert au prix barré / ancrage)
  unitPrice: 4500, // [À VALIDER]

  // Offres disponibles
  offers: [
    { id: "2", pairs: 2, price: 6500, label: "2 paires", badge: "" },
    { id: "3", pairs: 3, price: 7500, label: "3 paires", badge: "Le plus avantageux" }
  ],
  defaultOffer: "3",

  // Pointures (la semelle se découpe suivant la pointure exacte)
  sizes: ["35/36", "37/38", "39/40", "41/42", "43/44", "45/46"],

  // Coloris : si un seul coloris, le champ est masqué dans le formulaire
  colors: ["Orange / Noir"],

  // Compteur de preuve sociale [À REMPLACER par un chiffre réel]
  deliveredCount: "1 000",

  // Surligne les textes santé marqués [À VALIDER] (mettre false avant mise en ligne)
  showReviewMarkers: true
};
