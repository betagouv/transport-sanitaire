import { screen, waitFor } from "@testing-library/react";
import { describe, expect, it } from "vitest";
import type { Page } from "../../../core/socle/questionnaire-engine/question";
import { afficher } from "./afficher";

// Un rappel redit un fait déjà connu, en clair, avant la question qu'il aide à
// comprendre. Ce n'est pas une question. Les pages sont écrites ici.

const SEANCE: Page = {
  id: "seance",
  questions: [
    {
      id: "seance",
      kind: "single choice",
      label: "Quelle séance motive ce trajet ?",
      options: [
        { value: "dialyse", label: "Une dialyse" },
        { value: "aucune", label: "Aucune" },
      ],
    },
  ],
};

const RAPPEL = "Séance indiquée : une dialyse.";

const CONDITION: Page = {
  id: "condition",
  questions: [
    {
      id: "lieu",
      kind: "text",
      label: "Où a lieu la séance ?",
      askedIf: (answers) => answers.question("seance").is("dialyse"),
      reminderFrom: (answers) =>
        answers.question("seance").is("dialyse") ? RAPPEL : undefined,
    },
    {
      id: "motif",
      kind: "text",
      label: "Quel est le motif du trajet ?",
      askedIf: (answers) => answers.question("seance").is("aucune"),
    },
  ],
};

const SANS_SUITE: Page = {
  id: "precision",
  questions: [
    {
      id: "precision",
      kind: "text",
      label: "Une précision sur la séance ?",
      askedIf: () => false,
      reminder: "Ce rappel ne s'affiche pas seul.",
    },
  ],
};

const radio = (name: string) => screen.getByRole("radio", { name });
const champ = (name: string) => screen.findByRole("textbox", { name });
const precede = (avant: Element, apres: Element) =>
  Boolean(
    avant.compareDocumentPosition(apres) & Node.DOCUMENT_POSITION_FOLLOWING,
  );

describe("rappel d'une valeur connue", () => {
  it("s'affiche avant la question qu'il éclaire", async () => {
    const { user } = afficher([SEANCE, CONDITION]);

    await user.click(radio("Une dialyse"));

    const lieu = await champ("Où a lieu la séance ?");
    expect(precede(screen.getByText(RAPPEL), lieu)).toBe(true);
  });

  it("ne s'affiche pas quand sa question ne se pose pas", async () => {
    const { user } = afficher([SEANCE, CONDITION]);

    await user.click(radio("Aucune"));

    await champ("Quel est le motif du trajet ?");
    expect(screen.queryByText(RAPPEL)).toBeNull();
  });

  it("n'est pas une question : rien à cocher, rien à saisir, rien à valider", async () => {
    const { user, reponses } = afficher([SEANCE, CONDITION]);
    await user.click(radio("Une dialyse"));
    const lieu = await champ("Où a lieu la séance ?");

    expect(screen.getAllByRole("textbox")).toEqual([lieu]);
    expect(screen.queryByRole("radio")).toBeNull();
    expect(screen.queryByRole("checkbox")).toBeNull();

    await user.type(lieu, "Au centre");
    await user.click(screen.getByRole("button", { name: "Terminer" }));
    expect(reponses()).toEqual({ seance: "dialyse", lieu: "Au centre" });
  });

  it("ne crée pas d'écran à lui seul : une page qui ne demande rien est sautée", async () => {
    const { user, reponses } = afficher([SEANCE, SANS_SUITE]);

    await user.click(radio("Aucune"));

    await waitFor(() => expect(reponses()).toEqual({ seance: "aucune" }));
    expect(screen.queryByText("Ce rappel ne s'affiche pas seul.")).toBeNull();
  });
});
