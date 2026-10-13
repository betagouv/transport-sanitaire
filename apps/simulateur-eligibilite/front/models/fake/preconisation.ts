// La préconisation du modèle de démonstration : la commande, lue dans les
// réponses, et une mise en garde que des règles publicodes décident. Elle ne
// décide rien du transport.

import type { Answers, Validated } from "../../socle";
import {
  type Fait,
  publicodesEngine,
} from "../../socle/decision-engine/publicodes";
import type { Cibles } from "./declarations/cibles";
import type { Faits } from "./declarations/faits";
import type { Questions } from "./declarations/questions";

/**
 * Des réponses aux faits : ce qui est commandé, en toutes lettres, et ce qu'on
 * sait du lait et du citron.
 */
export function faits(
  answers: Answers<Questions>,
  validated: Validated<Questions>,
): Faits {
  const { boisson, accompagnements = [] } = answers;
  return {
    boisson: boisson === undefined ? null : BOISSONS[boisson],
    accompagnements: accompagnements.flatMap(
      (item) => ACCOMPAGNEMENTS[item] ?? [],
    ),
    lait: demande(validated.accompagnements, "lait"),
    citron: demande(validated.accompagnements, "citron"),
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
};

function commandeDe(boisson: string | null, avec: readonly string[]) {
  if (boisson === null) return SANS_COMMANDE;
  return avec.length > 0 ? `${boisson}, ${avec.join(" et ")}` : boisson;
}

// Les règles de la mise en garde. Le moteur ne reçoit pas un fait absent : avec
// du lait et sans rien savoir du citron, la cible reste indéfinie. Sans lait,
// elle est décidée, citron connu ou non.
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
// coché, il est refusé. Sinon le fait est absent : une option qui ne s'est pas
// proposée n'a pas été refusée.
function demande(
  question: Validated<Questions>["accompagnements"],
  option: "lait" | "citron",
): Fait {
  if (!question)
    return { provenance: "Les accompagnements n'ont pas été demandés." };
  if (!question.offered?.includes(option))
    return { provenance: `L'option « ${option} » ne s'est pas proposée.` };
  return question.answer?.includes(option)
    ? { value: true, provenance: `Accompagnements : « ${option} » coché.` }
    : {
        value: false,
        provenance: `Accompagnements : « ${option} » proposé, pas coché.`,
      };
}
