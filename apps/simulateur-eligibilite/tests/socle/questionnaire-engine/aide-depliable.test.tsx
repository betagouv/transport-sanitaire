import { screen, within } from "@testing-library/react";
import { describe, expect, it } from "vitest";
import type { Page } from "../../../front/socle/questionnaire-engine/question";
import { poser } from "./poser";

// Une option peut porter une aide, qui se déplie sur une liste. La déplier
// n'est pas répondre. Les pages sont écrites ici.

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
          helpFrom: ({ age }) => ({
            label: "Voir les situations concernées",
            items:
              age === "non"
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
const liste = () =>
  within(
    document.getElementById(aide().getAttribute("aria-controls") ?? "") ??
      document.body,
  )
    .getAllByRole("listitem")
    .map((item) => item.textContent);

describe("aide dépliable d'une option", () => {
  it("est repliée à l'ouverture de la page", () => {
    poser([SITUATIONS]);

    expect(aide()).toHaveAttribute("aria-expanded", "false");
  });

  it("se déplie sur sa liste, au clavier", async () => {
    const { user } = poser([SITUATIONS]);

    aide().focus();
    await user.keyboard("{Enter}");

    expect(aide()).toHaveAttribute("aria-expanded", "true");
    expect(liste()).toEqual(["Accident du travail", "Pension militaire"]);
  });

  it("n'est pas une réponse : rien n'est coché, la page attend toujours", async () => {
    const { user } = poser([SITUATIONS]);

    await user.click(aide());

    expect(
      screen.getAllByRole("checkbox").filter((box) => box.matches(":checked")),
    ).toEqual([]);
    expect(screen.getByRole("button", { name: "Suivant" })).toBeDisabled();
  });

  it("liste ce que les réponses laissent", async () => {
    const { user } = poser([AGE, SITUATIONS]);

    await user.click(screen.getByRole("radio", { name: "Non" }));

    await screen.findByRole("group", { name: /^quelles situations/i });
    expect(liste()).toEqual([
      "Accident du travail",
      "Suivi en CAMSP ou en CMPP",
    ]);
  });

  it("n'ajoute rien à une question sans aide", () => {
    poser([AGE]);

    expect(screen.queryByRole("button", { name: /voir/i })).toBeNull();
  });
});
