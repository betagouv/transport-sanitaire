import { fireEvent, screen } from "@testing-library/react";
import { describe, expect, it } from "vitest";
import { page, QuestionFactory, ReadingFactory } from "../../../core/socle";
import { afficher } from "./afficher";
import { declencheurDe } from "./panneaux";

// Une question peut s'afficher sous plusieurs réponses de sa page
// (`shownUnder` répété) : elle va sous la première devenue effective, y reste
// quand une autre le devient, et passe sous la suivante, sa réponse gardée,
// quand on la retire (NAV-PANNEAUX-20261116). Une place peut ne valoir que
// tant qu'une condition tient. Les pages sont écrites ici.

type Questions = {
  grave: "oui" | "non";
  situations: readonly ("ald" | "autre" | "aucune")[];
  lien: "direct" | "indirect";
  suite: "oui" | "non";
};

const question = new QuestionFactory<Questions>();
const given = new ReadingFactory<Questions>();

const GRAVE = question
  .singleChoice("grave", "Est-ce grave ?")
  .possibleAnswers({ oui: "Grave", non: "Bénin" });
const SITUATIONS = question
  .multipleChoice("situations", "Quelles situations concernent ce trajet ?")
  .possibleAnswers({
    ald: "Une affection de longue durée",
    autre: "Une autre situation",
    aucune: "Aucune de ces situations",
  })
  .exclusive("aucune");
const situations = given.question("situations").answer();
const LIEN = question
  .singleChoice("lien", "Quel lien avec la situation ?")
  .possibleAnswers({ direct: "Un lien direct", indirect: "Un lien indirect" })
  .appliesWhen(situations.checked("ald").or(situations.checked("autre")));
const SUITE = page(
  "suite",
  question
    .singleChoice("suite", "Une suite ?")
    .possibleAnswers({ oui: "Oui", non: "Non" }),
);

const SOUS_DEUX_REPONSES = page(
  "situations",
  SITUATIONS,
  LIEN.shownUnder("situations", "ald").shownUnder("situations", "autre"),
);

const caseACocher = (name: RegExp) => screen.getByRole("checkbox", { name });
const ald = () => caseACocher(/^une affection/i);
const autre = () => caseACocher(/^une autre/i);
const groupesDuLien = () =>
  screen.queryAllByRole("group", { name: /^quel lien/i });
const groupeDuLien = () => screen.getByRole("group", { name: /^quel lien/i });
const direct = () => screen.getByRole("radio", { name: "Un lien direct" });

describe("une question sous plusieurs réponses", () => {
  it("va sous la première cochée, une seule fois", async () => {
    const { user } = afficher([SOUS_DEUX_REPONSES]);

    await user.click(autre());
    await user.click(ald());

    expect(groupesDuLien()).toHaveLength(1);
    expect(declencheurDe(groupeDuLien())).toBe(autre());
  });

  it("suit l'ordre des coches, pas celui de la page", async () => {
    const { user } = afficher([SOUS_DEUX_REPONSES]);

    await user.click(ald());
    await user.click(autre());

    expect(declencheurDe(groupeDuLien())).toBe(ald());
  });

  it("passe sous l'autre réponse, sa réponse gardée, quand on décoche la sienne", async () => {
    const { user } = afficher([SOUS_DEUX_REPONSES]);

    await user.click(ald());
    await user.click(autre());
    await user.click(direct());
    await user.click(ald());

    expect(declencheurDe(groupeDuLien())).toBe(autre());
    expect(direct()).toBeChecked();
  });

  it("ne reprend pas sa place quand on recoche la première", async () => {
    const { user } = afficher([SOUS_DEUX_REPONSES]);

    await user.click(ald());
    await user.click(autre());
    await user.click(ald());
    await user.click(ald());

    expect(declencheurDe(groupeDuLien())).toBe(autre());
  });

  it("sans réponse sélectionnée sur la page, s'affiche à son rang", () => {
    const SANS_GARDE = question
      .singleChoice("lien", "Quel lien avec la situation ?")
      .possibleAnswers({
        direct: "Un lien direct",
        indirect: "Un lien indirect",
      })
      .shownUnder("situations", "ald");
    afficher([page("situations", SITUATIONS, SANS_GARDE)]);

    expect(declencheurDe(groupeDuLien())).toBeUndefined();
  });

  it("retrouve sa place au retour sur une page validée", async () => {
    const { user } = afficher([SOUS_DEUX_REPONSES, SUITE]);

    await user.click(autre());
    await user.click(ald());
    await user.click(direct());
    await user.click(screen.getByRole("button", { name: "Suivant" }));
    await user.click(await screen.findByRole("button", { name: "Précédent" }));

    expect(
      declencheurDe(await screen.findByRole("group", { name: /^quel lien/i })),
    ).toBe(autre());
  });
});

describe("une place qui ne vaut que sous une condition", () => {
  const SOUS_CONDITION = page(
    "situations",
    GRAVE,
    SITUATIONS,
    LIEN.shownUnder("situations", "ald").shownUnder("situations", "autre", {
      while: given.question("grave").answer().is("oui"),
    }),
  );

  it("ne compte pas tant que la condition ne tient pas", async () => {
    const { user } = afficher([SOUS_CONDITION]);

    await user.click(screen.getByLabelText("Bénin"));
    await user.click(autre());
    await user.click(ald());

    expect(declencheurDe(groupeDuLien())).toBe(ald());
  });

  it("compte dès que la condition tient", async () => {
    const { user } = afficher([SOUS_CONDITION]);

    await user.click(screen.getByLabelText("Grave"));
    await user.click(autre());
    await user.click(ald());

    expect(declencheurDe(groupeDuLien())).toBe(autre());
  });

  it("prend rang au moment où elle devient effective", async () => {
    const { user } = afficher([SOUS_CONDITION]);

    await user.click(screen.getByLabelText("Bénin"));
    await user.click(autre());
    await user.click(ald());
    await user.click(screen.getByLabelText("Grave"));

    expect(declencheurDe(groupeDuLien())).toBe(ald());
  });
});

describe("l'accessibilité d'un panneau", () => {
  const annonce = () => screen.queryByText(/^Nouvelles? questions? :/);

  it("annonce la question qui apparaît, sans bouger le focus", async () => {
    const { user } = afficher([SOUS_DEUX_REPONSES]);

    await user.click(ald());

    expect(annonce()).toHaveTextContent(
      "Nouvelle question : Quel lien avec la situation ?",
    );
    expect(annonce()).toHaveAttribute("aria-live", "polite");
    expect(ald()).toHaveFocus();
  });

  it("n'annonce rien à l'ouverture de la page", () => {
    afficher([SOUS_DEUX_REPONSES]);

    expect(annonce()).toBeNull();
  });

  it("garde le focus d'un champ qui change de panneau", async () => {
    const { user } = afficher([SOUS_DEUX_REPONSES]);
    await user.click(ald());
    await user.click(autre());

    direct().focus();
    fireEvent.click(ald());

    expect(declencheurDe(groupeDuLien())).toBe(autre());
    expect(direct()).toHaveFocus();
  });

  it("rend le focus à la réponse qui ouvrait le panneau d'un champ retiré", async () => {
    const { user } = afficher([SOUS_DEUX_REPONSES]);
    await user.click(ald());

    direct().focus();
    fireEvent.click(ald());

    expect(groupesDuLien()).toHaveLength(0);
    expect(ald()).toHaveFocus();
  });
});
