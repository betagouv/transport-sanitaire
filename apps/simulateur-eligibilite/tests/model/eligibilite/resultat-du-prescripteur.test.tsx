// Le résultat des cinq issues sans fiche patient, tel qu'il s'affiche (#133).
// Pour chaque seed, `eligibilite` donne le titre de l'issue, et un corps qui
// porte les textes de l'éditeur. Le socle place l'un et l'autre ; ses propres
// tests le vérifient.

import { render, screen, within } from "@testing-library/react";
import { describe, expect, it } from "vitest";
import { SEEDS } from "../../../core/models/eligibilite/seeds-catalogue";
import { catalogueResultats } from "../../../front/models/eligibilite/r2/catalogue-resultats";
import { eligibilite } from "../../../front/models/eligibilite/r2/resultat";
import { lectureDe } from "./reponses-de-la-permission";

// Le premier chargement du catalogue (900 ko) est long : il se fait avant les
// tests, dont le délai ne le mesure pas.
await catalogueResultats();

// Affiche le corps du résultat de la seed, et en donne le titre et
// l'introduction.
const afficher = async (id: string) => {
  const seed = SEEDS.find((candidate) => candidate.id === id);
  if (!seed) throw new Error(`Seed inconnue : ${id}`);
  const resultat = await eligibilite(lectureDe(seed.answers));
  render(resultat.body);
  return resultat;
};

const ZONE = { name: "Résultat pour le prescripteur" } as const;

// La seed, le titre de l'issue, et un texte du « Pourquoi » (son début quand
// il n'a pas de titre).
const ORDINAIRES: readonly [string, string, string | RegExp][] = [
  [
    "issue-caisse",
    "Un point précis reste à vérifier auprès de l’Assurance Maladie",
    "L’effet de la demande du Centre 15 doit être clarifié",
  ],
  [
    "issue-etablissement",
    "Ce transport relève de la prise en charge de l’établissement",
    /^Le trajet a été qualifié comme un transfert entre établissements/,
  ],
  [
    "issue-permission-patient",
    "Le transport lié à cette permission est à la charge du patient",
    /^La permission concerne un patient âgé d’au moins 20 ans/,
  ],
  [
    "issue-convocation",
    "Ce déplacement relève d’une convocation ou d’un appareillage réglementaire",
    /^Ce déplacement relève du cadre réglementaire des convocations/,
  ],
];

// Le catalogue cache leur introduction et « Que faire maintenant ? »
// (`renderPractitionerIntro`, `renderNextSteps`).
describe.each(ORDINAIRES)("la page de la seed %s", (id, titre, pourquoi) => {
  it("donne le titre de l'issue et le pourquoi, sans introduction", async () => {
    const { title, intro } = await afficher(id);
    expect(title).toBe(titre);
    expect(intro).toBeUndefined();
    const zone = screen.getByRole("region", ZONE);
    expect(within(zone).getByText(pourquoi)).toBeInTheDocument();
  });

  it("ne dit pas que faire maintenant", async () => {
    await afficher(id);
    expect(
      screen.queryByRole("heading", { name: "Que faire maintenant ?" }),
    ).not.toBeInTheDocument();
  });

  it("n'est pas une fiche patient", async () => {
    await afficher(id);
    expect(screen.queryByText(/fiche patient/i)).not.toBeInTheDocument();
  });
});

describe("la page de l'établissement", () => {
  it("met chaque bloc du pourquoi dans son paragraphe", async () => {
    await afficher("issue-etablissement");
    expect(
      screen.getByText("Aucun formulaire Assurance Maladie n’est à compléter"),
    ).toBeInTheDocument();
  });
});

describe("la page de la caisse", () => {
  it("transmet les questions à la caisse", async () => {
    await afficher("issue-caisse");
    expect(
      screen.getByRole("heading", {
        name: "Questions à transmettre à la caisse",
      }),
    ).toBeInTheDocument();
    expect(
      screen.getByText(
        "Quel financeur et quel document doivent être retenus pour ce cas précis ?",
      ),
    ).toBeInTheDocument();
  });
});

// Le catalogue cache ses raisons (`renderReasonPanels`) : le titre et
// l'introduction restent seuls, sans zone vide.
describe("la page du transport à l'étranger", () => {
  it("ne garde que le titre et l'introduction", async () => {
    const { title, intro } = await afficher("issue-dap-etranger-a-examiner");
    expect(title).toBe(
      "Prise en charge spécifique d’un transport à l’étranger",
    );
    expect(intro).toMatch(/^Le départ ou l’arrivée du trajet se situe hors/);
    expect(screen.queryByRole("region", ZONE)).not.toBeInTheDocument();
  });
});
