import { screen, within } from "@testing-library/react";
import { describe, expect, it } from "vitest";
import type {
  Page,
  Question,
} from "../../../front/socle/questionnaire-engine/question";
import { stateAfterAnswers } from "../../../front/socle/questionnaire-engine/questionnaire";
import { afficher } from "./afficher";

// Une adresse incohérente avec une autre réponse affiche son message sous le
// groupe de champs. Une erreur de champ passe devant. Les pages sont écrites
// ici.

const page = (...questions: Question[]): Page => ({
  id: questions[0]?.id ?? "vide",
  questions,
});

const valider = () =>
  screen.getByRole("button", { name: /^(Suivant|Terminer)$/ });

describe("adresse incohérente", () => {
  const DEPART: Question = {
    id: "depart",
    kind: "address",
    label: "Adresse de départ",
  };
  const memeVoie = (adresse: unknown) =>
    (adresse as { street?: string } | undefined)?.street;
  const ARRIVEE: Question = {
    id: "arrivee",
    kind: "address",
    label: "Adresse d'arrivée",
    inconsistenciesFrom: (answers) => {
      const depart = memeVoie(answers.question("depart").value);
      return depart && depart === memeVoie(answers.question("arrivee").value)
        ? ["L'arrivée répète le départ."]
        : [];
    },
  };
  const LILAS = {
    street: "3 rue des Lilas",
    postalCode: "75012",
    city: "Paris",
  };
  const champs = {
    "Numéro et voie": LILAS.street,
    "Code postal": LILAS.postalCode,
    Commune: LILAS.city,
  };

  it("affiche son message sous le groupe, et bloque", async () => {
    const { user } = afficher([page(ARRIVEE)], {
      lockedAnswers: { depart: LILAS },
    });
    for (const [nom, texte] of Object.entries(champs))
      await user.type(
        screen.getByRole("textbox", { name: (n) => n.startsWith(nom) }),
        texte,
      );

    const groupe = screen.getByRole("group", { name: "Adresse d'arrivée" });
    expect(
      within(groupe).getByText("L'arrivée répète le départ."),
    ).toBeVisible();
    expect(valider()).toBeDisabled();
  });

  it("ne compte pas comme répondue", () => {
    const reponses = { depart: LILAS, arrivee: LILAS };

    expect(
      stateAfterAnswers([page(DEPART), page(ARRIVEE)], reponses),
    ).toMatchObject({
      page: "arrivee",
      complete: false,
    });
  });

  it("laisse passer devant l'erreur d'un champ, sans message de groupe", async () => {
    const { user } = afficher([page(ARRIVEE)], {
      lockedAnswers: { depart: { ...LILAS, postalCode: "7501" } },
    });
    for (const [nom, texte] of Object.entries({
      ...champs,
      "Code postal": "7501",
    }))
      await user.type(
        screen.getByRole("textbox", { name: (n) => n.startsWith(nom) }),
        texte,
      );

    expect(
      screen.getByText("Indiquez un code postal de 5 chiffres."),
    ).toBeInTheDocument();
    expect(screen.queryByText("L'arrivée répète le départ.")).toBeNull();
  });
});
