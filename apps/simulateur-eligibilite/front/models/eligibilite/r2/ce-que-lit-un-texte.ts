// Ce qu'un texte de R2 lit des cibles et des faits (#260). Chaque texte le
// déclare à côté de lui, comme un fait déclare ses questions, et ne reçoit
// que ça :
//
//   export const LU_PAR_LES_CARTES = luPar(
//     { cibles: given.cibles("cible_mode_id", "cible_fauteuil_roulant") },
//     LU_PAR_LA_PORTEE,
//   );
//   export function cartesDeLaFiche(issue, trace: TraceDe<typeof LU_PAR_LES_CARTES>)
//
// Un texte qui en appelle un autre inclut sa déclaration : sans elle, ce qu'il
// reçoit n'a pas ce que l'autre lit, et le typage le refuse. Ce que R2 lit est
// donc l'union de ce que ses textes déclarent.

import type { Cibles } from "../../../../core/models/eligibilite/declarations/cibles";
import type { Faits } from "../../../../core/models/eligibilite/declarations/faits";
import { given } from "../../../../core/models/eligibilite/question";
import { constant, type Value, type ValueOf } from "../../../../core/socle";
import type { ReponsesLues } from "./trace-du-resultat";

type CibleNom = keyof Cibles & string;
type FaitNom = keyof Faits & string;

/** Ces cibles et ces faits, sous leur nom. */
export type Lu<C extends CibleNom, F extends FaitNom> = {
  readonly cibles: Pick<Cibles, C>;
  readonly faits: Pick<Faits, F>;
};

/** Ce que reçoit un texte : ce qu'il déclare, et ce que R2 lit des réponses. */
export type TraceDe<Lit> = ValueOf<Lit> & ReponsesLues;

/**
 * Ce que lit un texte : ses cibles, ses faits, et ce que lisent les textes
 * qu'il appelle.
 */
export function luPar<
  C extends CibleNom = never,
  F extends FaitNom = never,
  const Avec extends readonly Value<Lu<never, never>>[] = [],
>(
  lit: {
    readonly cibles?: Value<Pick<Cibles, C>>;
    readonly faits?: Value<Pick<Faits, F>>;
  },
  ...avec: Avec
): Value<Lu<C | CiblesDe<Avec[number]>, F | FaitsDe<Avec[number]>>> {
  const propre = given.all({
    cibles: lit.cibles ?? RIEN,
    faits: lit.faits ?? RIEN,
  });
  const parts = [propre, ...avec];
  return given
    .all(Object.fromEntries(parts.map((part, rang) => [rang, part])))
    .compute((lus) => reunis(Object.values(lus))) as Value<
    Lu<C | CiblesDe<Avec[number]>, F | FaitsDe<Avec[number]>>
  >;
}

// ---- implémentation ----

type CiblesDe<Lit> =
  Lit extends Value<{ cibles: infer Lues }> ? keyof Lues & CibleNom : never;
type FaitsDe<Lit> =
  Lit extends Value<{ faits: infer Lus }> ? keyof Lus & FaitNom : never;

const RIEN = constant({});

function reunis(lus: readonly Lu<never, never>[]): Lu<never, never> {
  return {
    cibles: Object.assign({}, ...lus.map((lu) => lu.cibles)),
    faits: Object.assign({}, ...lus.map((lu) => lu.faits)),
  };
}
