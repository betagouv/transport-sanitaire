// Q2.5 : le transfert entre établissements, distingué d'un autre déplacement
// pendant l'hospitalisation (D-106). Q2.1 = 9 les regroupe, et Q2.2.1.a écarte
// la permission sans dire de quel déplacement il s'agit. Les faits du
// transfert vivent sous `faits/`.

import { given, question } from "../../question.ts";
import {
  TRANSFERT_VERS_LA_PRISON,
  unRetourPenitentiaire,
} from "../conditions/retour-penitentiaire.ts";

// Une sortie d'hospitalisation vers la prison, hors permission, est définitive
// (TS1012-04).
const uneSortieVersLaPrison = unRetourPenitentiaire
  .and(given.question("Q2.1.g").answer().is("2_SORTIE"))
  .and(given.question("Q2.2.1.a").answer().is("1_OUI").not());

// Q2.5 se pose : Q2.1 dit un transfert, ou Q2.2.1.a écarte la permission, un
// déplacement pendant l'hospitalisation au type à préciser. Une sortie
// définitive vers la prison n'en est pas un.
const unTransfertAPoser = given
  .question("Q2.1")
  .answer()
  .is("9_TRANSFERT")
  .or(given.question("Q2.2.1.a").answer().is("2_NON"))
  .and(uneSortieVersLaPrison.not());

// Un transfert entre établissements ne mène pas à une prison.
const unTransfertVersLaPrison = given
  .question("Q2.5")
  .answer()
  .is("1_TRANSFERT")
  .and(unRetourPenitentiaire);

export const Q2_5 = question
  .singleChoice(
    "Q2.5",
    "Quel type de déplacement le patient doit-il effectuer ?",
  )
  .appliesWhen(unTransfertAPoser)
  .inconsistentWhen(unTransfertVersLaPrison, TRANSFERT_VERS_LA_PRISON);
