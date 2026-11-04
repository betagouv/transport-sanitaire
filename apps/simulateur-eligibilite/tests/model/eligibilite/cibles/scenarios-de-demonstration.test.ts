// Les 128 scénarios de test tirés des démonstrations de l'éditeur, rejoués
// contre nos règles. Ils viennent de son paquet v10.1.4
// (`integration_resultats/scenarios-demonstration.json`). Il y en a un par issue
// et par mode de transport, ou par variante d'une issue.
//
// Un scénario part de la base de l'oracle : tous les faits à « non », P1 et P2
// complètes. La fixture ne garde que les faits qu'il change. `null` y marque un
// fait que l'éditeur omet : il est inconnu.
//
// L'assertion porte sur les 57 cibles. Comme l'éditeur, on lit chaque cible
// avec `?? null`. Une cible inconnue et une cible sans objet valent donc toutes
// deux `null`.
//
// Le reste de la trace de l'éditeur n'est pas testé : les réponses, les
// précisions, la partie terrestre. Il les fixe au départ, nos règles ne les
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
  it("sont les 128 actifs de son paquet", () => {
    expect(SCENARIOS).toHaveLength(128);
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

// Les faits de la fixture. Un `null` devient un fait absent.
function changementsDe(faits: Scenario["faits"]): Changements {
  return Object.fromEntries(
    Object.entries(faits).map(([fait, value]) => [fait, value ?? undefined]),
  );
}
