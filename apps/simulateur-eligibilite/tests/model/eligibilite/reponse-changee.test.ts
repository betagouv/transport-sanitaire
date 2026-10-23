// Ce qu'efface une réponse changée : COR-14 et COR-23 de la v10.1.3 de
// l'éditeur (D-190). Le résultat se recalcule des réponses, et le complément
// repart vierge à chaque verrou : il reste à voir que seules les réponses qui
// dépendent de la réponse changée s'effacent, et qu'une réponse indépendante
// reste.

import { describe, expect, it } from "vitest";
import { model } from "../../../core/models/eligibilite";
import { commitPage } from "../../../core/socle/questionnaire-engine/page-commit";
import {
  type Answers,
  pagesOf,
} from "../../../core/socle/questionnaire-engine/question";

const pages = pagesOf(model.questionnaire);

// Une réponse à chaque question : seul compte ce que le changement efface.
const TOUT: Answers = Object.fromEntries(
  pages.flatMap((page) =>
    page.questions.map(({ id }) => [id, `réponse à ${id}`]),
  ),
);

// Les réponses qu'efface la page de `id` validée avec une autre réponse à `id`.
const effaceesPar = (id: string) => {
  const page = pages.find((page) =>
    page.questions.some((question) => question.id === id),
  );
  if (page === undefined) throw new Error(`${id} n'est sur aucune page`);
  const surLaPage = Object.fromEntries(
    page.questions.map((question) => [question.id, TOUT[question.id]]),
  );
  const apres = commitPage(pages, TOUT, page, {
    ...surLaPage,
    [id]: "une autre réponse",
  });
  return Object.keys(TOUT).filter((question) => !(question in apres));
};

describe("une réponse changée en P2 (COR-14)", () => {
  it.each([
    ["l'urgence", "Q2.3.4"],
    ["l'exception", "Q2.6"],
    ["la permission", "Q2.8.5"],
    ["la convocation", "Q2.10"],
    ["le lieu à l'étranger", "Q2.2.5"],
    ["le départ", "Q2.13.depart"],
  ])("%s garde les réponses des autres pages", (_, id) => {
    expect(effaceesPar(id)).toEqual([]);
  });
});

describe("une réponse changée en P1 (COR-23)", () => {
  it.each(["Q1.1", "Q1.2", "Q1.3"])(
    "%s efface l'indication médicale du retour vers la prison",
    (id) => {
      expect(effaceesPar(id)).toContain("Q2.2.1.indication");
    },
  );

  it("garde le motif du trajet", () => {
    expect(effaceesPar("Q1.3")).toEqual(["Q2.2.1.indication"]);
  });
});
