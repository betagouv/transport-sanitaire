// Un conflit de lieux certain (NAV-LIEUX-CONFLIT-CERTAIN-20261106, #353) :
// les réponses de P2 donnent à un lieu des natures inconciliables à l'aller
// comme au retour. Aucun sens de Q3.1.2 ne le lèverait : il s'arrête avant R2.
// Un conflit qui dépend du sens attend P3 (`p3/questions/lieu.ts`).
//
// Chaque question dont un lieu se tire porte l'incohérence. Elle ne lit que
// les réponses d'avant elle et la sienne : celles qui suivent comptent sans
// réponse, ce qui n'ajoute aucun rôle. L'alerte va à la question dont la
// réponse crée le conflit, pas à celles qui la suivent sur la page. Ses liens
// mènent aux réponses d'avant qui le fondent (NAV-LIEUX-CORRECTION-001).

import type {
  Answered,
  Condition,
  Revisit,
  Value,
} from "../../../../../socle/index.ts";
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
 * L'incohérence d'un conflit de lieux sur la question `propre`, telle que
 * `inconsistentWhen` la prend : il tient avec sa réponse et pas sans elle, le
 * message de l'éditeur, et les réponses d'avant à revoir.
 */
export function incoherenceDeLieux(
  propre: keyof Lues,
  lues: LuesJusquIci,
): readonly [Condition, string, { revisit: Value<readonly Revisit[]> }] {
  const reponses = reponsesDe(lues);
  const apparu = reponses.compute(
    (entrees) =>
      unConflitCertain(entrees) && !unConflitCertain(sans(entrees, propre)),
  );
  const revisit = reponses.compute((entrees) => aRevoir(entrees, propre, lues));
  return [apparu, LIEUX_INCOMPATIBLES, { revisit }];
}

// ---- implémentation ----

// Les libellés de l'éditeur : Q1.3 dit la situation particulière, les
// questions de P2 le déplacement.
const REVOIR_LA_SITUATION = "Revoir la situation particulière";
const REVOIR_LE_DEPLACEMENT = "Revoir la nature du déplacement";

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

function sans(entrees: Partial<Entrees>, nom: keyof Lues): Partial<Entrees> {
  return { ...entrees, [nom]: SANS_REPONSE };
}

// Les réponses d'avant sans lesquelles le conflit ne serait plus certain. Un
// lien par libellé : le premier, dans l'ordre des questions.
function aRevoir(
  entrees: Partial<Entrees>,
  propre: keyof Lues,
  lues: LuesJusquIci,
): readonly Revisit[] {
  const liens = (Object.keys(lues) as (keyof Lues)[])
    .filter((nom) => nom !== propre && entrees[nom]?.value !== undefined)
    .filter((nom) => !unConflitCertain(sans(entrees, nom)))
    .map((nom) => ({
      label: nom === "soins" ? REVOIR_LA_SITUATION : REVOIR_LE_DEPLACEMENT,
      question: (lues[nom] as Answered).id,
    }));
  return liens.filter(
    (lien, rang) =>
      liens.findIndex(({ label }) => label === lien.label) === rang,
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
