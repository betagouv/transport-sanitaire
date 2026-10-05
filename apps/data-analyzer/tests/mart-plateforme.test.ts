// Tests du mart par plateforme (sans mock, sans I/O) : on appelle `calculer()` sur des
// trajets synthétiques et on vérifie qu'une cellule partagée rend à chaque plateforme son
// volume, que le dénominateur est répété, et que la forme annuelle somme les véhicules.

import { describe, expect, it } from "vitest";
import { MartPlateforme } from "../src/04-marts/mart-plateforme.ts";
import type { TrajetReconcilieRow } from "../src/contrats.ts";

function trajet(p: Partial<TrajetReconcilieRow>): TrajetReconcilieRow {
  return {
    role: "plateforme",
    source: "src",
    plateforme: "Plateforme A",
    finess_juridique: "J1",
    finess_geographique: "",
    ght_code: "",
    ght_libelle: "",
    enveloppe: "Hors Article 80",
    annee: "2024",
    vehicule_canonique: "Ambulance",
    nb_trajets: 0,
    ...p,
  };
}

const reference = (p: Partial<TrajetReconcilieRow>) =>
  trajet({ role: "referentiel-national", plateforme: "", ...p });

describe("MartPlateforme.calculer, par véhicule", () => {
  const mart = new MartPlateforme({
    fichier: "x.csv",
    log: "x",
    grain: (t) => t.finess_juridique,
    identite: (cle) => ({ finess_juridique: cle }),
  });

  it("rend à chaque plateforme d'une cellule son volume et sa part, le dénominateur étant répété", () => {
    const rows = mart.calculer([
      reference({ nb_trajets: 100 }),
      trajet({ plateforme: "Plateforme B", nb_trajets: 30 }),
      trajet({ plateforme: "Plateforme A", nb_trajets: 10 }),
      trajet({ plateforme: "Plateforme A", nb_trajets: 5 }),
    ]);
    expect(rows).toEqual([
      {
        finess_juridique: "J1",
        annee: "2024",
        vehicule: "Ambulance",
        plateforme: "Plateforme A",
        nb_plateforme: 15,
        nb_reference: 100,
        part: 0.15,
        alerte_qualite: "",
      },
      {
        finess_juridique: "J1",
        annee: "2024",
        vehicule: "Ambulance",
        plateforme: "Plateforme B",
        nb_plateforme: 30,
        nb_reference: 100,
        part: 0.3,
        alerte_qualite: "",
      },
    ]);
  });

  it("ne sort aucune ligne pour une cellule sans trajet plateforme, ni pour l'article 80", () => {
    const rows = mart.calculer([
      reference({ nb_trajets: 100 }),
      trajet({ nb_trajets: 0 }),
      trajet({ enveloppe: "Article 80", nb_trajets: 50 }),
    ]);
    expect(rows).toEqual([]);
  });

  it("laisse la part vide sans dénominateur et signale une plateforme qui le dépasse seule", () => {
    const rows = mart.calculer([
      trajet({ finess_juridique: "J1", nb_trajets: 7 }),
      reference({ finess_juridique: "J2", nb_trajets: 10 }),
      trajet({ finess_juridique: "J2", nb_trajets: 12 }),
    ]);
    expect(rows).toMatchObject([
      { finess_juridique: "J1", part: "", alerte_qualite: "" },
      { finess_juridique: "J2", part: 1.2, alerte_qualite: "part>1" },
    ]);
  });
});

describe("MartPlateforme.calculer, forme annuelle", () => {
  const mart = new MartPlateforme({
    fichier: "x.csv",
    log: "x",
    annee: "2024",
    grain: (t) => t.finess_juridique,
    identite: (cle) => ({ finess_juridique: cle }),
  });

  it("somme les véhicules de l'année et rapporte chaque plateforme à tout le remboursement de l'entité", () => {
    const rows = mart.calculer([
      reference({ vehicule_canonique: "Ambulance", nb_trajets: 100 }),
      reference({ vehicule_canonique: "Assis", nb_trajets: 300 }),
      reference({ annee: "2025", nb_trajets: 999 }),
      trajet({ vehicule_canonique: "Ambulance", nb_trajets: 40 }),
      trajet({ annee: "2025", nb_trajets: 999 }),
      trajet({
        plateforme: "Plateforme B",
        vehicule_canonique: "Assis",
        nb_trajets: 20,
      }),
    ]);
    expect(rows).toEqual([
      {
        finess_juridique: "J1",
        annee: "2024",
        plateforme: "Plateforme A",
        nb_plateforme: 40,
        nb_cnam: 400,
        ratio: 0.1,
        alerte_qualite: "",
      },
      {
        finess_juridique: "J1",
        annee: "2024",
        plateforme: "Plateforme B",
        nb_plateforme: 20,
        nb_cnam: 400,
        ratio: 0.05,
        alerte_qualite: "",
      },
    ]);
  });
});
