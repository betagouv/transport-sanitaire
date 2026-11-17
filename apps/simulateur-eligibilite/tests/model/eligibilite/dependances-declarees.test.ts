// Les dépendances entre réponses du modèle de l'éditeur, question par question.
// Une dépendance ne se devine pas : chaque question la déclare par `dependsOn`
// (D-299). Sans elle, la réponse survit au changement de celle dont elle
// dépend, et peut finir dans un cerfa (#411).
//
// Ce test range donc chaque question dans une table : ce dont sa réponse
// dépend, ou rien. Une question ajoutée n'y est pas, et l'échec demande de la
// relire. Les tables suivent D-190, D-299, D-300 et D-301.

import { describe, expect, it } from "vitest";
import { model } from "../../../core/models/eligibilite";
import { Questionnaire } from "../../../core/socle/questionnaire-engine";

const SEANCES = ["3_CHIMIOTHERAPIE", "4_RADIOTHERAPIE", "5_DIALYSE"];

// La réponse s'efface quand l'une de ces réponses change. Entre crochets, les
// seules réponses possibles qui comptent.
const DEPENDANCES: Record<string, readonly Dependance[]> = {
  "Q1.2": ["Q1.1"],
  "Q1.4": ["Q1.1"],
  "Q2.1.f": [["Q1.3", SEANCES]],
  "Q2.1.g": ["Q2.1"],
  "Q2.2.1.indication": ["Q1.1", "Q1.2", "Q1.3"],
  "Q2.2.1.b": ["Q2.2.1"],
  "Q2.3.2.terrestre": ["Q2.3.2"],
  "Q2.7.a": ["Q2.7"],
  "Q2.8.6": ["Q2.8.5"],
  "Q2.8.6.a": ["Q2.8.5"],
  "Q2.8.6.b": ["Q2.8.5"],
  "Q2.10.a": ["Q2.10"],
  "Q2.10.b": ["Q2.10"],
  "Q3.1.1": ["Q3.1.2"],
  "Q3.2.nom": ["Q3.2.categorie"],
  "Q3.3.nom": ["Q3.3.categorie"],
};

// La réponse garde son sens tant que la question se pose : seule une garde
// qui ne tient plus l'efface.
const SANS_DEPENDANCE = [
  "Q0.1",
  // P1
  "Q1.1",
  "Q1.3",
  "Q1.3.a",
  "Q1.3.b",
  "Q1.3.accident_tiers_date",
  // P2
  "Q2.1",
  "Q2.2.1",
  "Q2.2.1.cadre",
  "Q2.2.1.a",
  "Q2.14.trajet",
  "Q2.2.5",
  "Q2.3.1",
  "Q2.3.2",
  "Q2.3.3",
  "Q2.3.1.finalite",
  "Q2.3.4",
  "Q2.5",
  "Q2.7",
  "Q2.6.a",
  "Q2.6",
  "Q2.8.1",
  "Q2.8.2",
  "Q2.8.3",
  "Q2.8.duree_48h",
  "Q2.8.4",
  "Q2.8.5",
  "Q2.10",
  "Q2.13.depart",
  "Q2.13.sens",
  "Q2.14.eloignement",
  "Q2.14.motif",
  // P3
  "Q3.1.2",
  "Q3.1.3",
  "Q3.2.categorie",
  "Q3.2.nature",
  "Q3.2.precision",
  "Q3.2.service",
  "Q3.2.adresse",
  "Q3.3.categorie",
  "Q3.lieux.usld.cote",
  "Q3.lieux.ehpad.cote",
  "Q3.3.nature",
  "Q3.3.precision",
  "Q3.3.service",
  "Q3.3.adresse",
  "Q3.4.distance",
  "Q3.4.a",
  "Q3.5",
  "Q3.6.1",
  "Q3.7",
  "Q3.8.maternite.nom",
  "Q3.8.maternite.adresse",
  "Q3.8.niveau",
  "Q3.8.hebergement.nom",
  "Q3.8.hebergement.adresse",
];

describe("les dépendances entre réponses du modèle", () => {
  it("chaque question est rangée : sa réponse dépend d'une autre, ou de rien", () => {
    const rangees = [...Object.keys(DEPENDANCES), ...SANS_DEPENDANCE];

    expect(
      {
        aRanger: sans(QUESTIONS, rangees),
        disparues: sans(rangees, QUESTIONS),
      },
      "Une question du modèle n'est dans aucune des deux tables de ce test, " +
        "ou une table cite une question que le modèle n'a plus. Pour une " +
        "question ajoutée, relis la règle de l'éditeur (D-299) : sa réponse " +
        "garde-t-elle son sens quand le patient, l'objet, le trajet ou le " +
        "contexte change ? Sinon, déclare-le par `dependsOn` et range-la dans " +
        "`DEPENDANCES`. Si oui, range-la dans `SANS_DEPENDANCE`.",
    ).toEqual({ aRanger: [], disparues: [] });
  });

  it("le modèle déclare ces dépendances, et aucune autre", () => {
    expect(
      DECLAREES,
      "Les `dependsOn` du modèle ne sont plus ceux de la table. Un `dependsOn` " +
        "retiré laisse survivre une réponse périmée ; un `dependsOn` ajouté " +
        "efface une réponse que l'éditeur veut garder (SQ-07, SQ-25). Corrige " +
        "le modèle, ou la table si la règle de l'éditeur a changé.",
    ).toEqual(DEPENDANCES);
  });
});

// ---- implémentation ----

// Une question entière, ou une question réduite à certaines réponses possibles.
type Dependance = string | readonly [string, readonly string[]];

const DECLAREES_PAR_QUESTION = [
  ...Questionnaire.pagesOf(model.questionnaire),
  ...model.complement.pages,
].flatMap((page) => page.questions);

const QUESTIONS = [
  ...new Set(DECLAREES_PAR_QUESTION.map((question) => question.id)),
];

const DECLAREES: Record<string, Dependance[]> = Object.fromEntries(
  DECLAREES_PAR_QUESTION.filter(
    (question) => question.dependencies.length > 0,
  ).map((question) => [
    question.id,
    question.dependencies.map(
      ({ id, possibleAnswers }): Dependance =>
        possibleAnswers ? [id, possibleAnswers] : id,
    ),
  ]),
);

function sans(liste: readonly string[], retirees: readonly string[]) {
  return liste.filter((element) => !retirees.includes(element));
}
