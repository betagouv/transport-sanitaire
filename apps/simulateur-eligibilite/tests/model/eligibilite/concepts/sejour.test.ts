// Le séjour hospitalier, lu sur des réponses données ou validées : quand
// « déjà hospitalisé » est coché ou écarté, et l'entrée qui l'ouvre.

import { describe, expect, it } from "vitest";
import { Sejour } from "../../../../core/models/eligibilite/concepts/sejour";
import type { Questions } from "../../../../core/models/eligibilite/declarations/questions";
import { GivenAnswers } from "../../../../core/socle/questionnaire-engine/given-answers";
import type { Answers } from "../../../../core/socle/questionnaire-engine/question";
import { ValidatedAnswers } from "../../../../core/socle/questionnaire-engine/validated-answers";

const sejour = (reponses: Answers<Questions>) =>
  Sejour.of(new GivenAnswers<Questions>(reponses));

describe("le séjour", () => {
  it("une entrée ouvre le séjour avec ce trajet", () => {
    expect(sejour({ "Q2.1.g": "1_ENTREE" }).commenceAvecCeTrajet()).toBe(true);
    expect(sejour({ "Q2.1.g": "2_SORTIE" }).commenceAvecCeTrajet()).toBe(false);
  });
});

describe("coché ou écarté", () => {
  const proposes: Questions["Q2.2.1"] = ["1_HOSPITALISATION", "2_ETRANGER"];
  const valides = (coches: Questions["Q2.2.1"], offered = proposes) =>
    Sejour.of(
      new ValidatedAnswers<Questions>({
        "Q2.2.1": { offered: [...offered], answer: coches },
      }),
    );

  it("proposé et coché : coché, pas écarté", () => {
    const lu = valides(["1_HOSPITALISATION"]);
    expect([lu.estCoche(), lu.estEcarte()]).toEqual([true, false]);
  });

  it("proposé, non coché : écarté", () => {
    const lu = valides(["2_ETRANGER"]);
    expect([lu.estCoche(), lu.estEcarte()]).toEqual([false, true]);
  });

  it("écarté, il donne son « non » ; coché, il laisse la main", () => {
    expect(valides(["2_ETRANGER"]).nonSiEcarte()?.provenance).toBe(
      "Q2.2.1 : « déjà hospitalisé » proposé, non coché.",
    );
    expect(valides(["1_HOSPITALISATION"]).nonSiEcarte()).toBeUndefined();
  });

  it("jamais proposé : ni coché, ni écarté", () => {
    const lu = valides(["2_ETRANGER"], ["2_ETRANGER"]);
    expect([lu.estCoche(), lu.estEcarte()]).toEqual([false, false]);
  });
});
