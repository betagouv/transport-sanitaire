// La préconisation factice : la commande, lue dans les réponses validées. Elle
// ne décide rien du transport.

import {
  Cible,
  FaitCatalogue,
  type GivenAnswers,
  givenOf,
  unFait,
  type ValidatedAnswers,
} from "../../../../core/socle";
import type { Cibles } from "./declarations/cibles";
import type { Faits } from "./declarations/faits";
import type { Questions } from "./declarations/questions";

// Ce que les faits lisent. `given` ne vient pas de `questionnaire.ts`, qui lit
// ce fichier.
const given = givenOf<Questions, Faits>();

const BOISSONS: Record<Questions["boisson"], string | null> = {
  the: "thé",
  cafe: "café",
  rien: null,
};

const ACCOMPAGNEMENTS: Record<string, string | undefined> = {
  lait: "lait",
  sucre: "sucre",
};

/** Les faits factices : ce qui est commandé, en toutes lettres. */
export const CATALOGUE_DES_FAITS = new FaitCatalogue<Faits>(
  ["boisson", "accompagnements"],
  [
    unFait("boisson").vaut(
      given
        .question("boisson")
        .answer()
        .compute((boisson) =>
          boisson.hasAnswer() ? BOISSONS[boisson.value] : null,
        ),
    ),
    unFait("accompagnements").vaut(
      given
        .question("accompagnements")
        .answer()
        .compute((avec) =>
          avec.checkedBoxes().flatMap((item) => ACCOMPAGNEMENTS[item] ?? []),
        ),
    ),
  ],
);

/** Des réponses aux faits, par le catalogue. */
export function faits(
  _answers: GivenAnswers<Questions>,
  validated: ValidatedAnswers<Questions>,
): Faits {
  return CATALOGUE_DES_FAITS.read(validated);
}

/** Des faits aux cibles : la commande, en une phrase. */
export function cibles({ boisson, accompagnements }: Faits): Cibles {
  if (boisson === null) return { commande: Cible.of(SANS_COMMANDE) };
  return {
    commande: Cible.of(
      accompagnements.length > 0
        ? `${boisson}, ${accompagnements.join(" et ")}`
        : boisson,
    ),
  };
}

/** La commande d'un questionnaire où rien n'est demandé. */
export const SANS_COMMANDE = "aucune";
