// Q2.5 : le transfert entre établissements, distingué d'un autre déplacement
// pendant l'hospitalisation (D-106). Q2.1 = 9 les regroupe, et Q2.2.1.a écarte
// la permission sans dire de quel déplacement il s'agit. Les faits du
// transfert vivent sous `faits/`.

import { Q1_3 } from "../../p1/questions/q1-3.ts";
import { given, question } from "../../question.ts";
import { incoherenceDeLieux } from "../conditions/conflit-de-lieux.ts";
import {
  TRANSFERT_VERS_LA_PRISON,
  unRetourPenitentiaire,
} from "../conditions/retour-penitentiaire.ts";
import { Q2_1, Q2_1_G } from "./q2-1.ts";
import { Q2_2_1 } from "./q2-2-1.ts";
import { Q2_2_1_A } from "./q2-2-1-a.ts";
import { Q2_2_1_CADRE } from "./q2-2-1-cadre.ts";

// La question, avant les règles qui lisent sa réponse.
const declaree = question
  .singleChoice(
    "Q2.5",
    "Quel type de déplacement le patient doit-il effectuer ?",
  )
  .options({
    "1_TRANSFERT": "Un transfert entre établissements.",
    "2_AUTRE_DEPLACEMENT": "Autre déplacement",
  });

// Une sortie d'hospitalisation vers la prison, hors permission, est définitive
// (TS1012-04).
const uneSortieVersLaPrison = unRetourPenitentiaire
  .and(given.question(Q2_1_G).answer().is("2_SORTIE"))
  .and(given.question(Q2_2_1_A).answer().is("1_OUI").not());

// Q2.5 se pose : Q2.1 dit un transfert, ou Q2.2.1.a écarte la permission, un
// déplacement pendant l'hospitalisation au type à préciser. Une sortie
// définitive vers la prison n'en est pas un.
const unTransfertAPoser = given
  .question(Q2_1)
  .answer()
  .is("9_TRANSFERT")
  .or(given.question(Q2_2_1_A).answer().is("2_NON"))
  .and(uneSortieVersLaPrison.not());

// Un transfert entre établissements ne mène pas à une prison.
const unTransfertVersLaPrison = given
  .question(declaree)
  .answer()
  .is("1_TRANSFERT")
  .and(unRetourPenitentiaire);

export const Q2_5 = declaree
  .appliesWhen(unTransfertAPoser)
  .inconsistentWhen(unTransfertVersLaPrison, TRANSFERT_VERS_LA_PRISON)
  // Un autre déplacement part du séjour, ou y revient.
  .inconsistentWhen(
    ...incoherenceDeLieux("transfert", {
      soins: Q1_3,
      motif: Q2_1,
      sousType: Q2_1_G,
      situations: Q2_2_1,
      sejour: Q2_2_1_CADRE,
      enPermission: Q2_2_1_A,
      transfert: declaree,
    }),
  );
