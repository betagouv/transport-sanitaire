// Tests du mart « taux par plateforme » (sans mock, sans I/O) : on appelle `calculer()` sur
// des trajets synthétiques et on vérifie les deux taux, la distribution par établissement
// et le sort des trajets sans finess.

import { describe, expect, it } from "vitest";
import { MartTauxPlateforme } from "../src/04-marts/mart-taux-plateforme.ts";
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

const reference = (finess_juridique: string, nb_trajets: number) =>
  trajet({
    role: "referentiel-national",
    plateforme: "",
    finess_juridique,
    nb_trajets,
  });

describe("MartTauxPlateforme.calculer", () => {
  const mart = new MartTauxPlateforme(["2024"]);

  it("rapporte chaque plateforme au remboursement national et à celui de ses seuls établissements", () => {
    const rows = mart.calculer([
      reference("J1", 100),
      reference("J2", 300),
      reference("J3", 600),
      trajet({ finess_juridique: "J1", nb_trajets: 10 }),
      trajet({ finess_juridique: "J2", nb_trajets: 90 }),
      trajet({ finess_juridique: "", nb_trajets: 5 }), // sans finess : hors numérateur
      trajet({
        plateforme: "Plateforme B",
        finess_juridique: "J3",
        nb_trajets: 60,
      }),
      trajet({ annee: "2023", nb_trajets: 999 }), // autre année
      trajet({ enveloppe: "Article 80", nb_trajets: 999 }),
    ]);
    expect(rows).toEqual([
      {
        plateforme: "Plateforme A",
        annee: "2024",
        nb_etablissements: 2,
        nb_plateforme: 100,
        nb_plateforme_sans_finess: 5,
        nb_cnam_etablissements: 400,
        taux_etablissements: 0.25,
        nb_cnam_national: 1000,
        taux_national: 0.1,
        ratio_q1: 0.15,
        ratio_mediane: 0.2,
        ratio_q3: 0.25,
      },
      {
        plateforme: "Plateforme B",
        annee: "2024",
        nb_etablissements: 1,
        nb_plateforme: 60,
        nb_plateforme_sans_finess: 0,
        nb_cnam_etablissements: 600,
        taux_etablissements: 0.1,
        nb_cnam_national: 1000,
        taux_national: 0.06,
        ratio_q1: 0.1,
        ratio_mediane: 0.1,
        ratio_q3: 0.1,
      },
    ]);
  });

  it("écarte de la distribution un établissement sans remboursement, et laisse les taux vides sans dénominateur", () => {
    const rows = mart.calculer([
      trajet({ finess_juridique: "J1", nb_trajets: 7 }),
    ]);
    expect(rows).toMatchObject([
      {
        nb_etablissements: 1,
        nb_plateforme: 7,
        taux_etablissements: "",
        taux_national: "",
        ratio_mediane: "",
      },
    ]);
  });
});
