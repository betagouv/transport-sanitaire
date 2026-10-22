// La préconisation factice : la commande, lue dans les réponses. Elle ne décide
// rien du transport.

import { Cible, type GivenAnswers } from "../../../../core/socle";
import type { Cibles } from "./declarations/cibles";
import type { Faits } from "./declarations/faits";
import type { Questions } from "./declarations/questions";

/** Des réponses aux faits : ce qui est commandé, en toutes lettres. */
export function faits(answers: GivenAnswers<Questions>): Faits {
  const boisson = answers.question("boisson");
  return {
    boisson: boisson.hasAnswer() ? BOISSONS[boisson.value] : null,
    accompagnements: answers
      .question("accompagnements")
      .checkedBoxes()
      .flatMap((item) => ACCOMPAGNEMENTS[item] ?? []),
  };
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

// ---- implémentation ----

const BOISSONS: Record<Questions["boisson"], string | null> = {
  the: "thé",
  cafe: "café",
  rien: null,
};

const ACCOMPAGNEMENTS: Record<string, string | undefined> = {
  lait: "lait",
  sucre: "sucre",
};
