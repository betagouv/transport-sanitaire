// La préconisation du modèle de démonstration : la commande, lue dans les
// réponses, et une mise en garde que des règles publicodes décident. Elle ne
// décide rien du transport.

import { publicodesEngine } from "../../socle/decision-engine/publicodes.ts";
import {
  Cible,
  type GivenAnswers,
  type ValidatedAnswers,
} from "../../socle/index.ts";
import type { Cibles } from "./declarations/cibles.ts";
import type { Faits } from "./declarations/faits.ts";
import type { Questions } from "./declarations/questions.ts";
import { CATALOGUE_DES_FAITS } from "./faits.ts";

/**
 * Des réponses aux faits : ce qui est commandé, en toutes lettres, et ce qu'on
 * sait du lait et du citron (`faits.ts`).
 */
export function faits(
  _answers: GivenAnswers<Questions>,
  validated: ValidatedAnswers<Questions>,
): Faits {
  return CATALOGUE_DES_FAITS.read(validated);
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
