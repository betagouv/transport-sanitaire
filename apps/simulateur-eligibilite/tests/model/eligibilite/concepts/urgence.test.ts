// L'urgence, lue sur Q2.3.4 ou, quand la branche la reprend, sur Q2.12 :
// attestée ou non, et répondue.

import { describe, expect, it } from "vitest";
import { Urgence } from "../../../../core/models/eligibilite/concepts/urgence";
import type { Questions } from "../../../../core/models/eligibilite/declarations/questions";
import type { Fait } from "../../../../core/socle";
import type { Validated } from "../../../../core/socle/questionnaire-engine/question";
import { ValidatedAnswers } from "../../../../core/socle/questionnaire-engine/validated-answers";

const urgence = (entrees: Validated<Questions>) =>
  Urgence.of(new ValidatedAnswers<Questions>(entrees));
const lu = (fait: Fait) => [fait.value, fait.provenance];

const EN_ATTENTE =
  "Ni Q2.3.4 ni Q2.12 n'ont de réponse : elles attendent, ou leur garde les écarte.";

describe("l'urgence demandée sur la page du trajet", () => {
  it.each([
    ["Q2.3.4 validée", { "Q2.3.4": { answer: "2_NON" } }, true],
    ["Q2.12 seule", { "Q2.12": { answer: "1_OUI" } }, false],
    ["aucune des deux", {}, false],
  ] as const)("%s : %s", (_, entrees, attendu) => {
    expect(urgence(entrees).estDemandeeSurLeTrajet()).toBe(attendu);
  });
});

describe("l'urgence attestée et répondue", () => {
  it.each([
    ["Q2.3.4", "1_OUI", true, true],
    ["Q2.3.4", "2_NON", false, true],
    ["Q2.12", "1_OUI", true, true],
    ["Q2.12", "2_NON", false, true],
  ] as const)("%s : %s", (question, reponse, attestee, repondue) => {
    const lue = urgence({ [question]: { answer: reponse } });
    const source = `${question} : « ${reponse} ».`;
    expect(lu(lue.attestee())).toEqual([attestee, source]);
    expect(lu(lue.repondue())).toEqual([repondue, source]);
  });

  it("Q2.3.4 l'emporte sur Q2.12", () => {
    const lue = urgence({
      "Q2.3.4": { answer: "2_NON" },
      "Q2.12": { answer: "1_OUI" },
    });
    expect(lu(lue.attestee())).toEqual([false, "Q2.3.4 : « 2_NON »."]);
  });

  it("ni l'une ni l'autre, tant qu'aucune n'a de réponse", () => {
    expect(lu(urgence({}).attestee())).toEqual([undefined, EN_ATTENTE]);
    expect(lu(urgence({}).repondue())).toEqual([undefined, EN_ATTENTE]);
  });
});
