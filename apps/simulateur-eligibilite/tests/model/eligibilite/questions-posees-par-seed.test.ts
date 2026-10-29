// Les questions que pose chaque seed, avant le verrou puis après, filtrage par
// le graphe compris (#255). Une question qui apparaît ou disparaît ici change
// le parcours : elle se justifie par ce que montre le résultat (D-220 à D-224).

import { describe, expect, it } from "vitest";
import type { Questions } from "../../../core/models/eligibilite/declarations/questions";
import type { Answers } from "../../../core/socle/questionnaire-engine/question";
import type { Questionnaire } from "../../../core/socle/questionnaire-engine/questionnaire";
import { model } from "../../../front/models/eligibilite";
import { questionnaireOf } from "../../../front/socle/simulateur/questionnaire-of";
import { lock } from "../../../front/socle/simulateur/start";

type Reponses = Answers<Questions>;

const posees = (read: ReturnType<Questionnaire["readWith"]>) =>
  read
    .askedPages()
    .flatMap((page) => read.questionsOn(page).map(({ id }) => id));

const avantLeVerrou = (reponses: Reponses) =>
  posees(questionnaireOf(model).readWith(reponses));

const apresLeVerrou = (reponses: Reponses) => {
  const { cibles } = lock(model, reponses).preconisation;
  const complement = questionnaireOf(model, model.core.complement.pages);
  return posees(complement.readWith(reponses, cibles));
};

const P1 = ["Q0.1", "Q1.1", "Q1.2", "Q1.3"];
const LIEUX = ["Q3.2.nature", "Q3.2.adresse", "Q3.3.nom", "Q3.3.adresse"];

// Le complément d'une DAP ou d'une PMT : le patient, les lieux, le centre de
// référence, puis la distance et l'urgence quand elles comptent.
const complement = (...entre: string[]) => [
  "Q3.1.1",
  "Q3.1.2",
  ...LIEUX,
  "Q3.4",
  ...entre,
  "Q3.6.2",
  "Q3.7",
];

const DISTANCE = ["Q2.3.1", "Q2.3.2"];

// Ce que pose chaque seed : avant le verrou, puis après.
const ATTENDU: Record<string, readonly [string[], string[]]> = {
  "issue-pmt": [[...P1, "Q1.3.a", "Q2.2.1", ...DISTANCE], complement("Q3.4.a")],
  "issue-dap-sans-urgence": [
    [...P1, "Q1.3.a", "Q2.2.1", ...DISTANCE, "Q2.3.3", "Q2.3.4"],
    complement("Q3.4.distance", "Q3.4.a"),
  ],
  "issue-dap-urgence-attestee": [
    [...P1, "Q1.3.a", "Q2.2.1", ...DISTANCE, "Q2.3.3", "Q2.3.4"],
    complement("Q3.4.distance", "Q3.4.a", "Q3.5"),
  ],
  "issue-dap-avion-ou-bateau": [
    [...P1, "Q1.3.a", "Q2.2.1", ...DISTANCE, "Q2.3.4"],
    complement("Q3.4.a"),
  ],
  "issue-dap-avion-ou-bateau-urgence-attestee": [
    [...P1, "Q1.3.a", "Q2.2.1", ...DISTANCE, "Q2.3.4"],
    complement("Q3.4.a", "Q3.5"),
  ],
  "issue-s3141": [
    [...P1, "Q2.1", "Q2.2.1", ...DISTANCE, "Q2.7"].concat([
      "Q2.8.1",
      "Q2.8.2",
      "Q2.8.3",
      "Q2.8.4",
      "Q2.8.4.a",
      "Q2.8.5",
    ]),
    [
      "Q3.1.2",
      "Q3.2.nature",
      "Q3.2.adresse",
      "Q3.3.nature",
      "Q3.3.adresse",
    ].concat(["Q3.6.2"]),
  ],
  "issue-non-eligible": [[...P1, "Q2.1", "Q2.2.1", ...DISTANCE], []],
  "issue-caisse": [
    [...P1, "Q2.1", "Q2.2.1", ...DISTANCE, "Q2.5", "Q2.6.a", "Q2.6"],
    [],
  ],
  "issue-etablissement": [
    [...P1, "Q2.1", "Q2.2.1", ...DISTANCE, "Q2.5", "Q2.6.a", "Q2.6"],
    [],
  ],
  "issue-permission-patient": [
    [...P1, "Q2.1", "Q2.2.1", ...DISTANCE, "Q2.7", "Q2.7.a"],
    [],
  ],
  "issue-convocation": [[...P1, "Q2.1", "Q2.2.1", ...DISTANCE, "Q2.10"], []],
  "issue-dap-etranger-a-examiner": [
    [...P1, "Q1.3.a", "Q2.2.1", "Q2.2.5", ...DISTANCE],
    complement("Q3.4.a"),
  ],
  // Sans issue ni document, la distance ne se pose pas.
  "orientation-penitentiaire": [
    ["Q0.1", "Q1.1", "Q1.3", "Q1.4", "Q2.1", "Q2.2.1", "Q2.2.1.b"].concat([
      "Q2.2.1.indication",
    ]),
    ["Q3.2.adresse", "Q3.3.adresse", "Q3.6.2"],
  ],
  // Le séjour en établissement ouvre la permission (TS1014-B01).
  "sejour-en-etablissement": [
    ["Q0.1", "Q1.1", "Q1.2", "Q1.3", "Q2.2.1", "Q2.2.1.cadre"].concat([
      "Q2.2.1.a",
      "Q2.3.1",
      "Q2.3.2",
      "Q2.7",
    ]),
    ["Q3.1.1", "Q3.1.2", "Q3.2.nature", "Q3.2.adresse", "Q3.3.nature"].concat([
      "Q3.3.adresse",
      "Q3.4",
      "Q3.4.a",
      "Q3.6.2",
      "Q3.7",
    ]),
  ],
  // La HAD ne l'ouvre pas : Q2.6 qualifie l'article 80 (TS1014-B01).
  "sejour-en-had": [
    ["Q0.1", "Q1.1", "Q1.2", "Q1.3", "Q2.2.1", "Q2.2.1.cadre"].concat([
      "Q2.3.1",
      "Q2.3.2",
      "Q2.6",
    ]),
    [],
  ],
};

describe("les questions que pose chaque seed", async () => {
  const seeds = await model.core.seeds();

  it("chaque seed a sa liste", () => {
    expect(seeds.map(({ id }) => id).sort()).toEqual(
      Object.keys(ATTENDU).sort(),
    );
  });

  it.each(seeds.map((seed) => [seed.id, seed] as const))(
    "%s",
    (id, { answers }) => {
      const [avant, apres] = ATTENDU[id] ?? [[], []];

      expect(avantLeVerrou(answers)).toEqual(avant);
      expect(apresLeVerrou(answers)).toEqual(apres);
    },
  );
});
