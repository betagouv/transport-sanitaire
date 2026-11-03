// Q2.13 : le départ d'une entrée en établissement, sur la page de branche.
//
// Elle se pose quand une entrée en établissement de santé laisse
// `fait_transfert_article80` absent, ce qui envoie à la caisse : la nature du
// départ dit si l'entrée est simple.

import { given, question } from "../../question.ts";
import { brancheDecisive } from "../conditions/branche.ts";
import { Q2_1_G } from "./q2-1.ts";

const unDepartAPoser = given
  .question(Q2_1_G)
  .answer()
  .is("1_ENTREE")
  .and(given.fait("fait_hospitalisation").isOui())
  .and(given.fait("fait_transfert_article80").isInconnu())
  .and(brancheDecisive);

export const Q2_13_DEPART = question
  .singleChoice("Q2.13.depart", "Le patient devra effectuer son départ depuis…")
  // Les libellés sont ceux de WORDING-07 et WORDING-P2-04 (v10.1.4), sigles
  // après leur libellé.
  .options({
    "1_DOMICILE": "Son domicile ou un autre lieu de vie",
    "2_ETABLISSEMENT_DE_SANTE": "Un établissement de santé.",
    "3_EHPAD":
      "Un Établissement d'Hébergement pour Personnes Âgées Dépendantes (EHPAD).",
    "4_USLD": "Une Unité de Soins de Longue Durée (USLD).",
    "5_HEBERGEMENT_NON_MEDICALISE": "Un hébergement temporaire non médicalisé.",
    "6_ETABLISSEMENT_PENITENTIAIRE": "Un établissement pénitentiaire.",
    "7_AUTRE_LIEU": "Un autre lieu.",
  })
  .mattersWhile(unDepartAPoser);
