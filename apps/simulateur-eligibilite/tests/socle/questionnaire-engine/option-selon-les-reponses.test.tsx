import { screen } from "@testing-library/react";
import { describe, expect, it } from "vitest";
import type { Page } from "../../../front/socle/questionnaire-engine/question";
import { poser } from "./poser";

// Le libellé d'une option peut dépendre des réponses. L'option exclusive aussi,
// et elle peut ne pas se proposer. Les pages sont écrites ici.

const HOSPITALISATION: Page = {
  id: "hospitalisation",
  questions: [
    {
      id: "hospitalise",
      kind: "single choice",
      label: "Le patient est-il hospitalisé ?",
      options: [
        { value: "oui", label: "Oui" },
        { value: "non", label: "Non" },
      ],
    },
  ],
};

const SITUATIONS: Page = {
  id: "situations",
  questions: [
    {
      id: "situations",
      kind: "multiple choice",
      label: "Quelles situations concernent ce trajet ?",
      options: [
        {
          value: "etranger",
          label: "Un lieu à l'étranger",
          labelFrom: ({ hospitalise }) =>
            hospitalise === "oui"
              ? "Un établissement à l'étranger"
              : "Un lieu à l'étranger",
        },
        { value: "autre", label: "Une autre situation" },
      ],
      exclusiveOption: {
        value: "aucune",
        label: "Aucune de ces situations",
        labelFrom: ({ hospitalise }) =>
          hospitalise === "oui"
            ? "Aucune autre situation parmi celles proposées"
            : "Aucune de ces situations",
      },
    },
  ],
};

const EXONERATIONS: Page = {
  id: "exonerations",
  questions: [
    {
      id: "exonerations",
      kind: "multiple choice",
      label: "Quels cas d'exonération ?",
      options: [{ value: "ald", label: "Une affection de longue durée" }],
      exclusiveOption: {
        value: "aucun",
        label: "Aucun",
        offeredIf: ({ hospitalise }) => hospitalise !== "oui",
      },
    },
  ],
};

const radio = (name: string) => screen.getByRole("radio", { name });
const caseACocher = (name: string) => screen.getByRole("checkbox", { name });
const sansCase = (name: string) =>
  screen.queryByRole("checkbox", { name }) === null;

describe("libellé d'une option selon les réponses", () => {
  it("garde son libellé quand rien ne le change", async () => {
    const { user } = poser([HOSPITALISATION, SITUATIONS]);

    await user.click(radio("Non"));

    await screen.findByRole("group", { name: /^quelles situations/i });
    expect(caseACocher("Un lieu à l'étranger")).toBeInTheDocument();
    expect(caseACocher("Aucune de ces situations")).toBeInTheDocument();
  });

  it("change avec les réponses, option exclusive comprise", async () => {
    const { user } = poser([HOSPITALISATION, SITUATIONS]);

    await user.click(radio("Oui"));

    await screen.findByRole("group", { name: /^quelles situations/i });
    expect(caseACocher("Un établissement à l'étranger")).toBeInTheDocument();
    expect(
      caseACocher("Aucune autre situation parmi celles proposées"),
    ).toBeInTheDocument();
  });
});

describe("option exclusive conditionnelle", () => {
  it("se propose quand les réponses le permettent", async () => {
    const { user } = poser([HOSPITALISATION, EXONERATIONS]);

    await user.click(radio("Non"));

    await screen.findByRole("group", { name: /^quels cas/i });
    expect(caseACocher("Aucun")).toBeInTheDocument();
  });

  it("ne se propose pas sinon : il faut cocher autre chose", async () => {
    const { user, reponses } = poser([HOSPITALISATION, EXONERATIONS]);

    await user.click(radio("Oui"));

    await screen.findByRole("group", { name: /^quels cas/i });
    expect(sansCase("Aucun")).toBe(true);
    await user.click(caseACocher("Une affection de longue durée"));
    await user.click(screen.getByRole("button", { name: "Terminer" }));
    expect(reponses()).toEqual({ hospitalise: "oui", exonerations: ["ald"] });
  });

  it("quitte la réponse quand elle ne se propose plus", async () => {
    const { user } = poser([HOSPITALISATION, EXONERATIONS]);
    await user.click(radio("Non"));
    await screen.findByRole("group", { name: /^quels cas/i });
    await user.click(caseACocher("Aucun"));

    await user.click(screen.getByRole("button", { name: "Précédent" }));
    await user.click(radio("Oui"));

    await screen.findByRole("group", { name: /^quels cas/i });
    expect(screen.getByRole("button", { name: "Suivant" })).toBeDisabled();
  });
});
