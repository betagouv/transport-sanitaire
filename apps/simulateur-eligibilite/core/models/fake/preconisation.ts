// La préconisation du modèle de démonstration : la commande, lue dans les
// réponses, et une mise en garde que des règles publicodes décident. Elle ne
// décide rien du transport.

import { publicodesEngine } from "../../socle/decision-engine/publicodes.ts";
import {
  Cible,
  type Fait,
  FaitCatalogue,
  type FaitContext,
  type GivenAnswers,
  regles,
  type ValidatedAnswers,
} from "../../socle/index.ts";
import type { Cibles } from "./declarations/cibles.ts";
import { FAITS, type Faits } from "./declarations/faits.ts";
import type { Questions } from "./declarations/questions.ts";

/**
 * Des réponses aux faits : ce qui est commandé, en toutes lettres, et ce qu'on
 * sait du lait et du citron.
 */
export function faits(
  answers: GivenAnswers<Questions>,
  validated: ValidatedAnswers<Questions>,
): Faits {
  return CATALOGUE.read(answers, validated);
}

/**
 * Des faits aux cibles : la commande, en une phrase, et la mise en garde. La
 * commande se calcule en code, mais se lit comme toute cible.
 */
export function cibles({ boisson, accompagnements, ...connus }: Faits): Cibles {
  return {
    commande: Cible.of(commandeDe(boisson, accompagnements)),
    ...miseEnGarde.cibles(connus),
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
const miseEnGarde = publicodesEngine<
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
  { answers, validated }: FaitContext<Questions, Faits>,
  option: "lait" | "citron",
): Fait {
  const question = validated.question("accompagnements");
  return regles()
    .nonSi(answers.question("boisson").is("rien"), "Rien n'est commandé.")
    .seulementSi(question.isValidated())
    .inconnuSi(
      option === "citron" && question.checked("citron-a-voir"),
      "« Peut-être du citron » : à décider au service.",
    )
    .selonCase(question, option)
    .nonSi(
      !question.offers(option),
      `« ${option} » ne se sert pas avec cette boisson.`,
    )
    .sinon("Les accompagnements ne sont pas encore validés.");
}

// Chaque fait, déclaré une fois.
const CATALOGUE = new FaitCatalogue<Questions, Faits>(FAITS, {
  boisson: ({ answers }) => {
    const boisson = answers.question("boisson");
    return boisson.hasAnswer() ? BOISSONS[boisson.value] : null;
  },
  accompagnements: ({ answers }) =>
    answers
      .question("accompagnements")
      .checkedBoxes()
      .flatMap((item) => ACCOMPAGNEMENTS[item] ?? []),
  lait: (contexte) => demande(contexte, "lait"),
  citron: (contexte) => demande(contexte, "citron"),
});
