// Tests du mart de synthèse (sans mock, sans I/O) : on appelle `calculer()` sur des lignes
// de rollup synthétiques et on vérifie les comptages, les classes de taille et les deux
// ratios.

import { describe, expect, it } from "vitest";
import { MartSynthese } from "../src/04-marts/mart-synthese.ts";
import { TOUS_TRANSPORTS } from "../src/04-marts/vehicules.ts";

// Ligne au format d'un rollup relu depuis son CSV : valeurs en chaînes.
function entite(
  nb_cnam: number,
  nb_plateforme: number,
  vehicule = TOUS_TRANSPORTS,
) {
  return {
    vehicule,
    nb_cnam: String(nb_cnam),
    nb_plateforme: String(nb_plateforme),
  };
}

describe("MartSynthese.calculer", () => {
  const rows = new MartSynthese(["2024"]).calculer("2024", "juridique", [
    entite(60_000, 6_000),
    entite(20_000, 0),
    entite(500, 50),
    entite(0, 7), // trajets plateforme sans remboursement
    entite(0, 0),
    entite(60_000, 6_000, "Ambulance"), // ligne véhicule : déjà dans « Tous transports »
  ]);
  const parTaille = Object.fromEntries(rows.map((r) => [r.taille, r]));

  it("compte sur la ligne « Toutes tailles » les entités connues, remboursées et couvertes, et donne les deux ratios", () => {
    expect(parTaille["Toutes tailles"]).toEqual({
      annee: "2024",
      grain: "juridique",
      taille: "Toutes tailles",
      nb_entites: 5,
      nb_avec_remboursement: 3,
      nb_avec_plateforme: 3,
      part_entites_couvertes: 0.6,
      nb_cnam: 80_500,
      nb_cnam_couvert: 60_500,
      part_cnam_couvert: 0.7516,
      nb_plateforme: 6_057,
      ratio: 0.0752,
      ratio_couvert: 0.1001,
    });
  });

  it("range chaque entité dans sa classe de taille, d'après son remboursement de l'année", () => {
    expect(rows.map((r) => [r.taille, r.nb_entites])).toEqual([
      ["1. Moins de 1 000 trajets", 1],
      ["2. 1 000 à 9 999 trajets", 0],
      ["3. 10 000 à 49 999 trajets", 1],
      ["4. 50 000 trajets et plus", 1],
      ["0. Sans remboursement", 2],
      ["Toutes tailles", 5],
    ]);
  });

  it("laisse les parts vides là où il n'y a pas de dénominateur", () => {
    expect(parTaille["0. Sans remboursement"]).toMatchObject({
      nb_avec_plateforme: 1,
      nb_plateforme: 7,
      part_cnam_couvert: "",
      ratio: "",
    });
  });
});
