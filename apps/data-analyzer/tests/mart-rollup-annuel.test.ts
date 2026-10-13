// Tests du rollup annuel (sans mock, sans I/O) : on appelle `calculer()` sur des lignes de
// mart de ratio synthétiques et on vérifie les règles (une ligne par véhicule plus leur
// somme, année filtrée, ratio, entités sans plateforme ou sans remboursement, ratio>1)
// ainsi que les deux configurations livrées, GHT et établissement.

import { describe, expect, it } from "vitest";
import {
  MartRollupAnnuel,
  type MartRollupAnnuelConfig,
} from "../src/04-marts/mart-rollup-annuel.ts";
import { TOUS_TRANSPORTS } from "../src/04-marts/vehicules.ts";

// Ligne au format d'un mart de ratio relu depuis son CSV : valeurs en chaînes.
function ligne(p: Record<string, string>): Record<string, string> {
  return {
    ght_code: "G1",
    annee: "2024",
    vehicule: "Ambulance",
    plateforme: "Plateforme A",
    nb_plateforme: "0",
    nb_reference: "0",
    ...p,
  };
}

// La configuration qui produit mart_ght_<année> : elle sert de témoin de non-régression.
function parGht(p: Partial<MartRollupAnnuelConfig> = {}): MartRollupAnnuel {
  return new MartRollupAnnuel({
    annee: "2024",
    source: "mart_ght.csv",
    fichier: "mart_ght_2024.csv",
    log: "ght_2024",
    cle: (r) => r.ght_code ?? "",
    identite: (r) => ({ ght_code: r.ght_code ?? "" }),
    univers: () => new Map(),
    ...p,
  });
}

type Row = Record<string, string | number>;

/** Les seules lignes « Tous transports », une par entité. */
const tous = (rows: Row[]) =>
  rows.filter((r) => r.vehicule === TOUS_TRANSPORTS);

