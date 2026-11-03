import { screen } from "@testing-library/react";
import { describe, expect, it } from "vitest";
import { type Address, page, questionsOf } from "../../../core/socle";
import { Questionnaire } from "../../../core/socle/questionnaire-engine/questionnaire";
import { afficher } from "./afficher";

// C'est la question qui dit si son adresse est à l'étranger, d'après les
// réponses : jamais une case de la page. Quand le mode change, l'adresse déjà
// saisie se relit dans le nouveau. Les pages sont écrites ici.

type Questions = {
  destination: "france" | "etranger";
  arrivee: Address;
  remarque: string;
};

const OPTIONS = {
  destination: { france: "En France", etranger: "À l'étranger" },
} as const;

const question = questionsOf<Questions>({ options: OPTIONS });

const DESTINATION = page(
  "destination",
  question.singleChoice("destination", "Où va le patient ?"),
);

const ARRIVEE = question
  .address("arrivee", "Adresse d'arrivée")
  .abroadIf(({ answers }) => answers.question("destination").is("etranger"));

const REMARQUE = page(
  "remarque",
  question.text("remarque", "Une remarque ?").optional(),
);

const PAGES = [DESTINATION, page("arrivee", ARRIVEE), REMARQUE];
const QUESTIONNAIRE = new Questionnaire(PAGES);

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

describe("mode d'une adresse, donné par une réponse antérieure", () => {
  it("passe à l'étranger d'après la réponse, sans case à cocher", async () => {
    const { user } = afficher(PAGES);

    await user.click(screen.getByLabelText("À l'étranger"));
    await adresse("Adresse d'arrivée");

    expect(champ("Pays")).toBeInTheDocument();
    expect(screen.queryByRole("checkbox")).toBeNull();
  });

  it("reste en France sinon", async () => {
    const { user } = afficher(PAGES);

    await user.click(screen.getByLabelText("En France"));
    await adresse("Adresse d'arrivée");

    expect(champAbsent("Pays")).toBeNull();
  });

  it("relit l'adresse déjà saisie quand le mode change, et lui retire le pays", async () => {
    const { user, reponses } = afficher(PAGES);
    await user.click(screen.getByLabelText("À l'étranger"));
    await adresse("Adresse d'arrivée");
    await saisir(user, {
      "Numéro et voie": LONDRES.street,
      "Code postal": LONDRES.postalCode,
      Commune: LONDRES.city,
      Pays: LONDRES.country,
    });
    await user.click(valider());
    await user.click(screen.getByRole("button", { name: "Précédent" }));
    await user.click(screen.getByRole("button", { name: "Précédent" }));

    await user.click(screen.getByLabelText("En France"));
    await adresse("Adresse d'arrivée");

    expect(champ("Numéro et voie")).toHaveValue(LONDRES.street);
    expect(champ("Code postal")).toHaveAccessibleDescription(
      expect.stringContaining("Indiquez un code postal de 5 chiffres."),
    );

    await saisir(user, { "Code postal": "62100" });
    await user.click(valider());
    await user.click(valider());

    expect(reponses()?.arrivee).toEqual({
      street: LONDRES.street,
      postalCode: "62100",
      city: LONDRES.city,
    });
  });

  it("l'efface quand la question déclare en dépendre", async () => {
    const dependante = ARRIVEE.dependsOn("destination");
    const { user } = afficher([
      DESTINATION,
      page("arrivee", dependante),
      REMARQUE,
    ]);
    await user.click(screen.getByLabelText("En France"));
    await adresse("Adresse d'arrivée");
    await saisir(user, RUE_DES_LILAS);
    await user.click(valider());
    await user.click(screen.getByRole("button", { name: "Précédent" }));
    await user.click(screen.getByRole("button", { name: "Précédent" }));

    await user.click(screen.getByLabelText("À l'étranger"));
    await adresse("Adresse d'arrivée");

    expect(champ("Numéro et voie")).toHaveValue("");
  });
});

// Une adresse peut venir d'ailleurs que de l'écran : d'une seed, ou de réponses
// acquises avant le verrou.
describe("adresse déjà répondue", () => {
  const { country: _pays, ...SANS_PAYS } = LONDRES;

  it("rouvre sa page dans ses champs", async () => {
    afficher([page("arrivee", ARRIVEE)], {
      lockedAnswers: { arrivee: { ...SANS_PAYS, postalCode: "75012" } },
    });

    await adresse("Adresse d'arrivée");

    expect(champ("Numéro et voie")).toHaveValue(LONDRES.street);
    expect(champ("Code postal")).toHaveValue("75012");
    expect(champ("Commune")).toHaveValue(LONDRES.city);
  });

  it("compte comme une réponse quand elle est complète pour son mode", () => {
    const reponses = { destination: "etranger", arrivee: LONDRES };

    const lecture = QUESTIONNAIRE.readWith(reponses);
    expect(lecture.openPage().id).toBe("remarque");
    expect(lecture.isComplete()).toBe(true);
  });

  it("attend encore le pays d'une adresse à l'étranger qui n'en a pas", () => {
    const reponses = { destination: "etranger", arrivee: SANS_PAYS };

    const lecture = QUESTIONNAIRE.readWith(reponses);
    expect(lecture.openPage().id).toBe("arrivee");
    expect(lecture.isComplete()).toBe(false);
  });

  it("figure parmi les questions validées, réduite aux champs de son mode", () => {
    const reponses = {
      destination: "france",
      arrivee: { ...LONDRES, postalCode: "62100" },
    };

    expect(QUESTIONNAIRE.readWith(reponses).validated.toJSON().arrivee).toEqual(
      {
        answer: { ...SANS_PAYS, postalCode: "62100" },
      },
    );
  });
});
