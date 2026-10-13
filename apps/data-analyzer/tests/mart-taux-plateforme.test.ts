// Tests du mart « taux par plateforme » (sans mock, sans I/O) : on appelle `calculer()` sur
// des trajets synthétiques et on vérifie les deux taux, la distribution par établissement
// et le sort des trajets sans finess.

import { describe, expect, it } from "vitest";
import { MartTauxPlateforme } from "../src/04-marts/mart-taux-plateforme.ts";
import { TOUS_TRANSPORTS } from "../src/04-marts/vehicules.ts";
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

type Row = Record<string, string | number>;

/** Les seules lignes « Tous transports », une par plateforme et par année. */
const tous = (rows: Row[]) =>
  rows.filter((r) => r.vehicule === TOUS_TRANSPORTS);

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
    expect(tous(rows)).toEqual([
      {
        plateforme: "Plateforme A",
        annee: "2024",
        vehicule: TOUS_TRANSPORTS,
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
        vehicule: TOUS_TRANSPORTS,
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
    expect(tous(rows)).toMatchObject([
      {
        nb_etablissements: 1,
        nb_plateforme: 7,
        taux_etablissements: "",
        taux_national: "",
        ratio_mediane: "",
      },
    ]);
  });

  it("donne les mêmes taux véhicule par véhicule, chacun rapporté au remboursement de ce véhicule", () => {
    const assis = { vehicule_canonique: "Assis" } as const;
    const rows = mart.calculer([
      reference("J1", 100),
      trajet({
        role: "referentiel-national",
        plateforme: "",
        ...assis,
        nb_trajets: 400,
      }),
      trajet({ finess_juridique: "J1", nb_trajets: 20 }),
      trajet({ finess_juridique: "J1", ...assis, nb_trajets: 40 }),
    ]);
    const lecture = rows.map((r) => [
      r.vehicule,
      r.nb_plateforme,
      r.nb_cnam_national,
      r.taux_national,
    ]);
    expect(lecture).toEqual([
      ["Ambulance", 20, 100, 0.2],
      ["Assis", 40, 400, 0.1],
      [TOUS_TRANSPORTS, 60, 500, 0.12],
    ]);
  });
});
