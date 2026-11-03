// Q3.1.2 : le sens des transports du document. Il ne se propose que s'il
// s'accorde aux rôles que P2 a fixés aux lieux. Une seule permission demande
// son sens, plusieurs ne demandent que leur nombre mensuel (D-120, D-246).

import type { Condition } from "../../../../../socle/index.ts";
import type { Questions } from "../../catalogue/catalogue.ts";
import { unRetourPenitentiaire } from "../../p2/conditions/retour-penitentiaire.ts";
import { given, question } from "../../question.ts";
import { pmtOuDap, unS3141 } from "../conditions/supports-du-complement.ts";

type Sens = Questions["Q3.1.2"];

const unePermissionRepetee = given.question("Q2.8.5").answer().is("1_OUI");
const sousType = given.question("Q2.1.g").answer();

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
      .or(given.question("Q2.6").answer().checked("10_ADMISSION_HAD"))
      .or(unRetourPenitentiaire),
  );

// Quand un sens se propose, vu les rôles fixés en P2. Sans rôle fixé, tous se
// proposent. Un aller-retour change de motif : il ne se propose pas quand un
// rôle est fixé.
const SENS_COMPATIBLES = {
  "1_ALLER": depuisLEtablissement.not(),
  "2_RETOUR": versLEtablissement.not(),
  "3_ALLER_RETOUR_EQUIVALENT": versLEtablissement
    .or(depuisLEtablissement)
    .not(),
} as const satisfies Partial<Record<Sens, Condition>>;

export const Q3_1_2 = question
  .singleChoice("Q3.1.2", "Quel trajet cette prescription doit-elle couvrir ?")
  .mattersWhile(unSensAPoser)
  .option("1_ALLER", (option) =>
    option.offeredWhen(SENS_COMPATIBLES["1_ALLER"]),
  )
  .option("2_RETOUR", (option) =>
    option.offeredWhen(SENS_COMPATIBLES["2_RETOUR"]),
  )
  .option("3_ALLER_RETOUR_EQUIVALENT", (option) =>
    option.offeredWhen(SENS_COMPATIBLES["3_ALLER_RETOUR_EQUIVALENT"]),
  )
  .option("4_ALLER_RETOUR_DIFFERENT", (option) =>
    option.blocks(
      "Ces deux trajets nécessitent deux simulations distinctes. Choisissez ici le sens déjà évalué, puis faites une autre simulation pour l’autre sens.",
    ),
  );
