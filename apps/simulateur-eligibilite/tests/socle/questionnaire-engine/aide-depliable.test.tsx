import { screen, within } from "@testing-library/react";
import { describe, expect, it } from "vitest";
import type { Page } from "../../../core/socle/questionnaire-engine/question";
import { afficher } from "./afficher";

// Une option peut porter une aide : un lien, juste sous elle, qui déplie une
// liste. La déplier n'est pas répondre. Les pages sont écrites ici.

const AGE: Page = {
  id: "age",
  questions: [
    {
      id: "age",
      kind: "single choice",
      label: "Le patient est-il majeur ?",
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
        { value: "hospitalise", label: "Le patient est déjà hospitalisé" },
        {
          value: "autre",
          label: "Une autre situation particulière",
          helpFrom: (answers) => ({
            label: "Voir les situations concernées",
            items: answers.question("age").is("non")
              ? ["Accident du travail", "Suivi en CAMSP ou en CMPP"]
              : ["Accident du travail", "Pension militaire"],
          }),
        },
      ],
      exclusiveOption: { value: "aucune", label: "Aucune de ces situations" },
    },
  ],
};

const aide = () =>
  screen.getByRole("button", { name: "Voir les situations concernées" });
// Ce que l'aide liste, une fois dépliée. Repliée, elle ne liste rien.
const liste = () =>
  within(
    document.getElementById(aide().getAttribute("aria-controls") ?? "") ??
      document.body,
  )
    .queryAllByRole("listitem")
    .map((item) => item.textContent);

const caseACocher = (name: RegExp) => screen.getByRole("checkbox", { name });
const precede = (avant: Element, apres: Element) =>
  Boolean(
    avant.compareDocumentPosition(apres) & Node.DOCUMENT_POSITION_FOLLOWING,
  );

describe("aide dépliable d'une option", () => {
  it("se place juste sous son option, avant la suivante", () => {
    afficher([SITUATIONS]);

    expect(precede(caseACocher(/^une autre situation/i), aide())).toBe(true);
    expect(precede(aide(), caseACocher(/^aucune de ces/i))).toBe(true);
  });

  it("reste hors du libellé de son option", () => {
    afficher([SITUATIONS]);

    expect(aide().closest("label")).toBeNull();
  });

  it("est repliée à l'ouverture de la page", () => {
    afficher([SITUATIONS]);

    expect(aide()).toHaveAttribute("aria-expanded", "false");
    expect(liste()).toEqual([]);
  });

  it("se déplie sur sa liste, au clavier", async () => {
    const { user } = afficher([SITUATIONS]);

    aide().focus();
    await user.keyboard("{Enter}");

    expect(aide()).toHaveAttribute("aria-expanded", "true");
    expect(liste()).toEqual(["Accident du travail", "Pension militaire"]);
  });

  it("n'est pas une réponse : rien n'est coché, la page attend toujours", async () => {
    const { user } = afficher([SITUATIONS]);

    await user.click(aide());

    expect(
      screen.getAllByRole("checkbox").filter((box) => box.matches(":checked")),
    ).toEqual([]);
    expect(screen.getByRole("button", { name: "Suivant" })).toBeDisabled();
  });

  it("liste ce que les réponses laissent", async () => {
    const { user } = afficher([AGE, SITUATIONS]);

    await user.click(screen.getByRole("radio", { name: "Non" }));

    await screen.findByRole("group", { name: /^quelles situations/i });
    await user.click(aide());
    expect(liste()).toEqual([
      "Accident du travail",
      "Suivi en CAMSP ou en CMPP",
    ]);
  });

  it("n'ajoute rien à une question sans aide", () => {
    afficher([AGE]);

    expect(screen.queryByRole("button", { name: /voir/i })).toBeNull();
  });
});
