// R3 du modèle de l'éditeur, comme à l'écran (#223) : le vrai simulateur,
// ouvert sur une seed, mené par P3 jusqu'au document. La page suit C03 pour
// les cinq documents : le stepper, titré du document, à « Étape 4 sur 4 » et
// « Préparation terminée. » ; le texte ; la navigation ; les deux actions ;
// puis l'aperçu. Les gabarits se lisent sur le disque : le PDF se génère, et
// le texte, qui l'attend, s'affiche. Une nouvelle simulation ne garde rien du
// document précédent.

import { screen, waitFor } from "@testing-library/react";
import { afterEach, beforeEach, describe, expect, it } from "vitest";
import { SEEDS } from "../../../../core/models/eligibilite/seeds-catalogue";
import { model } from "../../../../front/models/eligibilite";
import { catalogueResultats } from "../../../../front/models/eligibilite/r2/components/textes-de-l-editeur";
import { rangerRattachement } from "../../../../front/socle/rattachement";
import {
  detailsDuStepper,
  ouvrirLeSimulateur,
} from "../../../socle/simulateur/questionnaire";
import { ecouterLesTelechargements } from "../../../socle/simulateur/telechargements";
import { completerP3 } from "../completer-p3";
import { MODELE_AUX_GABARITS_DU_DISQUE } from "../modele-aux-gabarits-du-disque";

// Le catalogue des textes et celui des seeds sont chargés une fois : la
// première fiche n'attend pas leurs 900 ko.
await catalogueResultats();
await model.core.seeds();

const ATTENTE = { timeout: 4000 };
const DELAI_D_UN_TEST = { timeout: 6 * ATTENTE.timeout };

const PRESCRIPTION = "Prescription préremplie prête à imprimer";
const ACCORD_PREALABLE =
  "Demande d’accord préalable préremplie prête à imprimer";

type User = Awaited<ReturnType<typeof ouvrirLeSimulateur>>;

let ecoute: ReturnType<typeof ecouterLesTelechargements>;

beforeEach(() => {
  rangerRattachement(null);
  ecoute = ecouterLesTelechargements();
});

afterEach(() => ecoute.arreter());

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

describe("une nouvelle simulation depuis R3", DELAI_D_UN_TEST, () => {
  it("ne montre que le document de la nouvelle seed", async () => {
    const user = await allerEnR3("issue-pmt", "Compléter la prescription");
    await user.click(
      screen.getByRole("button", { name: "Faire une nouvelle simulation" }),
    );

    await ouvrirEnR3(
      user,
      "issue-dap-sans-urgence",
      "Compléter la demande d’accord préalable",
    );

    expect(titreDeLEcran()).toBe(`${ACCORD_PREALABLE} Étape 4 sur 4`);
    expect(screen.getAllByText(/^Le document est prêt/)).toHaveLength(1);
    await user.click(
      await screen.findByRole("button", { name: "Télécharger" }, ATTENTE),
    );
    await waitFor(() => expect(ecoute.telechargements).toHaveLength(1));
    expect(ecoute.telechargements[0]?.nom).toMatch(
      /^demande-d-accord-prealable/,
    );
  });
});

// ---- implémentation ----

async function allerEnR3(id: string, completer: string) {
  const user = await ouvrirLeSimulateur({
    modele: MODELE_AUX_GABARITS_DU_DISQUE,
  });
  await ouvrirEnR3(user, id, completer);
  return user;
}

// La seed `id`, ouverte par l'écran des seeds et menée jusqu'au document.
async function ouvrirEnR3(user: User, id: string, completer: string) {
  const seed = SEEDS.find((candidate) => candidate.id === id);
  if (!seed) throw new Error(`Seed inconnue : ${id}`);
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
  await screen.findByText(
    /^Le document est prêt à être imprimé\./,
    {},
    ATTENTE,
  );
}

function titreDeLEcran() {
  return screen.getByRole("heading", { level: 1 }).textContent;
}

// Le stepper, le texte, la navigation et les deux actions, dans l'ordre de C03.
// « Télécharger » dit « Préparation du PDF » tant que le PDF se génère (D-233).
function hautDeLaPage(): HTMLElement[] {
  const bouton = (name: string | RegExp) =>
    screen.getByRole("button", { name });
  return [
    screen.getByRole("heading", { level: 1 }),
    screen.getByText(/^Le document est prêt à être imprimé\./),
    bouton("Précédent"),
    bouton("Faire une nouvelle simulation"),
    bouton("Imprimer"),
    bouton(/^(Télécharger|Préparation du PDF)$/),
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
