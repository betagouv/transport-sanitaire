// Les exceptions de l'article 80, lues sur Q2.5, Q2.6.a, Q2.6, Q2.2.1 et
// Q2.3.2 : celles qui se proposent (D-106), le Centre 15 de l'option 3, et ce
// que chaque exception établit, proposée ou non.

import { describe, expect, it } from "vitest";
import { ExceptionsDeLArticle80 } from "../../../../core/models/eligibilite/concepts/exceptions-de-l-article-80";
import type { Questions } from "../../../../core/models/eligibilite/declarations/questions";
import type { Fait } from "../../../../core/socle";
import { GivenAnswers } from "../../../../core/socle/questionnaire-engine/given-answers";
import type { Validated } from "../../../../core/socle/questionnaire-engine/question";
import { ValidatedAnswers } from "../../../../core/socle/questionnaire-engine/validated-answers";

const exceptions = (entrees: Validated<Questions>) =>
  ExceptionsDeLArticle80.of(new ValidatedAnswers<Questions>(entrees));
const lu = (fait: Fait | undefined) => fait && [fait.value, fait.provenance];

const TRANSFERT = { "Q2.5": { answer: "1_TRANSFERT" } } as const;
const AUTRE_DEPLACEMENT = {
  "Q2.5": { answer: "2_AUTRE_DEPLACEMENT" },
} as const;
const SEJOUR_COCHE = {
  "Q2.2.1": { offered: ["1_HOSPITALISATION"], answer: ["1_HOSPITALISATION"] },
} as const;

describe("les exceptions qui se proposent", () => {
  const aProposer = (
    exception: Questions["Q2.6"][number],
    entrees: Validated<Questions>,
    type?: Questions["Q2.6.a"],
  ) =>
    exceptions(entrees).estAProposer(
      exception,
      new GivenAnswers<Questions>({ "Q2.6.a": type }).question("Q2.6.a"),
    );

  it.each([
    ["un transfert définitif sans séjour", TRANSFERT, "1_DEFINITIF", true],
    ["un transfert provisoire", TRANSFERT, "2_PROVISOIRE", false],
    [
      "un transfert définitif après un séjour",
      { ...TRANSFERT, ...SEJOUR_COCHE },
      "1_DEFINITIF",
      false,
    ],
  ] as const)(
    "l'admission sans séjour, pour %s : %s",
    (_, entrees, type, attendu) => {
      expect(
        aProposer(
          "2_ADMISSION_SANS_SEJOUR",
          entrees as Validated<Questions>,
          type,
        ),
      ).toBe(attendu);
    },
  );

  it("le Centre 15, pour un transfert seulement", () => {
    expect(aProposer("3_CENTRE_QUINZE", TRANSFERT)).toBe(true);
    expect(aProposer("3_CENTRE_QUINZE", AUTRE_DEPLACEMENT)).toBe(false);
  });

  it("l'aérien ou le maritime, sans ligne régulière en Q2.3.2", () => {
    expect(aProposer("4_AIR_MER", {})).toBe(true);
    expect(aProposer("4_AIR_MER", { "Q2.3.2": { answer: true } })).toBe(false);
  });

  it.each([
    ["un transfert provisoire", TRANSFERT, "2_PROVISOIRE", true],
    ["un transfert définitif", TRANSFERT, "1_DEFINITIF", false],
    ["un autre déplacement", AUTRE_DEPLACEMENT, undefined, true],
    ["une admission en HAD, sans Q2.5", {}, undefined, false],
  ] as const)("la radiothérapie, pour %s : %s", (_, entrees, type, attendu) => {
    expect(aProposer("8_RADIOTHERAPIE", entrees, type)).toBe(attendu);
  });

  it("les autres, toujours", () => {
    expect(aProposer("5_HAD", {})).toBe(true);
  });
});

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
