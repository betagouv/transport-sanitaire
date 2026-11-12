// L'urgence, Q2.3.4, a deux places : la page du trajet, puis celle de la
// branche (ADR-29). Elle se pose à la première où sa garde tient, sous une
// seule réponse. Une correction qui la déplace d'une place à l'autre la garde
// répondue.
//
// Les pages sont lues comme l'écran les lit, filtrage par le graphe compris.

import { describe, expect, it } from "vitest";
import type { Questions } from "../../../../core/models/eligibilite/questions/reponses";
import {
  type Answers,
  pagesOf,
  Questionnaire,
} from "../../../../core/socle/questionnaire-engine";
import { model } from "../../../../front/models/eligibilite";
import { ciblesDe, MATERNITE_ETABLIE } from "./reponses-de-la-branche";

describe("l'urgence à deux places", () => {
  it("se pose à la branche pour un trajet court : le trajet ne la demande pas", () => {
    expect(urgences(MATERNITE_ETABLIE)).toEqual(["P2/branche"]);
  });

  it("se pose au trajet au-delà de 150 km : la branche ne la repose pas", () => {
    expect(urgences({ ...LONGUE, "Q2.3.4": "2_NON" })).toEqual(["P2/trajet"]);
  });

  it("répondue à la branche, puis le trajet allongé : posée au trajet, déjà répondue", () => {
    const apres = suivant(
      { ...MATERNITE_ETABLIE, "Q2.1": "1_CONSULTATION", "Q2.3.4": "1_OUI" },
      "P2/trajet",
      {
        "Q2.3.1": "3_PLUS_DE_CENT_CINQUANTE_KM",
        "Q2.3.3": "2_NON",
      },
    );

    expect(apres).toHaveProperty("Q2.3.4", "1_OUI");
    expect(urgences(apres)).toEqual(["P2/trajet"]);
    expect(lire(apres).isComplete()).toBe(true);
    expect(issue(apres)).toBe("ISSUE_CAISSE");
  });

  it("répondue au trajet, puis le trajet raccourci : la branche la pose, déjà répondue", () => {
    const apres = suivant({ ...LONGUE, "Q2.3.4": "2_NON" }, "P2/trajet", {
      "Q2.3.1": "1_CINQUANTE_KM_OU_MOINS",
    });

    expect(apres).toHaveProperty("Q2.3.4", "2_NON");
    expect(urgences(apres)).toEqual(["P2/branche"]);
    expect(lire(apres).isComplete()).toBe(true);
    expect(issue(apres)).toBe("ISSUE_DAP_SANS_URGENCE");
  });
});

// ---- implémentation ----

// La maternité établie, à plus de 150 km, sans série. La consultation prouve la
// finalité de soins : sans elle, l'examen seul n'ouvre pas l'accord préalable
// au-delà de 150 km (v10.1.8).
const LONGUE: Answers<Questions> = {
  ...MATERNITE_ETABLIE,
  "Q2.1": "1_CONSULTATION",
  "Q2.3.1": "3_PLUS_DE_CENT_CINQUANTE_KM",
  "Q2.3.3": "2_NON",
};

const pages = pagesOf(model.core.questionnaire);

const lire = (reponses: Answers) =>
  new Questionnaire(pages, model.core.relevance).readWith(reponses);

const pageDe = (id: string) => {
  const page = pages.find((candidate) => candidate.id === id);
  if (page === undefined) throw new Error(`Page inconnue : ${id}`);
  return page;
};

// Les pages où se pose l'urgence.
const urgences = (reponses: Answers) => {
  const lue = lire(reponses);
  return lue
    .askedPages()
    .filter((page) => lue.questionsOn(page).some(({ id }) => id === "Q2.3.4"))
    .map(({ id }) => id);
};

// Les réponses une fois la page `id` rouverte, changée par `changees`, puis
// validée. Son brouillon porte les réponses de toutes ses questions, comme à
// l'écran.
const suivant = (reponses: Answers, id: string, changees: Answers) => {
  const page = pageDe(id);
  const brouillon = Object.fromEntries(
    page.questions.flatMap(({ id: question }) =>
      reponses[question] === undefined ? [] : [[question, reponses[question]]],
    ),
  );
  return lire(reponses).commit(page, { ...brouillon, ...changees });
};

const issue = (reponses: Answers<Questions>) =>
  ciblesDe(reponses).cible_issue_id.value;
