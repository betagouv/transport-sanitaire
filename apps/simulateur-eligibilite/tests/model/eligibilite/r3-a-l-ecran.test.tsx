// R3 du modèle de l'éditeur, comme à l'écran (#223) : le vrai simulateur,
// ouvert sur une seed, mené par P3 jusqu'au document. La page suit C03 pour
// les cinq documents : le stepper, titré du document, à « Étape 4 sur 4 » et
// « Préparation terminée. » ; le texte ; la navigation ; les deux actions ;
// puis l'aperçu. L'aperçu lui-même se vérifie sur le modèle de test du
// socle : le navigateur de test ne sert pas les gabarits de l'app, le PDF ne
// s'y génère pas.

import { screen } from "@testing-library/react";
import { beforeEach, describe, expect, it } from "vitest";
import { SEEDS } from "../../../core/models/eligibilite/seeds-catalogue";
import { model } from "../../../front/models/eligibilite";
import { catalogueResultats } from "../../../front/models/eligibilite/r2/catalogue-resultats";
import { rangerRattachement } from "../../../front/socle/rattachement/session";
import {
  detailsDuStepper,
  ouvrirLeSimulateur,
} from "../../socle/simulateur/questionnaire";
import { completerP3 } from "./completer-p3";

// Le catalogue des textes et celui des seeds sont chargés une fois : la
// première fiche n'attend pas leurs 900 ko.
await catalogueResultats();
await model.core.seeds();

const ATTENTE = { timeout: 4000 };
const DELAI_D_UN_TEST = { timeout: 6 * ATTENTE.timeout };

const PRESCRIPTION = "Prescription préremplie prête à imprimer";
const ACCORD_PREALABLE =
  "Demande d’accord préalable préremplie prête à imprimer";

beforeEach(() => rangerRattachement(null));

describe("R3 du modèle de l'éditeur", DELAI_D_UN_TEST, () => {
  it.each([
    ["issue-pmt", "Compléter la prescription", PRESCRIPTION],
    ["issue-s3141", "Compléter la prescription", PRESCRIPTION],
    [
      "issue-dap-sans-urgence",
      "Compléter la demande d’accord préalable",
      ACCORD_PREALABLE,
    ],
    [
      "issue-dap-urgence-attestee",
      "Compléter la demande d’accord préalable",
      ACCORD_PREALABLE,
    ],
    [
      "issue-dap-etranger-a-examiner",
      "Compléter la demande d’examen",
      "Demande d’examen préremplie prête à imprimer",
    ],
  ])(
    "%s : suit C03, le stepper titré du document et la préparation terminée",
    async (id, completer, titre) => {
      await allerEnR3(id, completer);

      expect(titreDeLEcran()).toBe(`${titre} Étape 4 sur 4`);
      expect(detailsDuStepper()).toBe("Préparation terminée.");
      expect(dansLOrdre(hautDeLaPage())).toBe(true);
    },
  );
});

// ---- implémentation ----

async function allerEnR3(id: string, completer: string) {
  const seed = SEEDS.find((candidate) => candidate.id === id);
  if (!seed) throw new Error(`Seed inconnue : ${id}`);
  const user = await ouvrirLeSimulateur({ produit: true, modele: model });
  await user.click(
    await screen.findByRole("button", { name: "Seeds" }, ATTENTE),
  );
  await user.click(
    await screen.findByRole(
      "button",
      { name: `Ouvrir : ${seed.label}` },
      ATTENTE,
    ),
  );
  await user.click(
    await screen.findByRole("button", { name: completer }, ATTENTE),
  );
  await completerP3(user);
}

function titreDeLEcran() {
  return screen.getByRole("heading", { level: 1 }).textContent;
}

// Le stepper, le texte, la navigation et les deux actions, dans l'ordre de C03.
function hautDeLaPage(): HTMLElement[] {
  const bouton = (name: string) => screen.getByRole("button", { name });
  return [
    screen.getByRole("heading", { level: 1 }),
    screen.getByText(/^Le document est prêt à être imprimé\./),
    bouton("Précédent"),
    bouton("Faire une nouvelle simulation"),
    bouton("Imprimer"),
    bouton("Télécharger"),
  ];
}

// Chaque élément précède le suivant dans la page.
function dansLOrdre(elements: readonly Element[]): boolean {
  return elements.every((element, index) => {
    const avant = elements[index - 1];
    if (!avant) return true;
    const position = avant.compareDocumentPosition(element);
    return (position & Node.DOCUMENT_POSITION_FOLLOWING) !== 0;
  });
}
