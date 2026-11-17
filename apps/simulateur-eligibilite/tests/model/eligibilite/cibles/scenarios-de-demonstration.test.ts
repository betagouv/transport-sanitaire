// Les 128 scénarios de test tirés des démonstrations de l'éditeur, rejoués
// contre nos règles. Ils viennent de son paquet v10.1.8, correctif du 13 novembre
// (`integration_resultats/scenarios-demonstration.json`). Il y en a un par issue
// et par mode de transport, ou par variante d'une issue.
//
// Un scénario part de la base de l'oracle : tous les faits à « non », P1 et P2
// complètes. La fixture ne garde que les faits qu'il change. `null` y marque un
// fait que l'éditeur omet : il est inconnu.
//
// L'assertion porte sur les 63 cibles. Comme l'éditeur, on lit chaque cible
// avec `?? null`. Une cible inconnue et une cible sans objet valent donc toutes
// deux `null`.
//
// Le paquet v10.2.1 n'a pas régénéré la fixture. Son R31 fait passer
// l'étranger sans motif de DAP en ISSUE_CAISSE : on applique aux attendus le
// même écart que son test du moteur (`tests/moteur_v1021_a.mjs`).
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
      expect(obtenues).toEqual(selonR31(cibles));
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

// R31 (v10.2.1) : l'étranger sans motif de DAP va vers la caisse, sans
// document ni attente d'accord.
function selonR31(cibles: Scenario["cibles"]): Scenario["cibles"] {
  if (
    cibles.cible_issue_id !== "ISSUE_DAP_ETRANGER_A_EXAMINER" ||
    cibles.cible_dap_requise !== false
  ) {
    return cibles;
  }
  return {
    ...cibles,
    cible_issue_id: "ISSUE_CAISSE",
    cible_support_id: "AUCUN",
    cible_reason_code: "TRANSPORT_ETRANGER_CIRCUIT_A_CONFIRMER",
    cible_attente_accord: null,
    cible_reponse_explicite_caisse: null,
  };
}
