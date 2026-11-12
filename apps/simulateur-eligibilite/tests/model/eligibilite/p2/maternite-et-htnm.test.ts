// La maternité et un HTNM sur le même trajet (TS1018-04, v10.1.8) : cochés
// ensemble en Q2.2.1, ils ne disent pas le déplacement évalué. Q2.14.trajet le
// demande, et deux déplacements font deux simulations (D-285).

import { describe, expect, it } from "vitest";
import { EXAMEN, MATERNITE, posees } from "./reponses-de-la-branche";
import {
  faits,
  issue,
  posee,
  type Reponses,
} from "./reponses-de-la-permission";

describe("la maternité et un HTNM cochés ensemble", () => {
  it("se cochent ensemble : plus d'incompatibilité", () => {
    expect(situations(EXAMEN_ET_HTNM)?.incompatibleOptions ?? []).toEqual([]);
  });

  it.each<[string, Reponses]>([
    ["l'examen", EXAMEN_ET_HTNM],
    [
      "l'hébergement",
      { ...MATERNITE, "Q2.2.1": ["15_HEBERGEMENT_MATERNITE", "5_HTNM"] },
    ],
  ])(
    "avec %s, demandent le déplacement évalué, sans décider avant",
    (_, reponses) => {
      expect(trajet(reponses)).toBeDefined();
      expect(faits(reponses).fait_htnm_hors_maternite.value).toBeUndefined();
      expect(issue(reponses)).toBeUndefined();
    },
  );

  it("le déplacement de la maternité écarte le HTNM, et qualifie le dispositif", () => {
    const maternite = avec("1_ENGAGEMENT_MATERNITE");
    expect(faits(maternite).fait_htnm_hors_maternite.value).toBe(false);
    expect(posees(maternite)).toContain("Q2.14.eloignement");
  });

  it("le déplacement du HTNM écarte le dispositif, sans le qualifier", () => {
    const htnm = avec("2_HTNM_HORS_MATERNITE");
    expect([
      faits(htnm).fait_htnm_hors_maternite.value,
      faits(htnm).fait_dap_maternite.value,
    ]).toEqual([true, false]);
    expect(posees(htnm)).not.toContain("Q2.14.eloignement");
  });

  it("deux déplacements bloquent : deux simulations", () => {
    const question = trajet(EXAMEN_ET_HTNM);
    expect(
      question?.kind === "single choice"
        ? question.options.find(({ value }) => value === "3_DEUX_TRAJETS")
            ?.blocks
        : undefined,
    ).toBe("Ces deux trajets nécessitent deux simulations distinctes.");
  });
});

describe("le déplacement évalué ne se demande pas", () => {
  it.each<[string, Reponses]>([
    ["pour la maternité seule", EXAMEN],
    ["pour un HTNM seul", { ...EXAMEN, "Q2.2.1": ["5_HTNM"] }],
  ])("%s", (_, reponses) => {
    expect(trajet(reponses)).toBeUndefined();
  });
});

// ---- implémentation ----

const EXAMEN_ET_HTNM: Reponses = {
  ...EXAMEN,
  "Q2.2.1": ["14_EXAMEN_MATERNITE", "5_HTNM"],
};

const avec = (deplacement: Reponses["Q2.14.trajet"]): Reponses => ({
  ...EXAMEN_ET_HTNM,
  "Q2.14.trajet": deplacement,
});

const trajet = (reponses: Reponses) =>
  posee("P2/contextes", "Q2.14.trajet", reponses);

const situations = (reponses: Reponses) => {
  const question = posee("P2/contextes", "Q2.2.1", reponses);
  return question?.kind === "multiple choice" ? question : undefined;
};
