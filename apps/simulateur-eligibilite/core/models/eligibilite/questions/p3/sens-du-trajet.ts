// Le sens des transports du document (Q3.1.2), le nombre qui le suit (Q3.1.1)
// et le nombre mensuel du S3141 (Q3.1.3). Le sens ne se propose que s'il
// s'accorde aux rôles que P2 a fixés aux lieux. Plusieurs permissions sont
// chacune un aller-retour : Q2.8 donne alors le sens, qui ne se redemande pas
// (D-120). Le nombre compte des trajets du sens choisi : trois allers-retours
// valent 3 (`CONTRAT_Q31_QUANTITES.json`, D-246).

import type { Condition, GivenAnswer } from "../../../../socle/index.ts";
import type { Questions } from "../catalogue/catalogue.ts";
import { unRetourPenitentiaire } from "../p2/retour-penitentiaire.ts";
import { type Context, given, type Inconnu } from "../question.ts";
import { pmtOuDap, unS3141 } from "./supports-du-complement.ts";

type Sens = Questions["Q3.1.2"];
type Rappel = { readonly label: string; readonly value: string }[];

const unePermissionRepetee = given.question("Q2.8.5").answer().is("1_OUI");
const semaines = given.question("Q2.8.6.a").answer();
const sousType = given.question("Q2.1.g").answer();

/** Q3.1.2 se pose pour la PMT, la DAP, et le S3141 d'une seule permission. */
export const unSensAPoser = pmtOuDap.or(
  unS3141.and(unePermissionRepetee.not()),
);

/** Q3.1.3 se pose pour le S3141 de plusieurs permissions. */
export const desTrajetsMensuelsAPoser = unS3141.and(unePermissionRepetee);

/** Ce dont le sens du document se tire : Q3.1.2 et la répétition de Q2.8. */
type Origines = {
  readonly sens: GivenAnswer<Sens>;
  readonly repetition: GivenAnswer<Questions["Q2.8.5"]>;
};

/** Le sens du document : Q3.1.2, ou l'aller-retour de plusieurs permissions. */
export function sensDe({ sens, repetition }: Origines): Sens | Inconnu {
  if (sens.hasAnswer()) return sens.value;
  return repetition.is("1_OUI") ? "3_ALLER_RETOUR_EQUIVALENT" : undefined;
}

/** Le sens du document, tel que l'endroit le lit (`sensDe`). */
export const SENS_DU_DOCUMENT = given
  .all({
    sens: given.question("Q3.1.2").answer(),
    repetition: given.question("Q2.8.5").answer(),
  })
  .compute(sensDe);

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

/**
 * Quand un sens se propose, vu les rôles fixés en P2. Sans rôle fixé, tous se
 * proposent. Un aller-retour change de motif : il ne se propose pas quand un
 * rôle est fixé.
 */
export const SENS_COMPATIBLES = {
  "1_ALLER": depuisLEtablissement.not(),
  "2_RETOUR": versLEtablissement.not(),
  "3_ALLER_RETOUR_EQUIVALENT": versLEtablissement
    .or(depuisLEtablissement)
    .not(),
} as const satisfies Partial<Record<Sens, Condition>>;

/** Q3.1.1 se pose pour la PMT et la DAP, une fois le sens choisi. */
export const uneQuantiteAPoser = pmtOuDap.and(
  given
    .question("Q3.1.2")
    .answer()
    .isOneOf("1_ALLER", "2_RETOUR", "3_ALLER_RETOUR_EQUIVALENT"),
);

/** Le libellé de Q3.1.1 : il dit l'unité du sens choisi. */
export function quantiteDuSens({ answers }: Context): string {
  return QUANTITES[sensDeQ312(answers)].question;
}

/** L'aide de Q3.1.1 : ce que vaut une unité du sens choisi. */
export function aideDuSens({ answers }: Context): string {
  return QUANTITES[sensDeQ312(answers)].aide;
}

/** Q3.1.3 dépasse ce que la fréquence de Q2.8 permet. */
export const desTrajetsAuDelaDeLaFrequence = given
  .question("Q3.1.3")
  .answer()
  .computeWith(semaines, (nombre, frequence) => {
    const maximum = allersRetoursMensuelsAuPlus(frequence.value);
    return (
      maximum !== undefined &&
      nombre.value !== undefined &&
      nombre.value > maximum
    );
  });

/** Le message de Q3.1.3 au-delà de la fréquence : il cite le maximum. */
export const FREQUENCE_DEPASSEE = semaines.compute(
  ({ value }) =>
    `Avec une permission toutes les ${value} semaine(s), un mois compte au plus ${allersRetoursMensuelsAuPlus(value)} allers-retours.`,
);

/**
 * La fréquence des permissions de Q2.8, rappelée au-dessus de Q3.1.3. Elle ne
 * se convertit pas en nombre par mois (TS1014-E04).
 */
export function rappelDesPermissions({ answers }: Context): Rappel {
  const semaines = answers.question("Q2.8.6.a").value;
  if (semaines === undefined || semaines < 1) return [];
  const frequence =
    semaines === 1
      ? "Une permission aller-retour par semaine"
      : `Une permission aller-retour toutes les ${semaines} semaines`;
  return [{ label: "Fréquence", value: frequence }];
}

// ---- implémentation ----

// Les libellés de Q3.1.1, sens par sens (`CONTRAT_Q31_QUANTITES.json`).
const QUANTITES = {
  "1_ALLER": {
    question: "Combien d’allers simples cette prescription doit-elle couvrir ?",
    aide: "Un aller simple correspond à un seul trajet vers le lieu de soins.",
  },
  "2_RETOUR": {
    question:
      "Combien de retours simples cette prescription doit-elle couvrir ?",
    aide: "Un retour simple correspond à un seul trajet depuis le lieu de soins.",
  },
  "3_ALLER_RETOUR_EQUIVALENT": {
    question: "Combien d’allers-retours cette prescription doit-elle couvrir ?",
    aide: "Un aller-retour comprend deux trajets : un aller et un retour. Exemple : 3 allers-retours = 3 allers et 3 retours.",
  },
} as const;

// Le sens de Q3.1.2 qui a une unité. Q3.1.1 ne se pose qu'avec l'un d'eux
// (`uneQuantiteAPoser`) : l'aller tient lieu de défaut.
function sensDeQ312(answers: Context["answers"]): keyof typeof QUANTITES {
  const sens = answers.question("Q3.1.2").value;
  return sens !== undefined && sens in QUANTITES
    ? (sens as keyof typeof QUANTITES)
    : "1_ALLER";
}

// Le plus d'allers-retours qu'un mois compte : une permission toutes les
// `semaines` semaines, sur 31 jours.
function allersRetoursMensuelsAuPlus(
  semaines: number | Inconnu,
): number | Inconnu {
  if (semaines === undefined || semaines < 1) return undefined;
  return Math.ceil(31 / (7 * semaines));
}
