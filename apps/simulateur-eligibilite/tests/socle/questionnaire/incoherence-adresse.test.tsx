import { screen, within } from "@testing-library/react";
import { describe, expect, it } from "vitest";
import { type Address, givenOf, page, questionsOf } from "../../../core/socle";
import { Questionnaire } from "../../../core/socle/questionnaire-engine/questionnaire";
import { afficher } from "./afficher";

// Une adresse incohérente avec une autre réponse affiche son message sous le
// groupe de champs. Une erreur de champ passe devant. Les pages sont écrites
// ici.

type Questions = { depart: Address; arrivee: Address };

const question = questionsOf<Questions>({ options: {} });
const given = givenOf<Questions>();

const valider = () =>
  screen.getByRole("button", { name: /^(Suivant|Terminer)$/ });

describe("adresse incohérente", () => {
  const DEPART = question.address("depart", "Adresse de départ");
  const memeVoie = (adresse: Address | undefined) => adresse?.street;
  const ARRIVEE = question
    .address("arrivee", "Adresse d'arrivée")
    .inconsistentWhen(
      given
        .question("depart")
        .answer()
        .computeWith(given.question("arrivee").answer(), (depart, arrivee) => {
          const voie = memeVoie(depart.value);
          return Boolean(voie) && voie === memeVoie(arrivee.value);
        }),
      "L'arrivée répète le départ.",
    );
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
    const { user } = afficher([page("arrivee", ARRIVEE)], {
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

    const lecture = new Questionnaire([
      page("depart", DEPART),
      page("arrivee", ARRIVEE),
    ]).readWith(reponses);
    expect(lecture.openPage().id).toBe("arrivee");
    expect(lecture.isComplete()).toBe(false);
  });

  it("laisse passer devant l'erreur d'un champ, sans message de groupe", async () => {
    const { user } = afficher([page("arrivee", ARRIVEE)], {
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
