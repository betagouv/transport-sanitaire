// Aplatit un cerfa rempli : il n'y reste aucun champ (D-84).
//
// Chaque champ devient le dessin de sa valeur, sur la page. Le PDF s'imprime
// tel quel, et rien ne s'y corrige plus dans un lecteur : une correction passe
// par une nouvelle simulation.

import { PDFDocument } from "pdf-lib";

/** Le PDF rempli `pdf`, sans aucun champ. */
export async function flattenCerfa(pdf: Uint8Array): Promise<Uint8Array> {
  const document = await PDFDocument.load(pdf);
  document.getForm().flatten();
  return document.save();
}
