// Les scénarios de démonstration de l'éditeur, rejoués contre les règles : les
// 133 actifs de `integration_resultats/scenarios-demonstration.json` du paquet
// v10.1.3, sous ses identifiants.
//
// Ses scénarios partent des faits, comme l'oracle : tous à « non », P1 et P2
// complètes. La fixture n'en garde que ce qui change, avec `null` pour un fait
// que le scénario omet, donc inconnu. Elle garde ses 55 cibles, `null` pour une
// cible qu'il ne sait pas calculer : son banc ne distingue pas l'inconnu du sans
// objet, on fait de même.
//
// Seules ses cibles sont rejouées. Le reste de sa trace (réponses, précisions,
// partie terrestre) est une donnée d'entrée de ses textes, que nos règles ne
// calculent pas.

import { describe, expect, it } from "vitest";
import { type Changements, preconiser } from "./faits-de-l-oracle";
import FIXTURE from "./scenarios-de-demonstration.json" with { type: "json" };

type Scenario = {
  readonly id: string;
  readonly faits: Readonly<Record<string, boolean | null | undefined>>;
  readonly cibles: Readonly<Record<string, unknown>>;
};

const SCENARIOS: readonly Scenario[] = FIXTURE.scenarios;

describe("les scénarios de démonstration de l'éditeur", () => {
  it("sont les 133 actifs de son paquet", () => {
    expect(SCENARIOS).toHaveLength(133);
  });

  it.each(SCENARIOS.map((scenario) => [scenario.id, scenario] as const))(
    "%s",
    (_id, { faits, cibles }) => {
      const valeurs: Readonly<Record<string, unknown>> = preconiser(
        changementsDe(faits),
      );
      const obtenues = Object.fromEntries(
        Object.keys(cibles).map((cible) => [cible, valeurs[cible] ?? null]),
      );
      expect(obtenues).toEqual(cibles);
    },
  );
});

// ---- implémentation ----

// Les faits de la fixture, un `null` devenant un fait absent.
function changementsDe(faits: Scenario["faits"]): Changements {
  return Object.fromEntries(
    Object.entries(faits).map(([fait, value]) => [fait, value ?? undefined]),
  );
}
