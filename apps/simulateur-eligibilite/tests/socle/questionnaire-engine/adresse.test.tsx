import { screen, within } from "@testing-library/react";
import { describe, expect, it } from "vitest";
import type {
  Page,
  Question,
} from "../../../front/socle/questionnaire-engine/question";
import { afficher } from "./afficher";

// Une adresse se saisit champ par champ, et sa réponse est un objet. En France,
// le code postal fait cinq chiffres. À l'étranger, le pays est attendu et le
// code postal est libre et facultatif. Les pages sont écrites ici.

const DEPART: Question = {
  id: "depart",
  kind: "address",
  label: "Adresse de départ",
};

const page = (question: Question): Page => ({
  id: question.id,
  questions: [question],
});

const LONDRES = {
  street: "10 Downing Street",
  postalCode: "SW1A 2AA",
  city: "Londres",
  country: "Royaume-Uni",
};

const adresse = (name: string) => screen.findByRole("group", { name });
// Le nom d'un champ commence par son libellé : son indication le suit.
const nomme = (libelle: string) => (nom: string) => nom.startsWith(libelle);
const champ = (name: string) =>
  screen.getByRole("textbox", { name: nomme(name) });
const champAbsent = (name: string) =>
  screen.queryByRole("textbox", { name: nomme(name) });
const valider = () =>
  screen.getByRole("button", { name: /^(Suivant|Terminer)$/ });

type User = ReturnType<typeof afficher>["user"];

async function saisir(user: User, champs: Record<string, string>) {
  for (const [name, texte] of Object.entries(champs)) {
    await user.clear(champ(name));
    await user.type(champ(name), texte);
  }
}

const RUE_DES_LILAS = {
  "Numéro et voie": "3 rue des Lilas",
  "Code postal": "75012",
  Commune: "Paris",
};

describe("adresse", () => {
  it("se saisit en champs séparés, sous le libellé de la question", async () => {
    afficher([page(DEPART)]);

    const groupe = within(await adresse("Adresse de départ"));

    const libelles = [
      "Numéro et voie",
      "Complément (facultatif)",
      "Code postal",
      "Commune",
    ];
    for (const libelle of libelles)
      expect(
        groupe.getByRole("textbox", { name: nomme(libelle) }),
      ).toBeInTheDocument();
    expect(groupe.getAllByRole("textbox")).toHaveLength(libelles.length);
  });

  it("rend un objet, une clé par champ saisi", async () => {
    const { user, reponses } = afficher([page(DEPART)]);

    await saisir(user, RUE_DES_LILAS);
    await user.click(valider());

    expect(reponses()).toEqual({
      depart: { street: "3 rue des Lilas", postalCode: "75012", city: "Paris" },
    });
  });

  it("garde le complément quand il est saisi", async () => {
    const { user, reponses } = afficher([page(DEPART)]);

    await saisir(user, {
      ...RUE_DES_LILAS,
      "Complément (facultatif)": "Bâtiment B",
    });
    await user.click(valider());

    expect(reponses()?.depart).toMatchObject({ complement: "Bâtiment B" });
  });

  it("retire les espaces de début et de fin, et garde accents et casse", async () => {
    const { user, reponses } = afficher([page(DEPART)]);

    await saisir(user, {
      "Numéro et voie": "  12 allée de l'Évêché ",
      "Code postal": " 29000 ",
      Commune: " QUIMPER  ",
    });
    await user.click(valider());

    expect(reponses()).toEqual({
      depart: {
        street: "12 allée de l'Évêché",
        postalCode: "29000",
        city: "QUIMPER",
      },
    });
  });

  it("ne se valide pas tant qu'un champ attendu manque", async () => {
    const { user } = afficher([page(DEPART)]);

    await saisir(user, { "Numéro et voie": "3 rue des Lilas" });

    expect(valider()).toBeDisabled();
  });

  it("demande le nom du lieu quand la question le règle", async () => {
    const { user, reponses } = afficher([
      page({ ...DEPART, withPlaceName: true }),
    ]);

    await saisir(user, RUE_DES_LILAS);
    expect(valider()).toBeDisabled();
    await saisir(user, { "Nom du lieu": "Clinique des Lilas" });
    await user.click(valider());

    expect(reponses()?.depart).toMatchObject({
      placeName: "Clinique des Lilas",
    });
  });

  it("laisse valider la page vide quand elle est facultative", async () => {
    const { user, reponses } = afficher([page({ ...DEPART, optional: true })]);

    await adresse("Adresse de départ (facultatif)");
    await user.click(valider());

    expect(reponses()).toEqual({});
  });
});

describe("adresse en France", () => {
  it("refuse un code postal qui n'a pas cinq chiffres, sous son champ", async () => {
    const { user } = afficher([page(DEPART)]);

    await saisir(user, { ...RUE_DES_LILAS, "Code postal": "7501" });

    expect(champ("Code postal")).toHaveAccessibleDescription(
      expect.stringContaining("Indiquez un code postal de 5 chiffres."),
    );
    expect(valider()).toBeDisabled();
  });

  it("refuse un code postal qui porte autre chose que des chiffres", async () => {
    const { user } = afficher([page(DEPART)]);

    await saisir(user, { "Code postal": "2A004" });

    expect(
      screen.getByText("Indiquez un code postal de 5 chiffres."),
    ).toBeInTheDocument();
  });

  it("donne à chaque champ fautif son message, et rien aux autres", async () => {
    const { user } = afficher([page(DEPART)]);

    await saisir(user, {
      "Numéro et voie": "  ",
      "Code postal": "75",
      Commune: "Paris",
    });

    expect(champ("Numéro et voie")).toHaveAccessibleDescription(
      "Cette réponse est attendue.",
    );
    expect(champ("Code postal")).toHaveAccessibleDescription(
      expect.stringContaining("Indiquez un code postal de 5 chiffres."),
    );
    expect(champ("Commune")).not.toHaveAccessibleDescription();
  });

  it("ne demande pas le pays", async () => {
    afficher([page(DEPART)]);

    await adresse("Adresse de départ");

    expect(champAbsent("Pays")).toBeNull();
  });
});

describe("adresse à l'étranger", () => {
  const A_L_ETRANGER = page({ ...DEPART, abroad: true });

  it("attend le pays", async () => {
    const { user, reponses } = afficher([A_L_ETRANGER]);

    await saisir(user, {
      "Numéro et voie": LONDRES.street,
      "Code postal": LONDRES.postalCode,
      Commune: LONDRES.city,
    });
    expect(valider()).toBeDisabled();
    await saisir(user, { Pays: LONDRES.country });
    await user.click(valider());

    expect(reponses()).toEqual({ depart: LONDRES });
  });

  it("laisse le code postal libre", async () => {
    const { user } = afficher([A_L_ETRANGER]);

    await saisir(user, { "Code postal": "SW1A 2AA" });

    expect(champ("Code postal")).not.toHaveAccessibleDescription();
  });

  it("se valide sans code postal", async () => {
    const { user, reponses } = afficher([A_L_ETRANGER]);

    await saisir(user, {
      "Numéro et voie": "Main Street",
      Commune: "Dublin",
      Pays: "Irlande",
    });
    await user.click(valider());

    expect(reponses()).toEqual({
      depart: { street: "Main Street", city: "Dublin", country: "Irlande" },
    });
  });
});
