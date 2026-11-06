// Les questions que pose chaque seed, avant le verrou puis après, filtrage par
// le graphe compris (#255). Une question qui apparaît ou disparaît ici change
// le parcours : elle se justifie par ce que montre le résultat (D-220 à D-224).

import { describe, expect, it } from "vitest";
import type { Questions } from "../../../core/models/eligibilite/questions/reponses";
import type { Answers } from "../../../core/socle/questionnaire-engine";
import { Simulation } from "../../../core/socle/simulation";
import { model } from "../../../front/models/eligibilite";

type Reponses = Answers<Questions>;

const posees = (simulation: Simulation) =>
  simulation
    .pages()
    .flatMap((page) => simulation.questionsOn(page).map(({ id }) => id));

const avantLeVerrou = (reponses: Reponses) =>
  posees(Simulation.resume(model.core, reponses));

// Le complément, sous le verrou de ces réponses : rien, quand aucun cerfa ne suit.
const apresLeVerrou = (reponses: Reponses) =>
  posees(Simulation.resume(model.core, reponses).lock());

const P1 = ["Q0.1", "Q1.1", "Q1.2", "Q1.3"];
const LIEUX = ["Q3.2.nature", "Q3.2.adresse", "Q3.3.nom", "Q3.3.adresse"];

// Le complément d'une DAP ou d'une PMT : le patient, les lieux, le centre de
// référence, puis la distance et l'urgence quand elles comptent. Le nombre de
// trajets attend le sens, qu'aucune seed ne donne (D-246).
const complement = (...entre: string[]) => [
  "Q3.1.2",
  ...LIEUX,
  "Q3.4",
  ...entre,
  "Q3.7",
];

const DISTANCE = ["Q2.3.1", "Q2.3.2"];

// Ce que pose chaque seed : avant le verrou, puis après.
const ATTENDU: Record<string, readonly [string[], string[]]> = {
  "issue-pmt": [
    [...P1, "Q1.3.a", "Q2.2.1", "Q2.2.1.b", ...DISTANCE],
    complement("Q3.4.a"),
  ],
  "pmt-mineur-soins-continus": [
    [...P1, "Q1.3.a", "Q2.2.1", "Q2.2.1.b", ...DISTANCE],
    complement("Q3.4.a"),
  ],
  "issue-dap-sans-urgence": [
    [...P1, "Q1.3.a", "Q2.2.1", "Q2.2.1.b", ...DISTANCE, "Q2.3.3", "Q2.3.4"],
    complement("Q3.4.distance", "Q3.4.a"),
  ],
  "issue-dap-urgence-attestee": [
    [...P1, "Q1.3.a", "Q2.2.1", "Q2.2.1.b", ...DISTANCE, "Q2.3.3", "Q2.3.4"],
    complement("Q3.4.distance", "Q3.4.a", "Q3.5"),
  ],
  "issue-dap-avion-ou-bateau": [
    [...P1, "Q1.3.a", "Q2.2.1", "Q2.2.1.b", ...DISTANCE, "Q2.3.4"],
    complement("Q3.4.a"),
  ],
  "issue-dap-avion-ou-bateau-urgence-attestee": [
    [...P1, "Q1.3.a", "Q2.2.1", "Q2.2.1.b", ...DISTANCE, "Q2.3.4"],
    complement("Q3.4.a", "Q3.5"),
  ],
  "issue-s3141": [
    [...P1, "Q2.1", "Q2.2.1", "Q2.2.1.b", ...DISTANCE, "Q2.7"].concat([
      "Q2.8.1",
      "Q2.8.2",
      "Q2.8.3",
      "Q2.8.duree_48h",
      "Q2.8.4",
      "Q2.8.5",
    ]),
    ["Q3.1.2", "Q3.2.nature", "Q3.2.adresse", "Q3.3.nature", "Q3.3.adresse"],
  ],
  "issue-non-eligible": [
    [...P1, "Q2.1", "Q2.2.1", "Q2.2.1.b", ...DISTANCE],
    [],
  ],
  "issue-caisse": [
    [
      ...P1,
      "Q2.1",
      "Q2.2.1",
      "Q2.2.1.b",
      ...DISTANCE,
      "Q2.5",
      "Q2.6.a",
      "Q2.6",
    ],
    [],
  ],
  "issue-etablissement": [
    [
      ...P1,
      "Q2.1",
      "Q2.2.1",
      "Q2.2.1.b",
      ...DISTANCE,
      "Q2.5",
      "Q2.6.a",
      "Q2.6",
    ],
    [],
  ],
  "issue-permission-patient": [
    [...P1, "Q2.1", "Q2.2.1", "Q2.2.1.b", ...DISTANCE, "Q2.7", "Q2.7.a"],
    [],
  ],
  "issue-convocation": [
    [...P1, "Q2.1", "Q2.2.1", "Q2.2.1.b", ...DISTANCE, "Q2.10"],
    [],
  ],
  "issue-dap-etranger-a-examiner": [
    [...P1, "Q1.3.a", "Q2.2.1", "Q2.2.5", "Q2.2.1.b", ...DISTANCE],
    complement("Q3.4.a"),
  ],
  // L'Engagement maternité finit P3 par Q3.8 (D-251). Sans sens, l'hébergement
  // n'est pas encore l'arrivée.
  "dap-engagement-maternite": [
    [
      "Q0.1",
      "Q1.1",
      "Q1.3",
      "Q1.4",
      "Q2.1",
      "Q2.2.1",
      "Q2.2.1.b",
      ...DISTANCE,
    ].concat(["Q2.14.eloignement", "Q2.14.motif", "Q2.3.4"]),
    [
      "Q3.1.2",
      "Q3.2.nature",
      "Q3.2.adresse",
      "Q3.3.nature",
      "Q3.3.adresse",
      "Q3.4",
      "Q3.4.a",
      "Q3.8.maternite.nom",
      "Q3.8.maternite.adresse",
      "Q3.8.niveau",
    ],
  ],
  // Sans issue ni document, la distance ne se pose pas.
  "orientation-penitentiaire": [
    ["Q0.1", "Q1.1", "Q1.3", "Q1.4", "Q2.1", "Q2.2.1", "Q2.2.1.indication"],
    ["Q3.2.adresse", "Q3.3.adresse"],
  ],
  // Le séjour en établissement ouvre la permission (TS1014-B01).
  "sejour-en-etablissement": [
    ["Q0.1", "Q1.1", "Q1.2", "Q1.3", "Q2.2.1", "Q2.2.1.cadre"].concat([
      "Q2.2.1.a",
      "Q2.2.1.b",
      "Q2.3.1",
      "Q2.3.2",
      "Q2.7",
    ]),
    ["Q3.1.2", "Q3.2.nature", "Q3.2.adresse", "Q3.3.nature"].concat([
      "Q3.3.adresse",
      "Q3.4",
      "Q3.4.a",
      "Q3.7",
    ]),
  ],
  // La HAD ne l'ouvre pas : Q2.6 qualifie l'article 80 (TS1014-B01).
  "sejour-en-had": [
    ["Q0.1", "Q1.1", "Q1.2", "Q1.3", "Q2.2.1", "Q2.2.1.cadre"].concat([
      "Q2.2.1.b",
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
