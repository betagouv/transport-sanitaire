// Le cadre du séjour en cours, « déjà hospitalisé » coché : un établissement de
// santé ou une Hospitalisation à Domicile (TS1014-B01). Une sortie
// d'établissement (Q2.1.g) dit déjà l'établissement : le cadre ne se demande
// pas alors.

import { given } from "../question.ts";

const unSejourCoche = given
  .question("Q2.2.1")
  .answer()
  .checked("1_HOSPITALISATION");
const uneSortie = given.question("Q2.1.g").answer().is("2_SORTIE");
const cadre = given.question("Q2.2.1.cadre").answer();

/** Q2.2.1.cadre se pose : le séjour est coché, et rien n'en dit le cadre. */
export const unCadreAPoser = unSejourCoche.and(uneSortie.not());

/** Le séjour coché a lieu en Hospitalisation à Domicile. */
export const unSejourEnHad = unSejourCoche.and(cadre.is("2_HAD"));

/** Le séjour coché a lieu dans un établissement de santé. */
export const unSejourEnEtablissement = unSejourCoche.and(
  cadre.is("1_ETABLISSEMENT").or(uneSortie),
);
