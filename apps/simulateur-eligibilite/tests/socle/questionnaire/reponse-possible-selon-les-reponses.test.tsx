import { screen } from "@testing-library/react";
import { describe, expect, it } from "vitest";
import { page, QuestionFactory, ReadingFactory } from "../../../core/socle";
import { afficher } from "./afficher";

// Le libellé d'une réponse possible peut dépendre des réponses. La réponse
// possible exclusive aussi, et elle peut ne pas se proposer. Les pages sont
// écrites ici.

type Questions = {
  hospitalise: "oui" | "non";
  situations: readonly ("etranger" | "autre" | "aucune")[];
  exonerations: readonly ("ald" | "aucun")[];
};

const question = new QuestionFactory<Questions>();
const given = new ReadingFactory<Questions>();

const HOSPITALISATION = page(
  "hospitalisation",
  question
    .singleChoice("hospitalise", "Le patient est-il hospitalisé ?")
    .possibleAnswers({ oui: "Oui", non: "Non" }),
);

const SITUATIONS = page(
  "situations",
  question
    .multipleChoice("situations", "Quelles situations concernent ce trajet ?")
    .possibleAnswers({
      etranger: "Un lieu à l'étranger",
      autre: "Une autre situation",
      aucune: "Aucune de ces situations",
    })
    .exclusive("aucune")
    .possibleAnswer("etranger", (possibleAnswer) =>
      possibleAnswer.labelFrom(({ answers }) =>
        answers.question("hospitalise").is("oui")
          ? "Un établissement à l'étranger"
          : "Un lieu à l'étranger",
      ),
    )
    .possibleAnswer("aucune", (possibleAnswer) =>
      possibleAnswer.labelFrom(({ answers }) =>
        answers.question("hospitalise").is("oui")
          ? "Aucune autre situation parmi celles proposées"
          : "Aucune de ces situations",
      ),
    ),
);

const EXONERATIONS = page(
  "exonerations",
  question
    .multipleChoice("exonerations", "Quels cas d'exonération ?")
    .possibleAnswers({ ald: "Une affection de longue durée", aucun: "Aucun" })
    .exclusive("aucun")
    .possibleAnswer("aucun", (possibleAnswer) =>
      possibleAnswer.offeredWhen(
        given.question("hospitalise").answer().is("oui").not(),
      ),
    ),
);

const radio = (name: string) => screen.getByRole("radio", { name });
const caseACocher = (name: string) => screen.getByRole("checkbox", { name });
const sansCase = (name: string) =>
  screen.queryByRole("checkbox", { name }) === null;

describe("libellé d'une réponse possible selon les réponses", () => {
  it("garde son libellé quand rien ne le change", async () => {
    const { user } = afficher([HOSPITALISATION, SITUATIONS]);

    await user.click(radio("Non"));

    await screen.findByRole("group", { name: /^quelles situations/i });
    expect(caseACocher("Un lieu à l'étranger")).toBeInTheDocument();
    expect(caseACocher("Aucune de ces situations")).toBeInTheDocument();
  });

  it("change avec les réponses, réponse possible exclusive comprise", async () => {
    const { user } = afficher([HOSPITALISATION, SITUATIONS]);

    await user.click(radio("Oui"));

    await screen.findByRole("group", { name: /^quelles situations/i });
    expect(caseACocher("Un établissement à l'étranger")).toBeInTheDocument();
    expect(
      caseACocher("Aucune autre situation parmi celles proposées"),
    ).toBeInTheDocument();
  });
});

describe("réponse possible exclusive conditionnelle", () => {
  it("se propose quand les réponses le permettent", async () => {
    const { user } = afficher([HOSPITALISATION, EXONERATIONS]);

    await user.click(radio("Non"));

    await screen.findByRole("group", { name: /^quels cas/i });
    expect(caseACocher("Aucun")).toBeInTheDocument();
  });

  it("ne se propose pas sinon : il faut cocher autre chose", async () => {
    const { user, reponses } = afficher([HOSPITALISATION, EXONERATIONS]);

    await user.click(radio("Oui"));

    await screen.findByRole("group", { name: /^quels cas/i });
    expect(sansCase("Aucun")).toBe(true);
    await user.click(caseACocher("Une affection de longue durée"));
    await user.click(screen.getByRole("button", { name: "Terminer" }));
    expect(reponses()).toEqual({ hospitalise: "oui", exonerations: ["ald"] });
  });

  it("quitte la réponse quand elle ne se propose plus", async () => {
    const { user } = afficher([HOSPITALISATION, EXONERATIONS]);
    await user.click(radio("Non"));
    await screen.findByRole("group", { name: /^quels cas/i });
    await user.click(caseACocher("Aucun"));

    await user.click(screen.getByRole("button", { name: "Précédent" }));
    await user.click(radio("Oui"));

    await screen.findByRole("group", { name: /^quels cas/i });
    expect(screen.getByRole("button", { name: "Suivant" })).toBeDisabled();
  });
});
