import { screen } from "@testing-library/react";
import { describe, expect, it } from "vitest";
import type {
  Page,
  Question,
} from "../../../core/socle/questionnaire-engine/question";
import { Questionnaire } from "../../../core/socle/questionnaire-engine/questionnaire";
import { errorsOf } from "../../../front/socle/questionnaire-engine/screen-texts";
import { afficher } from "./afficher";

// Deux options d'un choix multiple peuvent s'exclure : cocher l'une décoche
// l'autre, avec une explication. Les pages sont écrites ici.

const EXPLICATION =
  "Le patient voyage dans son fauteuil ou sur un brancard, pas les deux.";

const CRITERES: Question = {
  id: "criteres",
  kind: "multiple choice",
  label: "Quels critères ?",
  options: [
    { value: "fauteuil", label: "Dans son fauteuil" },
    { value: "brancard", label: "Sur un brancard" },
    { value: "oxygene", label: "Sous oxygène" },
  ],
  incompatibleOptions: [
    { values: ["fauteuil", "brancard"], explanation: EXPLICATION },
  ],
};

const PAGE: Page = { id: "criteres", questions: [CRITERES] };

const caseACocher = (name: string) => screen.getByRole("checkbox", { name });

describe("options incompatibles", () => {
  it("décoche l'autre, explique pourquoi, et garde le reste", async () => {
    const { user } = afficher([PAGE]);
    await user.click(caseACocher("Dans son fauteuil"));
    await user.click(caseACocher("Sous oxygène"));

    await user.click(caseACocher("Sur un brancard"));

    expect(caseACocher("Sur un brancard")).toBeChecked();
    expect(caseACocher("Dans son fauteuil")).not.toBeChecked();
    expect(caseACocher("Sous oxygène")).toBeChecked();
    expect(screen.getByText(EXPLICATION)).toBeInTheDocument();
  });

  it("vaut dans les deux sens", async () => {
    const { user } = afficher([PAGE]);
    await user.click(caseACocher("Sur un brancard"));

    await user.click(caseACocher("Dans son fauteuil"));

    expect(caseACocher("Dans son fauteuil")).toBeChecked();
    expect(caseACocher("Sur un brancard")).not.toBeChecked();
  });

  it("n'explique rien tant que rien n'est décoché", async () => {
    const { user } = afficher([PAGE]);

    await user.click(caseACocher("Dans son fauteuil"));
    await user.click(caseACocher("Sous oxygène"));

    expect(screen.queryByText(EXPLICATION)).toBeNull();
  });

  it("retire l'explication au geste suivant, et valide ce qui reste", async () => {
    const { user, reponses } = afficher([PAGE]);
    await user.click(caseACocher("Dans son fauteuil"));
    await user.click(caseACocher("Sur un brancard"));

    await user.click(caseACocher("Sous oxygène"));

    expect(screen.queryByText(EXPLICATION)).toBeNull();
    await user.click(screen.getByRole("button", { name: "Terminer" }));
    expect(reponses()).toEqual({ criteres: ["brancard", "oxygene"] });
  });

  it("refuse une réponse venue d'ailleurs qui porterait les deux", () => {
    const [criteres] = new Questionnaire([PAGE]).readWith({}).questionsOn(PAGE);
    expect(criteres && errorsOf(criteres, ["fauteuil", "brancard"])).toEqual([
      EXPLICATION,
    ]);
    expect(criteres && errorsOf(criteres, ["fauteuil", "oxygene"])).toEqual([]);
  });
});
