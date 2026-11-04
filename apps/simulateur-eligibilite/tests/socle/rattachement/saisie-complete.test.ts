// La règle de complétude partagée entre le front et le back : les trois cas du
// rattachement, et ce que chacun exige.

import { describe, expect, it } from "vitest";
import {
  enrichitLeReferentiel,
  saisieComplete,
} from "../../../shared/rattachement-saisi";

describe("saisieComplete", () => {
  it("un service du référentiel suffit", () => {
    expect(saisieComplete({ etabId: "e1", serviceId: "s1" })).toBe(true);
    expect(saisieComplete({ etabId: "e1" })).toBe(false);
    expect(saisieComplete({ etabId: "" })).toBe(false);
  });

  it("le service « Autre » exige le nom du vrai service", () => {
    const autre = { etabId: "e1", serviceId: "s_autre", serviceEstAutre: true };
    expect(saisieComplete(autre)).toBe(false);
    expect(saisieComplete({ ...autre, serviceLibre: "  " })).toBe(false);
    expect(saisieComplete({ ...autre, serviceLibre: "Néphrologie" })).toBe(
      true,
    );
  });

  it("un établissement saisi exige son nom et celui du service, sans id", () => {
    const saisi = { etabId: "", etabEstAutre: true };
    expect(saisieComplete(saisi)).toBe(false);
    expect(saisieComplete({ ...saisi, etabLibre: "CH de Voiron" })).toBe(false);
    expect(saisieComplete({ ...saisi, serviceLibre: "Urgences" })).toBe(false);
    expect(
      saisieComplete({
        ...saisi,
        etabLibre: "CH de Voiron",
        serviceLibre: "Urgences",
      }),
    ).toBe(true);
  });
});

describe("enrichitLeReferentiel", () => {
  it("seules les saisies libres apprennent quelque chose au référentiel", () => {
    expect(enrichitLeReferentiel({ etabId: "e1", serviceId: "s1" })).toBe(
      false,
    );
    expect(
      enrichitLeReferentiel({
        etabId: "e1",
        serviceId: "s_autre",
        serviceEstAutre: true,
        serviceLibre: "Néphrologie",
      }),
    ).toBe(true);
    expect(
      enrichitLeReferentiel({
        etabId: "",
        etabEstAutre: true,
        etabLibre: "CH de Voiron",
        serviceLibre: "Urgences",
      }),
    ).toBe(true);
  });
});
