// Q2.13 : les lieux du trajet encore nécessaires, sur la page de branche.
//
// Q2.13.depart se pose quand une entrée en établissement de santé laisse
// `fait_transfert_article80` absent, ce qui envoie à la caisse : la nature du
// départ dit si l'entrée est simple.
//
// Q2.13.sens se pose quand le sens change la cohérence des lieux et qu'aucune
// réponse ne l'établit (détail 8 de Q2.13, QST-LIEUX-CONFLIT-CERTAIN-20261106,
// #365). Un sens seulement documentaire reste à P3 : Q3.1.2.

import { Q1_3 } from "../../p1/questions/q1-3.ts";
import { given, question } from "../../question.ts";
import { brancheDecisive } from "../conditions/branche.ts";
import {
  incoherenceDeLieux,
  unSensQuiChangeLesLieux,
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

// Les réponses de P2 dont les lieux se tirent, avant celles de Q2.13.
const LIEUX_DE_P2 = {
  soins: Q1_3,
  sousType: Q2_1_G,
  situations: Q2_2_1,
  sejour: Q2_2_1_CADRE,
  enPermission: Q2_2_1_A,
  transfert: Q2_5,
  contexte: Q2_6,
} as const;

// Le départ nommé contredit un départ que P2 fixe déjà.
export const Q2_13_DEPART = departDeLEntree.inconsistentWhen(
  ...incoherenceDeLieux("departDeLEntree", {
    ...LIEUX_DE_P2,
    departDeLEntree,
  }),
);

// La question, avant l'incohérence qui lit sa réponse. Les libellés sont ceux
// du sous-champ `sens` de Q2.13 (`REFERENTIEL/02`), mot pour mot.
const trajetEvalue = question
  .singleChoice(
    "Q2.13.sens",
    "Quel trajet évaluez-vous dans cette simulation ?",
  )
  .options({
    "1_ALLER": "L’aller vers le lieu de soins, de séjour ou de permission.",
    "2_RETOUR": "Le retour depuis ce lieu.",
    "3_ALLER_RETOUR_EQUIVALENT":
      "L’aller et le retour avec les mêmes besoins et les mêmes règles.",
    "4_ALLER_RETOUR_DIFFERENT":
      "L’aller et le retour avec des besoins ou des règles différents.",
  })
  .appliesWhen(
    unSensQuiChangeLesLieux({ ...LIEUX_DE_P2, departDeLEntree: Q2_13_DEPART }),
  )
  .option("4_ALLER_RETOUR_DIFFERENT", (option) =>
    option.blocks("Ces deux trajets nécessitent deux simulations distinctes."),
  );

// Le sens choisi rend certain le conflit qu'il crée.
export const Q2_13_SENS = trajetEvalue.inconsistentWhen(
  ...incoherenceDeLieux("trajetEvalue", {
    ...LIEUX_DE_P2,
    departDeLEntree: Q2_13_DEPART,
    trajetEvalue,
  }),
);
