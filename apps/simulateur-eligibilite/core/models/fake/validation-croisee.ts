// Les pages du modèle de démonstration qui montrent la validation croisée : une
// réponse qui en contredit une autre, un message par incohérence.
//
// Une incohérence se déclare sur la plus tardive des deux questions : le moteur
// lui cache les pages suivantes. Elle dit quoi corriger, en texte.

import { page, type QuestionnairePart } from "../../socle/index.ts";
import type { Cibles } from "./declarations/cibles.ts";
import type { Questions } from "./declarations/questions.ts";
import { given, question } from "./question.ts";

type DemoPage = QuestionnairePart<Questions, Cibles>["pages"][number];

const fin = given.question("fin").answer();
const finAvantDebut = fin
  .toDate()
  .isBefore(given.question("debut").answer().toDate());
const finUnDimanche = fin.compute(({ value }) =>
  value ? isSunday(value) : false,
);
const factureRepetee = given
  .question("adresse")
  .answer()
  .computeWith(given.question("expedition").answer(), (facture, recu) =>
    sameAddress(facture.value, recu.value),
  );

/** Deux réponses de la même page, et deux règles sur la seconde. */
export const CRENEAU: DemoPage = page(
  "creneau",
  question
    .datetime("debut", "Quand commence le retrait ?")
    .hint(
      "Démontre : deux réponses de la même page qui se contredisent. La règle est sur la fin : elle lit le début, saisi juste avant.",
    ),
  question
    .datetime("fin", "Quand finit-il ?")
    .hint(
      "Démontre : deux messages ensemble, sous la même réponse. Une fin avant le début, un jour de fermeture : choisissez un dimanche avant le début pour voir les deux. Corrigée, la page se valide.",
    )
    .inconsistentWhen(finAvantDebut, "La fin du retrait précède son début.")
    .inconsistentWhen(
      finUnDimanche,
      "Le comptoir est fermé le dimanche : choisissez un autre jour.",
    ),
);

/** Une seconde adresse, refusée quand elle répète la première. */
export const EXPEDITION: DemoPage = page(
  "expedition",
  question
    .address("expedition", "À quelle adresse envoyer le reçu ?")
    .hint(
      "Démontre : une incohérence de deux adresses. Celle de la facture, donnée plus haut, ne peut pas être répétée. Le message s'affiche sous le groupe, tous les champs en rouge. Une erreur de champ passe devant.",
    )
    .inconsistentWhen(
      factureRepetee,
      "Le reçu doit partir à une autre adresse que celle de la facture.",
    ),
);

// ---- implémentation ----

// `2026-10-18T09:00` s'écrit à l'heure locale : on le lit de même.
function isSunday(dateTime: string): boolean {
  return new Date(dateTime).getDay() === 0;
}

// Deux adresses sont les mêmes quand leur voie, leur code postal et leur
// commune le sont, sans égard aux accents ni à la casse.
function sameAddress(
  first: Questions["adresse"] | undefined,
  second: Questions["expedition"] | undefined,
): boolean {
  if (!first || !second) return false;
  const key = ({ street, postalCode, city }: Questions["adresse"]) =>
    [street, postalCode ?? "", city]
      .map((part) =>
        part
          .normalize("NFD")
          .replace(/\p{Diacritic}/gu, "")
          .trim()
          .toLowerCase(),
      )
      .join("|");
  return key(first) === key(second);
}
