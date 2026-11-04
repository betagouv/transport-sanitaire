// Ce qu'efface une réponse changée : COR-14 et COR-23 de la v10.1.3 de
// l'éditeur (D-190), et les cas « Distance/ligne », « Certificats »,
// « Maternité » et « Contextes » de ses compléments de recette (#149). Le
// résultat se recalcule des réponses, et le complément repart vierge à chaque
// verrou : il reste à voir que seules les réponses qui dépendent de la réponse
// changée, ou que sa page ne pose plus, s'effacent, et qu'une réponse
// indépendante reste.

import { describe, expect, it } from "vitest";
import { model } from "../../../core/models/eligibilite";
import type { Questions } from "../../../core/models/eligibilite/questions/reponses";
import {
  type Answers,
  answerOnPage,
  commitPage,
  pagesOf,
  Questionnaire,
} from "../../../core/socle/questionnaire-engine";

import { preconisationOf } from "../../../core/socle/simulation";
import { model as frontModel } from "../../../front/models/eligibilite";
import { MATERNITE_ETABLIE } from "./p2/reponses-de-la-branche";

type Reponses = Answers<Questions>;

const pages = pagesOf(model.questionnaire);
const pageDe = (id: string) => {
  const page = pages.find((candidate) => candidate.id === id);
  if (page === undefined) throw new Error(`Page inconnue : ${id}`);
  return page;
};

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

// Le parcours tel que l'écran le lit, filtrage par le graphe compris.
const lire = (reponses: Answers) =>
  new Questionnaire(
    pagesOf(frontModel.core.questionnaire),
    frontModel.core.relevance,
  ).readWith(reponses);

// Le brouillon d'une page rouverte : ses réponses validées.
const brouillonDe = (reponses: Reponses, id: string): Reponses =>
  Object.fromEntries(
    pageDe(id).questions.flatMap((question) => {
      const reponse = reponses[question.id as keyof Questions];
      return reponse === undefined ? [] : [[question.id, reponse]];
    }),
  );

// Les réponses une fois la page `id` rouverte, changée par `changees`, puis
// validée : ce que fait « Suivant » après un « Précédent ».
const valideeAvec = (reponses: Reponses, id: string, changees: Reponses) =>
  lire(reponses).commit(pageDe(id), {
    ...brouillonDe(reponses, id),
    ...changees,
  });

const posees = (reponses: Answers) => {
  const lues = lire(reponses);
  return lues
    .askedPages()
    .flatMap((page) => lues.questionsOn(page).map(({ id }) => id));
};

const issue = (reponses: Answers) =>
  preconisationOf({ ...model, relevance: frontModel.core.relevance }, reponses)
    .cibles.cible_issue_id.value;

