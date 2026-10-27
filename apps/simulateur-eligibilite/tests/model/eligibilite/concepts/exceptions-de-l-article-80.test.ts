// Les exceptions de l'article 80, lues sur Q2.5, Q2.6.a, Q2.6, Q2.2.1 et
// Q2.3.2 : le Centre 15 de l'option 3, et ce que chaque exception établit,
// proposée ou non (D-106).

import { describe, expect, it } from "vitest";
import { ExceptionsDeLArticle80 } from "../../../../core/models/eligibilite/concepts/exceptions-de-l-article-80";
import type { Questions } from "../../../../core/models/eligibilite/declarations/questions";
import type { Fait } from "../../../../core/socle";
import type { Validated } from "../../../../core/socle/questionnaire-engine/question";
import { ValidatedAnswers } from "../../../../core/socle/questionnaire-engine/validated-answers";

const exceptions = (entrees: Validated<Questions>) =>
  ExceptionsDeLArticle80.of(new ValidatedAnswers<Questions>(entrees));
const lu = (fait: Fait | undefined) => fait && [fait.value, fait.provenance];

const SEJOUR_COCHE = {
  "Q2.2.1": { offered: ["1_HOSPITALISATION"], answer: ["1_HOSPITALISATION"] },
} as const;

describe("le Centre 15 de l'option 3", () => {
  it.each([
    [["3_CENTRE_QUINZE"], [true, "Q2.6 : « 3_CENTRE_QUINZE » cochée."]],
    [
      ["11_AUCUNE"],
      [false, "Q2.6 : « 3_CENTRE_QUINZE » proposée, non cochée."],
    ],
  ] as const)("Q2.6 : %j", (coches, attendu) => {
    expect(
      lu(
        exceptions({
          "Q2.6": {
            offered: ["3_CENTRE_QUINZE", "11_AUCUNE"],
            answer: [...coches],
          },
        }).centre15(),
      ),
    ).toEqual(attendu);
  });

  it("non proposé, ou sans Q2.6, il ne dit rien", () => {
    const sansOption = {
      "Q2.6": { offered: ["11_AUCUNE"], answer: ["11_AUCUNE"] },
    } as const;
    expect(
      exceptions(sansOption as Validated<Questions>).centre15(),
    ).toBeUndefined();
    expect(exceptions({}).centre15()).toBeUndefined();
  });
});

describe("ce qu'une exception établit", () => {
  const AUCUNE = { offered: ["11_AUCUNE"], answer: ["11_AUCUNE"] } as const;

  it("proposée, sa case décide", () => {
    const valides = exceptions({
      "Q2.6": { offered: ["5_HAD", "11_AUCUNE"], answer: ["5_HAD"] },
    } as Validated<Questions>);
    expect(lu(valides.fait("5_HAD"))).toEqual([
      true,
      "Q2.6 : « 5_HAD » cochée.",
    ]);
  });

  it.each([
    [
      "l'admission sans séjour, après un séjour",
      "2_ADMISSION_SANS_SEJOUR",
      SEJOUR_COCHE,
      [
        false,
        "Q2.6 : « 2_ADMISSION_SANS_SEJOUR » ne s'est pas proposée : un séjour initial est coché en Q2.2.1.",
      ],
    ],
    [
      "l'admission sans séjour, pour un transfert provisoire",
      "2_ADMISSION_SANS_SEJOUR",
      { "Q2.6.a": { answer: "2_PROVISOIRE" } },
      [
        false,
        "Q2.6 : « 2_ADMISSION_SANS_SEJOUR » ne s'est pas proposée : Q2.6.a : transfert provisoire, avec retour à l'établissement d'origine.",
      ],
    ],
    [
      "l'aérien ou le maritime, sur une ligne régulière",
      "4_AIR_MER",
      {},
      [true, "Q2.3.2 : ligne régulière, réutilisée sans revote."],
    ],
    [
      "la radiothérapie, pour un transfert définitif",
      "8_RADIOTHERAPIE",
      { "Q2.6.a": { answer: "1_DEFINITIF" } },
      [
        false,
        "Q2.6 : « 8_RADIOTHERAPIE » ne s'est pas proposée : Q2.6.a : transfert définitif.",
      ],
    ],
    [
      "la radiothérapie, pour une admission en HAD",
      "8_RADIOTHERAPIE",
      {},
      [
        false,
        "Q2.6 : « 8_RADIOTHERAPIE » ne s'est pas proposée : une admission en HAD n'est pas un transfert provisoire.",
      ],
    ],
    [
      "une autre",
      "6_USLD",
      {},
      [undefined, "Q2.6 : « 6_USLD » ne s'est pas proposée."],
    ],
  ] as const)(
    "non proposée, son prédicat : %s",
    (_, exception, entrees, attendu) => {
      const valides = exceptions({
        ...entrees,
        "Q2.6": AUCUNE,
      } as Validated<Questions>);
      expect(lu(valides.fait(exception))).toEqual(attendu);
    },
  );

  it("sans Q2.6, rien", () => {
    expect(exceptions({}).fait("5_HAD")).toBeUndefined();
  });
});
