// Ce qu'un bloc de R2 lit des cibles et des faits (#260), et ce que tous
// lisent des réponses. Chaque bloc le déclare à côté de lui, comme un fait
// déclare ses questions, et ne reçoit que ça :
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

import type { Cibles } from "../../../../../core/models/eligibilite/cibles/noms";
import type { Faits } from "../../../../../core/models/eligibilite/faits/noms";
import { given } from "../../../../../core/models/eligibilite/questions/reponses";
import { constant, type Value, type ValueOf } from "../../../../../core/socle";
import type { Precisions } from "./precisions";

type CibleNom = keyof Cibles & string;
type FaitNom = keyof Faits & string;

/** Ces cibles et ces faits, sous leur nom. */
export type Lu<C extends CibleNom, F extends FaitNom> = {
  readonly cibles: Pick<Cibles, C>;
  readonly faits: Pick<Faits, F>;
};

/** Ce que les blocs de R2 lisent des réponses, hors des faits et des cibles. */
export type ReponsesLues = {
  /**
   * Les numéros de Q1.2 réellement choisis, tels que les réponses les disent.
   * Vide si Q1.2 ne s'est pas posée (Q1.1 prouve alors qu'elle ne s'applique
   * pas). Jamais refaits depuis `fait_critere_tap`, qui les regroupe.
   */
  readonly criteres: readonly number[];
  /** La réponse à Q2.8.5, si elle est validée. */
  readonly permissionRepeated?: boolean;
  /**
   * Une partie terrestre d'un trajet en ligne régulière est prouvée. Aucune
   * question ne la pose : Q2.3.2 dit la ligne régulière, pas ce qui l'entoure.
   * La clé reste donc absente.
   */
  readonly partieTerrestre?: true;
  /**
   * Un séjour réel est prouvé. Ce n'est pas une clé de l'éditeur : un texte de
   * R2 le lit ici, plutôt que de redécouper l'identifiant du lexique.
   */
  readonly sejourReel?: true;
  readonly precisions: Precisions;
};

/** Ce que reçoit un bloc : ce qu'il déclare, et ce que R2 lit des réponses. */
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
