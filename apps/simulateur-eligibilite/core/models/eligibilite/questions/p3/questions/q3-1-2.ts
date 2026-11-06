// Q3.1.2 : le sens des transports du document. Il ne se propose que s'il
// s'accorde aux rôles que P2 a fixés aux lieux. Une seule permission demande
// son sens, plusieurs ne demandent que leur nombre mensuel (D-120, D-246).

import { unRetourPenitentiaire } from "../../p2/conditions/retour-penitentiaire.ts";
import { Q2_1_G } from "../../p2/questions/q2-1.ts";
import { Q2_6 } from "../../p2/questions/q2-6.ts";
import { Q2_8_5 } from "../../p2/questions/q2-8-5.ts";
import { given, question } from "../../question.ts";
import { pmtOuDap, unS3141 } from "../conditions/supports-du-complement.ts";

const unePermissionRepetee = given.question(Q2_8_5).answer().is("1_OUI");
const sousType = given.question(Q2_1_G).answer();

// Q3.1.2 se pose pour la PMT, la DAP, et le S3141 d'une seule permission.
const unSensAPoser = pmtOuDap.or(unS3141.and(unePermissionRepetee.not()));

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
  .options({
    "1_ALLER": "Aller simple",
    "2_RETOUR": "Retour simple",
    "3_ALLER_RETOUR_EQUIVALENT":
      "Aller-retour identique (même trajet en sens inverse, mêmes conditions de transport)",
    "4_ALLER_RETOUR_DIFFERENT":
      "Aller-retour différent (trajets ou conditions différents à l'aller et au retour)",
  })
  .mattersWhile(unSensAPoser)
  // Un sens ne se propose que s'il s'accorde aux rôles fixés en P2. Sans rôle
  // fixé, tous se proposent. Un aller-retour change de motif : il ne se propose
  // pas quand un rôle est fixé.
  .option("1_ALLER", (option) => option.offeredWhen(depuisLEtablissement.not()))
  .option("2_RETOUR", (option) => option.offeredWhen(versLEtablissement.not()))
  .option("3_ALLER_RETOUR_EQUIVALENT", (option) =>
    option.offeredWhen(versLEtablissement.or(depuisLEtablissement).not()),
  )
  .option("4_ALLER_RETOUR_DIFFERENT", (option) =>
    option.blocks("Ces deux trajets nécessitent deux simulations distinctes."),
  );
