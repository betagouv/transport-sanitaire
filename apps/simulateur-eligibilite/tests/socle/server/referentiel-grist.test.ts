// @vitest-environment node
//
// La source Grist du référentiel, contre un Grist en mémoire : ce qu'une saisie
// libre y écrit, et ce qu'elle n'y écrit pas.

import { afterEach, describe, expect, it } from "vitest";
import { creerReferentielGrist } from "../../../server/rattachement/referentiel-grist.ts";
import {
  demarrerGrist,
  type GristDeTest,
  type Ligne,
} from "./grist-de-test.ts";

const CHU: Ligne = { id: 1, fields: { Id2: 10, Nom: "CHU Grenoble Alpes" } };
const AUTRE: Ligne = {
  id: 1,
  fields: { Id2: 7, Nom: "Autre", Etablissement: 1 },
};

let grist: GristDeTest;
afterEach(() => grist.close());

async function referentielSur(tables: Record<string, Ligne[]>) {
  grist = await demarrerGrist(tables);
  return creerReferentielGrist({ docUrl: grist.docUrl, cleApi: "test" });
}

const noms = (table: string) =>
  grist.tables[table]?.map((l) => l.fields.Nom) ?? [];

describe("service saisi sous « Autre »", () => {
  const saisie = {
    etabId: "10",
    serviceId: "7",
    serviceEstAutre: true,
    serviceLibre: "  Néphrologie ",
  };

  it("crée le service sous l'établissement, visible aussitôt, marqué formulaire", async () => {
    const ref = await referentielSur({
      Etablissements: [CHU],
      Services_Unites: [AUTRE],
    });

    await ref.enrichirDepuisSaisie?.(saisie);

    expect(grist.tables.Services_Unites?.at(-1)?.fields).toEqual({
      Id2: 8,
      Nom: "Néphrologie",
      Etablissement: 1,
      Origine: "formulaire",
    });
    expect(await ref.listerServices("10")).toContainEqual({
      id: "8",
      libelle: "Néphrologie",
    });
  });

  it("réutilise l'homonyme à la casse et aux espaces près", async () => {
    const ref = await referentielSur({
      Etablissements: [CHU],
      Services_Unites: [
        AUTRE,
        { id: 2, fields: { Id2: 8, Nom: "néphrologie", Etablissement: 1 } },
      ],
    });

    await ref.enrichirDepuisSaisie?.(saisie);
    await ref.enrichirDepuisSaisie?.(saisie);

    expect(noms("Services_Unites")).toEqual(["Autre", "néphrologie"]);
  });
});

describe("établissement saisi", () => {
  const saisie = {
    etabId: "",
    etabEstAutre: true,
    etabLibre: "CH de Voiron",
    serviceLibre: "Urgences",
  };

  it("crée l'établissement puis son service, marqués formulaire", async () => {
    const ref = await referentielSur({
      Etablissements: [CHU],
      Services_Unites: [AUTRE],
    });

    await ref.enrichirDepuisSaisie?.(saisie);

    expect(grist.tables.Etablissements?.at(-1)?.fields).toEqual({
      Id2: 11,
      Nom: "CH de Voiron",
      Origine: "formulaire",
    });
    expect(grist.tables.Services_Unites?.at(-1)?.fields).toEqual({
      Id2: 8,
      Nom: "Urgences",
      Etablissement: 2,
      Origine: "formulaire",
    });
    // À la visite suivante, l'établissement est dans la liste, avec son service.
    expect(await ref.listerEtablissements()).toContainEqual({
      id: "11",
      libelle: "CH de Voiron",
    });
    expect(await ref.listerServices("11")).toEqual([
      { id: "8", libelle: "Urgences" },
    ]);
  });

  it("réutilise l'établissement homonyme, sans doublon", async () => {
    const ref = await referentielSur({
      Etablissements: [
        CHU,
        { id: 2, fields: { Id2: 11, Nom: "ch de voiron" } },
      ],
      Services_Unites: [AUTRE],
    });

    await ref.enrichirDepuisSaisie?.(saisie);
    await ref.enrichirDepuisSaisie?.(saisie);

    expect(noms("Etablissements")).toEqual([
      "CHU Grenoble Alpes",
      "ch de voiron",
    ]);
    expect(noms("Services_Unites")).toEqual(["Autre", "Urgences"]);
  });
});

describe("sélection issue des listes", () => {
  it("n'écrit rien", async () => {
    const ref = await referentielSur({
      Etablissements: [CHU],
      Services_Unites: [AUTRE],
    });

    await ref.enrichirDepuisSaisie?.({ etabId: "10", serviceId: "7" });

    expect(noms("Etablissements")).toEqual(["CHU Grenoble Alpes"]);
    expect(noms("Services_Unites")).toEqual(["Autre"]);
  });
});
