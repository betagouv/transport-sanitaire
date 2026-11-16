// Ce que le début d'une simulation dit de son rattachement (ADR-0053) : les ids
// du référentiel quand il en a, et les noms, lus dans la liste ou saisis.

import { describe, expect, it } from "vitest";
import type { RattachementSaisi } from "../../../shared/rattachement-saisi";
import { journalDeTest } from "./journal-de-test";

function demarrer(rattachement: RattachementSaisi | null) {
  const { analytics, envoyes } = journalDeTest();
  analytics.startASimulation.execute({
    rattachement,
    seeded: false,
    version: "10.1.8",
  });
  return envoyes[0];
}

describe("le rattachement d'un parcours", () => {
  it("un service de la liste : les deux ids, et les noms de la liste", () => {
    const debut = demarrer({
      etabId: "e_chu_grenoble",
      etabLibelle: "CHU Grenoble Alpes",
      serviceId: "s_grenoble_cardio",
      serviceLibelle: "Cardiologie",
    });

    expect(debut).toMatchObject({
      establishment_id: "e_chu_grenoble",
      establishment_name: "CHU Grenoble Alpes",
      service_id: "s_grenoble_cardio",
      service_name: "Cardiologie",
    });
  });

  it("un service saisi sous « Autre » : l'id d'« Autre », et le nom saisi", () => {
    const debut = demarrer({
      etabId: "e_chu_grenoble",
      etabLibelle: "CHU Grenoble Alpes",
      serviceId: "s_grenoble_autre",
      serviceLibelle: "Autre",
      serviceEstAutre: true,
      serviceLibre: " Néphrologie ",
    });

    expect(debut).toMatchObject({
      service_id: "s_grenoble_autre",
      service_name: "Néphrologie",
    });
  });

  it("un établissement saisi : ses noms, sans id", () => {
    const debut = demarrer({
      etabId: "",
      etabEstAutre: true,
      etabLibre: "Clinique des Cèdres",
      serviceLibre: "Urgences",
    });

    expect(debut).toMatchObject({
      establishment_name: "Clinique des Cèdres",
      service_name: "Urgences",
    });
    expect(debut?.establishment_id).toBeUndefined();
    expect(debut?.service_id).toBeUndefined();
  });

  it("le rattachement de repli, sans référentiel : ses ids, sans nom", () => {
    const debut = demarrer({ etabId: "autre", serviceId: "autre" });

    expect(debut).toMatchObject({
      establishment_id: "autre",
      service_id: "autre",
    });
    expect(debut?.establishment_name).toBeUndefined();
    expect(debut?.service_name).toBeUndefined();
  });
});
