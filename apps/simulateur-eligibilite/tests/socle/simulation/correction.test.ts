// Corriger une réponse d'avant depuis une alerte (ADR-30), sans écran : les
// réponses que l'incohérence invite à revoir, la page qu'un lien rouvre, et où
// « Suivant » reprend. Les pages sont écrites ici.

import { describe, expect, it } from "vitest";
import { constant, givenOf, page, questionsOf } from "../../../core/socle";
import type { CoreModel } from "../../../core/socle/model";
import type {
  Answers,
  Page,
  QuestionnairePart,
} from "../../../core/socle/questionnaire-engine";
import { Simulation } from "../../../core/socle/simulation";

type Questions = {
  soin: "dialyse" | "rien";
  frequence: "hebdomadaire" | "ponctuelle";
  motif: "consultation" | "autre";
  lieu: "hopital" | "domicile";
};

const question = questionsOf<Questions>();
const given = givenOf<Questions>();

const MESSAGE = "Une dialyse ne se fait pas à l'hôpital ici.";
const REVOIR = { label: "Revoir le soin", question: "soin" };

// Le lieu contredit la dialyse : son alerte invite à revoir le soin.
const LIEU = question
  .singleChoice("lieu", "Où ?")
  .options({ hopital: "À l'hôpital", domicile: "À domicile" })
  .appliesWhen(given.question("motif").answer().is("consultation"))
  .inconsistentWhen(
    given
      .question("soin")
      .answer()
      .is("dialyse")
      .and(given.question("lieu").answer().is("hopital")),
    MESSAGE,
    { revisit: constant([REVOIR, REVOIR]) },
  );

const PAGES = [
  page(
    "soin",
    question
      .singleChoice("soin", "Quel soin ?")
      .options({ dialyse: "Une dialyse", rien: "Rien" }),
  ),
  // Ne se pose que sans dialyse : la changer la rend nécessaire.
  page(
    "frequence",
    question
      .singleChoice("frequence", "À quelle fréquence ?")
      .options({ hebdomadaire: "Chaque semaine", ponctuelle: "Une fois" })
      .appliesWhen(given.question("soin").answer().is("rien")),
  ),
  page(
    "motif",
    question
      .singleChoice("motif", "Pour quoi ?")
      .options({ consultation: "Une consultation", autre: "Autre chose" }),
  ),
  page("lieu", LIEU),
] as Page[];

const core: CoreModel = {
  preconisation: { faits: () => ({}), cibles: () => ({}), reads: new Map() },
  questionnaire: [
    { id: "partie", title: "Partie", pages: PAGES },
  ] as QuestionnairePart<never, undefined>[],
  complement: {
    id: "complement",
    title: "Complément",
    pages: [
      page("note", question.text("note", "Une note ?")),
    ] as unknown as Page[],
  },
  seeds: async () => [],
};

const DIALYSE = { soin: "dialyse", motif: "consultation" };
const A_L_HOPITAL: Answers = { lieu: "hopital" };

// Sur le lieu, l'alerte affichée par ce brouillon.
const surLeLieu = () => Simulation.resume(core, DIALYSE);
const alerteDu = (simulation: Simulation, draft: Answers = {}) =>
  simulation.questionsOn(simulation.page, draft)[0];

describe("les réponses à revoir", () => {
  it("accompagnent l'alerte, chacune une fois", () => {
    const lieu = alerteDu(surLeLieu(), A_L_HOPITAL);

    expect(lieu?.inconsistencies).toEqual([MESSAGE]);
    expect(lieu?.revisits).toEqual([REVOIR]);
  });

  it("n'existent pas sans alerte", () => {
    expect(alerteDu(surLeLieu(), { lieu: "domicile" })?.revisits).toEqual([]);
  });
});

describe("rouvrir une réponse à revoir", () => {
  it("ouvre sa page, et garde l'origine pour y revenir", () => {
    const revue = surLeLieu().revisit("soin", A_L_HOPITAL);

    expect(revue?.page.id).toBe("soin");
    expect(revue?.correcting).toBe(true);
    expect(revue?.position).toEqual({ step: 1, returnTo: 3 });
    expect(revue?.answers).toEqual(DIALYSE);
  });

  it("refuse une question de la page ouverte, ou d'après", () => {
    const surLeMotif = Simulation.start(core).validate({ soin: "dialyse" });

    expect(surLeLieu().revisit("lieu", A_L_HOPITAL)).toBeUndefined();
    expect(surLeMotif.revisit("lieu", {})).toBeUndefined();
  });

  it("refuse une question qui ne se pose pas", () => {
    expect(surLeLieu().revisit("frequence", A_L_HOPITAL)).toBeUndefined();
  });

  it("refuse tout après le verrou", () => {
    const verrouillee = Simulation.resume(core, {
      ...DIALYSE,
      lieu: "domicile",
    }).lock();

    expect(verrouillee.revisit("soin", {})).toBeUndefined();
  });
});

