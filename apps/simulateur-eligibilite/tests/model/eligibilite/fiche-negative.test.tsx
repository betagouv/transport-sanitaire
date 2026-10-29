// La fiche patient négative, telle qu'elle s'affiche (#134). La seed
// `issue-non-eligible` donne les textes de l'aperçu de l'éditeur (TS1014-J05).
// `eligibilite` donne le titre du prescripteur, rouge foncé, et sa phrase à la
// page, puis la feuille, que le socle pose sous ses logos avec son titre et sa
// raison.

import { render, screen, within } from "@testing-library/react";
import { describe, expect, it } from "vitest";
import { SEEDS } from "../../../core/models/eligibilite/seeds-catalogue";
import { catalogueResultats } from "../../../front/models/eligibilite/r2/catalogue-resultats";
import { eligibilite } from "../../../front/models/eligibilite/r2/resultat";
import { lectureDe, type Reponses } from "./reponses-de-la-permission";

const { issues } = await catalogueResultats();
const issue = issues.ISSUE_NON_ELIGIBLE;

const seed = SEEDS.find(({ id }) => id === "issue-non-eligible");
if (!seed) throw new Error("Seed inconnue : issue-non-eligible");

// Affiche le contenu de la feuille, et donne le résultat.
const afficher = async (answers: Reponses) => {
  const resultat = await eligibilite(lectureDe(answers));
  render(resultat.sheet?.body);
  return resultat;
};

// Une ALD, le patient se déplaçant seul : Q1.3 option 2 établit l'ALD.
const AVEC_ALD = {
  ...seed.answers,
  "Q1.1": "1_SEUL",
  "Q1.4": "1_VEHICULE_PERSONNEL",
  "Q1.3": ["2_ALD"],
  "Q1.3.b": "1_LIEN_DIRECT",
} as Reponses;

describe("la fiche de la seed issue-non-eligible", () => {
  it("donne le titre du prescripteur à la page, et celui du patient à la feuille", async () => {
    const { title, intro, sheet } = await afficher(seed.answers);
    expect(title).toBe(issue.prescriberTitle);
    expect(intro).toMatch(/^Vous trouverez ci-dessous une fiche explicative/);
    expect(sheet?.title).toBe(issue.title);
  });

  it("donne à la feuille la raison de la consultation", async () => {
    const { sheet } = await afficher(seed.answers);
    expect(sheet?.intro).toMatch(
      /^Votre déplacement concerne une consultation médicale/,
    );
  });

  it("met en avant ce que l'Assurance Maladie ne rembourse pas", async () => {
    await afficher(seed.answers);
    const { title, items } = issue.institutionalInformation;
    const bloc = screen.getByRole("complementary", { name: title });
    expect(
      within(bloc)
        .getAllByRole("listitem")
        .map((item) => item.textContent),
    ).toEqual(items);
  });

  it("titre le prescripteur d'un refus", async () => {
    const { tone } = await afficher(seed.answers);
    expect(tone).toBe("refusal");
  });

  it("donne les consignes et le bloc des frais", async () => {
    await afficher(seed.answers);
    const { intro } = issue.instructions;
    expect(
      screen.getByRole("heading", { name: intro.title }),
    ).toBeInTheDocument();
    expect(
      screen.getByText(/^La prescription de transport est un acte médical/),
    ).toBeInTheDocument();
    const regles = screen.getByRole("region", { name: intro.title });
    expect(within(regles).getAllByRole("listitem")).toHaveLength(4);
    expect(
      screen.getByRole("heading", { name: issue.finance.title }),
    ).toBeInTheDocument();
    expect(screen.getByText(issue.finance.text)).toBeInTheDocument();
  });
});

describe("une ALD établie", () => {
  it("garde la raison propre à l'ALD", async () => {
    const { sheet } = await afficher(AVEC_ALD);
    expect(sheet?.intro).toMatch(/les critères de déficience ou d’incapacité/);
  });
});