// Un patient seul, pour une consultation à 50 km ou moins, sans situation
// particulière : le parcours est complet.
const SEUL: Reponses = {
  "Q0.1": "1_VERIFIER",
  "Q1.1": "1_SEUL",
  "Q1.3": ["7_AUCUNE"],
  "Q1.4": "1_VEHICULE_PERSONNEL",
  "Q2.1": "1_CONSULTATION",
  "Q2.2.1": ["0_AUCUNE"],
  "Q2.2.1.b": ["0_AUCUN"],
  "Q2.3.1": "1_CINQUANTE_KM_OU_MOINS",
  "Q2.3.2": false,
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

describe("le premier bloc des situations changé (cas « Contextes »)", () => {
  // Les trois situations à précisions, et un soin du second bloc.
  const TROIS_SITUATIONS: Reponses = {
    ...SEUL,
    "Q2.2.1": ["1_HOSPITALISATION", "2_ETRANGER", "10_RETOUR_PENITENTIAIRE"],
    "Q2.2.1.cadre": "1_ETABLISSEMENT",
    "Q2.2.1.a": "2_NON",
    "Q2.2.1.indication": "1_OUI",
    "Q2.2.5": ["2_ARRIVEE"],
    "Q2.2.1.b": ["1_ATMP"],
  };
  const PRECISIONS = [
    "Q2.2.1.cadre",
    "Q2.2.1.a",
    "Q2.2.1.indication",
    "Q2.2.5",
  ];

  it("« Non, aucune » efface les précisions et le second bloc, et garde le trajet", () => {
    const apres = valideeAvec(TROIS_SITUATIONS, "P2/contextes", {
      "Q2.2.1": ["0_AUCUNE"],
    });

    expect(PRECISIONS.filter((id) => id in apres)).toEqual([]);
    expect(apres).not.toHaveProperty("Q2.2.1.b");
    expect(apres["Q2.3.1"]).toBe("1_CINQUANTE_KM_OU_MOINS");
  });

  it("décocher le séjour efface le cadre et la permission du séjour, et le second bloc", () => {
    const apres = valideeAvec(TROIS_SITUATIONS, "P2/contextes", {
      "Q2.2.1": ["2_ETRANGER", "10_RETOUR_PENITENTIAIRE"],
    });

    expect(PRECISIONS.filter((id) => id in apres)).toEqual([
      "Q2.2.1.indication",
      "Q2.2.5",
    ]);
    expect(apres).not.toHaveProperty("Q2.2.1.b");
  });
});

describe("la distance changée (cas « Distance/ligne »)", () => {
  const EN_SERIE: Reponses = {
    ...SEUL,
    "Q2.3.1": "2_PLUS_DE_CINQUANTE_KM",
    "Q2.3.3": "1_OUI",
    "Q2.3.4": "2_NON",
  };

  it("revenir à 50 km ou moins efface la série et l'urgence", () => {
    const apres = valideeAvec(EN_SERIE, "P2/trajet", {
      "Q2.3.1": "1_CINQUANTE_KM_OU_MOINS",
    });

    expect(apres).not.toHaveProperty("Q2.3.3");
    expect(apres).not.toHaveProperty("Q2.3.4");
    expect(posees(apres)).not.toContain("Q2.3.3");
  });

  it("repasser au-delà de 50 km repose la série, sans réponse", () => {
    const court = valideeAvec(EN_SERIE, "P2/trajet", {
      "Q2.3.1": "1_CINQUANTE_KM_OU_MOINS",
    });
    const deNouveau = { ...court, "Q2.3.1": "2_PLUS_DE_CINQUANTE_KM" };

    expect(posees(deNouveau)).toContain("Q2.3.3");
    expect(deNouveau).not.toHaveProperty("Q2.3.3");
  });
});

describe("une décision atteinte, puis une réponse changée (cas « Certificats »)", () => {
  // Une chimiothérapie : la séance prouve le motif, Q2.1 ne se pose pas.
  const CHIMIO: Reponses = { ...SEUL, "Q1.3": ["3_CHIMIOTHERAPIE"] };
  const { "Q2.1": _, ...CHIMIO_SANS_MOTIF } = CHIMIO;
  const ACQUIS = {
    "Q2.2.1": ["0_AUCUNE"],
    "Q2.2.1.b": ["0_AUCUN"],
    "Q2.3.1": "1_CINQUANTE_KM_OU_MOINS",
    "Q2.3.2": false,
  };

  it("une seconde séance en Q1.3 repose Q2.1.f, et garde le reste de P2", () => {
    expect(lire(CHIMIO_SANS_MOTIF).isComplete()).toBe(true);
    expect(issue(CHIMIO_SANS_MOTIF)).toBeDefined();

    const apres = valideeAvec(CHIMIO_SANS_MOTIF, "P1/3", {
      "Q1.3": ["3_CHIMIOTHERAPIE", "4_RADIOTHERAPIE"],
    });
    const lues = lire(apres);

    expect(lues.isComplete()).toBe(false);
    expect(lues.openPage().id).toBe("P2/prestation");
    expect(lues.questionsOn(lues.openPage()).map(({ id }) => id)).toEqual([
      "Q2.1.f",
    ]);
    expect(apres).toMatchObject(ACQUIS);
  });

  it("une hospitalisation en Q2.1 pose Q2.1.g, et garde le reste de P2", () => {
    expect(lire(SEUL).isComplete()).toBe(true);

    const apres = valideeAvec(SEUL, "P2/prestation", {
      "Q2.1": "8_HOSPITALISATION",
    });
    const lues = lire(apres);

    expect(lues.openPage().id).toBe("P2/prestation");
    expect(lues.questionsOn(lues.openPage()).map(({ id }) => id)).toEqual([
      "Q2.1",
      "Q2.1.g",
    ]);
    expect(apres).toMatchObject(ACQUIS);
  });

  it("revenir à la consultation efface Q2.1.g, et garde le reste de P2", () => {
    const sortie: Reponses = {
      ...SEUL,
      "Q2.1": "8_HOSPITALISATION",
      "Q2.1.g": "2_SORTIE",
    };
    const apres = valideeAvec(sortie, "P2/prestation", {
      "Q2.1": "1_CONSULTATION",
    });

    expect(apres).not.toHaveProperty("Q2.1.g");
    expect(apres).toMatchObject(ACQUIS);
    expect(lire(apres).isComplete()).toBe(true);
  });
});

describe("les groupes de la maternité changés (cas « Maternité »)", () => {
  const URGENCE_DITE: Reponses = { ...MATERNITE_ETABLIE, "Q2.12": "2_NON" };

  it.each([
    ["Q2.14.eloignement", ["2_COMMUNE_DESIGNEE_PAR_L_ARS"]],
    ["Q2.14.motif", ["2_HEBERGEMENT_ENGAGEMENT"]],
  ] as const)("changer %s efface l'urgence (Q2.12)", (id, autre) => {
    const brouillon = brouillonDe(URGENCE_DITE, "P2/branche");

    expect(brouillon).toHaveProperty("Q2.12");
    expect(
      answerOnPage(pageDe("P2/branche"), brouillon, id, autre),
    ).not.toHaveProperty("Q2.12");
  });
});
