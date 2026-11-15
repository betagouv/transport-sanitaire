// Des faits aux cibles : la commande, en une phrase, et une mise en garde que
// des règles publicodes décident. Elle ne décide rien du transport.

import { PublicodesDecisionEngine } from "../../../socle/decision-engine/publicodes-decision-engine.adapter.ts";
import { Cible } from "../../../socle/index.ts";
import type { Faits } from "../faits/noms.ts";
import type { Cibles } from "./noms.ts";

/**
 * La commande se calcule en code, mais se lit comme toute cible.
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
const miseEnGarde = new PublicodesDecisionEngine<
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
