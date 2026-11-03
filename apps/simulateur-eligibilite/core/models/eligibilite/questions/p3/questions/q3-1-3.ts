// Q3.1.3 : le nombre mensuel d'allers-retours du S3141 de plusieurs
// permissions. Il reprend la fréquence de Q2.8, sans la dépasser.

import { Q2_8_5 } from "../../p2/questions/q2-8-5.ts";
import { Q2_8_6_A } from "../../p2/questions/q2-8-6.ts";
import { type Context, given, type Inconnu, question } from "../../question.ts";
import { unS3141 } from "../conditions/supports-du-complement.ts";

// La question, avant les règles qui lisent sa réponse.
const declaree = question.number(
  "Q3.1.3",
  "Combien d’allers-retours faut-il prescrire par mois pour ces permissions de sortie ?",
);

type Rappel = { readonly label: string; readonly value: string }[];

const semaines = given.question(Q2_8_6_A).answer();

// Q3.1.3 se pose pour le S3141 de plusieurs permissions.
const desTrajetsMensuelsAPoser = unS3141.and(
  given.question(Q2_8_5).answer().is("1_OUI"),
);

// Le plus d'allers-retours qu'un mois compte : une permission toutes les
// `semaines` semaines, sur 31 jours.
function allersRetoursMensuelsAuPlus(
  semaines: number | Inconnu,
): number | Inconnu {
  if (semaines === undefined || semaines < 1) return undefined;
  return Math.ceil(31 / (7 * semaines));
}

// Q3.1.3 dépasse ce que la fréquence de Q2.8 permet.
const desTrajetsAuDelaDeLaFrequence = given
  .question(declaree)
  .answer()
  .computeWith(semaines, (nombre, frequence) => {
    const maximum = allersRetoursMensuelsAuPlus(frequence.value);
    return (
      maximum !== undefined &&
      nombre.value !== undefined &&
      nombre.value > maximum
    );
  });

// Le message de Q3.1.3 au-delà de la fréquence : il cite le maximum.
const FREQUENCE_DEPASSEE = semaines.compute(
  ({ value }) =>
    `Avec une permission toutes les ${value} semaine(s), un mois compte au plus ${allersRetoursMensuelsAuPlus(value)} allers-retours.`,
);

// La fréquence des permissions de Q2.8, rappelée au-dessus de Q3.1.3. Elle ne
// se convertit pas en nombre par mois (TS1014-E04).
function rappelDesPermissions({ answers }: Context): Rappel {
  const semaines = answers.question(Q2_8_6_A).value;
  if (semaines === undefined || semaines < 1) return [];
  const frequence =
    semaines === 1
      ? "Une permission aller-retour par semaine"
      : `Une permission aller-retour toutes les ${semaines} semaines`;
  return [{ label: "Fréquence", value: frequence }];
}

export const Q3_1_3 = declaree
  .hint("Exemple : 2 allers-retours par mois = 2 allers et 2 retours par mois.")
  .integer()
  .min(1)
  .unit("aller(s)-retour(s) par mois")
  .mattersWhile(desTrajetsMensuelsAPoser)
  .reminderFrom(rappelDesPermissions)
  .inconsistentWhen(desTrajetsAuDelaDeLaFrequence, FREQUENCE_DEPASSEE);
