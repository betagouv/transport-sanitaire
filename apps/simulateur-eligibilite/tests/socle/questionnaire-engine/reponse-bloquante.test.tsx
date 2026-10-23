import { screen } from "@testing-library/react";
import { describe, expect, it } from "vitest";
import { page, questionsOf } from "../../../core/socle";
import { afficher } from "./afficher";

// Une option peut arrêter le questionnaire : son message s'affiche, et on
// n'avance plus. Les pages sont écrites ici.

type Questions = {
  nombre: number;
  organisation: "aller" | "different";
  depart: string;
  equipements: readonly ("fauteuil" | "autre")[];
};

const OPTIONS = {
  organisation: { aller: "Aller simple", different: "Aller-retour différent" },
  equipements: { fauteuil: "Un fauteuil", autre: "Un autre" },
} as const;

const question = questionsOf<Questions>({ options: OPTIONS });

const MESSAGE =
  "Un retour différent demande une autre simulation, pour l'autre sens.";

const ORGANISATION = question
  .singleChoice("organisation", "Comment le trajet est-il organisé ?")
  .option("different", (option) => option.blocks(MESSAGE));

const TRAJET = page(
  "trajet",
  question.number("nombre", "Combien de transports ?"),
  ORGANISATION,
);

const SEULE = page("organisation", ORGANISATION);

const SUITE = page("depart", question.text("depart", "Lieu de départ"));

const EQUIPEMENTS = page(
  "equipements",
  question
    .multipleChoice("equipements", "Quels équipements ?")
    .option("autre", (option) => option.blocks("Précisez avec la caisse.")),
);

const radio = (name: string) => screen.getByRole("radio", { name });
const valider = () =>
  screen.getByRole("button", { name: /^(Suivant|Terminer)$/ });
const unInstant = () => new Promise((fini) => setTimeout(fini, 300));

describe("réponse qui bloque", () => {
  it("affiche son message et bloque le bouton", async () => {
    const { user } = afficher([TRAJET]);
    await user.type(screen.getByRole("spinbutton"), "2");

    await user.click(radio("Aller-retour différent"));

    expect(screen.getByText(MESSAGE)).toBeInTheDocument();
    expect(valider()).toBeDisabled();
  });

  it("libère le bouton dès qu'une autre réponse est choisie", async () => {
    const { user, reponses } = afficher([TRAJET]);
    await user.type(screen.getByRole("spinbutton"), "2");
    await user.click(radio("Aller-retour différent"));

    await user.click(radio("Aller simple"));

    expect(screen.queryByText(MESSAGE)).toBeNull();
    await user.click(valider());
    expect(reponses()).toEqual({ nombre: 2, organisation: "aller" });
  });

  it("retient une page qui avancerait seule", async () => {
    const { user } = afficher([SEULE, SUITE]);

    await user.click(radio("Aller-retour différent"));
    await unInstant();

    expect(screen.getByText(MESSAGE)).toBeInTheDocument();
    expect(screen.queryByRole("textbox")).toBeNull();
  });

  it("vaut aussi pour une case cochée", async () => {
    const { user } = afficher([EQUIPEMENTS]);

    await user.click(screen.getByRole("checkbox", { name: "Un fauteuil" }));
    await user.click(screen.getByRole("checkbox", { name: "Un autre" }));

    expect(screen.getByText("Précisez avec la caisse.")).toBeInTheDocument();
    expect(valider()).toBeDisabled();
  });
});
