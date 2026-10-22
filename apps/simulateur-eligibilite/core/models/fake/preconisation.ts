// La préconisation du modèle de démonstration : la commande, lue dans les
// réponses, et une mise en garde que des règles publicodes décident. Elle ne
// décide rien du transport.

import { publicodesEngine } from "../../socle/decision-engine/publicodes.ts";
import {
  Fait,
  type GivenAnswers,
  type ValidatedAnswers,
} from "../../socle/index.ts";
import type { Cibles } from "./declarations/cibles.ts";
import type { Faits } from "./declarations/faits.ts";
import type { Questions } from "./declarations/questions.ts";

/**
 * Des réponses aux faits : ce qui est commandé, en toutes lettres, et ce qu'on
 * sait du lait et du citron.
 */
export function faits(
  answers: GivenAnswers<Questions>,
  validated: ValidatedAnswers<Questions>,
): Faits {
  const boisson = answers.question("boisson");
  return {
    boisson: boisson.hasAnswer() ? BOISSONS[boisson.value] : null,
    accompagnements: answers
      .question("accompagnements")
      .checkedBoxes()
      .flatMap((item) => ACCOMPAGNEMENTS[item] ?? []),
    lait: demande(answers, validated, "lait"),
    citron: demande(answers, validated, "citron"),
  };
}

/** Des faits aux cibles : la commande, en une phrase, et la mise en garde. */
export function cibles({ boisson, accompagnements, ...connus }: Faits): Cibles {
  return {
    commande: commandeDe(boisson, accompagnements),
    ...regles.cibles(connus),
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
  citron: "citron",
  "citron-a-voir": "peut-être du citron",
};

function commandeDe(boisson: string | null, avec: readonly string[]) {
  if (boisson === null) return SANS_COMMANDE;
  return avec.length > 0 ? `${boisson}, ${avec.join(" et ")}` : boisson;
}

// Les règles de la mise en garde. Le moteur ne reçoit pas un fait absent : avec
// du lait et un citron à décider au service, la cible reste indéfinie. Sans
// lait, elle est décidée, citron connu ou non.
const regles = publicodesEngine<
  Pick<Faits, "lait" | "citron">,
  Pick<Cibles, "lait_tourne">
>(
  {
    lait: { titre: "Du lait est demandé" },
    citron: { titre: "Du citron est demandé" },
    lait_tourne: { "toutes ces conditions": ["lait", "citron"] },
  },
  ["lait_tourne"],
);

// Ce qu'on sait d'un accompagnement. Coché, il est demandé. Proposé sans être
// coché, il est refusé. Une option qui ne s'est pas proposée n'a pas été
// refusée : elle ne vaut « non » que si la boisson l'exclut.
function demande(
  answers: GivenAnswers<Questions>,
  validated: ValidatedAnswers<Questions>,
  option: "lait" | "citron",
): Fait {
  if (answers.question("boisson").is("rien"))
    return Fait.non("Rien n'est commandé.");
  const question = validated.question("accompagnements");
  if (!question.isValidated())
    return Fait.inconnu("Les accompagnements ne sont pas encore validés.");
  if (option === "citron" && question.checked("citron-a-voir"))
    return Fait.inconnu("« Peut-être du citron » : à décider au service.");
  return (
    question.faitOf(option) ??
    Fait.non(`« ${option} » ne se sert pas avec cette boisson.`)
  );
}
