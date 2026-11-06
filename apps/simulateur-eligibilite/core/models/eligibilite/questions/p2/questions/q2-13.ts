// Q2.13 : le départ d'une entrée en établissement, sur la page de branche.
//
// Elle se pose quand une entrée en établissement de santé laisse
// `fait_transfert_article80` absent, ce qui envoie à la caisse : la nature du
// départ dit si l'entrée est simple.

import { Q1_3 } from "../../p1/questions/q1-3.ts";
import { given, question } from "../../question.ts";
import { brancheDecisive } from "../conditions/branche.ts";
import {
  LIEUX_INCOMPATIBLES,
  unConflitDeLieuxApparu,
} from "../conditions/conflit-de-lieux.ts";
import { Q2_1_G } from "./q2-1.ts";
import { Q2_2_1 } from "./q2-2-1.ts";
import { Q2_2_1_A } from "./q2-2-1-a.ts";
import { Q2_2_1_CADRE } from "./q2-2-1-cadre.ts";
import { Q2_5 } from "./q2-5.ts";
import { Q2_6 } from "./q2-6.ts";

const unDepartAPoser = given
  .question(Q2_1_G)
  .answer()
  .is("1_ENTREE")
  .and(given.fait("fait_hospitalisation").isOui())
  .and(given.fait("fait_transfert_article80").isInconnu())
  .and(brancheDecisive);

// La question, avant l'incohérence qui lit sa réponse.
const departDeLEntree = question
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

// Le départ nommé contredit un départ que P2 fixe déjà.
export const Q2_13_DEPART = departDeLEntree.inconsistentWhen(
  unConflitDeLieuxApparu("departDeLEntree", {
    soins: Q1_3,
    sousType: Q2_1_G,
    situations: Q2_2_1,
    sejour: Q2_2_1_CADRE,
    enPermission: Q2_2_1_A,
    transfert: Q2_5,
    contexte: Q2_6,
    departDeLEntree,
  }),
  LIEUX_INCOMPATIBLES,
);
