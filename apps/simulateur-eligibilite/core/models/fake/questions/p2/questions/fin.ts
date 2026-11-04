// La fin du retrait : deux règles sur la seconde réponse de la page, qui lit
// le début, saisi juste avant. Une incohérence se déclare sur la plus tardive
// des deux questions : le moteur lui cache les pages suivantes.

import { given, question } from "../../question.ts";
import { DEBUT } from "./debut.ts";

// La question, avant les règles qui lisent sa réponse.
const fin = question.datetime("fin", "Quand finit-il ?");

const reponse = given.question(fin).answer();
const finAvantDebut = reponse
  .toDate()
  .isBefore(given.question(DEBUT).answer().toDate());
const finUnDimanche = reponse.compute(({ value }) =>
  value ? isSunday(value) : false,
);

export const FIN = fin
  .hint(
    "Démontre : deux messages ensemble, sous la même réponse. Une fin avant le début, un jour de fermeture : choisissez un dimanche avant le début pour voir les deux. Corrigée, la page se valide.",
  )
  .inconsistentWhen(finAvantDebut, "La fin du retrait précède son début.")
  .inconsistentWhen(
    finUnDimanche,
    "Le comptoir est fermé le dimanche : choisissez un autre jour.",
  );

// ---- implémentation ----

// `2026-10-18T09:00` s'écrit à l'heure locale : on le lit de même.
function isSunday(dateTime: string): boolean {
  return new Date(dateTime).getDay() === 0;
}
