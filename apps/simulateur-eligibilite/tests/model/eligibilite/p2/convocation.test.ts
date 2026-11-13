// La convocation (Q2.10) : quand la page se pose, ce qu'elle établit, et
// l'issue qu'elle donne. `CATALOGUE_COMPLET_QUESTIONS.md` Q2.10,
// `CONTRAT_REPONSES_FAITS.json` et `CONTRAT_NEGATIONS_PROUVEES.json` du paquet
// de l'éditeur (D-108).

import { describe, expect, it } from "vitest";
import {
  appareillage,
  CONVOQUE,
  ciblesDe,
  fait,
  issue,
  PAR_Q221B,
  posee,
  posees,
  type Reponses,
} from "./reponses-de-la-convocation";
import { SANS_SITUATION } from "./reponses-de-la-permission";

const PAGE = "P2/convocation";

describe("quand la page de la convocation se pose", () => {
  it.each([
    ["l'autre motif", CONVOQUE],
    ["une consultation", PAR_Q221B],
  ])("se pose quand Q2.2.1.b signale une convocation, avec %s", (_, base) => {
    expect(posees(base)).toEqual(["Q2.10"]);
  });

  it.each([
    ["un motif sans convocation", { ...SANS_SITUATION }],
    [
      "d'autres soins sans la convocation",
      {
        ...SANS_SITUATION,
        "Q2.1": "1_CONSULTATION",
        "Q2.2.1": ["0_AUCUNE"],
        "Q2.2.1.b": ["1_ATMP"],
      },
    ],
    [
      "la convocation proposée et écartée en Q2.2.1",
      { ...SANS_SITUATION, "Q2.1": "1_CONSULTATION" },
    ],
  ] as const)("ne se pose pas sur %s", (_, reponses) => {
    expect(posees(reponses)).toEqual([]);
  });

  // Seule Q2.2.1.b découvre la convocation : elle s'y propose quel que soit
  // le motif de Q2.1 (QST-COLLECTE-UNIQUE, D-272).
  it.each(["1_CONSULTATION", "8_HOSPITALISATION", "14_AUTRE"] as const)(
    "propose la convocation en Q2.2.1.b après Q2.1 = %s",
    (motif) => {
      const reponses: Reponses = { ...CONVOQUE, "Q2.1": motif };
      const question = posee("P2/contextes-soins", "Q2.2.1.b", reponses);
      const valeurs =
        question?.kind === "multiple choice"
          ? question.options.map(({ value }) => value)
          : [];
      expect(valeurs).toContain("13_CONVOCATION");
    },
  );

  it("pose les sept catégories de Q2.10, dans l'ordre du catalogue", () => {
    const question = posee(PAGE, "Q2.10", CONVOQUE);
    expect(
      question?.kind === "single choice" &&
        question.options.map(({ value }) => value),
    ).toEqual([
      "1_CONTROLE_MEDICAL",
      "2_EXPERT_JURIDICTION",
      "3_AUDIENCE_CONSULTATION",
      "4_EXPERT_CONTESTATION",
      "5_COMMISSION_RECOURS",
      "6_APPAREILLAGE",
      "7_AUCUNE",
    ]);
  });

  it("pose Q2.10.a et Q2.10.b ensemble, sous l'option 6 seulement", () => {
    expect(posees({ ...CONVOQUE, "Q2.10": "6_APPAREILLAGE" })).toEqual([
      "Q2.10",
      "Q2.10.a",
      "Q2.10.b",
    ]);
    expect(posees({ ...CONVOQUE, "Q2.10": "1_CONTROLE_MEDICAL" })).toEqual([
      "Q2.10",
    ]);
  });
});

