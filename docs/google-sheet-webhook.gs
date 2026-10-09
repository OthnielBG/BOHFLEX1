/**
 * BOHFLEX — Réception des commandes dans un Google Sheet
 *
 * Installation :
 * 1. Créez un Google Sheet, puis Extensions > Apps Script.
 * 2. Collez ce code, enregistrez.
 * 3. Déployer > Nouveau déploiement > Type « Application Web »
 *    - Exécuter en tant que : Moi
 *    - Accès : Tout le monde
 * 4. Copiez l'URL obtenue (https://script.google.com/macros/s/.../exec)
 *    dans assets/js/config.js → orderWebhookUrl.
 */
var HEADERS = ["Date", "Réf", "Offre", "Paires", "Prix (FCFA)", "Pointures", "Coloris",
  "Nom", "Téléphone", "Ville / Quartier", "Adresse / repère", "Remarques", "Source", "UTM", "Statut"];

function doPost(e) {
  var sheet = SpreadsheetApp.getActiveSpreadsheet().getSheetByName("Commandes") ||
    SpreadsheetApp.getActiveSpreadsheet().insertSheet("Commandes");
  if (sheet.getLastRow() === 0) sheet.appendRow(HEADERS);
  var o = JSON.parse(e.postData.contents);
  sheet.appendRow([
    new Date(), o.ref, o.offer, o.pairs, o.price, o.sizes, o.color,
    o.name, "'+225 " + o.phone, o.city, o.address, o.notes, o.source, o.utm, "Nouvelle"
  ]);
  return ContentService.createTextOutput(JSON.stringify({ ok: true }))
    .setMimeType(ContentService.MimeType.JSON);
}
