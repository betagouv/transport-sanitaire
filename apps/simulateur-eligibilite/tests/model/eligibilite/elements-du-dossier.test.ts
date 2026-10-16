// Les éléments du dossier de la page du praticien (#133, D-112). Les noms sont
// recopiés du programme de l'éditeur ; les lignes attendues, de ses aperçus.

import { describe, expect, it } from "vitest";
import {
  elementsDuDossier,
  elementsDuDossierDeLEtranger,
} from "../../../front/models/eligibilite/elements-du-dossier";
import { faux, trace, vrai } from "./traces-du-praticien";

describe("une ligne du dossier", () => {
  it("dit un fait « oui » établi", () => {
    const avecAld = trace({}, { fait_ald_liee: vrai });
    expect(elementsDuDossier(["fait_ald_liee"], avecAld)).toEqual([
      "Soins et déficience en lien avec l’ALD : établi",
    ]);
  });

  it("dit un fait « non » non retenu", () => {
    const sansPermission = trace({}, { fait_permission: faux });
    expect(elementsDuDossier(["fait_permission"], sansPermission)).toEqual([
      "Permission de sortie : non retenu",
    ]);
  });

  it("dit un fait absent non vérifiable, sans en faire un « non »", () => {
    expect(
      elementsDuDossier(["fait_ald_exonerante_3_ou_4"], trace({})),
    ).toEqual([
      "Base juridique ALD qualifiante : non vérifiable dans la trace",
    ]);
  });
});

describe("les lignes du dossier", () => {
  it("suivent l'ordre des faits cités, chacun une fois", () => {
    const faits = ["fait_motif_pension", "fait_hospitalisation"];
    expect(elementsDuDossier([...faits, ...faits], trace({}))).toHaveLength(2);
    expect(elementsDuDossier(faits, trace({}))[0]).toMatch(/^Soins liés/);
  });

  it("taisent un fait que le programme de l'éditeur ne nomme pas", () => {
    expect(elementsDuDossier(["fait_bariatrique"], trace({}))).toEqual([]);
  });

  it("finissent, pour l'étranger, par le document et le financeur", () => {
    const etranger = trace({}, { fait_trajet_etranger: vrai });
    expect(elementsDuDossierDeLEtranger(etranger)).toEqual([
      "Départ ou arrivée hors de France : établi",
      "Document à préparer : demande d’examen (formulaire S3139h)",
      "Prise en charge et financeur : à confirmer auprès de la caisse",
    ]);
  });
});
