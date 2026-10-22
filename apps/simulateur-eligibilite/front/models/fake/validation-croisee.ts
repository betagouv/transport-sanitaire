// Les pages du modèle de démonstration qui montrent la validation croisée : une
// réponse qui en contredit une autre, un message par incohérence.
//
// Une incohérence se déclare sur la plus tardive des deux questions : le moteur
// lui cache les pages suivantes. Elle dit quoi corriger, en texte.

import type { QuestionnairePart } from "../../socle";
import type { Cibles } from "./declarations/cibles";
import type { Questions } from "./declarations/questions";

type DemoPage = QuestionnairePart<Questions, Cibles>["pages"][number];

/** Deux réponses de la même page, et deux règles sur la seconde. */
export const CRENEAU: DemoPage = {
  id: "creneau",
  questions: [
    {
      id: "debut",
      kind: "datetime",
      label: "Quand commence le retrait ?",
      hint: "Démontre : deux réponses de la même page qui se contredisent. La règle est sur la fin : elle lit le début, saisi juste avant.",
    },
    {
      id: "fin",
      kind: "datetime",
      label: "Quand finit-il ?",
      hint: "Démontre : deux messages ensemble, sous la même réponse. Une fin avant le début, un jour de fermeture : choisissez un dimanche avant le début pour voir les deux. Corrigée, la page se valide.",
      inconsistenciesFrom: (answers) => {
        const debut = answers.question("debut").value;
        const fin = answers.question("fin").value;
        return [
          ...(debut && fin && fin < debut
            ? ["La fin du retrait précède son début."]
            : []),
          ...(fin && isSunday(fin)
            ? ["Le comptoir est fermé le dimanche : choisissez un autre jour."]
            : []),
        ];
      },
    },
  ],
};

/** Une seconde adresse, refusée quand elle répète la première. */
export const EXPEDITION: DemoPage = {
  id: "expedition",
  questions: [
    {
      id: "expedition",
      kind: "address",
      label: "À quelle adresse envoyer le reçu ?",
      hint: "Démontre : une incohérence de deux adresses. Celle de la facture, donnée plus haut, ne peut pas être répétée. Le message s'affiche sous le groupe, tous les champs en rouge. Une erreur de champ passe devant.",
      inconsistenciesFrom: (answers) =>
        sameAddress(
          answers.question("adresse").value,
          answers.question("expedition").value,
        )
          ? ["Le reçu doit partir à une autre adresse que celle de la facture."]
          : [],
    },
  ],
};

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
