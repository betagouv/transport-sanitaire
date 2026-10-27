// Le sens des transports du document (Q3.1.2) et le nombre mensuel du S3141
// (Q3.1.3). Le sens ne se propose que s'il s'accorde aux rôles que P2 a fixés
// aux lieux. Plusieurs permissions sont chacune un aller-retour : Q2.8 donne
// alors le sens, qui ne se redemande pas (D-120).

import type { Condition, GivenAnswer } from "../../../socle/index.ts";
import { trajetsMensuelsAuPlus } from "../concepts/permission.ts";
import type { Questions } from "../declarations/questions.ts";
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

/** Le message d'un aller-retour qui ne compte qu'un transport. */
export const ALLER_RETOUR_D_UN_TRANSPORT =
  "Un aller-retour compte deux transports. Indiquez-en au moins deux, ou choisissez « Aller simple » ou « Retour simple ».";

/** Q3.1.2 dit un aller-retour, quand Q3.1.1 ne compte qu'un transport. */
export const unAllerRetourDUnSeulTransport = given
  .question("Q3.1.2")
  .answer()
  .is("3_ALLER_RETOUR_EQUIVALENT")
  .and(given.question("Q3.1.1").answer().is(1));

/** Q3.1.3 dépasse ce que la fréquence de Q2.8 permet. */
export const desTrajetsAuDelaDeLaFrequence = given
  .question("Q3.1.3")
  .answer()
  .computeWith(semaines, (nombre, frequence) => {
    const maximum = trajetsMensuelsAuPlus(frequence.value);
    return (
      maximum !== undefined &&
      nombre.value !== undefined &&
      nombre.value > maximum
    );
  });

/** Le message de Q3.1.3 au-delà de la fréquence : il cite le maximum. */
export const FREQUENCE_DEPASSEE = semaines.compute(
  ({ value }) =>
    `Avec une permission toutes les ${value} semaine(s), un mois compte au plus ${trajetsMensuelsAuPlus(value)} trajets.`,
);

/** Ce que Q2.8 a fixé des permissions, rappelé au-dessus de Q3.1.3. */
export function rappelDesPermissions({ answers }: Context): Rappel {
  const debut = answers.question("Q2.8.2").value;
  const fin = answers.question("Q2.8.3").value;
  const periode = answers.question("Q2.8.6").value;
  const semaines = answers.question("Q2.8.6.a").value;
  return [
    ...(debut && fin
      ? [
          {
            label: "Première permission",
            value: `du ${lisible(debut)} au ${lisible(fin)}`,
          },
        ]
      : []),
    ...(periode
      ? [{ label: "Fin de la période", value: lisible(periode) }]
      : []),
    ...(semaines !== undefined
      ? [
          {
            label: "Fréquence",
            value: `une permission aller-retour toutes les ${semaines} semaine(s)`,
          },
        ]
      : []),
  ];
}

// ---- implémentation ----

// `AAAA-MM-JJ` donne `JJ/MM/AAAA`, et `AAAA-MM-JJTHH:mm` y ajoute l'heure.
function lisible(date: string): string {
  const [jour, heure] = date.split("T");
  const [annee, mois, quantieme] = (jour ?? "").split("-");
  const lu = `${quantieme}/${mois}/${annee}`;
  return heure ? `${lu} à ${heure}` : lu;
}
