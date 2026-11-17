// Ce que le début d'une simulation dit de son rattachement (ADR-0053) : les ids
// du référentiel quand il en a. Les noms ne partent pas : le contrat v10.2.2
// ne les connaît pas (#497).

import { describe, expect, it } from "vitest";
import type { RattachementSaisi } from "../../../shared/rattachement-saisi";
import { journalDeTest } from "./journal-de-test";

function demarrer(rattachement: RattachementSaisi | null) {
  const { analytics, envoyes } = journalDeTest();
  analytics.startASimulation.execute({
    rattachement,
    seeded: false,
    modelVersion: "10.2.1",
  });
  return envoyes[0];
}

describe("le rattachement d'un parcours", () => {
  it("un service de la liste : les deux ids", () => {
    const debut = demarrer({
      etabId: "e_chu_grenoble",
      etabLibelle: "CHU Grenoble Alpes",
      serviceId: "s_grenoble_cardio",
      serviceLibelle: "Cardiologie",
    });

    expect(debut).toMatchObject({
      establishment_id: "e_chu_grenoble",
      service_id: "s_grenoble_cardio",
    });
  });

  it("un service saisi sous « Autre » : l'id d'« Autre »", () => {
    const debut = demarrer({
      etabId: "e_chu_grenoble",
      etabLibelle: "CHU Grenoble Alpes",
      serviceId: "s_grenoble_autre",
      serviceLibelle: "Autre",
      serviceEstAutre: true,
      serviceLibre: " Néphrologie ",
    });

    expect(debut).toMatchObject({
      establishment_id: "e_chu_grenoble",
      service_id: "s_grenoble_autre",
    });
  });

  it("un établissement saisi : sans id", () => {
    const debut = demarrer({
      etabId: "",
      etabEstAutre: true,
      etabLibre: "Clinique des Cèdres",
      serviceLibre: "Urgences",
    });

    expect(debut?.establishment_id).toBeUndefined();
    expect(debut?.service_id).toBeUndefined();
  });

  it("le rattachement de repli, sans référentiel : ses ids", () => {
    const debut = demarrer({ etabId: "autre", serviceId: "autre" });

    expect(debut).toMatchObject({
      establishment_id: "autre",
      service_id: "autre",
    });
  });
});
