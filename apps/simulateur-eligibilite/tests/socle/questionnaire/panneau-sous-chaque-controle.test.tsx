import { screen } from "@testing-library/react";
import { describe, expect, it } from "vitest";
import { page, QuestionFactory, ReadingFactory } from "../../../core/socle";
import { afficher } from "./afficher";
import { declencheurDe } from "./panneaux";

// Toute réponse peut ouvrir un panneau sous elle (NAV-PANNEAUX-GENERAL-
// 20261116) : l'option d'un choix unique, la case seule cochée, l'option
// d'une liste déroulante. Le panneau a ses libellés liés à leurs champs, et
// sa page attend « Suivant » : seul un choix unique affiché seul avance
// (D-240). Les pages sont écrites ici.

type Questions = {
  boisson: "cafe" | "the";
  taille: "petite" | "grande";
  ligne: boolean;
  lieu: "domicile" | "structure";
  nom: string;
  suite: "oui" | "non";
};

const question = new QuestionFactory<Questions>();
const given = new ReadingFactory<Questions>();

const BOISSON = question
  .singleChoice("boisson", "Quelle boisson ?")
  .possibleAnswers({ cafe: "Café", the: "Thé" });
const TAILLE = question
  .singleChoice("taille", "Quelle taille ?")
  .possibleAnswers({ petite: "Petite", grande: "Grande" });
const LIGNE = question.checkbox("ligne", "Une partie se fait en avion.");
const LIEU = question
  .singleChoice("lieu", "Quel lieu ?")
  .possibleAnswers({ domicile: "Domicile", structure: "Structure de soins" })
  .dropdown();
const NOM = question
  .text("nom", "Nom de la structure")
  .appliesWhen(given.question("lieu").answer().is("structure"))
  .shownUnder("lieu", "structure");
const SUITE = page(
  "suite",
  question
    .singleChoice("suite", "Une suite ?")
    .possibleAnswers({ oui: "Oui", non: "Non" }),
);

const SOUS_UN_CHOIX = page(
  "boisson",
  BOISSON,
  TAILLE.appliesWhen(given.question("boisson").answer().is("cafe")).shownUnder(
    "boisson",
    "cafe",
  ),
);
const SOUS_UNE_CASE = page(
  "ligne",
  LIGNE,
  TAILLE.appliesWhen(given.question("ligne").answer().is(true)).shownUnder(
    "ligne",
  ),
);

const groupeDeLaTaille = () =>
  screen.getByRole("group", { name: "Quelle taille ?" });
const resteSurLaPage = async () => {
  await new Promise((resolve) => setTimeout(resolve, 300));
  expect(screen.queryByRole("group", { name: "Une suite ?" })).toBeNull();
};

describe("un panneau sous l'option d'un choix unique", () => {
  it("s'insère sous l'option choisie, avant la suivante", async () => {
    const { user } = afficher([SOUS_UN_CHOIX, SUITE]);

    await user.click(screen.getByLabelText("Café"));

    expect(declencheurDe(groupeDeLaTaille())).toBe(
      screen.getByLabelText("Café"),
    );
    expect(
      groupeDeLaTaille().compareDocumentPosition(screen.getByLabelText("Thé")),
    ).toBe(Node.DOCUMENT_POSITION_FOLLOWING);
  });

  it("fait attendre « Suivant », même sa question répondue", async () => {
    const { user } = afficher([SOUS_UN_CHOIX, SUITE]);

    await user.click(screen.getByLabelText("Café"));
    await user.click(screen.getByLabelText("Grande"));
    await resteSurLaPage();
  });

  it("fermé, laisse le choix seul avancer de lui-même", async () => {
    const { user } = afficher([SOUS_UN_CHOIX, SUITE]);

    await user.click(screen.getByLabelText("Thé"));

    expect(
      await screen.findByRole("group", { name: "Une suite ?" }),
    ).toBeInTheDocument();
  });
});

describe("un panneau sous une case seule", () => {
  it("s'insère sous la case cochée", async () => {
    const { user } = afficher([SOUS_UNE_CASE, SUITE]);

    await user.click(screen.getByRole("checkbox"));

    expect(declencheurDe(groupeDeLaTaille())).toBe(
      screen.getByRole("checkbox"),
    );
  });

  it("fait attendre « Suivant »", async () => {
    const { user } = afficher([SOUS_UNE_CASE, SUITE]);

    await user.click(screen.getByRole("checkbox"));
    await user.click(screen.getByLabelText("Petite"));
    await resteSurLaPage();
  });
});

describe("un panneau sous une liste déroulante", () => {
  it("s'insère sous la liste, l'option choisie", async () => {
    const { user } = afficher([page("lieu", LIEU, NOM), SUITE]);

    await user.selectOptions(screen.getByRole("combobox"), "structure");

    const nom = screen.getByRole("textbox", { name: /nom de la structure/i });
    expect(declencheurDe(nom)).toBe(screen.getByRole("combobox"));
  });

  it("disparaît avec l'option qui l'ouvre", async () => {
    const { user } = afficher([page("lieu", LIEU, NOM), SUITE]);

    await user.selectOptions(screen.getByRole("combobox"), "structure");
    await user.selectOptions(screen.getByRole("combobox"), "domicile");

    expect(screen.queryByRole("textbox")).toBeNull();
    expect(document.querySelector(".socle-conditional-panel")).toBeNull();
  });
});