describe("« Suivant » pendant une correction", () => {
  it("revient à l'origine, avec son brouillon et son alerte, sans repasser par les pages restées valides", () => {
    const revenue = surLeLieu()
      .revisit("soin", A_L_HOPITAL)
      ?.validate({ soin: "dialyse" });

    expect(revenue?.page.id).toBe("lieu");
    expect(revenue?.correcting).toBe(false);
    expect(revenue?.restoredDraft).toEqual(A_L_HOPITAL);
    expect(
      alerteDu(revenue as Simulation, A_L_HOPITAL)?.inconsistencies,
    ).toEqual([MESSAGE]);
  });

  it("pose d'abord la question devenue nécessaire avant l'origine", () => {
    const precisee = surLeLieu()
      .revisit("soin", A_L_HOPITAL)
      ?.validate({ soin: "rien" });

    expect(precisee?.page.id).toBe("frequence");
    expect(precisee?.correcting).toBe(true);
    // Le rang de l'origine reste celui du début de la correction.
    expect(precisee?.position).toEqual({ step: 2, returnTo: 3 });

    const revenue = precisee?.validate({ frequence: "ponctuelle" });
    expect(revenue?.page.id).toBe("lieu");
    expect(
      alerteDu(revenue as Simulation, A_L_HOPITAL)?.inconsistencies,
    ).toEqual([]);
  });

  it("rejoint le résultat quand l'origine ne se pose plus", () => {
    const finie = surLeLieu()
      .revisit("motif", A_L_HOPITAL)
      ?.validate({ motif: "autre" });

    expect(finie?.stage).toEqual({ name: "resultat" });
    expect(finie?.correcting).toBe(false);
  });

  it("« Précédent » l'abandonne", () => {
    const reculee = surLeLieu().revisit("motif", A_L_HOPITAL)?.back();

    expect(reculee?.page.id).toBe("soin");
    expect(reculee?.correcting).toBe(false);
    expect(reculee?.position).toEqual({ step: 1 });
  });
});

describe("aller à une position", () => {
  it("accepte une page déjà posée, en avant comme en arrière", () => {
    const surLeSoin = surLeLieu().moveTo({ step: 1 });

    expect(surLeSoin?.page.id).toBe("soin");
    expect(surLeSoin?.moveTo({ step: 3 })?.page.id).toBe("lieu");
  });

  it("refuse une page que rien n'a encore posée", () => {
    const surLeMotif = Simulation.start(core).validate({ soin: "dialyse" });

    expect(surLeMotif.moveTo({ step: 3 })).toBeUndefined();
    expect(surLeMotif.moveTo({ step: 0 })).toBeUndefined();
  });

  it("reprend une correction vers une page plus loin, qui attend sa réponse", () => {
    const reprise = surLeLieu().moveTo({ step: 1, returnTo: 3 });
    const repondue = Simulation.resume(core, { ...DIALYSE, lieu: "domicile" });

    expect(reprise?.correcting).toBe(true);
    expect(reprise?.validate({ soin: "dialyse" }).page.id).toBe("lieu");
    expect(surLeLieu().moveTo({ step: 3, returnTo: 1 })).toBeUndefined();
    expect(repondue.moveTo({ step: 1, returnTo: 3 })).toBeUndefined();
  });

  it("garde le brouillon de l'origine, à l'aller comme au retour", () => {
    const revue = surLeLieu().revisit("soin", A_L_HOPITAL);
    const revenue = revue?.moveTo({ step: 3 });
    const repartie = revenue?.moveTo({ step: 1, returnTo: 3 });

    expect(revenue?.correcting).toBe(false);
    expect(revenue?.restoredDraft).toEqual(A_L_HOPITAL);
    expect(repartie?.validate({ soin: "dialyse" }).restoredDraft).toEqual(
      A_L_HOPITAL,
    );
  });

  it("rouvre le questionnaire depuis le résultat", () => {
    const resultat = Simulation.resume(core, { ...DIALYSE, lieu: "domicile" });

    expect(resultat.position).toEqual({ step: 4 });
    expect(resultat.moveTo({ step: 2 })?.stage).toEqual({
      name: "questionnaire",
    });
  });

  it("refuse tout après le verrou, qui numérote la suite", () => {
    const verrouillee = Simulation.resume(core, {
      ...DIALYSE,
      lieu: "domicile",
    }).lock();

    expect(verrouillee.position).toEqual({ step: 5 });
    expect(verrouillee.validate({ note: "rien" }).position).toEqual({
      step: 6,
    });
    expect(verrouillee.moveTo({ step: 1 })).toBeUndefined();
  });
});