describe("MartRollupAnnuel.calculer", () => {
  it("sort une ligne par véhicule et une ligne qui les somme, pour la seule année demandée", () => {
    const rows = parGht().calculer([
      ligne({
        vehicule: "Ambulance",
        nb_plateforme: "30",
        nb_reference: "100",
      }),
      ligne({ vehicule: "Assis", nb_plateforme: "20", nb_reference: "50" }),
      ligne({ annee: "2023", nb_plateforme: "999" }), // autre année : volume ignoré
      ligne({ ght_code: "", nb_plateforme: "999" }), // clé vide : ligne ignorée
    ]);
    const mesures = { ght_code: "G1", annee: "2024", alerte_qualite: "" };
    expect(rows).toEqual([
      {
        ...mesures,
        vehicule: "Ambulance",
        plateforme: "Plateforme A",
        nb_plateforme: 30,
        nb_cnam: 100,
        ratio: 0.3,
      },
      {
        ...mesures,
        vehicule: "Assis",
        plateforme: "Plateforme A",
        nb_plateforme: 20,
        nb_cnam: 50,
        ratio: 0.4,
      },
      {
        ...mesures,
        vehicule: "Autre",
        plateforme: "",
        nb_plateforme: 0,
        nb_cnam: 0,
        ratio: "",
      },
      {
        ...mesures,
        vehicule: TOUS_TRANSPORTS,
        plateforme: "Plateforme A",
        nb_plateforme: 50,
        nb_cnam: 150,
        ratio: 0.3333,
      },
    ]);
  });

  it("liste toute entité : ratio 0 sans trajet plateforme, ratio vide sans remboursement", () => {
    const rows = parGht().calculer([
      ligne({
        ght_code: "SANS_PLATEFORME",
        plateforme: "",
        nb_reference: "100",
      }),
      ligne({ ght_code: "SANS_REMBOURSEMENT", nb_plateforme: "7" }),
      ligne({ ght_code: "ZERO_PARTOUT", plateforme: "" }),
    ]);
    expect(tous(rows)).toMatchObject([
      { ght_code: "SANS_PLATEFORME", plateforme: "", ratio: 0 },
      { ght_code: "SANS_REMBOURSEMENT", nb_plateforme: 7, ratio: "" },
      { ght_code: "ZERO_PARTOUT", nb_plateforme: 0, nb_cnam: 0, ratio: "" },
    ]);
  });

  it("liste aussi les entités sans ligne dans l'année : celles d'une autre année et celles de l'univers", () => {
    const rows = parGht().calculer(
      [ligne({ ght_code: "AUTRE_ANNEE", annee: "2023", nb_plateforme: "9" })],
      new Map([["UNIVERS", { ght_code: "UNIVERS" }]]),
    );
    expect(rows).toHaveLength(8); // deux entités, quatre lignes chacune
    expect(tous(rows)).toMatchObject([
      { ght_code: "AUTRE_ANNEE", nb_plateforme: 0, nb_cnam: 0, ratio: "" },
      { ght_code: "UNIVERS", nb_plateforme: 0, nb_cnam: 0, ratio: "" },
    ]);
  });

  it("somme sur la ligne « Tous transports » une entité dont chaque véhicule ne porte qu'un membre du ratio", () => {
    const rows = parGht().calculer([
      ligne({ vehicule: "Ambulance", plateforme: "", nb_reference: "100" }),
      ligne({ vehicule: "Assis", nb_plateforme: "5" }),
    ]);
    expect(tous(rows)).toMatchObject([
      { nb_plateforme: 5, nb_cnam: 100, ratio: 0.05 },
    ]);
  });

  it("joint sur la ligne « Tous transports » les plateformes de tous les véhicules, sans doublon", () => {
    const rows = parGht().calculer([
      ligne({ vehicule: "Ambulance", plateforme: "Plateforme B" }),
      ligne({ vehicule: "Assis", plateforme: "Plateforme A + Plateforme B" }),
    ]);
    expect(rows.map((r) => r.plateforme)).toEqual([
      "Plateforme B",
      "Plateforme A + Plateforme B",
      "",
      "Plateforme A + Plateforme B",
    ]);
  });

  it("ne retient que l'année de sa configuration", () => {
    const rows = parGht({ annee: "2025" }).calculer([
      ligne({ nb_plateforme: "30", nb_reference: "100" }),
      ligne({ annee: "2025", nb_plateforme: "10", nb_reference: "40" }),
    ]);
    expect(tous(rows)).toMatchObject([
      { annee: "2025", nb_plateforme: 10, nb_cnam: 40, ratio: 0.25 },
    ]);
  });

  it("signale ratio > 1 sur le véhicule qui le porte, même quand la somme repasse sous 1", () => {
    const rows = parGht().calculer([
      ligne({
        vehicule: "Ambulance",
        nb_plateforme: "120",
        nb_reference: "100",
      }),
      ligne({ vehicule: "Assis", nb_plateforme: "0", nb_reference: "900" }),
    ]);
    expect(rows.map((r) => [r.vehicule, r.ratio, r.alerte_qualite])).toEqual([
      ["Ambulance", 1.2, "ratio>1"],
      ["Assis", 0, ""],
      ["Autre", "", ""],
      [TOUS_TRANSPORTS, 0.12, ""],
    ]);
  });

  it("habille les lignes avec les colonnes d'identité de la configuration, ici au grain établissement", () => {
    const parEtablissement = parGht({
      cle: (r) => r.finess_juridique ?? "",
      identite: (r) => ({
        finess_juridique: r.finess_juridique ?? "",
        nom: r.nom ?? "",
      }),
    });
    const rows = parEtablissement.calculer([
      ligne({ finess_juridique: "J1", nom: "CH Test", nb_reference: "40" }),
      // L'identité vient de la première ligne rencontrée, pas des suivantes.
      ligne({
        finess_juridique: "J1",
        nom: "AUTRE LIBELLE",
        vehicule: "Assis",
      }),
    ]);
    expect(rows).toHaveLength(4);
    expect(rows.every((r) => r.nom === "CH Test")).toBe(true);
  });
});
