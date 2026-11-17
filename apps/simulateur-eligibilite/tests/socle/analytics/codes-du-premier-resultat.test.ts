// Ce que le premier résultat dit au journal de ses codes (ANA22, contrat
// v10.2.2) : `result_displayed` porte toujours l'issue et le support. Quand
// les règles n'en donnent pas, ou que le modèle ne les déclare pas, le R2 ne
// part pas, et rien ne s'y rattache : ni boutons, ni avis, ni document.

import { describe, expect, it } from "vitest";
import { Journey } from "../../../front/socle/analytics/journey.entity";
import type { ShownResult } from "../../../front/socle/analytics/revision.entity";
import { PROVENANCE } from "./journal-de-test";

const unParcours = () => new Journey({ seeded: false, provenance: PROVENANCE });

const CODES = {
  issue: "ISSUE_NON_ELIGIBLE",
  mode: null,
  transportComposition: "not_applicable",
  reasonCodes: ["TRANSPORT_EXCLU_PROUVE"],
  support: "AUCUN",
} as const;

const unR2 = (codes: ShownResult["codes"]): ShownResult => ({
  canComplete: false,
  codes,
});

describe("les codes du premier résultat", () => {
  it("un R2 part avec son issue, son support et le code de raison des règles", () => {
    const [affiche] = unParcours().displayResult(unR2(CODES));

    expect(affiche).toMatchObject({
      type: "result_displayed",
      issue: "ISSUE_NON_ELIGIBLE",
      support: "AUCUN",
      transport_composition: "not_applicable",
      reason_codes: ["TRANSPORT_EXCLU_PROUVE"],
    });
  });

  it.each([
    ["sans issue", { ...CODES, issue: null }],
    ["sans support", { ...CODES, support: null }],
    ["sans codes déclarés", null],
  ])("un R2 %s ne part pas, ni ses boutons", (_cas, codes) => {
    const journey = unParcours();

    const affiche = journey.displayResult(unR2(codes));
    const exposes = journey.exposeButtons(["patient_sheet_print", "feedback"]);

    expect([...affiche, ...exposes]).toEqual([]);
  });

  it("un R2 dont les règles décident ensuite part sous la révision r1", () => {
    const journey = unParcours();
    journey.displayResult(unR2({ ...CODES, issue: null }));

    const [affiche] = journey.displayResult(unR2(CODES));

    expect(affiche?.revision).toBe("r1");
  });
});
