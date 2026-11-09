// Un conflit de lieux certain (NAV-LIEUX-CONFLIT-CERTAIN-20261106, #353) :
// les réponses de P2 donnent à un lieu des natures inconciliables dans le sens
// acquis, ou, sans sens acquis, à l'aller comme au retour. Il s'arrête avant R2.
//
// Un conflit qu'un seul sens crée demande ce sens avant R2 : Q2.13.sens
// (QST-LIEUX-CONFLIT-CERTAIN-20261106, #365). Un sens qui ne change rien aux
// lieux reste une précision de P3.
//
// Chaque question dont un lieu ou le sens se tire porte l'incohérence. Elle ne
// lit que les réponses d'avant elle et la sienne : celles qui suivent comptent
// sans réponse, ce qui n'ajoute aucun rôle. L'alerte va à la question dont la
// réponse crée le conflit, pas à celles qui la suivent sur la page. Ses liens
// mènent aux réponses d'avant qui le fondent (NAV-LIEUX-CORRECTION-001).

import type {
  Answered,
  Condition,
  Revisit,
  Value,
} from "../../../../../socle/index.ts";
import { given, type Inconnu } from "../../question.ts";
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

/**
 * Le sens change-t-il la cohérence des lieux ? Aucune réponse ne l'établit, et
 * les rôles de P2 ne se contredisent que dans l'un des deux.
 */
export function unSensQuiChangeLesLieux(lues: LuesJusquIci): Condition {
  return reponsesDe(lues).compute((reponses) => {
    const entrees = { ...SANS_REPONSES, ...reponses };
    if (orientationAcquise(entrees) !== undefined) return false;
    const enConflit = ORIENTATIONS.filter((orientation) =>
      desRolesContradictoires(entrees, orientation),
    );
    return enConflit.length === 1;
  });
}

// ---- implémentation ----

// Les libellés de l'éditeur : Q1.3 dit la situation particulière, les
// questions de P2 le déplacement.
const REVOIR_LA_SITUATION = "Revoir la situation particulière";
const REVOIR_LE_DEPLACEMENT = "Revoir la nature du déplacement";

// Un aller-retour équivalent se lit comme l'aller : deux orientations suffisent.
const ORIENTATIONS: readonly Orientation[] = ["aller", "retour"];

// Le sens de Q2.13.sens. L'aller-retour différent bloque : il n'en donne aucun.
const ORIENTATION_DU_SENS: Readonly<Record<string, Orientation>> = {
  "1_ALLER": "aller",
  "2_RETOUR": "retour",
  "3_ALLER_RETOUR_EQUIVALENT": "aller",
};

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
  repetition: SANS_REPONSE,
  trajetEvalue: SANS_REPONSE,
};

function unConflitCertain(lues: Partial<Entrees>): boolean {
  const entrees = { ...SANS_REPONSES, ...lues };
  const acquise = orientationAcquise(entrees);
  const possibles = acquise === undefined ? ORIENTATIONS : [acquise];
  return possibles.every((orientation) =>
    desRolesContradictoires(entrees, orientation),
  );
}

// Le sens que les réponses établissent : Q2.13.sens, ou plusieurs
// permissions, chacune un aller-retour (D-120).
function orientationAcquise({
  trajetEvalue,
  repetition,
}: Entrees): Orientation | Inconnu {
  const sens = trajetEvalue.value;
  if (sens !== undefined) return ORIENTATION_DU_SENS[sens];
  return repetition.is("1_OUI") ? "aller" : undefined;
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
