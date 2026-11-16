// Q3.1.2 : le sens des transports du document. Il ne se propose que s'il
// s'accorde aux rôles que P2 a fixés aux lieux. Une permission demande son
// sens, qu'elle soit seule ou répétée : Q2.8.5 n'en dit aucun (D-284). Un sens
// qualifié avant R2, en Q2.13.sens, ne se redemande pas (#365).

import { unRetourPenitentiaire } from "../../p2/conditions/retour-penitentiaire.ts";
import { Q2_1_G } from "../../p2/questions/q2-1.ts";
import { Q2_6 } from "../../p2/questions/q2-6.ts";
import { Q2_13_SENS } from "../../p2/questions/q2-13.ts";
import { given, question } from "../../question.ts";
import { pmtOuDap, unS3141 } from "../conditions/supports-du-complement.ts";

const sousType = given.question(Q2_1_G).answer();

// Q3.1.2 se pose pour la PMT, la DAP et le S3141.
const unSensAPoser = pmtOuDap.or(unS3141);

// Les rôles que P2 a fixés aux lieux. Une entrée va vers l'établissement. Une
// sortie, une admission en HAD et un retour pénitentiaire en reviennent.
const versLEtablissement = sousType.is("1_ENTREE");
const depuisLEtablissement = versLEtablissement
  .not()
  .and(
    sousType
      .isOneOf("2_SORTIE", "3_ADMISSION_HAD")
      .or(given.question(Q2_6).answer().checked("10_ADMISSION_HAD"))
      .or(unRetourPenitentiaire),
  );

export const Q3_1_2 = question
  .singleChoice("Q3.1.2", "Quel trajet cette prescription doit-elle couvrir ?")
  // Le deuxième point du catalogue de Q3.1. « Aller-retour différent » bloque
  // : une autre simulation traite l'autre sens (TS1001-03).
  .possibleAnswers({
    "1_ALLER": "Aller simple",
    "2_RETOUR": "Retour simple",
    "3_ALLER_RETOUR_EQUIVALENT":
      "Aller-retour identique (même trajet en sens inverse, mêmes conditions de transport)",
    "4_ALLER_RETOUR_DIFFERENT":
      "Aller-retour différent (trajets ou conditions différents à l'aller et au retour)",
  })
  .mattersWhile(unSensAPoser)
  .appliesWhen(given.question(Q2_13_SENS).answer().isMissing())
  // Un sens ne se propose que s'il s'accorde aux rôles fixés en P2. Sans rôle
  // fixé, tous se proposent. Un aller-retour change de motif : il ne se propose
  // pas quand un rôle est fixé.
  .possibleAnswer("1_ALLER", (possibleAnswer) =>
    possibleAnswer.offeredWhen(depuisLEtablissement.not()),
  )
  .possibleAnswer("2_RETOUR", (possibleAnswer) =>
    possibleAnswer.offeredWhen(versLEtablissement.not()),
  )
  .possibleAnswer("3_ALLER_RETOUR_EQUIVALENT", (possibleAnswer) =>
    possibleAnswer.offeredWhen(
      versLEtablissement.or(depuisLEtablissement).not(),
    ),
  )
  .possibleAnswer("4_ALLER_RETOUR_DIFFERENT", (possibleAnswer) =>
    possibleAnswer
      .blocks("Ces deux trajets nécessitent deux simulations distinctes.")
      .offersRestart(),
  );
