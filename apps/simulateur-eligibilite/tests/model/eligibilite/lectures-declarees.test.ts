// Ce que chaque partie du résultat (R2) et du cerfa (R3) déclare lire (#196).
// Une précision se déroule en ses questions : au bout, chaque nom déclaré est
// une question du questionnaire, un fait ou une cible, et rien d'autre.

import { describe, expect, it } from "vitest";
import { model } from "../../../core/models/eligibilite";
import { CIBLES } from "../../../core/models/eligibilite/declarations/cibles";
import { FAITS } from "../../../core/models/eligibilite/declarations/faits";
import { pagesOf } from "../../../core/socle/questionnaire-engine/question";
import { CONDITIONS } from "../../../front/models/eligibilite/r2/fiche-negative/raison-non-eligible";
import {
  PRECISIONS,
  SEJOUR_REEL,
} from "../../../front/models/eligibilite/r2/precisions-du-resultat";
import { RAISONS } from "../../../front/models/eligibilite/r2/prescripteur/scenarios-de-la-caisse";
import {
  type Rubrique,
  uneRubrique,
} from "../../../front/models/eligibilite/r3/rubriques/rubrique";
import { donnees, PMT } from "./reponses-du-cerfa";

const QUESTIONS = pagesOf([...model.questionnaire, model.complement]).flatMap(
  ({ questions }) => questions.map(({ id }) => id),
);
const LISIBLES = new Set<string>([...QUESTIONS, ...FAITS, ...CIBLES]);

// Chaque rubrique, partagée ou propre à un cerfa.
const RUBRIQUES = Object.values(
  import.meta.glob(
    [
      "../../../front/models/eligibilite/r3/rubriques/*.ts",
      "../../../front/models/eligibilite/r3/s*/s*.ts",
    ],
    { eager: true },
  ),
)
  .flatMap((module) => Object.values(module as object))
  .filter(
    (valeur): valeur is Rubrique<unknown> =>
      typeof valeur === "object" &&
      valeur !== null &&
      "lit" in valeur &&
      "cellules" in valeur,
  );

const PRECISIONS_ET_SEJOUR = [...Object.values(PRECISIONS), SEJOUR_REEL];
const QUESTIONS_DE_LA_PRECISION = new Map<string, readonly string[]>(
  PRECISIONS_ET_SEJOUR.map(({ nom, lit }) => [nom, lit]),
);

// Une précision se déroule en ses questions ; tout autre nom reste lui-même.
const deroule = (lit: readonly string[]) =>
  lit.flatMap((nom) => QUESTIONS_DE_LA_PRECISION.get(nom) ?? [nom]);
const horsDuParcours = (lit: readonly string[]) =>
  deroule(lit).filter((nom) => !LISIBLES.has(nom));

describe("chaque nom déclaré", () => {
  it("par une rubrique est une question, un fait ou une cible", () => {
    expect(RUBRIQUES.length).toBeGreaterThan(14);
    for (const { nom, lit } of RUBRIQUES)
      expect([nom, horsDuParcours(lit)]).toEqual([nom, []]);
  });

  it("par une raison de la caisse est un fait ou une cible", () => {
    for (const { scenario, lit } of RAISONS)
      expect([scenario, horsDuParcours(lit)]).toEqual([scenario, []]);
  });

  it("par une précision est une question", () => {
    for (const { nom, lit } of PRECISIONS_ET_SEJOUR)
      expect([nom, lit.filter((id) => !QUESTIONS.includes(id))]).toEqual([
        nom,
        [],
      ]);
  });

  it("par une raison non éligible remonte à des questions, des faits ou des cibles", () => {
    for (const { id, lit } of CONDITIONS)
      expect([id, horsDuParcours(lit)]).toEqual([id, []]);
  });
});

describe("une rubrique qui lit sans déclarer", () => {
  const ESSAI = uneRubrique("Essai")
    .lit("Q3.7")
    .cellules<{ question: unknown; fait: unknown; cible: unknown }>({
      question: ({ validated }) => {
        // @ts-expect-error Q3.6.2 n'est pas déclarée.
        return validated.question("Q3.6.2").value;
      },
      fait: ({ faits }) => {
        // @ts-expect-error `fait_ald_liee` n'est pas déclaré.
        return faits.fait_ald_liee;
      },
      cible: ({ cibles }) => {
        // @ts-expect-error `cible_issue_id` n'est pas déclarée.
        return cibles.cible_issue_id;
      },
    });

  it.each([
    ["question", "Q3.6.2"],
    ["fait", "fait_ald_liee"],
    ["cible", "cible_issue_id"],
  ] as const)("lève sur une %s, en se nommant", (cellule, nom) => {
    expect(() => ESSAI.cellules[cellule](donnees(PMT))).toThrow(
      `La rubrique « Essai » lit ${nom} sans le déclarer.`,
    );
  });
});
