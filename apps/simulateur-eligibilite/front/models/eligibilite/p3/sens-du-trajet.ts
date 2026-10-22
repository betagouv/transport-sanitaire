// Le sens des transports du document (Q3.1.2) et le nombre mensuel du S3141
// (Q3.1.3). Le sens ne se propose que s'il s'accorde aux rôles que P2 a fixés
// aux lieux. Plusieurs permissions sont chacune un aller-retour : Q2.8 donne
// alors le sens, qui ne se redemande pas (D-120).

import type { GivenAnswers } from "../../../../core/socle";
import type { Questions } from "../declarations/questions";
import { retourPenitentiaireCoche } from "../p2/retour-penitentiaire";
import type { ContextDuComplement } from "../question";
import { pmtOuDap } from "./supports-du-complement";

type Reponses = GivenAnswers<Questions>;
type Sens = Questions["Q3.1.2"];
type Rappel = { readonly label: string; readonly value: string }[];

/** Q3.1.2 se pose pour la PMT, la DAP, et le S3141 d'une seule permission. */
export function sensAPoser({ answers, cibles }: ContextDuComplement): boolean {
  return (
    pmtOuDap(cibles) ||
    (cibles.cible_support_id === "S3141" && !plusieursPermissions(answers))
  );
}

/** Q3.1.3 se pose pour le S3141 de plusieurs permissions. */
export function trajetsMensuelsAPoser({
  answers,
  cibles,
}: ContextDuComplement): boolean {
  return cibles.cible_support_id === "S3141" && plusieursPermissions(answers);
}

/** Le sens du document : Q3.1.2, ou l'aller-retour de plusieurs permissions. */
export function sensDuDocument(reponses: Reponses): Sens | undefined {
  const sens = reponses.question("Q3.1.2");
  if (sens.hasAnswer()) return sens.value;
  return plusieursPermissions(reponses)
    ? "3_ALLER_RETOUR_EQUIVALENT"
    : undefined;
}

/**
 * Le sens se propose-t-il, vu les rôles fixés en P2 ? Une entrée va vers
 * l'établissement. Une sortie, une admission en HAD et un retour pénitentiaire
 * en reviennent. Leur aller-retour change de motif : il ne se propose pas.
 */
export function sensCompatible(sens: Sens, reponses: Reponses): boolean {
  const impose = sensImpose(reponses);
  return impose === undefined || sens === impose;
}

/** Un aller-retour compte deux transports : un seul ne le couvre pas. */
export function nombreDuSens({ answers }: ContextDuComplement): string[] {
  return answers.question("Q3.1.2").is("3_ALLER_RETOUR_EQUIVALENT") &&
    answers.question("Q3.1.1").is(1)
    ? [
        "Un aller-retour compte deux transports. Indiquez-en au moins deux, ou choisissez « Aller simple » ou « Retour simple ».",
      ]
    : [];
}

/** Q3.1.3 dépasse-t-elle ce que la fréquence de Q2.8 permet ? */
export function trajetsAuDelaDeLaFrequence({
  answers,
}: ContextDuComplement): string[] {
  const maximum = trajetsMensuelsMaximum(answers);
  const nombre = answers.question("Q3.1.3").value;
  return maximum !== undefined && nombre !== undefined && nombre > maximum
    ? [
        `Avec une permission toutes les ${answers.question("Q2.8.6.a").value} semaine(s), un mois compte au plus ${maximum} trajets.`,
      ]
    : [];
}

/** Ce que Q2.8 a fixé des permissions, rappelé au-dessus de Q3.1.3. */
export function rappelDesPermissions({ answers }: ContextDuComplement): Rappel {
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

// Q2.8 couvre-t-elle plusieurs permissions ? Chacune est un aller-retour.
function plusieursPermissions(reponses: Reponses): boolean {
  return reponses.question("Q2.8.5").is("1_OUI");
}

// Le plus de trajets qu'un mois peut compter : deux par permission, une
// permission toutes les N semaines, sur 31 jours.
function trajetsMensuelsMaximum(reponses: Reponses): number | undefined {
  const semaines = reponses.question("Q2.8.6.a").value;
  if (semaines === undefined || semaines < 1) return undefined;
  return 2 * Math.ceil(31 / (7 * semaines));
}

// Le seul sens que les rôles de P2 permettent. Absent : tous se proposent.
function sensImpose(reponses: Reponses): Sens | undefined {
  const sousType = reponses.question("Q2.1.g");
  if (sousType.is("1_ENTREE")) return "1_ALLER";
  if (
    sousType.isOneOf("2_SORTIE", "3_ADMISSION_HAD") ||
    reponses.question("Q2.6").checked("10_ADMISSION_HAD") ||
    retourPenitentiaireCoche(reponses)
  )
    return "2_RETOUR";
  return undefined;
}

// `AAAA-MM-JJ` donne `JJ/MM/AAAA`, et `AAAA-MM-JJTHH:mm` y ajoute l'heure.
function lisible(date: string): string {
  const [jour, heure] = date.split("T");
  const [annee, mois, quantieme] = (jour ?? "").split("-");
  const lu = `${quantieme}/${mois}/${annee}`;
  return heure ? `${lu} à ${heure}` : lu;
}
