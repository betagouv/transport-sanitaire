// Tests du mart de répartition (sans mock, sans I/O) : on appelle `calculer()` sur des
// lignes de rollup synthétiques et on vérifie le classement par tranche de ratio.

import { describe, expect, it } from "vitest";
import { MartRepartition } from "../src/04-marts/mart-repartition.ts";
import { TOUS_TRANSPORTS } from "../src/04-marts/vehicules.ts";

// Ligne au format d'un rollup relu depuis son CSV : valeurs en chaînes.
function ligne(
  nb_plateforme: number,
  nb_cnam: number,
  p: Record<string, string> = {},
) {
  return {
    vehicule: TOUS_TRANSPORTS,
    plateforme: "Plateforme A",
    nb_plateforme: String(nb_plateforme),
    nb_cnam: String(nb_cnam),
    ...p,
  };
}

describe("MartRepartition.calculer", () => {
  const mart = new MartRepartition(["2024"]);
  const comptes = (
    rows: Record<string, string | number>[],
    plateforme: string,
  ) =>
    rows
      .filter((r) => r.plateforme === plateforme && r.nb_etablissements !== 0)
      .map((r) => [r.tranche, r.nb_etablissements, r.nb_plateforme, r.nb_cnam]);

  it("classe chaque établissement dans sa tranche de ratio, bornes basses incluses", () => {
    const rows = mart.calculer(
      "2024",
      [
        ligne(0, 100), // aucun trajet plateforme
        ligne(0, 0), // aucun volume : pas de ratio à classer
        ligne(5, 1000), // 0,5 %
        ligne(10, 1000), // 1 % : borne basse de « 1 à 5 % »
        ligne(60, 100), // 60 %
        ligne(150, 100), // 150 %
        ligne(7, 0), // sans remboursement
        ligne(999, 1000, { vehicule: "Ambulance" }), // ligne véhicule : ignorée
      ],
      [],
    );
    expect(comptes(rows, "Toutes plateformes")).toEqual([
      ["0. Aucun trajet plateforme", 1, 0, 100],
      ["1. Moins de 1 %", 1, 5, 1000],
      ["2. 1 à 5 %", 1, 10, 1000],
      ["6. 50 à 100 %", 1, 60, 100],
      ["7. Plus de 100 %", 1, 150, 100],
      ["8. Sans remboursement", 1, 7, 0],
    ]);
  });

  it("donne à chaque plateforme sa répartition, sans tranche « aucun trajet », et garde les tranches vides", () => {
    const rows = mart.calculer(
      "2024",
      [],
      [ligne(30, 100), ligne(20, 1000, { plateforme: "Plateforme B" })],
    );
    expect(comptes(rows, "Plateforme A")).toEqual([
      ["5. 25 à 50 %", 1, 30, 100],
    ]);
    expect(comptes(rows, "Plateforme B")).toEqual([
      ["2. 1 à 5 %", 1, 20, 1000],
    ]);
    const tranchesA = rows.filter((r) => r.plateforme === "Plateforme A");
    expect(tranchesA).toHaveLength(8);
    expect(tranchesA[0]).toEqual({
      annee: "2024",
      plateforme: "Plateforme A",
      tranche: "1. Moins de 1 %",
      nb_etablissements: 0,
      nb_plateforme: 0,
      nb_cnam: 0,
    });
  });
});
