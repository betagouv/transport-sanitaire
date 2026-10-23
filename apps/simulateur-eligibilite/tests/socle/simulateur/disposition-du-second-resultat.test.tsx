// La page du second résultat, de haut en bas (C03 du contrat d'intégration) :
// le stepper, titré du document ; le texte ; « Précédent » et « Faire une
// nouvelle simulation » ; « Imprimer » et « Télécharger » ; l'aperçu du
// document, qui est le PDF même que les deux actions portent. Le modèle peut
// tenir la place de l'aperçu.

import { resolveObjectURL } from "node:buffer";
import { screen, waitFor } from "@testing-library/react";
import { afterEach, beforeEach, describe, expect, it } from "vitest";
import type { Model } from "../../../front/socle/model";
import { modeleDeTest } from "../modele-de-test";
import {
  allerAuResultat,
  bouton,
  detailsDuStepper,
  ouvrirLeSimulateur,
  QUANTITE,
} from "./questionnaire";
import { ecouterLesTelechargements } from "./telechargements";

type User = Awaited<ReturnType<typeof ouvrirLeSimulateur>>;

const TITRE = /^Commande complétée : thé, lait Étape (\d) sur \1$/;
const TEXTE = "Commande : thé, lait, 2 tasses";
const IMPRIMER = "Imprimer le bon de commande";
const TELECHARGER = "Télécharger le bon de commande";

let ecoute: ReturnType<typeof ecouterLesTelechargements>;

beforeEach(() => {
  ecoute = ecouterLesTelechargements();
});

afterEach(() => ecoute.arreter());

describe("la page du second résultat", () => {
  it("titre son stepper du document, à la dernière étape, et dit la préparation terminée", async () => {
    const user = await ouvrirLeSimulateur();
    await allerAuCerfa(user);

    expect(
      screen.getByRole("heading", { level: 1, name: TITRE }),
    ).toBeVisible();
    expect(screen.getAllByRole("heading", { level: 1 })).toHaveLength(1);
    expect(detailsDuStepper()).toBe("Préparation terminée.");
  });

  it("range le stepper, le texte, la navigation, les deux actions, puis l'aperçu", async () => {
    const user = await ouvrirLeSimulateur();
    await allerAuCerfa(user);

    expect(
      dansLOrdre([
        screen.getByRole("heading", { level: 1, name: TITRE }),
        screen.getByText(TEXTE),
        bouton("Précédent"),
        bouton("Faire une nouvelle simulation"),
        bouton(IMPRIMER),
        bouton(TELECHARGER),
        await apercu(),
      ]),
    ).toBe(true);
  });

  it("montre en aperçu le document même qu'il télécharge", async () => {
    const user = await ouvrirLeSimulateur();
    await allerAuCerfa(user);

    const montre = await contenuDe(await apercu());
    await user.click(bouton(TELECHARGER));
    await waitFor(() => expect(ecoute.telechargements).toHaveLength(1));

    expect(montre).toEqual(await ecoute.telechargements[0]?.contenu());
  });

  it("montre, à la place de l'aperçu, ce que le modèle y met", async () => {
    const user = await ouvrirLeSimulateur({ modele: sansApercu() });
    await allerAuCerfa(user);
    await waitFor(() => expect(bouton(TELECHARGER)).toBeEnabled());

    expect(
      dansLOrdre([
        bouton(TELECHARGER),
        screen.getByText("Le bon de commande sort vierge."),
      ]),
    ).toBe(true);
    expect(screen.queryByTitle("Aperçu du document")).toBeNull();
  });
});

// ---- implémentation ----

async function allerAuCerfa(user: User) {
  await allerAuResultat(user);
  await user.click(bouton("Compléter la commande"));
  await user.type(screen.getByRole("spinbutton", QUANTITE), "2");
  await user.click(bouton("Terminer"));
  await screen.findByText(TEXTE);
}

// L'aperçu, une fois le PDF généré.
function apercu() {
  return screen.findByTitle("Aperçu du document");
}

// Le PDF derrière l'aperçu. Le navigateur de test ne l'affiche pas : on relit
// le blob derrière son URL, par Node, qui l'a créée.
async function contenuDe(element: HTMLElement) {
  const blob = resolveObjectURL(element.getAttribute("data") ?? "");
  if (!blob) throw new Error("Aucun PDF derrière l'aperçu.");
  return new Uint8Array(await blob.arrayBuffer());
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

// Le modèle de test, qui tient la place de l'aperçu.
function sansApercu(): Model {
  return {
    ...modeleDeTest,
    cerfa: {
      ...modeleDeTest.cerfa,
      standIn: () => <p>Le bon de commande sort vierge.</p>,
    },
  };
}
