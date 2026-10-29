// Le résultat des cinq issues sans fiche patient, tel qu'il s'affiche (#133).
// Pour chaque seed, `eligibilite` donne le titre de l'issue, et un corps qui
// porte les textes de l'éditeur. Le socle place l'un et l'autre ; ses propres
// tests le vérifient.

import { render, screen } from "@testing-library/react";
import { describe, expect, it } from "vitest";
import { SEEDS } from "../../../core/models/eligibilite/seeds-catalogue";
import { catalogueResultats } from "../../../front/models/eligibilite/r2/catalogue-resultats";
import { eligibilite } from "../../../front/models/eligibilite/r2/resultat";
import { lectureDe } from "./reponses-de-la-permission";

// Le premier chargement du catalogue (900 ko) est long : il se fait avant les
// tests, dont le délai ne le mesure pas.
await catalogueResultats();

// Affiche le corps du résultat de la seed, et en donne le titre.
const afficher = async (id: string) => {
  const seed = SEEDS.find((candidate) => candidate.id === id);
  if (!seed) throw new Error(`Seed inconnue : ${id}`);
  const resultat = await eligibilite(lectureDe(seed.answers));
  render(resultat.body);
  return resultat.title;
};

// La seed, le titre de l'issue, un texte du scénario (le début du « Pourquoi »
// quand il n'a pas de titre), une action.
const CAS: readonly [string, string, string | RegExp, string][] = [
  [
    "issue-caisse",
    "Un point précis reste à vérifier auprès de l’Assurance Maladie",
    "L’effet de la demande du Centre 15 doit être clarifié",
    "Contacter l’Assurance Maladie et faire préciser le financeur, l’éventuel accord et la pièce à utiliser.",
  ],
  [
    "issue-etablissement",
    "Ce transport relève de la prise en charge de l’établissement",
    /^Le trajet a été qualifié comme un transfert entre établissements/,
    "Contacter le service prescripteur ou la cellule de coordination des transports de l’établissement d’origine.",
  ],
  [
    "issue-permission-patient",
    "Le transport lié à cette permission est à la charge du patient",
    /^La permission concerne un patient âgé d’au moins 20 ans/,
    "Ne pas éditer de prescription Prescription Médicale de Transport (PMT)/Demande d’Accord Préalable (DAP) Assurance Maladie pour ce trajet.",
  ],
  [
    "issue-convocation",
    "Ce déplacement relève d’une convocation ou d’un appareillage réglementaire",
    /^Ce déplacement relève du cadre réglementaire des convocations/,
    "Vérifier que la convocation ou l’avis mentionne bien la date, le lieu et l’objet du déplacement.",
  ],
  [
    "issue-dap-etranger-a-examiner",
    "Prise en charge spécifique d’un transport à l’étranger",
    "Une demande d’examen du transport",
    "Contacter la caisse du patient avant l’organisation du transport pour faire préciser les conditions de prise en charge et les justificatifs attendus.",
  ],
];

describe.each(CAS)("la page de la seed %s", (id, titre, element, action) => {
  it("donne le titre de l'issue, puis le texte de l'éditeur", async () => {
    expect(await afficher(id)).toBe(titre);
    expect(screen.getByText(element)).toBeInTheDocument();
    expect(screen.getByText(action)).toBeInTheDocument();
  });

  it("n'est pas une fiche patient", async () => {
    await afficher(id);
    expect(screen.queryByText(/fiche patient/i)).not.toBeInTheDocument();
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

describe("la page du transport à l'étranger", () => {
  it("garde la mise en garde de l'éditeur, sans note de publication", async () => {
    await afficher("issue-dap-etranger-a-examiner");
    expect(
      screen.getByText(/N’appliquez pas la règle d’accord tacite/),
    ).toBeInTheDocument();
    expect(screen.queryByText(/avant publication/)).not.toBeInTheDocument();
  });
});
