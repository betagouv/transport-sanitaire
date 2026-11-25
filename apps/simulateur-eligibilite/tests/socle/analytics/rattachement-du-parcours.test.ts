// Ce que le début d'une simulation dit de son rattachement : les ids du
// référentiel, et rien d'autre. Les noms ne partent pas : le contrat v10.2.2 ne
// les connaît pas. Une saisie libre part avec les ids que le référentiel lui
// donne, jamais celui de l'entrée « Autre ».

import { describe, expect, it } from "vitest";
import { RegisterTheRattachement } from "../../../front/socle/rattachement/register-the-rattachement.usecase";
import type { RattachementSaisi } from "../../../shared/rattachement-saisi.vo";
import type { Referentiel } from "../../../shared/referentiel.port";
import { snapshotReferentiel } from "../../../shared/snapshot-referentiel.adapter";
import { journalDeTest } from "./journal-de-test";

describe("le rattachement d'un parcours", () => {
  it("un service de la liste : les deux ids", async () => {
    const debut = await demarrer(QUI_ENREGISTRE, {
      etabId: "e_chu_grenoble",
      serviceId: "s_grenoble_cardio",
    });

    expect(debut).toMatchObject({
      establishment_id: "e_chu_grenoble",
      service_id: "s_grenoble_cardio",
    });
  });

  it("une structure : l'établissement fourre-tout et le service de la structure", async () => {
    const debut = await demarrer(QUI_ENREGISTRE, {
      etabId: "e_liberal_cnam",
      serviceId: "s_assurance_maladie",
    });

    expect(debut).toMatchObject({
      establishment_id: "e_liberal_cnam",
      service_id: "s_assurance_maladie",
    });
  });

  it("un service saisi sous « Autre » : l'id du service créé, jamais celui d'« Autre »", async () => {
    const debut = await demarrer(QUI_ENREGISTRE, SERVICE_SAISI);

    expect(debut).toMatchObject({
      establishment_id: "e_chu_grenoble",
      service_id: "s_cree",
    });
  });

  it("un établissement saisi : les ids de l'établissement et du service créés", async () => {
    const debut = await demarrer(QUI_ENREGISTRE, ETABLISSEMENT_SAISI);

    expect(debut).toMatchObject({
      establishment_id: "e_cree",
      service_id: "s_cree",
    });
  });

  it("aucun nom, saisi ou choisi, ne part avec l'événement", async () => {
    const debuts = [
      await demarrer(QUI_ENREGISTRE, SERVICE_SAISI),
      await demarrer(QUI_ENREGISTRE, ETABLISSEMENT_SAISI),
      await demarrer(MUET, ETABLISSEMENT_SAISI),
    ];

    const envoye = JSON.stringify(debuts);
    for (const nom of ["Néphrologie", "Clinique des Cèdres", "Urgences"]) {
      expect(envoye).not.toContain(nom);
    }
  });

  it("un service saisi sous « Autre », référentiel muet : l'établissement seul", async () => {
    const debut = await demarrer(MUET, SERVICE_SAISI);

    expect(debut?.establishment_id).toBe("e_chu_grenoble");
    expect(debut).not.toHaveProperty("service_id");
  });

  it("un établissement saisi, référentiel muet : sans id", async () => {
    const debut = await demarrer(MUET, ETABLISSEMENT_SAISI);

    expect(debut).not.toHaveProperty("establishment_id");
    expect(debut).not.toHaveProperty("service_id");
  });

  it("une saisie libre, sur une source qui n'écrit pas : comme un référentiel muet", async () => {
    const debut = await demarrer(snapshotReferentiel, SERVICE_SAISI);

    expect(debut?.establishment_id).toBe("e_chu_grenoble");
    expect(debut).not.toHaveProperty("service_id");
  });

  it("sans liste des établissements : sans id, pas de rattachement de repli", async () => {
    const debut = await demarrer(MUET, { etabId: "" });

    expect(debut).not.toHaveProperty("establishment_id");
    expect(debut).not.toHaveProperty("service_id");
  });
});

// ---- implémentation ----

const SERVICE_SAISI: RattachementSaisi = {
  etabId: "e_chu_grenoble",
  serviceId: "s_grenoble_autre",
  serviceEstAutre: true,
  serviceLibre: " Néphrologie ",
};

const ETABLISSEMENT_SAISI: RattachementSaisi = {
  etabId: "",
  etabEstAutre: true,
  etabLibre: "Clinique des Cèdres",
  serviceLibre: "Urgences",
};

// Un référentiel qui enregistre la saisie libre : il donne l'établissement de
// la saisie, ou celui qu'il crée, et le service qu'il crée.
const QUI_ENREGISTRE: Referentiel = {
  ...snapshotReferentiel,
  async enrichirDepuisSaisie({ etabId }) {
    return { etabId: etabId || "e_cree", serviceId: "s_cree" };
  },
};

const MUET: Referentiel = {
  ...snapshotReferentiel,
  async enrichirDepuisSaisie() {
    throw new Error("Grist ne répond pas");
  },
};

// Le prescripteur se rattache, puis la simulation démarre.
async function demarrer(referentiel: Referentiel, saisie: RattachementSaisi) {
  const rattachement = await new RegisterTheRattachement(referentiel).execute(
    saisie,
  );
  const { analytics, envoyes } = journalDeTest();
  analytics.startASimulation.execute({
    rattachement,
    seeded: false,
    modelVersion: "10.2.1",
  });
  return envoyes[0];
}