describe("les faits de la convocation", () => {
  it("laisse le fait comme il était tant que Q2.10 n'est pas validée", () => {
    for (const base of [CONVOQUE, PAR_Q221B]) {
      expect(fait(base)).toEqual({
        provenance: expect.stringMatching(/À qualifier dans sa branche/),
      });
    }
  });

  it("ne tient pas Q2.10.a et Q2.10.b pour répondues sans leur page validée", () => {
    const { "Q2.10.a": _, ...sansAgrement } = appareillage(
      "1_OUI",
      "2_PODO_ORTHESE",
    );
    expect(fait(sansAgrement).value).toBeUndefined();
  });

  // Sans Q2.10.b, ni « oui » ni « non » : seul « Non » à l'agrément suffit à
  // écarter le motif (cas « Conditions obligatoires » des compléments de
  // recette, #149).
  it.each(["1_OUI", "3_NE_PEUX_PAS_VERIFIER"] as const)(
    "laisse le fait absent avec Q2.10.a = %s et Q2.10.b sans réponse",
    (agrement) => {
      const { "Q2.10.b": _, ...sansAppareil } = appareillage(
        agrement,
        "2_PODO_ORTHESE",
      );
      expect(fait(sansAppareil).value).toBeUndefined();
    },
  );

  it.each([
    "1_CONTROLE_MEDICAL",
    "2_EXPERT_JURIDICTION",
    "3_AUDIENCE_CONSULTATION",
    "4_EXPERT_CONTESTATION",
    "5_COMMISSION_RECOURS",
  ] as const)("%s donne « oui »", (categorie) => {
    for (const base of [CONVOQUE, PAR_Q221B]) {
      expect(fait({ ...base, "Q2.10": categorie })).toEqual({
        value: true,
        provenance: `Q2.10 : « ${categorie} ».`,
      });
    }
  });

  it.each([
    ["1_PROTHESE_OCULAIRE_FACIALE"],
    ["2_PODO_ORTHESE"],
    ["3_ORTHOPROTHESE"],
  ] as const)("l'appareillage agréé (%s) donne « oui »", (appareil) => {
    expect(fait(appareillage("1_OUI", appareil))).toEqual({
      value: true,
      provenance: `Q2.10 : « 6_APPAREILLAGE », Q2.10.a : « 1_OUI », Q2.10.b : « ${appareil} ».`,
    });
  });

  it.each([
    ["2_NON", "1_PROTHESE_OCULAIRE_FACIALE"],
    ["2_NON", "4_AUTRE"],
    ["2_NON", "5_NE_PEUX_PAS_PRECISER"],
    ["3_NE_PEUX_PAS_VERIFIER", "4_AUTRE"],
    ["1_OUI", "4_AUTRE"],
  ] as const)(
    "l'appareillage avec l'agrément %s et la catégorie %s donne « non »",
    (agrement, appareil) => {
      expect(fait(appareillage(agrement, appareil)).value).toBe(false);
    },
  );

  it("trace la raison du « non » : l'agrément, ou l'autre appareillage", () => {
    expect(fait(appareillage("2_NON", "2_PODO_ORTHESE")).provenance).toMatch(
      /Q2\.10\.a : « 2_NON »/,
    );
    expect(fait(appareillage("1_OUI", "4_AUTRE")).provenance).toMatch(
      /Q2\.10\.b : « 4_AUTRE »/,
    );
  });

  it.each([
    ["3_NE_PEUX_PAS_VERIFIER", "2_PODO_ORTHESE"],
    ["1_OUI", "5_NE_PEUX_PAS_PRECISER"],
    ["3_NE_PEUX_PAS_VERIFIER", "5_NE_PEUX_PAS_PRECISER"],
  ] as const)(
    "l'agrément %s avec la catégorie %s, sans rien de négatif, laisse le fait absent",
    (agrement, appareil) => {
      const resultat = fait(appareillage(agrement, appareil));
      expect(resultat.value).toBeUndefined();
      expect(resultat.provenance).toMatch(/^Q2\.10 : « 6_APPAREILLAGE »/);
    },
  );

  // Point 6 de la v10.1.3 : la même réponse, la même qualification.
  it.each([
    ["l'autre motif", CONVOQUE],
    ["une consultation", PAR_Q221B],
  ] as const)("« aucune » vaut « non », avec %s", (_, entree) => {
    expect(fait({ ...entree, "Q2.10": "7_AUCUNE" })).toEqual({
      value: false,
      provenance:
        "Q2.10 : « 7_AUCUNE ». Ce motif de convocation ne s'applique pas.",
    });
  });

  it("n'établit rien quand la page ne se pose pas : le « non » de Q2.2.1.b reste", () => {
    for (const reponses of [
      SANS_SITUATION,
      { ...SANS_SITUATION, "Q2.10": "1_CONTROLE_MEDICAL" } as const,
    ]) {
      expect(fait(reponses)).toEqual({
        value: false,
        provenance:
          "Q2.2.1.b : « 0_AUCUN ». « 13_CONVOCATION » proposée, non cochée.",
      });
    }
  });
});

describe("l'issue des règles", () => {
  it("une catégorie vérifiée donne ISSUE_CONVOCATION", () => {
    expect(issue({ ...CONVOQUE, "Q2.10": "1_CONTROLE_MEDICAL" })).toBe(
      "ISSUE_CONVOCATION",
    );
    expect(issue(appareillage("1_OUI", "3_ORTHOPROTHESE"))).toBe(
      "ISSUE_CONVOCATION",
    );
  });

  it("l'appareillage invérifiable donne ISSUE_CAISSE, avec sa raison dédiée (cible_reason_code)", () => {
    const cibles = ciblesDe(
      appareillage("3_NE_PEUX_PAS_VERIFIER", "2_PODO_ORTHESE"),
    );
    expect(cibles.cible_issue_id.value).toBe("ISSUE_CAISSE");
    expect(cibles.cible_reason_code.value).toBe(
      "CONVOCATION_CONDITION_NON_VERIFIABLE",
    );
  });

  it.each([
    ["un autre appareillage", appareillage("1_OUI", "4_AUTRE")],
    ["un fournisseur non agréé", appareillage("2_NON", "2_PODO_ORTHESE")],
  ] as const)("%s ne donne pas ISSUE_CONVOCATION", (_, reponses) => {
    expect(issue(reponses)).not.toBe("ISSUE_CONVOCATION");
  });

  it("« aucune » pour une convocation, sans autre motif, ne donne aucun droit", () => {
    expect(issue({ ...CONVOQUE, "Q2.10": "7_AUCUNE" })).toBe(
      "ISSUE_NON_ELIGIBLE",
    );
  });
});
