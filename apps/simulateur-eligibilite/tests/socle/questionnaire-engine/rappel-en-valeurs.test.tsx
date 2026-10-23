import { screen } from "@testing-library/react";
import { describe, expect, it } from "vitest";
import { Cible, page, questionsOf } from "../../../core/socle";
import { afficher } from "./afficher";

// Un rappel peut prendre la forme de valeurs avec leur intitulé : ce qui est
// déjà décidé, montré près du champ encore demandé. On le lit, on ne le
// modifie pas. Les pages sont écrites ici.

type Questions = {
  adresse: string;
  nature: string;
  nom: string;
};

// Les cibles figées au verrou. Avant lui : aucune.
type Cibles = { readonly nature: Cible<string> } | undefined;

const question = questionsOf<Questions, undefined, Cibles>({ options: {} });

const ARRIVEE = page(
  "arrivee",
  question
    .text("adresse", "Adresse du lieu d'arrivée")
    .reminderFrom(({ answers, cibles }) => [
      { label: "Rôle", value: "arrivée" },
      {
        label: "Nature",
        value: String(cibles?.nature.value ?? answers.question("nature").value),
      },
    ]),
);

const SANS_RAPPEL = page("nom", question.text("nom", "Nom du lieu"));

const VERROU = {
  lockedAnswers: { motif: "consultation" },
  cibles: { nature: Cible.of("structure de soins") },
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
    afficher([ARRIVEE], VERROU);

    expect(termes()).toEqual(["Rôle :", "Nature :"]);
    expect(valeurs()).toEqual(["arrivée", "structure de soins"]);
  });

  it("se place juste avant le champ qu'il concerne", () => {
    afficher([ARRIVEE], VERROU);

    expect(precede(screen.getByText("structure de soins"), adresse())).toBe(
      true,
    );
  });

  it("ne se modifie pas : le seul champ de la page est celui de la question", () => {
    afficher([ARRIVEE], VERROU);

    expect(screen.getAllByRole("textbox")).toEqual([adresse()]);
    expect(screen.queryByRole("combobox")).toBeNull();
    expect(screen.queryByRole("radio")).toBeNull();
  });

  it("n'est pas une réponse : seule l'adresse est validée", async () => {
    const { user, reponses } = afficher([ARRIVEE], VERROU);

    await user.type(adresse(), "3 rue des Lilas");
    await user.click(screen.getByRole("button", { name: "Terminer" }));

    expect(reponses()).toEqual({
      motif: "consultation",
      adresse: "3 rue des Lilas",
    });
  });

  it("ne montre rien pour une question qui n'en a pas", () => {
    afficher([SANS_RAPPEL]);

    expect(screen.queryByRole("term")).toBeNull();
  });
});
