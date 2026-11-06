// Un conflit de lieux certain (NAV-LIEUX-CONFLIT-CERTAIN-20261106, #353) :
// les réponses de P2 donnent à un lieu des natures inconciliables à l'aller
// comme au retour. Aucun sens de Q3.1.2 ne le lèverait : il s'arrête avant R2.
// Un conflit qui dépend du sens attend P3 (`p3/questions/lieu.ts`).
//
// Chaque question dont un lieu se tire porte l'incohérence. Elle ne lit que
// les réponses d'avant elle et la sienne : celles qui suivent comptent sans
// réponse, ce qui n'ajoute aucun rôle. L'alerte va à la question dont la
// réponse crée le conflit, pas à celles qui la suivent sur la page.

import type { Answered, Condition, Value } from "../../../../../socle/index.ts";
import { given } from "../../question.ts";
import {
  desRolesContradictoires,
  type Entrees,
  type Lues,
  type Orientation,
} from "./roles-des-lieux.ts";

/** Le message de l'éditeur, mot pour mot. */
export const LIEUX_INCOMPATIBLES =
  "Les réponses indiquent des lieux incompatibles pour ce trajet. Revenez aux réponses précédentes pour préciser le déplacement à évaluer.";

/** Les questions qu'une incohérence lit : celles d'avant elle, et la sienne. */
type LuesJusquIci = { readonly [Nom in keyof Lues]?: Answered };

/**
 * La réponse de la question `propre` crée un conflit certain : il tient avec
 * elle, et pas sans elle.
 */
export function unConflitDeLieuxApparu(
  propre: keyof Lues,
  lues: LuesJusquIci,
): Condition {
  return reponsesDe(lues).compute(
    (entrees) =>
      unConflitCertain(entrees) &&
      !unConflitCertain({ ...entrees, [propre]: SANS_REPONSE }),
  );
}

// ---- implémentation ----

// Un aller-retour équivalent se lit comme l'aller : deux orientations suffisent.
const ORIENTATIONS: readonly Orientation[] = ["aller", "retour"];

// Une question qui n'est pas encore lue : ni valeur, ni option, ni case.
const SANS_REPONSE = {
  value: undefined,
  is: () => false,
  checked: () => false,
};
const SANS_REPONSES: Entrees = {
  soins: SANS_REPONSE,
  motif: SANS_REPONSE,
  sousType: SANS_REPONSE,
  situations: SANS_REPONSE,
  sejour: SANS_REPONSE,
  enPermission: SANS_REPONSE,
  transfert: SANS_REPONSE,
  contexte: SANS_REPONSE,
  departDeLEntree: SANS_REPONSE,
};

function unConflitCertain(lues: Partial<Entrees>): boolean {
  const entrees = { ...SANS_REPONSES, ...lues };
  return ORIENTATIONS.every((orientation) =>
    desRolesContradictoires(entrees, orientation),
  );
}

function reponsesDe(lues: LuesJusquIci): Value<Partial<Entrees>> {
  return given.all(
    Object.fromEntries(
      Object.entries(lues).map(([nom, lue]) => [
        nom,
        given.question(lue).answer(),
      ]),
    ),
    // `Object.fromEntries` perd les noms : chacun garde la réponse de sa question.
  ) as unknown as Value<Partial<Entrees>>;
}
