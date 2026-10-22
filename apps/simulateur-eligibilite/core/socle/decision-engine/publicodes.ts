// Le moteur de décision : des faits aux cibles, par les règles publicodes d'un
// modèle.
//
// Le socle ne connaît ni les règles ni leurs noms : le modèle les lui donne.
// Ce fichier est le seul du socle à importer publicodes. Le modèle le prend
// ici, hors du point d'entrée du socle, pour que publicodes reste hors du
// chunk d'entrée.

import Engine, { type RawPublicodes } from "publicodes";
import type { Fait } from "./fait.ts";

/**
 * Des cibles telles que les règles les rendent. Chacune peut rester
 * indéfinie, faute d'un fait dont elle dépend : ce n'est pas une décision.
 */
type Evaluated<Cibles> = {
  readonly [Nom in keyof Cibles]: Cibles[Nom] | undefined;
};

/** Ce que des règles calculent pour des faits. */
export type DecisionEngine<Faits, Cibles> = {
  /** Toutes les cibles de ces faits : la préconisation. */
  cibles(faits: Faits): Evaluated<Cibles>;
  /** Une seule cible de ces faits, quand le questionnaire en a besoin en route. */
  cible<Nom extends keyof Cibles>(
    faits: Faits,
    nom: Nom,
  ): Cibles[Nom] | undefined;
};

/** Le moteur de ces règles, qui rend ces cibles. */
export function publicodesEngine<
  Faits extends Readonly<Record<string, Fait<boolean | number | string>>>,
  Cibles extends Readonly<Record<string, unknown>>,
>(
  rules: RawPublicodes<string>,
  cibles: readonly (keyof Cibles & string)[],
): DecisionEngine<Faits, Cibles> {
  // Compiler les règles coûte : le moteur est créé au premier calcul, puis gardé.
  let engine: Engine | undefined;
  const on = (faits: Faits) => {
    engine ??= new Engine(rules);
    engine.setSituation(situationOf(faits));
    return engine;
  };
  return {
    cibles: (faits) => {
      const evaluated = on(faits);
      return Object.fromEntries(
        cibles.map((cible) => [cible, evaluated.evaluate(cible).nodeValue]),
      ) as Evaluated<Cibles>;
    },
    cible: (faits, nom) =>
      on(faits).evaluate(nom as string).nodeValue as Cibles[typeof nom],
  };
}

// ---- implémentation ----

// Seuls les faits établis partent aux règles : publicodes refuse une valeur
// `undefined`, et une clé absente laisse indéfini ce qui en dépend. Les règles
// lisent un booléen comme « oui » ou « non ».
function situationOf(
  faits: Readonly<Record<string, Fait<boolean | number | string>>>,
) {
  return Object.fromEntries(
    Object.entries(faits).flatMap(([fait, { value }]) =>
      value === undefined ? [] : [[fait, asRuleValue(value)]],
    ),
  );
}

function asRuleValue(value: boolean | number | string): string | number {
  if (typeof value !== "boolean") return value;
  return value ? "oui" : "non";
}
