import { screen } from "@testing-library/react";
import { describe, expect, it } from "vitest";
import type { Page } from "../../../front/socle/questionnaire-engine/question";
import { poser } from "./poser";

// Un rappel peut prendre la forme de valeurs avec leur intitulé : ce qui est
// déjà décidé, montré près du champ encore demandé. On le lit, on ne le
// modifie pas. Les pages sont écrites ici.

const ARRIVEE: Page = {
  id: "arrivee",
  questions: [
    {
      id: "adresse",
      kind: "text",
      label: "Adresse du lieu d'arrivée",
      reminderFrom: (answers, cibles) => [
        { label: "Rôle", value: "arrivée" },
        { label: "Nature", value: String(cibles?.nature ?? answers.nature) },
      ],
    },
  ],
};

const SANS_RAPPEL: Page = {
  id: "nom",
  questions: [{ id: "nom", kind: "text", label: "Nom du lieu" }],
};

const VERROU = {
  lockedAnswers: { motif: "consultation" },
  cibles: { nature: "structure de soins" },
};

const adresse = () =>
  screen.getByRole("textbox", { name: "Adresse du lieu d'arrivée" });
const termes = () => screen.getAllByRole("term").map((el) => el.textContent);
const valeurs = () =>
  screen.getAllByRole("definition").map((el) => el.textContent);
const precede = (avant: Element, apres: Element) =>
  Boolean(
    avant.compareDocumentPosition(apres) & Node.DOCUMENT_POSITION_FOLLOWING,
  );

describe("rappel en valeurs, près d'un champ", () => {
  it("montre chaque valeur, avec son intitulé", () => {
    poser([ARRIVEE], VERROU);

    expect(termes()).toEqual(["Rôle :", "Nature :"]);
    expect(valeurs()).toEqual(["arrivée", "structure de soins"]);
  });

  it("se place juste avant le champ qu'il concerne", () => {
    poser([ARRIVEE], VERROU);

    expect(precede(screen.getByText("structure de soins"), adresse())).toBe(
      true,
    );
  });

  it("ne se modifie pas : le seul champ de la page est celui de la question", () => {
    poser([ARRIVEE], VERROU);

    expect(screen.getAllByRole("textbox")).toEqual([adresse()]);
    expect(screen.queryByRole("combobox")).toBeNull();
    expect(screen.queryByRole("radio")).toBeNull();
  });

  it("n'est pas une réponse : seule l'adresse est validée", async () => {
    const { user, reponses } = poser([ARRIVEE], VERROU);

    await user.type(adresse(), "3 rue des Lilas");
    await user.click(screen.getByRole("button", { name: "Terminer" }));

    expect(reponses()).toEqual({
      motif: "consultation",
      adresse: "3 rue des Lilas",
    });
  });

  it("ne montre rien pour une question qui n'en a pas", () => {
    poser([SANS_RAPPEL]);

    expect(screen.queryByRole("term")).toBeNull();
  });
});
